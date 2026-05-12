import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Check, Zap, ArrowRight, Loader2, AlertCircle, CreditCard, Star,
} from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "wouter";

interface Price {
  id: string;
  unit_amount: number | null;
  currency: string;
  recurring: { interval: string } | null;
  active: boolean;
}
interface Product {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  prices: Price[];
}

// Hardcoded plans UI (mapped from Stripe products)
const PLANS = [
  {
    name: "Free",
    price: 0,
    period: "forever",
    credits: "3 credits/day",
    description: "Try it without a credit card.",
    features: [
      "3 free credits per day",
      "Auto-resets every 24 hours",
      "10 title variations",
      "Full SEO description",
      "15 tags",
      "6 Flux AI thumbnails",
    ],
    highlight: false,
    planKey: "free",
    priceId: null,
  },
  {
    name: "Starter",
    price: 19,
    period: "month",
    credits: "100 credits/month",
    description: "For regular creators publishing weekly.",
    features: [
      "100 credits per month",
      "10 title variations",
      "Full SEO description",
      "15 tags",
      "8 Flux AI thumbnails",
      "YouTube channel style matching",
      "Full generation history",
    ],
    highlight: false,
    planKey: "starter",
    priceId: "starter",
  },
  {
    name: "Pro",
    price: 39,
    period: "month",
    credits: "500 credits/month",
    description: "For daily publishers and agencies.",
    features: [
      "500 credits per month",
      "10 title variations",
      "Full SEO description",
      "15 tags",
      "8 Flux AI thumbnails",
      "YouTube channel style matching",
      "Full history & export",
      "Priority generation queue",
    ],
    highlight: true,
    planKey: "pro",
    priceId: "pro",
  },
];

const CREDIT_PACKS = [
  { label: "50 credits", price: 10, packKey: "pack_50" },
  { label: "150 credits", price: 25, packKey: "pack_150" },
  { label: "350 credits", price: 50, packKey: "pack_350" },
];

export default function PricingPage() {
  const { user, isAuthenticated, isLoading, login } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingPrices, setLoadingPrices] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [checkoutSuccess] = useSearchParams();
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");

  useEffect(() => {
    const success = checkoutSuccess.get?.("checkout");
    if (success === "success") toast.success("Payment successful! Your credits are being applied.");
  }, []);

  useEffect(() => {
    fetch("/api/stripe/products-with-prices")
      .then((r) => r.json())
      .then((d: { data: Product[] }) => { setProducts(d.data ?? []); setLoadingPrices(false); })
      .catch(() => setLoadingPrices(false));
  }, []);

  // Match plan name to stripe product
  function findPriceId(planKey: string): string | null {
    const product = products.find((p) =>
      p.name.toLowerCase().includes(planKey.toLowerCase())
    );
    if (!product) return null;
    // Find monthly recurring price
    const monthly = product.prices.find((p) => p.recurring?.interval === "month");
    return monthly?.id ?? product.prices[0]?.id ?? null;
  }

  function findPackPriceId(packKey: string): string | null {
    // One-time prices matching the pack label
    const packCreditMap: Record<string, string> = {
      pack_50: "50",
      pack_150: "150",
      pack_350: "350",
    };
    const creditLabel = packCreditMap[packKey];
    const packProduct = products.find((p) => p.name.toLowerCase().includes("pack") || p.name.toLowerCase().includes("credit"));
    if (!packProduct) return null;
    const price = packProduct.prices.find((p) => !p.recurring && p.unit_amount != null);
    return price?.id ?? null;
  }

  async function handleCheckout(priceId: string, loadingKey: string) {
    if (!isAuthenticated) {
      login("/pricing");
      return;
    }
    setCheckoutLoading(loadingKey);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "Failed to start checkout");
      window.location.href = data.url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setCheckoutLoading(null);
    }
  }

  async function handleManageSubscription() {
    setCheckoutLoading("portal");
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST", credentials: "include" });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "Failed to open portal");
      window.location.href = data.url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Portal failed");
    } finally {
      setCheckoutLoading(null);
    }
  }

  const isCurrentPlan = (planKey: string) => (user?.plan ?? "free") === planKey;

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-14">
          <h1 className="text-5xl font-black mb-4">
            Transparent Pricing.{" "}
            <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
              Real Value.
            </span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            1 credit = 1 full generation (10 titles + description + tags + 6–8 thumbnails). No hidden fees, no unlimited-but-slow gimmicks.
          </p>
          {isAuthenticated && user && (
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-zinc-900 px-4 py-2 text-sm">
              <Zap className="h-4 w-4 text-yellow-400" />
              <span className="text-zinc-400">Current plan:</span>
              <span className="font-semibold text-white capitalize">{user.plan}</span>
              <span className="text-zinc-500">·</span>
              <span className="text-zinc-400">{user.credits} credits remaining</span>
            </div>
          )}
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {PLANS.map(({ name, price, period, credits, description, features, highlight, planKey, priceId: planPriceKey }) => {
            const stripeId = planPriceKey ? findPriceId(planPriceKey) : null;
            const current = isCurrentPlan(planKey);
            const loadingThis = checkoutLoading === planKey;

            return (
              <div key={name} className={`relative flex flex-col rounded-2xl p-6 ${highlight
                ? "bg-gradient-to-b from-red-950/60 to-zinc-900 border-2 border-red-500/40 shadow-2xl shadow-red-500/10"
                : "border border-white/5 bg-zinc-900/50"}`}
              >
                {highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white border-0 text-xs px-3 py-1">
                      <Star className="h-3 w-3 mr-1 fill-white" /> Most Popular
                    </Badge>
                  </div>
                )}
                {current && (
                  <div className="absolute -top-3 right-4">
                    <Badge className="bg-green-500/20 text-green-400 border border-green-500/30 text-xs px-2 py-0.5">Current</Badge>
                  </div>
                )}

                <div className="mb-5">
                  <h2 className="text-xl font-bold text-white">{name}</h2>
                  <div className="mt-3 flex items-end gap-1">
                    <span className="text-5xl font-black text-white">${price}</span>
                    {price > 0 && <span className="text-zinc-400 mb-1.5 text-sm">/{period}</span>}
                  </div>
                  <p className="text-xs text-zinc-500 mt-1 font-medium">{credits}</p>
                  <p className="text-sm text-zinc-400 mt-2">{description}</p>
                </div>

                <div className="flex-1">
                  <ul className="space-y-2.5 mb-6">
                    {features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-zinc-400">
                        <Check className={`h-4 w-4 mt-0.5 shrink-0 ${highlight ? "text-red-400" : "text-zinc-500"}`} />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>

                {planKey === "free" ? (
                  <Button
                    onClick={() => !isAuthenticated ? login("/studio") : (window.location.href = `${base}/studio`)}
                    className="w-full bg-zinc-800 hover:bg-zinc-700 text-white border-0"
                  >
                    {isAuthenticated ? "Go to Studio" : "Start for Free"}
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : current && user?.stripeSubscriptionId ? (
                  <Button
                    onClick={handleManageSubscription}
                    disabled={checkoutLoading === "portal"}
                    variant="outline"
                    className="w-full border-white/10 text-zinc-400 hover:text-white hover:bg-white/5"
                  >
                    {checkoutLoading === "portal" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CreditCard className="h-4 w-4 mr-2" />}
                    Manage Subscription
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      if (!isAuthenticated) { login("/pricing"); return; }
                      if (!stripeId && !loadingPrices) {
                        toast.error("Stripe not connected yet — contact support"); return;
                      }
                      if (stripeId) handleCheckout(stripeId, planKey);
                    }}
                    disabled={loadingThis || current || loadingPrices}
                    className={`w-full ${highlight
                      ? "bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white border-0 shadow-lg shadow-red-500/20"
                      : "bg-zinc-800 hover:bg-zinc-700 text-white border-0"}`}
                  >
                    {loadingThis
                      ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Redirecting...</>
                      : loadingPrices
                        ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Loading...</>
                        : current
                          ? "Current Plan"
                          : <>{name === "Pro" ? "Go Pro" : "Get Starter"} <ArrowRight className="h-4 w-4 ml-1" /></>}
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {/* Credit packs */}
        <div className="rounded-2xl border border-white/5 bg-zinc-900/50 p-8 mb-10">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold">Need Extra Credits?</h3>
            <p className="text-zinc-400 text-sm mt-1">One-time credit packs — never expire, use anytime.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {CREDIT_PACKS.map(({ label, price, packKey }) => {
              const stripeId = findPackPriceId(packKey);
              const loadingThis = checkoutLoading === packKey;
              return (
                <div key={packKey} className="rounded-xl border border-white/10 bg-zinc-800/40 p-5 flex flex-col items-center gap-3">
                  <div className="text-center">
                    <p className="text-2xl font-black text-white">${price}</p>
                    <p className="text-zinc-400 text-sm mt-0.5">{label}</p>
                    <p className="text-zinc-600 text-xs mt-1">${(price / parseInt(label)).toFixed(2)}/credit</p>
                  </div>
                  <Button
                    onClick={() => {
                      if (!isAuthenticated) { login("/pricing"); return; }
                      if (!stripeId) { toast.error("Stripe not connected yet"); return; }
                      handleCheckout(stripeId, packKey);
                    }}
                    disabled={loadingThis || loadingPrices}
                    size="sm"
                    className="w-full bg-zinc-700 hover:bg-zinc-600 text-white border-0"
                  >
                    {loadingThis ? <Loader2 className="h-4 w-4 animate-spin" /> : `Buy ${label}`}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        {/* FAQ */}
        <div className="rounded-2xl border border-white/5 bg-zinc-900/50 p-8">
          <h3 className="text-xl font-bold mb-6 text-center">Common Questions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              ["What is 1 credit?", "1 credit = 1 full generation: 10 high-CTR titles + a full SEO description + 15 tags + 6–8 AI thumbnails. Everything you need for one video."],
              ["Do credits expire?", "Monthly credits reset at the start of each billing period. One-time credit pack credits never expire — they stay on your account until used."],
              ["Can I cancel anytime?", "Yes, subscriptions are billed monthly and you can cancel at any time from your billing portal. Credits don't roll over after cancellation."],
              ["What AI generates the thumbnails?", "We use Replicate's Flux Schnell model — a state-of-the-art diffusion model optimized for high-quality, fast image generation at YouTube's 16:9 aspect ratio."],
            ].map(([q, a]) => (
              <div key={q}>
                <p className="font-semibold text-white text-sm mb-1.5">{q}</p>
                <p className="text-sm text-zinc-500 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
