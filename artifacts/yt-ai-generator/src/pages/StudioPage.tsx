import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Zap, Sparkles, Copy, Download, RefreshCw, Link as LinkIcon, AlertCircle,
  CheckCircle, Image, Tag, FileText, TrendingUp, Youtube, X, ArrowRight, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import JSZip from "jszip";
import { Link, useLocation } from "wouter";

interface ThumbnailImage { url: string; index: number; prompt?: string | null }
interface GenerateResult {
  titles: string[];
  description: string;
  tags: string[];
  thumbnails: ThumbnailImage[];
  provider?: string | null;
  generationId: string;
  creditsRemaining: number;
}
interface VideoData {
  videoId: string; title: string; description: string;
  channelTitle?: string | null; channelThumbnailStyle?: string | null;
}

export default function StudioPage() {
  const { user, isAuthenticated, isLoading, login } = useAuth();
  const [, navigate] = useLocation();
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");

  // Form state
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [style, setStyle] = useState("");
  const [audience, setAudience] = useState("");
  const [mode, setMode] = useState<"url" | "manual">("url");

  // Generation state
  const [fetchingVideo, setFetchingVideo] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [credits, setCredits] = useState(user?.credits ?? 0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) login("/studio");
  }, [isLoading, isAuthenticated, login]);

  useEffect(() => {
    if (user?.credits != null) setCredits(user.credits);
  }, [user?.credits]);

  async function fetchVideo() {
    if (!youtubeUrl.trim()) return;
    setFetchingVideo(true);
    setVideoData(null);
    setError(null);
    try {
      const res = await fetch("/api/youtube/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ url: youtubeUrl }),
      });
      const data = await res.json() as VideoData & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to fetch video");
      setVideoData(data);
      setTopic(data.title ?? "");
      setDescription(data.description?.slice(0, 500) ?? "");
      toast.success("Video fetched! Ready to generate.");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to fetch video");
    } finally {
      setFetchingVideo(false);
    }
  }

  async function generate() {
    if (!topic.trim()) { toast.error("Please enter a topic or fetch a YouTube video."); return; }
    if (credits <= 0) { toast.error("No credits left! Upgrade or wait for daily reset."); return; }

    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/generate/all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          topic,
          description: description || null,
          style: style || null,
          targetAudience: audience || null,
          channelStyle: videoData?.channelThumbnailStyle ?? null,
          thumbnailCount: 6,
        }),
      });
      const data = await res.json() as GenerateResult & { error?: string };
      if (!res.ok) {
        if (res.status === 402) throw new Error("CREDITS_EMPTY");
        if (res.status === 401) throw new Error("Please sign in to generate.");
        throw new Error(data.error ?? "Generation failed");
      }
      setResult(data);
      setCredits(data.creditsRemaining);
      toast.success("Generated successfully! 🎉");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Generation failed";
      if (msg === "CREDITS_EMPTY") {
        setError("You're out of credits. Upgrade your plan or wait for the daily reset.");
      } else {
        setError(msg);
      }
    } finally {
      setGenerating(false);
    }
  }

  function copyText(text: string, label = "Copied!") {
    navigator.clipboard.writeText(text);
    toast.success(label);
  }

  async function downloadAll() {
    if (!result?.thumbnails?.length) return;
    const zip = new JSZip();
    const folder = zip.folder("thumbboost-thumbnails")!;
    await Promise.all(
      result.thumbnails.map(async (t, i) => {
        const resp = await fetch(t.url);
        const blob = await resp.blob();
        folder.file(`thumbnail-${i + 1}.webp`, blob);
      })
    );
    const content = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(content);
    a.download = "thumbboost-thumbnails.zip";
    a.click();
    toast.success("Thumbnails downloaded!");
  }

  async function downloadSingle(url: string, idx: number) {
    const resp = await fetch(url);
    const blob = await resp.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `thumbnail-${idx + 1}.webp`;
    a.click();
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const planCreditsMap: Record<string, number> = { free: 3, starter: 100, pro: 500 };
  const maxCredits = planCreditsMap[user?.plan ?? "free"] ?? 3;
  const creditPct = Math.min((credits / maxCredits) * 100, 100);

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black">Studio</h1>
            <p className="text-zinc-500 mt-1">Generate viral titles, SEO description & thumbnails</p>
          </div>
          {/* Credit meter */}
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-400" />
              <span className="text-sm font-semibold">{credits} credits</span>
            </div>
            <div className="w-24 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${credits === 0 ? "bg-red-500" : credits <= 1 ? "bg-orange-500" : "bg-yellow-400"}`}
                style={{ width: `${creditPct}%` }}
              />
            </div>
            {credits === 0 && (
              <Link href={`${base}/pricing`}>
                <a className="text-xs text-red-400 hover:text-red-300">Get more credits →</a>
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Input panel */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl border border-white/5 bg-zinc-900/80 p-5 space-y-4">
              {/* Mode toggle */}
              <div className="flex rounded-xl bg-zinc-800 p-1 gap-1">
                <button
                  onClick={() => setMode("url")}
                  className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${mode === "url" ? "bg-zinc-700 text-white shadow" : "text-zinc-400 hover:text-white"}`}
                >
                  <Youtube className="h-3.5 w-3.5" /> YouTube URL
                </button>
                <button
                  onClick={() => setMode("manual")}
                  className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${mode === "manual" ? "bg-zinc-700 text-white shadow" : "text-zinc-400 hover:text-white"}`}
                >
                  <Sparkles className="h-3.5 w-3.5" /> Manual
                </button>
              </div>

              {mode === "url" ? (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://youtube.com/watch?v=..."
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && fetchVideo()}
                      className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-red-500/50"
                    />
                    <Button
                      onClick={fetchVideo}
                      disabled={fetchingVideo || !youtubeUrl.trim()}
                      className="shrink-0 bg-zinc-700 hover:bg-zinc-600 text-white border-0"
                    >
                      {fetchingVideo ? <Loader2 className="h-4 w-4 animate-spin" /> : <LinkIcon className="h-4 w-4" />}
                    </Button>
                  </div>
                  {videoData && (
                    <div className="rounded-xl bg-zinc-800/50 p-3 flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-white line-clamp-2">{videoData.title}</p>
                        {videoData.channelTitle && <p className="text-xs text-zinc-500 mt-0.5">{videoData.channelTitle}</p>}
                        {videoData.channelThumbnailStyle && (
                          <p className="text-xs text-blue-400 mt-1">✦ Channel style detected: {videoData.channelThumbnailStyle}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-zinc-400 mb-1.5 block">Topic *</label>
                    <Input
                      placeholder="e.g. How to grow on YouTube in 2024"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-red-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400 mb-1.5 block">Context (optional)</label>
                    <Textarea
                      placeholder="What's the video about? Any key points?"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-red-500/50 resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-zinc-400 mb-1.5 block">Style</label>
                      <Input
                        placeholder="e.g. educational"
                        value={style}
                        onChange={(e) => setStyle(e.target.value)}
                        className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-red-500/50 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-400 mb-1.5 block">Audience</label>
                      <Input
                        placeholder="e.g. beginners"
                        value={audience}
                        onChange={(e) => setAudience(e.target.value)}
                        className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-red-500/50 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Generate button */}
              <Button
                onClick={generate}
                disabled={generating || credits <= 0 || (!topic.trim() && mode === "manual") || (mode === "url" && !videoData && !topic.trim())}
                className="w-full h-11 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white border-0 shadow-lg shadow-red-500/20 font-semibold disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating... (~30s)
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate — 1 Credit
                  </>
                )}
              </Button>

              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-red-300">{error}</p>
                    {error.includes("credits") && (
                      <Link href={`${base}/pricing`}>
                        <a className="text-xs text-red-400 underline mt-1 block">Upgrade for more →</a>
                      </Link>
                    )}
                  </div>
                </div>
              )}

              {generating && (
                <div className="rounded-xl bg-zinc-800/50 p-3 space-y-2">
                  <div className="h-1.5 rounded-full bg-zinc-700 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-red-500 to-orange-500 animate-pulse rounded-full" style={{ width: "60%" }} />
                  </div>
                  <p className="text-xs text-zinc-500 text-center">Generating titles, description & thumbnails simultaneously...</p>
                </div>
              )}
            </div>

            {/* Credits upgrade prompt */}
            {credits <= 1 && user?.plan === "free" && (
              <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4">
                <p className="text-sm font-medium text-orange-300 mb-2">Running low on credits</p>
                <p className="text-xs text-zinc-500 mb-3">Free plan gets 3 credits/day. Upgrade for 100–500/month.</p>
                <Link href={`${base}/pricing`}>
                  <Button size="sm" className="w-full bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30">
                    Upgrade Plan <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Results panel */}
          <div className="lg:col-span-3">
            {!result ? (
              <div className="h-full rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center p-12 text-center min-h-[400px]">
                <div className="h-16 w-16 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center mb-4">
                  <Sparkles className="h-8 w-8 text-zinc-700" />
                </div>
                <p className="text-zinc-500 font-medium">Results will appear here</p>
                <p className="text-zinc-600 text-sm mt-1">
                  {mode === "url" ? "Paste a YouTube URL and click Generate" : "Fill in the topic and click Generate"}
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/5 bg-zinc-900/80 overflow-hidden">
                {/* Result header */}
                <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-sm font-medium text-white">Generation Complete</span>
                    {result.provider && (
                      <Badge variant="outline" className="text-xs border-white/10 text-zinc-400">{result.provider}</Badge>
                    )}
                  </div>
                  <Button
                    onClick={generate}
                    disabled={generating || credits <= 0}
                    variant="outline"
                    size="sm"
                    className="border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 text-xs"
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Regenerate All
                  </Button>
                </div>

                <Tabs defaultValue="titles" className="w-full">
                  <TabsList className="w-full justify-start rounded-none border-b border-white/5 bg-transparent px-5 gap-1 h-10">
                    <TabsTrigger value="titles" className="data-[state=active]:bg-white/10 text-zinc-400 data-[state=active]:text-white rounded-lg h-7 px-3 text-xs">
                      <TrendingUp className="h-3.5 w-3.5 mr-1" />Titles ({result.titles.length})
                    </TabsTrigger>
                    <TabsTrigger value="description" className="data-[state=active]:bg-white/10 text-zinc-400 data-[state=active]:text-white rounded-lg h-7 px-3 text-xs">
                      <FileText className="h-3.5 w-3.5 mr-1" />Description
                    </TabsTrigger>
                    <TabsTrigger value="tags" className="data-[state=active]:bg-white/10 text-zinc-400 data-[state=active]:text-white rounded-lg h-7 px-3 text-xs">
                      <Tag className="h-3.5 w-3.5 mr-1" />Tags
                    </TabsTrigger>
                    <TabsTrigger value="thumbnails" className="data-[state=active]:bg-white/10 text-zinc-400 data-[state=active]:text-white rounded-lg h-7 px-3 text-xs">
                      <Image className="h-3.5 w-3.5 mr-1" />Thumbnails ({result.thumbnails.length})
                    </TabsTrigger>
                  </TabsList>

                  {/* Titles */}
                  <TabsContent value="titles" className="p-5 space-y-2 mt-0">
                    {result.titles.map((title, i) => (
                      <div key={i} className={`group flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-all ${i === 0 ? "bg-red-500/5 border border-red-500/20" : ""}`}>
                        <div className="flex items-center gap-2 shrink-0">
                          {i === 0
                            ? <Badge className="bg-red-500/20 text-red-400 border-0 text-xs px-2">⭐ Top</Badge>
                            : <span className="text-zinc-600 text-xs w-4 text-right">{i + 1}</span>
                          }
                        </div>
                        <p className="flex-1 text-sm text-zinc-200 leading-snug">{title}</p>
                        <button
                          onClick={() => copyText(title, "Title copied!")}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white shrink-0"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                    <Button
                      onClick={() => copyText(result.titles.join("\n"), "All titles copied!")}
                      variant="outline"
                      size="sm"
                      className="w-full mt-2 border-white/10 text-zinc-400 hover:text-white hover:bg-white/5"
                    >
                      <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy All Titles
                    </Button>
                  </TabsContent>

                  {/* Description */}
                  <TabsContent value="description" className="p-5 mt-0">
                    <div className="relative">
                      <Textarea
                        value={result.description}
                        onChange={(e) => setResult({ ...result, description: e.target.value })}
                        rows={12}
                        className="bg-zinc-800 border-zinc-700 text-zinc-200 resize-none text-sm leading-relaxed focus:border-red-500/50"
                      />
                      <button
                        onClick={() => copyText(result.description, "Description copied!")}
                        className="absolute top-2 right-2 p-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-400 hover:text-white"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-zinc-600 mt-2">{result.description.length} characters</p>
                  </TabsContent>

                  {/* Tags */}
                  <TabsContent value="tags" className="p-5 mt-0">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {result.tags.map((tag, i) => (
                        <button
                          key={i}
                          onClick={() => copyText(tag)}
                          className="group flex items-center gap-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:text-white transition-all border border-white/5 hover:border-white/10"
                        >
                          <span>#{tag}</span>
                          <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                        </button>
                      ))}
                    </div>
                    <Button
                      onClick={() => copyText(result.tags.join(", "), "Tags copied!")}
                      variant="outline"
                      size="sm"
                      className="border-white/10 text-zinc-400 hover:text-white hover:bg-white/5"
                    >
                      <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy All Tags
                    </Button>
                  </TabsContent>

                  {/* Thumbnails */}
                  <TabsContent value="thumbnails" className="p-5 mt-0">
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {result.thumbnails.map((t, i) => (
                        <div key={i} className="group relative rounded-xl overflow-hidden border border-white/10 aspect-video bg-zinc-800">
                          <img src={t.url} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                            <button
                              onClick={() => downloadSingle(t.url, i)}
                              className="p-2 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="absolute bottom-1.5 left-1.5 bg-black/60 backdrop-blur-sm rounded-md px-1.5 py-0.5 text-xs text-zinc-300">
                            #{i + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button
                      onClick={downloadAll}
                      className="w-full bg-zinc-800 hover:bg-zinc-700 text-white border-0"
                    >
                      <Download className="h-4 w-4 mr-2" /> Download All as ZIP
                    </Button>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
