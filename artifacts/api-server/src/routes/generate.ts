import { Router } from "express";
import OpenAI from "openai";
import {
  GenerateContentBody,
  GenerateThumbnailsBody,
  GenerateAllBody,
} from "@workspace/api-zod";

const router = Router();

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");
  return new OpenAI({ apiKey });
}

async function generateContentFromTopic(topic: string, description?: string | null, style?: string | null, targetAudience?: string | null) {
  const openai = getOpenAI();

  const systemPrompt = `You are an expert YouTube content strategist and SEO specialist. 
Your job is to create highly optimized, click-worthy content for YouTube videos.
Always respond in valid JSON format exactly as requested.`;

  const userPrompt = `Generate YouTube content for a video about: "${topic}"
${description ? `\nExisting description context: ${description.slice(0, 500)}` : ""}
${style ? `\nVideo style: ${style}` : ""}
${targetAudience ? `\nTarget audience: ${targetAudience}` : ""}

Return a JSON object with exactly this structure:
{
  "titles": ["title1", "title2", ..., "title10"],
  "description": "Full SEO-optimized description (400-600 words with timestamps placeholder, relevant keywords, call-to-action, links section)",
  "tags": ["tag1", "tag2", ..., "tag20"]
}

Requirements:
- titles: exactly 10 unique, catchy, click-worthy titles (mix of curiosity gaps, numbers, how-tos, emotional hooks)
- description: professional YouTube description with timestamps, keywords naturally embedded, strong CTA
- tags: 20 relevant tags/keywords sorted by importance`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.8,
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(content) as { titles?: string[]; description?: string; tags?: string[] };

  return {
    titles: parsed.titles ?? [],
    description: parsed.description ?? "",
    tags: parsed.tags ?? [],
  };
}

async function generateThumbnailImages(topic: string, style?: string | null, count?: number | null) {
  const numThumbnails = Math.min(Math.max(count ?? 6, 5), 8);

  const openai = getOpenAI();

  const prompts = [
    `YouTube thumbnail for "${topic}": Bold text overlay, bright contrasting colors, shocked/excited face expression, high energy, professional photography style`,
    `YouTube thumbnail for "${topic}": Minimalist design, clean typography, gradient background, modern aesthetic, eye-catching visual element`,
    `YouTube thumbnail for "${topic}": Before and after split layout, dramatic comparison, bright yellow/red accent colors, bold white text`,
    `YouTube thumbnail for "${topic}": Close-up dramatic portrait, intense expression, dark moody background, glowing text effect`,
    `YouTube thumbnail for "${topic}": Illustrated/graphic design style, bright comic-style colors, bold cartoon elements, fun energetic feel`,
    `YouTube thumbnail for "${topic}": Professional studio look, soft lighting, clean background, overlay text with arrow pointing to subject`,
    `YouTube thumbnail for "${topic}": Dark cinematic style, dramatic lighting, gold/orange accent colors, mysterious atmosphere`,
    `YouTube thumbnail for "${topic}": Bright outdoor setting, natural light, candid energetic pose, overlaid bold uppercase text`,
  ];

  const selectedPrompts = prompts.slice(0, numThumbnails);

  const replicateKey = process.env.REPLICATE_API_KEY;

  if (replicateKey) {
    // Use Replicate Flux for higher quality
    const thumbnails = await Promise.allSettled(
      selectedPrompts.map(async (prompt, index) => {
        const response = await fetch("https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${replicateKey}`,
            "Content-Type": "application/json",
            Prefer: "wait",
          },
          body: JSON.stringify({
            input: {
              prompt: prompt + (style ? `, ${style} style` : ""),
              aspect_ratio: "16:9",
              output_format: "webp",
              output_quality: 90,
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`Replicate API error: ${response.status}`);
        }

        const data = (await response.json()) as { output?: string | string[] };
        const url = Array.isArray(data.output) ? data.output[0] : data.output;
        if (!url) throw new Error("No output URL from Replicate");

        return { url: url as string, index, prompt };
      })
    );

    const successful = thumbnails
      .map((r, i) => (r.status === "fulfilled" ? r.value : null))
      .filter((v): v is { url: string; index: number; prompt: string } => v !== null);

    if (successful.length > 0) {
      return { thumbnails: successful, provider: "replicate" };
    }
    // Fall through to DALL-E if Replicate fails
  }

  // Use DALL-E 3
  const thumbnails = await Promise.allSettled(
    selectedPrompts.map(async (prompt, index) => {
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: prompt + (style ? `, ${style} style` : "") + ". 16:9 aspect ratio, YouTube thumbnail format.",
        size: "1792x1024",
        quality: "standard",
        n: 1,
      });

      const url = response.data?.[0]?.url;
      if (!url) throw new Error("No image URL returned");
      return { url, index, prompt };
    })
  );

  const successful = thumbnails
    .map((r) => (r.status === "fulfilled" ? r.value : null))
    .filter((v): v is { url: string; index: number; prompt: string } => v !== null);

  return { thumbnails: successful, provider: "dall-e" };
}

// POST /api/generate/content
router.post("/generate/content", async (req, res) => {
  const parsed = GenerateContentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    res.status(400).json({ error: "OPENAI_API_KEY not configured" });
    return;
  }

  try {
    const { topic, description, style, targetAudience } = parsed.data;
    const result = await generateContentFromTopic(topic, description, style, targetAudience);
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to generate content");
    res.status(500).json({ error: "Failed to generate content" });
  }
});

// POST /api/generate/thumbnails
router.post("/generate/thumbnails", async (req, res) => {
  const parsed = GenerateThumbnailsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    res.status(400).json({ error: "OPENAI_API_KEY not configured" });
    return;
  }

  try {
    const { topic, style, count } = parsed.data;
    const result = await generateThumbnailImages(topic, style, count);
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to generate thumbnails");
    res.status(500).json({ error: "Failed to generate thumbnails" });
  }
});

// POST /api/generate/all
router.post("/generate/all", async (req, res) => {
  const parsed = GenerateAllBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    res.status(400).json({ error: "OPENAI_API_KEY not configured" });
    return;
  }

  try {
    const { topic, description, style, targetAudience, thumbnailCount } = parsed.data;

    const [contentResult, thumbnailResult] = await Promise.all([
      generateContentFromTopic(topic, description, style, targetAudience),
      generateThumbnailImages(topic, style, thumbnailCount),
    ]);

    res.json({
      titles: contentResult.titles,
      description: contentResult.description,
      tags: contentResult.tags,
      thumbnails: thumbnailResult.thumbnails,
      provider: thumbnailResult.provider,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to generate all");
    res.status(500).json({ error: "Failed to generate all content" });
  }
});

// GET /api/config/status
router.get("/config/status", (req, res) => {
  res.json({
    openai: !!process.env.OPENAI_API_KEY,
    youtube: !!process.env.YOUTUBE_API_KEY,
    replicate: !!process.env.REPLICATE_API_KEY,
  });
});

export default router;
