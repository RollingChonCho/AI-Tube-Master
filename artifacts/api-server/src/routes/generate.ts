import { Router } from "express";
import OpenAI from "openai";
import { GenerateAllBody } from "@workspace/api-zod";
import { storage } from "../storage";

const router = Router();

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");
  return new OpenAI({ apiKey });
}

async function generateContent(topic: string, description?: string | null, style?: string | null, targetAudience?: string | null, channelStyle?: string | null) {
  const openai = getOpenAI();

  const systemPrompt = `You are an elite YouTube content strategist with deep expertise in viral growth, high-CTR titles, and YouTube SEO. You consistently produce content that gets 10x more clicks than average. You know all the psychological triggers — curiosity gaps, power words, controversy, numbers, and transformation promises.`;

  const channelCtx = channelStyle ? `\nThis channel's visual/editorial style: ${channelStyle}. Match this style in your titles.` : "";
  const userPrompt = `Generate highly optimized YouTube content for: "${topic}"
${description ? `\nVideo context: ${description.slice(0, 600)}` : ""}
${style ? `\nContent style: ${style}` : ""}
${targetAudience ? `\nTarget audience: ${targetAudience}` : ""}${channelCtx}

Return ONLY a valid JSON object with this exact structure:
{
  "titles": ["title1", ..., "title10"],
  "description": "Full SEO description...",
  "tags": ["tag1", ..., "tag15"]
}

Title requirements — write 10 titles that:
- Use power words: Secret, Shocking, Ultimate, Brutal, Honest, Never, Always, Instantly
- Mix formats: "How I...", "Why You're...", numbers like "7 Reasons", curiosity gaps "The Truth About..."
- Each title under 70 characters for mobile
- Naturally incorporate the main keyword
- Create urgency or FOMO where appropriate

Description requirements:
- 400-500 words, keyword-rich but natural
- Open with a strong hook (first 2 lines are visible before "Show more")
- Include: timestamps placeholder section, "In this video you'll learn..." section, CTA to subscribe, links section footer
- Embed 8-12 relevant keywords naturally

Tags: 15 specific, relevant tags ordered by search volume importance`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.85,
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(content) as { titles?: string[]; description?: string; tags?: string[] };

  return {
    titles: (parsed.titles ?? []).slice(0, 10),
    description: parsed.description ?? "",
    tags: (parsed.tags ?? []).slice(0, 15),
  };
}

interface ThumbnailResult {
  url: string;
  index: number;
  prompt: string | null;
}

async function generateThumbnails(topic: string, count: number, channelStyle?: string | null, style?: string | null): Promise<{ thumbnails: ThumbnailResult[]; provider: string }> {
  const replicateKey = process.env.REPLICATE_API_KEY;
  if (!replicateKey) {
    throw new Error("REPLICATE_API_KEY is required for thumbnail generation");
  }

  const styleHint = channelStyle ? ` Channel style: ${channelStyle}.` : "";
  const userStyle = style ? ` Visual style: ${style}.` : "";

  const prompts = [
    `YouTube thumbnail, "${topic}", bold white text overlay, shocked reaction face expression, bright neon yellow and red background, high contrast, ultra sharp, photorealistic, 16:9${styleHint}${userStyle}`,
    `YouTube thumbnail, "${topic}", dramatic split screen comparison, before vs after layout, bold text, vivid colors, professional photography, 16:9${styleHint}${userStyle}`,
    `YouTube thumbnail, "${topic}", minimalist design, dark gradient background, glowing gold accent text, clean modern typography, cinematic, 16:9${styleHint}${userStyle}`,
    `YouTube thumbnail, "${topic}", close-up intense human expression, blue and orange contrast colors, bold uppercase text, energy and urgency, 16:9${styleHint}${userStyle}`,
    `YouTube thumbnail, "${topic}", illustrated graphic design style, vibrant flat design, bold arrows and icons, pop-art inspired, eye-catching, 16:9${styleHint}${userStyle}`,
    `YouTube thumbnail, "${topic}", dark cinematic mood, dramatic side lighting, deep shadows, gold typography, mysterious atmosphere, premium look, 16:9${styleHint}${userStyle}`,
    `YouTube thumbnail, "${topic}", bright natural outdoor setting, energetic candid expression, bold text overlay with drop shadow, authentic feel, 16:9${styleHint}${userStyle}`,
    `YouTube thumbnail, "${topic}", studio photography, clean white background, product or subject hero shot, bold color banner, professional, 16:9${styleHint}${userStyle}`,
  ].slice(0, count);

  const results = await Promise.allSettled(
    prompts.map(async (prompt, index) => {
      const resp = await fetch("https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${replicateKey}`,
          "Content-Type": "application/json",
          Prefer: "wait",
        },
        body: JSON.stringify({
          input: {
            prompt,
            aspect_ratio: "16:9",
            output_format: "webp",
            output_quality: 90,
          },
        }),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(`Replicate error ${resp.status}: ${errText}`);
      }

      const data = await resp.json() as { output?: string | string[] };
      const url = Array.isArray(data.output) ? data.output[0] : data.output;
      if (!url) throw new Error("No output URL from Replicate");

      return { url: url as string, index, prompt };
    }),
  );

  const successful = results
    .map((r) => (r.status === "fulfilled" ? r.value : null))
    .filter((v): v is ThumbnailResult => v !== null);

  if (successful.length === 0) {
    throw new Error("All thumbnail generation attempts failed");
  }

  return { thumbnails: successful, provider: "replicate" };
}

// POST /api/generate/all — costs 1 credit
router.post("/generate/all", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Sign in to generate content" });
    return;
  }

  const parsed = GenerateAllBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    res.status(500).json({ error: "OpenAI API key not configured" });
    return;
  }

  if (!process.env.REPLICATE_API_KEY) {
    res.status(500).json({ error: "Replicate API key not configured — thumbnail generation unavailable" });
    return;
  }

  // Refresh daily credits first, then attempt deduction
  await storage.refreshFreeCreditsIfNeeded(req.user.id);
  const deducted = await storage.deductCredit(req.user.id);
  if (!deducted) {
    res.status(402).json({ error: "Insufficient credits. Upgrade your plan or purchase more credits." });
    return;
  }

  const { topic, description, style, targetAudience, channelStyle, thumbnailCount } = parsed.data;
  const numThumbnails = Math.min(Math.max(thumbnailCount ?? 6, 5), 8);

  try {
    // Run content and thumbnails in parallel
    const [contentResult, thumbnailResult] = await Promise.all([
      generateContent(topic, description, style, targetAudience, channelStyle),
      generateThumbnails(topic, numThumbnails, channelStyle, style),
    ]);

    // Log credit usage
    await storage.logCreditTransaction({
      userId: req.user.id,
      amount: -1,
      type: "generation",
      description: `Generated for: ${topic.slice(0, 100)}`,
    });

    // Save to history
    const generation = await storage.saveGeneration({
      userId: req.user.id,
      topic,
      sourceUrl: null,
      titles: contentResult.titles,
      description: contentResult.description,
      tags: contentResult.tags,
      thumbnails: thumbnailResult.thumbnails,
      provider: thumbnailResult.provider,
    });

    // Get updated credit balance
    const freshUser = await storage.getUser(req.user.id);

    res.json({
      titles: contentResult.titles,
      description: contentResult.description,
      tags: contentResult.tags,
      thumbnails: thumbnailResult.thumbnails,
      provider: thumbnailResult.provider,
      generationId: generation.id,
      creditsRemaining: freshUser?.credits ?? 0,
    });
  } catch (err) {
    // Credit was deducted but generation failed — refund
    await storage.addCredits(req.user.id, 1);
    await storage.logCreditTransaction({
      userId: req.user.id,
      amount: 1,
      type: "refund",
      description: "Refund due to generation failure",
    });
    req.log.error({ err }, "Failed to generate all — credit refunded");
    res.status(500).json({ error: "Generation failed. Your credit has been refunded." });
  }
});

// GET /api/config/status
router.get("/config/status", (_req, res) => {
  res.json({
    openai: !!process.env.OPENAI_API_KEY,
    youtube: !!process.env.YOUTUBE_API_KEY,
    replicate: !!process.env.REPLICATE_API_KEY,
  });
});

export default router;
