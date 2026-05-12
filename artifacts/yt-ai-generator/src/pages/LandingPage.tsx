import { useAuth } from "@/hooks/use-auth";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  Zap, Sparkles, Check, Star, ArrowRight, Youtube, TrendingUp,
  Image, FileText, Tag, Download, RefreshCw, Shield, Clock, ChevronRight,
} from "lucide-react";

const FEATURES = [
  { icon: TrendingUp, title: "10 High-CTR Titles", desc: "AI-crafted titles using power words, curiosity gaps, and proven viral patterns that drive clicks." },
  { icon: FileText, title: "SEO Description", desc: "Full 400-word YouTube description optimized for search with natural keyword density and structured sections." },
  { icon: Tag, title: "15 Optimized Tags", desc: "Research-backed tags ordered by search volume to maximize your video's discoverability." },
  { icon: Image, title: "6–8 AI Thumbnails", desc: "Flux-powered thumbnails in YouTube's exact 16:9 format — bold, eye-catching, ready to upload." },
  { icon: Youtube, title: "Channel Style Match", desc: "Paste your YouTube URL and we'll analyze your channel's visual style to match your brand." },
  { icon: Download, title: "One-Click Export", desc: "Download individual thumbnails or grab all as a ZIP. Copy titles and descriptions in a click." },
];

const TESTIMONIALS = [
  { name: "Marcus Chen", handle: "@techwithmarcus", avatar: "MC", plan: "Pro", quote: "My CTR jumped from 3.2% to 8.7% in the first month. ThumbBoost AI thumbnails look indistinguishable from ones I'd spend 2 hours on in Photoshop.", views: "2.1M views/mo" },
  { name: "Sarah Williams", handle: "@sarahcooks", avatar: "SW", plan: "Starter", quote: "I was spending 45 minutes per video on titles and thumbnails. Now it takes me 90 seconds and the quality is better. This tool paid for itself in week 1.", views: "340K views/mo" },
  { name: "Derek Foster", handle: "@derekfinance", avatar: "DF", plan: "Pro", quote: "The channel style matching is insane. It actually studied my past thumbnails and matched the exact aesthetic. My audience didn't even notice I switched tools.", views: "890K views/mo" },
  { name: "Priya Patel", handle: "@priyawellness", avatar: "PP", plan: "Starter", quote: "As a solo creator, I don't have a design team. ThumbBoost AI IS my design team. Absolutely worth every penny.", views: "127K views/mo" },
];

const PLANS = [
  {
    name: "Free", price: 0, period: "forever", credits: "3 credits/day", description: "Try it out — no credit card needed.",
    features: ["3 credits/day (auto-reset)", "10 title variations", "Full SEO description", "15 tags", "6 Flux thumbnails"],
    cta: "Start Free", highlight: false,
  },
  {
    name: "Starter", price: 19, period: "month", credits: "100 credits/month", description: "For growing creators who publish regularly.",
    features: ["100 credits per month", "10 title variations", "Full SEO description", "15 tags", "8 Flux thumbnails", "Channel style matching", "Generation history"],
    cta: "Get Starter", highlight: false,
  },
  {
    name: "Pro", price: 39, period: "month", credits: "500 credits/month", description: "For serious creators who publish daily.",
    features: ["500 credits per month", "10 title variations", "Full SEO description", "15 tags", "8 Flux thumbnails", "Channel style matching", "Full history + export", "Priority generation"],
    cta: "Go Pro", highlight: true,
  },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Paste your YouTube URL or describe your topic", desc: "We'll auto-fetch your video's title, description, and analyze your channel style." },
  { step: "02", title: "Click Generate — takes about 30 seconds", desc: "Our AI generates 10 viral titles, a full SEO description, 15 tags, and 6–8 custom thumbnails simultaneously." },
  { step: "03", title: "Copy, download, and publish", desc: "One-click copy for text, individual or ZIP download for thumbnails. Your content is ready." },
];

export default function LandingPage() {
  const { isAuthenticated, login } = useAuth();
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-32">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-gradient-to-b from-red-500/10 to-transparent blur-3xl" />
          <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full bg-orange-500/5 blur-3xl" />
          <div className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full bg-red-500/5 blur-3xl" />
        </div>

        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center relative">
          <Badge className="mb-6 inline-flex bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 py-1 px-3 text-sm">
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            AI-Powered Thumbnail & Title Generator
          </Badge>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight mb-6 leading-[1.05]">
            Generate{" "}
            <span className="bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
              Viral Thumbnails
            </span>
            <br />in Seconds
          </h1>

          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Paste a YouTube link. Get 10 high-CTR titles, a full SEO description, 15 tags, and 6–8 custom Flux-powered thumbnails — instantly.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              onClick={() => isAuthenticated ? window.location.href = `${base}/studio` : login("/studio")}
              size="lg"
              className="h-14 px-8 text-base bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white border-0 shadow-xl shadow-red-500/25 font-semibold"
            >
              <Zap className="h-5 w-5 mr-2" />
              Generate for Free — No Card Required
            </Button>
            <Link href={`${base}/pricing`}>
              <Button variant="outline" size="lg" className="h-14 px-8 text-base border-white/10 text-zinc-300 hover:bg-white/5 hover:text-white">
                View Pricing
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>

          {/* Social proof bar */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-zinc-500">
            <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-green-500" />3 free credits daily, no card</span>
            <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-green-500" />Flux AI thumbnails</span>
            <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-green-500" />YouTube channel style matching</span>
          </div>
        </div>

        {/* Mock Result Card */}
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 mt-20 relative">
          <div className="rounded-2xl border border-white/10 bg-zinc-900/80 backdrop-blur-sm overflow-hidden shadow-2xl shadow-black/50">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-black/30">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="ml-2 text-xs text-zinc-500 font-mono">ThumbBoost AI — Studio</span>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Titles preview */}
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-3">✦ Generated Titles</p>
                <div className="space-y-2">
                  {[
                    "I Tried This for 30 Days and It Changed Everything",
                    "The Brutal Truth About YouTube Growth in 2024",
                    "7 Thumbnail Mistakes That Are Killing Your CTR",
                    "Why 99% of Creators Get Thumbnails Wrong",
                    "How I Went from 0 to 100K Subscribers (Exact Method)",
                  ].map((title, i) => (
                    <div key={i} className={`flex items-start gap-2 p-2 rounded-lg ${i === 0 ? "bg-red-500/10 border border-red-500/20" : "hover:bg-white/5"}`}>
                      {i === 0 && <Badge className="shrink-0 bg-red-500/20 text-red-400 border-0 text-xs">Top Pick</Badge>}
                      {i !== 0 && <span className="text-zinc-600 text-xs mt-0.5 w-5 shrink-0">{i + 1}.</span>}
                      <span className="text-sm text-zinc-200 leading-snug">{title}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Thumbnails preview */}
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-3">✦ AI Thumbnails</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    "bg-gradient-to-br from-red-900 to-orange-800",
                    "bg-gradient-to-br from-blue-900 to-purple-900",
                    "bg-gradient-to-br from-zinc-800 to-zinc-900",
                    "bg-gradient-to-br from-green-900 to-teal-900",
                  ].map((bg, i) => (
                    <div key={i} className={`aspect-video rounded-lg ${bg} flex items-center justify-center border border-white/10`}>
                      <Image className="h-6 w-6 text-white/30" />
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <div className="flex-1 h-7 rounded-md bg-white/5 border border-white/10 flex items-center justify-center">
                    <Download className="h-3.5 w-3.5 text-zinc-400" />
                    <span className="text-xs text-zinc-400 ml-1.5">Download ZIP</span>
                  </div>
                  <div className="flex-1 h-7 rounded-md bg-white/5 border border-white/10 flex items-center justify-center">
                    <RefreshCw className="h-3.5 w-3.5 text-zinc-400" />
                    <span className="text-xs text-zinc-400 ml-1.5">Regenerate</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 border-t border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">Everything You Need to <span className="text-red-400">Dominate YouTube</span></h2>
            <p className="text-zinc-400 text-lg max-w-2xl mx-auto">One generation. All the content you need to publish a high-performing video.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="group rounded-2xl border border-white/5 bg-zinc-900/50 p-6 hover:border-white/10 hover:bg-zinc-900 transition-all">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/10">
                  <Icon className="h-5 w-5 text-red-400" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 border-t border-white/5 bg-zinc-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">From URL to Upload-Ready in <span className="text-orange-400">Under a Minute</span></h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map(({ step, title, desc }) => (
              <div key={step} className="relative text-center">
                <div className="text-7xl font-black text-white/5 mb-4">{step}</div>
                <h3 className="text-lg font-semibold text-white mb-3 -mt-10">{title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 border-t border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">Creators Are <span className="text-yellow-400">Getting Results</span></h2>
            <p className="text-zinc-400">Real creators, real numbers.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {TESTIMONIALS.map(({ name, handle, avatar, plan, quote, views }) => (
              <div key={handle} className="rounded-2xl border border-white/5 bg-zinc-900/50 p-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />)}
                </div>
                <p className="text-zinc-300 text-sm leading-relaxed mb-4">"{quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white text-xs font-bold">
                    {avatar}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{name} <span className="text-zinc-500 font-normal">{handle}</span></p>
                    <p className="text-xs text-zinc-500">{views} · <span className="text-blue-400">{plan}</span></p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 border-t border-white/5 bg-zinc-950" id="pricing">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">Predictable Pricing. <span className="text-green-400">No Surprises.</span></h2>
            <p className="text-zinc-400 max-w-xl mx-auto">A strict credit system means you're always in control. 1 generation = 1 credit, always.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map(({ name, price, period, credits, description, features, cta, highlight }) => (
              <div key={name} className={`relative rounded-2xl p-6 ${highlight ? "bg-gradient-to-b from-red-950/50 to-zinc-900 border-2 border-red-500/40 shadow-2xl shadow-red-500/10" : "border border-white/5 bg-zinc-900/50"}`}>
                {highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white border-0 text-xs px-3 py-1">Most Popular</Badge>
                  </div>
                )}
                <div className="mb-5">
                  <h3 className="text-lg font-bold text-white">{name}</h3>
                  <div className="mt-2 flex items-end gap-1">
                    <span className="text-4xl font-black text-white">${price}</span>
                    {price > 0 && <span className="text-zinc-400 mb-1">/{period}</span>}
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">{credits}</p>
                  <p className="text-sm text-zinc-400 mt-2">{description}</p>
                </div>
                <Button
                  onClick={() => isAuthenticated ? window.location.href = `${base}/pricing` : login("/pricing")}
                  className={`w-full mb-5 ${highlight ? "bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white border-0 shadow-lg shadow-red-500/20" : "bg-zinc-800 hover:bg-zinc-700 text-white border-0"}`}
                >
                  {cta} <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
                <ul className="space-y-2.5">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-zinc-400">
                      <Check className={`h-4 w-4 mt-0.5 shrink-0 ${highlight ? "text-red-400" : "text-zinc-500"}`} />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {/* Credit packs */}
          <div className="mt-8 rounded-2xl border border-white/5 bg-zinc-900/50 p-6 text-center">
            <p className="text-sm text-zinc-400 mb-3">Need more credits? <span className="text-white font-medium">Buy credit packs anytime</span></p>
            <div className="flex flex-wrap justify-center gap-3">
              {[["$10", "50 credits"], ["$25", "150 credits"], ["$50", "350 credits"]].map(([price, label]) => (
                <div key={price} className="rounded-xl border border-white/10 bg-zinc-800/50 px-5 py-3 text-sm">
                  <span className="font-bold text-white">{price}</span>
                  <span className="text-zinc-400 ml-1">for {label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 border-t border-white/5">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 shadow-2xl shadow-red-500/30 mb-6">
            <Zap className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-4xl font-black mb-4">Start Boosting Your CTR Today</h2>
          <p className="text-zinc-400 text-lg mb-8">3 free generations every day. No credit card. Cancel anytime.</p>
          <Button
            onClick={() => isAuthenticated ? window.location.href = `${base}/studio` : login("/studio")}
            size="lg"
            className="h-14 px-10 text-base bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white border-0 shadow-xl shadow-red-500/25 font-semibold"
          >
            <Zap className="h-5 w-5 mr-2" />
            Generate Free Thumbnails Now
          </Button>
          <p className="mt-4 text-sm text-zinc-600">
            <Shield className="inline h-3.5 w-3.5 mr-1" /> No credit card required · <Clock className="inline h-3.5 w-3.5 mr-1" /> Ready in 30 seconds
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
              <Zap className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-zinc-400">ThumbBoost<span className="text-red-400">AI</span></span>
          </div>
          <p className="text-xs text-zinc-600">© 2024 ThumbBoostAI. Built for creators who want to grow.</p>
          <div className="flex gap-6 text-xs text-zinc-600">
            <span className="hover:text-zinc-400 cursor-pointer">Privacy</span>
            <span className="hover:text-zinc-400 cursor-pointer">Terms</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
