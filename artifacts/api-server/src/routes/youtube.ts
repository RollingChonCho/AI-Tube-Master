import { Router } from "express";
import { FetchYouTubeVideoBody } from "@workspace/api-zod";

const router = Router();

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
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
      const errText = await response.text();
      req.log.error({ status: response.status, body: errText }, "YouTube API error");
      res.status(400).json({ error: "YouTube API request failed" });
      return;
    }

    const data = (await response.json()) as {
      items?: Array<{
        snippet?: {
          title?: string;
          description?: string;
          channelTitle?: string;
          publishedAt?: string;
          thumbnails?: { maxres?: { url?: string }; high?: { url?: string }; default?: { url?: string } };
        };
        statistics?: { viewCount?: string };
      }>;
    };

    if (!data.items || data.items.length === 0) {
      res.status(400).json({ error: "Video not found" });
      return;
    }

    const item = data.items[0];
    const snippet = item.snippet ?? {};
    const statistics = item.statistics ?? {};
    const thumbnailUrl =
      snippet.thumbnails?.maxres?.url ??
      snippet.thumbnails?.high?.url ??
      snippet.thumbnails?.default?.url ??
      "";

    res.json({
      videoId,
      title: snippet.title ?? "",
      description: snippet.description ?? "",
      thumbnailUrl,
      channelTitle: snippet.channelTitle ?? null,
      viewCount: statistics.viewCount ?? null,
      publishedAt: snippet.publishedAt ?? null,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch YouTube video");
    res.status(500).json({ error: "Failed to fetch YouTube video" });
  }
});

export default router;
