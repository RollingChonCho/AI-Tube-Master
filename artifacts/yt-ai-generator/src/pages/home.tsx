// Legacy page — redirected to new LandingPage
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Home() {
  const [, navigate] = useLocation();
  useEffect(() => { navigate("/"); }, []);
  return null;
}

/*
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { 
  useGetConfigStatus, 
  useFetchYouTubeVideo, 
  useGenerateAll,
  useGenerateContent,
  useGenerateThumbnails
} from "@workspace/api-client-react";
import type { 
  GenerateAllResult, 
  YouTubeVideoData,
  ThumbnailImage
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import JSZip from "jszip";
import { 
  Loader2, 
  Youtube, 
  Wand2, 
  Copy, 
  Check, 
  Download, 
  AlertCircle,
  X,
  FileText,
  Tags,
  Image as ImageIcon,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

import { ModeToggle } from "@/components/mode-toggle";

const LOADING_MESSAGES = [
  "Analyzing topic...",
  "Drafting catchy titles...",
  "Optimizing SEO description...",
  "Generating relevant tags...",
  "Painting stunning thumbnails...",
  "Adding final touches...",
  "Almost there..."
];

export default function Home() {
  const { toast } = useToast();
  const { data: configStatus, isLoading: isConfigLoading } = useGetConfigStatus();
  
  const [inputMode, setInputMode] = useState<"url" | "manual">("url");
  const [url, setUrl] = useState("");
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [style, setStyle] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  
  const [videoData, setVideoData] = useState<YouTubeVideoData | null>(null);
  const [results, setResults] = useState<GenerateAllResult | null>(null);
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const [showConfigNotice, setShowConfigNotice] = useState(true);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);

  const fetchVideo = useFetchYouTubeVideo();
  const generateAll = useGenerateAll();
  const generateContent = useGenerateContent();
  const generateThumbnails = useGenerateThumbnails();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (generateAll.isPending) {
      setLoadingMsgIdx(0);
      interval = setInterval(() => {
        setLoadingMsgIdx((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [generateAll.isPending]);

  const handleFetch = () => {
    if (!url) {
      toast({ title: "Please enter a YouTube URL", variant: "destructive" });
      return;
    }
    fetchVideo.mutate({ data: { url } }, {
      onSuccess: (data) => {
        setVideoData(data);
        setTopic(data.title);
        setDescription(data.description || "");
      },
      onError: () => {
        toast({ title: "Failed to fetch video", description: "Could not fetch video metadata. Check the URL and your YouTube API key.", variant: "destructive" });
      }
    });
  };

  const getActiveParams = () => ({
    topic: inputMode === "url" && videoData ? videoData.title : topic,
    description: (inputMode === "url" && videoData ? videoData.description : description) || undefined,
  });

  const handleGenerate = () => {
    const params = getActiveParams();
    if (!params.topic) {
      toast({ title: "Topic is required", variant: "destructive" });
      return;
    }

    generateAll.mutate({ 
      data: { 
        ...params,
        style: style || undefined,
        targetAudience: targetAudience || undefined,
        thumbnailCount: 6
      } 
    }, {
      onSuccess: (data) => {
        setResults(data);
        toast({ title: "Generation complete!", description: "Titles, description, and thumbnails are ready." });
      },
      onError: () => {
        toast({ title: "Generation failed", description: "Could not generate content. Check your OpenAI API key.", variant: "destructive" });
      }
    });
  };

  const handleRegenerateContent = () => {
    const params = getActiveParams();
    if (!params.topic) return;

    generateContent.mutate({
      data: {
        ...params,
        style: style || undefined,
        targetAudience: targetAudience || undefined,
      }
    }, {
      onSuccess: (data) => {
        if (results) {
          setResults({ ...results, titles: data.titles, description: data.description, tags: data.tags });
        }
        toast({ title: "Content regenerated!" });
      },
      onError: () => {
        toast({ title: "Failed to regenerate content", description: "Could not regenerate. Check your OpenAI API key.", variant: "destructive" });
      }
    });
  };

  const handleRegenerateThumbnails = () => {
    const params = getActiveParams();
    if (!params.topic) return;

    generateThumbnails.mutate({
      data: {
        topic: params.topic,
        style: style || undefined,
        count: 6
      }
    }, {
      onSuccess: (data) => {
        if (results) {
          setResults({ ...results, thumbnails: data.thumbnails, provider: data.provider });
        }
        toast({ title: "Thumbnails regenerated!" });
      },
      onError: () => {
        toast({ title: "Failed to regenerate thumbnails", description: "Could not regenerate thumbnails. Check your API keys.", variant: "destructive" });
      }
    });
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStates({ ...copiedStates, [id]: true });
    setTimeout(() => {
      setCopiedStates(prev => ({ ...prev, [id]: false }));
    }, 2000);
    toast({ title: "Copied to clipboard" });
  };

  const handleDownloadImage = async (url: string, index: number) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `thumbnail-${index + 1}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
      toast({ title: "Failed to download image", variant: "destructive" });
    }
  };

  const handleDownloadAll = async () => {
    if (!results?.thumbnails || results.thumbnails.length === 0) return;
    
    toast({ title: "Zipping images...", description: "This might take a moment." });
    try {
      const zip = new JSZip();
      
      await Promise.all(results.thumbnails.map(async (thumb: ThumbnailImage, i: number) => {
        const response = await fetch(thumb.url);
        const blob = await response.blob();
        zip.file(`thumbnail-${i + 1}.png`, blob);
      }));
      
      const content = await zip.generateAsync({ type: "blob" });
      const a = document.createElement('a');
      const blobUrl = window.URL.createObjectURL(content);
      a.href = blobUrl;
      a.download = "youtube-thumbnails.zip";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
      toast({ title: "Download complete" });
    } catch (e) {
      toast({ title: "Failed to create ZIP", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary/20 p-2 rounded-lg">
              <Youtube className="w-5 h-5 text-primary" />
            </div>
            <h1 className="font-bold text-xl tracking-tight">Creator<span className="text-primary">Studio</span></h1>
          </div>
          <ModeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 mt-8 max-w-5xl space-y-8">
        
        {/* Config Notice */}
        {!isConfigLoading && configStatus && showConfigNotice && (!configStatus.openai || !configStatus.youtube || !configStatus.replicate) && (
          <div className="bg-muted border border-border rounded-lg p-4 flex items-start gap-3 relative">
            <AlertCircle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-sm">Limited Functionality</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Some API keys are missing. 
                {!configStatus.openai && " OpenAI is not configured (generation will fail)."}
                {!configStatus.youtube && " YouTube Data API is not configured (fetching videos won't work)."}
                {!configStatus.replicate && " Replicate is not configured (falling back to DALL-E)."}
              </p>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 -mt-1 -mr-1" onClick={() => setShowConfigNotice(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-8">
          
          {/* LEFT COLUMN: Input */}
          <div className="space-y-6">
            <Card className="border-border/50 shadow-md">
              <CardHeader className="pb-4">
                <CardTitle>Source Material</CardTitle>
                <CardDescription>Start with a video link or manual topic</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as "url" | "manual")} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="url">YouTube URL</TabsTrigger>
                    <TabsTrigger value="manual">Manual Input</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="url" className="space-y-4">
                    <div className="space-y-2">
                      <Input 
                        placeholder="https://youtube.com/watch?v=..." 
                        value={url} 
                        onChange={e => setUrl(e.target.value)} 
                      />
                      <Button 
                        variant="secondary" 
                        className="w-full" 
                        onClick={handleFetch}
                        disabled={fetchVideo.isPending}
                      >
                        {fetchVideo.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Youtube className="w-4 h-4 mr-2" />}
                        Fetch Metadata
                      </Button>
                    </div>

                    {videoData && (
                      <div className="mt-4 p-3 bg-muted/50 rounded-lg border border-border/50 space-y-3">
                        <img src={videoData.thumbnailUrl} alt="Thumbnail" className="w-full aspect-video object-cover rounded-md bg-muted" />
                        <div>
                          <h4 className="font-medium text-sm line-clamp-2">{videoData.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{videoData.description || "No description"}</p>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="manual" className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Topic / Title Idea <span className="text-destructive">*</span></label>
                      <Input placeholder="e.g. 10 ways to master React" value={topic} onChange={e => setTopic(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Description Context</label>
                      <Textarea placeholder="What is this video about?" className="resize-none h-24" value={description} onChange={e => setDescription(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Vibe / Style</label>
                      <Select value={style} onValueChange={setStyle}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select style..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Educational">Educational</SelectItem>
                          <SelectItem value="Entertainment">Entertainment</SelectItem>
                          <SelectItem value="Tutorial">Tutorial</SelectItem>
                          <SelectItem value="Vlog">Vlog</SelectItem>
                          <SelectItem value="Review">Review</SelectItem>
                          <SelectItem value="Gaming">Gaming</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Target Audience</label>
                      <Input placeholder="e.g. Beginner developers" value={targetAudience} onChange={e => setTargetAudience(e.target.value)} />
                    </div>
                  </TabsContent>
                </Tabs>

                <Button 
                  className="w-full py-6 text-base font-semibold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]" 
                  onClick={handleGenerate}
                  disabled={generateAll.isPending || (inputMode === 'url' && !videoData && !topic) || (inputMode === 'manual' && !topic)}
                >
                  {generateAll.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-5 h-5 mr-2" />
                      Generate Everything
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN: Results */}
          <div className="min-w-0">
            {!results && !generateAll.isPending && (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 border border-dashed border-border rounded-xl bg-muted/20">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Wand2 className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">No Content Yet</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                  Enter your video details on the left and hit generate to create titles, descriptions, and thumbnails instantly.
                </p>
              </div>
            )}

            {generateAll.isPending && (
              <div className="space-y-6">
                <div className="flex flex-col items-center justify-center py-12 px-4 border border-border rounded-xl bg-card">
                  <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-1">{LOADING_MESSAGES[loadingMsgIdx]}</h3>
                  <p className="text-sm text-muted-foreground">This can take up to 60 seconds.</p>
                </div>
                <Skeleton className="h-10 w-full max-w-sm" />
                <div className="grid gap-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
                </div>
              </div>
            )}

            {results && !generateAll.isPending && (
              <Tabs defaultValue="titles" className="w-full">
                <TabsList className="mb-6 bg-transparent border-b border-border w-full justify-start rounded-none h-auto p-0 overflow-x-auto overflow-y-hidden">
                  <TabsTrigger value="titles" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3 shrink-0">
                    <FileText className="w-4 h-4 mr-2" /> Titles
                  </TabsTrigger>
                  <TabsTrigger value="description" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3 shrink-0">
                    <Tags className="w-4 h-4 mr-2" /> Description & Tags
                  </TabsTrigger>
                  <TabsTrigger value="thumbnails" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3 shrink-0">
                    <ImageIcon className="w-4 h-4 mr-2" /> Thumbnails
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="titles" className="space-y-4 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">10 Optimized Titles</h3>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={handleRegenerateContent} disabled={generateContent.isPending}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${generateContent.isPending ? 'animate-spin' : ''}`} />
                        Regenerate
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleCopy(results.titles.join('\n'), 'all-titles')}>
                        {copiedStates['all-titles'] ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                        Copy All
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-3">
                    {results.titles.map((t: string, i: number) => (
                      <div key={i} className="group relative p-4 rounded-lg border border-border/50 bg-card hover:border-primary/50 transition-colors flex items-start gap-4">
                        <div className="w-8 shrink-0 text-center font-mono text-sm text-muted-foreground mt-0.5">
                          {String(i + 1).padStart(2, '0')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[15px] pr-12">{t}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-muted-foreground">{t.length} chars</span>
                            {i < 3 && <Badge variant="secondary" className="text-[10px] h-4 px-1.5 bg-primary/10 text-primary hover:bg-primary/20">Top Pick</Badge>}
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-4 top-4"
                          onClick={() => handleCopy(t, `title-${i}`)}
                        >
                          {copiedStates[`title-${i}`] ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="description" className="space-y-6 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">SEO Description</h3>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={handleRegenerateContent} disabled={generateContent.isPending}>
                          <RefreshCw className={`w-4 h-4 mr-2 ${generateContent.isPending ? 'animate-spin' : ''}`} />
                          Regenerate
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleCopy(results.description, 'desc')}>
                          {copiedStates['desc'] ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                          Copy
                        </Button>
                      </div>
                    </div>
                    <Textarea 
                      value={results.description} 
                      onChange={(e) => setResults({ ...results, description: e.target.value })}
                      className="h-64 font-mono text-sm leading-relaxed bg-muted/30 focus-visible:ring-primary"
                    />
                  </div>

                  <div className="space-y-3 pt-4 border-t border-border/50">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Tags & Keywords</h3>
                      <Button variant="outline" size="sm" onClick={() => handleCopy(results.tags.join(', '), 'tags')}>
                        {copiedStates['tags'] ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                        Copy All
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {results.tags.map((tag: string, i: number) => (
                        <div 
                          key={i} 
                          className="flex items-center bg-secondary text-secondary-foreground px-3 py-1.5 rounded-full text-sm font-medium hover:bg-secondary/80 cursor-pointer group transition-colors"
                          onClick={() => handleCopy(tag, `tag-${i}`)}
                        >
                          {tag}
                          {copiedStates[`tag-${i}`] ? <Check className="w-3 h-3 ml-2 text-green-500" /> : <Copy className="w-3 h-3 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />}
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="thumbnails" className="space-y-4 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
                    <div>
                      <h3 className="text-lg font-semibold">Thumbnail Concepts</h3>
                      {results.provider && (
                        <p className="text-xs text-muted-foreground mt-1">Generated by <span className="font-medium text-foreground capitalize">{results.provider}</span></p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" onClick={handleRegenerateThumbnails} disabled={generateThumbnails.isPending}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${generateThumbnails.isPending ? 'animate-spin' : ''}`} />
                        Regenerate
                      </Button>
                      <Button onClick={handleDownloadAll} disabled={!results.thumbnails.length}>
                        <Download className="w-4 h-4 mr-2" />
                        Download ZIP
                      </Button>
                    </div>
                  </div>
                  
                  {generateThumbnails.isPending ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       {[1, 2, 3, 4].map((i) => (
                         <Skeleton key={i} className="aspect-video w-full rounded-xl" />
                       ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {results.thumbnails.map((thumb: ThumbnailImage, i: number) => (
                        <Card key={i} className="overflow-hidden group border-border/50 hover:border-primary/50 transition-colors">
                          <div className="aspect-video bg-muted relative overflow-hidden">
                            <img src={thumb.url} alt={`Thumbnail ${i+1}`} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Button variant="secondary" onClick={() => handleDownloadImage(thumb.url, i)}>
                                <Download className="w-4 h-4 mr-2" /> Download
                              </Button>
                            </div>
                          </div>
                          {thumb.prompt && (
                            <div className="p-3 bg-card border-t border-border/50">
                              <details className="text-xs text-muted-foreground group/details">
                                <summary className="cursor-pointer font-medium hover:text-foreground list-none flex items-center">
                                  <span className="mr-2">▶</span> View Prompt
                                </summary>
                                <p className="mt-2 pl-4 leading-relaxed border-l border-border/50">{thumb.prompt}</p>
                              </details>
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

              </Tabs>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
