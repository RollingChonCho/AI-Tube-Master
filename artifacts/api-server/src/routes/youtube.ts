import { Router } from "express";
import { FetchYouTubeVideoBody } from "@workspace/api-zod";

const router = Router();

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

// Fetch recent channel videos and analyze thumbnail style
async function analyzeChannelStyle(channelId: string, apiKey: string): Promise<string | null> {
  try {
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?channelId=${channelId}&type=video&order=date&maxResults=6&key=${apiKey}&part=snippet`;
    const resp = await fetch(searchUrl);
    if (!resp.ok) return null;

    const data = await resp.json() as {
      items?: Array<{
        snippet?: {
          title?: string;
          thumbnails?: { high?: { url?: string } };
        };
      }>;
    };

    if (!data.items?.length) return null;

    // Summarize the style based on titles and thumbnail patterns
    const titles = data.items.map((i) => i.snippet?.title ?? "").filter(Boolean);
    const hasNumbers = titles.some((t) => /\d/.test(t));
    const hasAllCaps = titles.some((t) => t === t.toUpperCase() && t.length > 3);
    const hasEmoji = titles.some((t) => /\p{Emoji}/u.test(t));
    const avgTitleLen = titles.reduce((s, t) => s + t.length, 0) / titles.length;

    const traits: string[] = [];
    if (hasNumbers) traits.push("uses numbered lists");
    if (hasAllCaps) traits.push("bold all-caps text overlays");
    if (hasEmoji) traits.push("emoji accents");
    if (avgTitleLen > 50) traits.push("long descriptive titles");
    else traits.push("punchy short titles");

    return traits.length > 0 ? traits.join(", ") : null;
  } catch {
    return null;
  }
}

router.post("/youtube/fetch", async (req, res) => {
  const parsed = FetchYouTubeVideoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { url } = parsed.data;
  const videoId = extractVideoId(url);
  if (!videoId) {
    res.status(400).json({ error: "Could not extract video ID from URL" });
    return;
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    res.status(400).json({ error: "YouTube API key not configured" });
    return;
  }

  try {
    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=snippet,statistics`;
    const response = await fetch(apiUrl);
    if (!response.ok) {
      res.status(400).json({ error: "YouTube API request failed" });
      return;
    }

    const data = await response.json() as {
      items?: Array<{
        snippet?: {
          title?: string;
          description?: string;
          channelTitle?: string;
          channelId?: string;
          publishedAt?: string;
          thumbnails?: { maxres?: { url?: string }; high?: { url?: string }; default?: { url?: string } };
        };
        statistics?: { viewCount?: string };
      }>;
    };

    if (!data.items?.length) {
      res.status(400).json({ error: "Video not found" });
      return;
    }

    const item = data.items[0];
    const snippet = item.snippet ?? {};
    const statistics = item.statistics ?? {};
    const thumbnailUrl = snippet.thumbnails?.maxres?.url ?? snippet.thumbnails?.high?.url ?? snippet.thumbnails?.default?.url ?? "";
    const channelId = snippet.channelId ?? null;

    // Analyze channel style in parallel if channelId available
    const channelThumbnailStyle = channelId ? await analyzeChannelStyle(channelId, apiKey) : null;

    res.json({
      videoId,
      title: snippet.title ?? "",
      description: snippet.description ?? "",
      thumbnailUrl,
      channelTitle: snippet.channelTitle ?? null,
      channelId,
      viewCount: statistics.viewCount ?? null,
      publishedAt: snippet.publishedAt ?? null,
      channelThumbnailStyle,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch YouTube video");
    res.status(500).json({ error: "Failed to fetch YouTube video" });
  }
});

export default router;
