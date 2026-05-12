import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Zap, Sparkles, CreditCard, History, TrendingUp, ArrowRight,
  Image, Copy, ExternalLink, Clock, Star,
} from "lucide-react";
import { toast } from "sonner";
import type { HistoryItem } from "@workspace/api-client-react";

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading, login } = useAuth();
  const [, navigate] = useLocation();
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) login("/dashboard");
  }, [isLoading, isAuthenticated, login]);

  const { data: historyData, isLoading: historyLoading } = useQuery<{ items: HistoryItem[] }>({
    queryKey: ["history"],
    queryFn: () => fetch("/api/history", { credentials: "include" }).then((r) => r.json()),
    enabled: isAuthenticated,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;

  const planColors: Record<string, string> = {
    free: "bg-zinc-800 text-zinc-300 border-zinc-700",
    starter: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    pro: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  };

  const history = historyData?.items ?? [];
  const urlCheckout = isAuthenticated ? `${base}/pricing` : "#";

  function manageSubscription() {
    fetch("/api/stripe/portal", { method: "POST", credentials: "include" })
      .then((r) => r.json())
      .then((d: { url?: string }) => { if (d.url) window.location.href = d.url; })
      .catch(() => toast.error("Could not open billing portal"));
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
        {/* Welcome banner */}
        <div className="mb-8">
          <h1 className="text-3xl font-black">
            Welcome back{user.firstName ? `, ${user.firstName}` : ""} 👋
          </h1>
          <p className="text-zinc-500 mt-1">Your ThumbBoost AI dashboard</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {/* Credits */}
          <Card className="bg-zinc-900 border-white/5 col-span-1">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-500/10">
                  <Zap className="h-4.5 w-4.5 text-yellow-400" />
                </div>
                <Badge variant="outline" className={`text-xs ${planColors[user.plan ?? "free"] ?? planColors.free}`}>
                  {(user.plan ?? "free").charAt(0).toUpperCase() + (user.plan ?? "free").slice(1)}
                </Badge>
              </div>
              <div className="text-3xl font-black text-white">{user.credits ?? 0}</div>
              <p className="text-xs text-zinc-500 mt-0.5">Credits remaining</p>
              {user.plan === "free" && (
                <p className="text-xs text-zinc-600 mt-1">Resets daily · 3 max</p>
              )}
            </CardContent>
          </Card>

          {/* Generations used */}
          <Card className="bg-zinc-900 border-white/5">
            <CardContent className="p-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10 mb-3">
                <TrendingUp className="h-4.5 w-4.5 text-red-400" />
              </div>
              <div className="text-3xl font-black text-white">{history.length}</div>
              <p className="text-xs text-zinc-500 mt-0.5">Total generations</p>
            </CardContent>
          </Card>

          {/* Plan */}
          <Card className="bg-zinc-900 border-white/5">
            <CardContent className="p-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 mb-3">
                <Star className="h-4.5 w-4.5 text-purple-400" />
              </div>
              <div className="text-xl font-black text-white capitalize">{user.plan ?? "Free"}</div>
              <p className="text-xs text-zinc-500 mt-0.5">Current plan</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          <Link
            href={`${base}/studio`}
            className="group flex items-center gap-4 rounded-2xl border border-white/5 bg-zinc-900/50 p-5 hover:border-red-500/30 hover:bg-zinc-900 transition-all cursor-pointer"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-orange-500 shadow-lg shadow-red-500/20">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-white">New Generation</p>
              <p className="text-sm text-zinc-500">Generate titles, description & thumbnails</p>
            </div>
            <ArrowRight className="h-5 w-5 text-zinc-600 group-hover:text-white transition-colors" />
          </Link>

          {user.plan !== "pro" ? (
            <Link
              href={`${base}/pricing`}
              className="group flex items-center gap-4 rounded-2xl border border-dashed border-white/10 bg-zinc-900/30 p-5 hover:border-blue-500/30 hover:bg-zinc-900 transition-all cursor-pointer"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
                <CreditCard className="h-6 w-6 text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-white">Upgrade Plan</p>
                <p className="text-sm text-zinc-500">Get 100–500 credits/month from $19</p>
              </div>
              <ArrowRight className="h-5 w-5 text-zinc-600 group-hover:text-blue-400 transition-colors" />
            </Link>
          ) : (
            <button onClick={manageSubscription} className="group flex items-center gap-4 rounded-2xl border border-white/5 bg-zinc-900/50 p-5 hover:border-white/10 hover:bg-zinc-900 transition-all text-left w-full">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-500/10">
                <CreditCard className="h-6 w-6 text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-white">Manage Billing</p>
                <p className="text-sm text-zinc-500">Update payment, cancel subscription</p>
              </div>
              <ExternalLink className="h-5 w-5 text-zinc-600 group-hover:text-white transition-colors" />
            </button>
          )}
        </div>

        {/* Credit notice if low */}
        {(user.credits ?? 0) === 0 && (
          <div className="mb-8 rounded-xl border border-orange-500/20 bg-orange-500/5 p-4 flex items-center gap-3">
            <Zap className="h-5 w-5 text-orange-400 shrink-0" />
            <p className="text-sm text-orange-300">You're out of credits.{" "}
              {user.plan === "free"
                ? "They'll reset tomorrow, or upgrade for more."
                : <Link href={`${base}/pricing`} className="text-orange-400 underline">Buy a credit pack</Link>}
            </p>
          </div>
        )}

        {/* History */}
        <div>
          <div className="flex items-center gap-2 mb-5">
            <History className="h-5 w-5 text-zinc-400" />
            <h2 className="text-lg font-bold">Generation History</h2>
            {history.length > 0 && (
              <Badge variant="outline" className="border-white/10 text-zinc-400 text-xs">{history.length}</Badge>
            )}
          </div>

          {historyLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-xl bg-zinc-900 animate-pulse" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center">
              <Sparkles className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500 font-medium">No generations yet</p>
              <p className="text-zinc-600 text-sm mt-1">Your history will appear here after your first generation</p>
              <Link href={`${base}/studio`}>
                <Button className="mt-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20">
                  <Sparkles className="h-4 w-4 mr-2" /> Create Your First
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => {
                const titles = (item.titles as string[]) ?? [];
                const thumbs = (item.thumbnails as Array<{ url: string }>) ?? [];
                return (
                  <div key={item.id} className="group rounded-xl border border-white/5 bg-zinc-900/50 p-4 hover:border-white/10 hover:bg-zinc-900 transition-all">
                    <div className="flex items-start gap-4">
                      {/* Thumbnail preview */}
                      {thumbs[0]?.url ? (
                        <img src={thumbs[0].url} alt="" className="h-16 w-28 rounded-lg object-cover shrink-0 border border-white/10" />
                      ) : (
                        <div className="h-16 w-28 rounded-lg bg-zinc-800 shrink-0 flex items-center justify-center border border-white/10">
                          <Image className="h-5 w-5 text-zinc-600" />
                        </div>
                      )}
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white text-sm leading-snug line-clamp-1">
                          {item.topic}
                        </p>
                        {titles[0] && (
                          <p className="text-xs text-zinc-500 mt-1 line-clamp-1">
                            <span className="text-zinc-600">Top title: </span>{titles[0]}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-zinc-600 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                          <span className="text-xs text-zinc-600">{titles.length} titles · {thumbs.length} thumbs</span>
                        </div>
                      </div>
                      {/* Actions */}
                      <button
                        onClick={() => { navigator.clipboard.writeText(titles[0] ?? ""); toast.success("Title copied!"); }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white shrink-0"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
