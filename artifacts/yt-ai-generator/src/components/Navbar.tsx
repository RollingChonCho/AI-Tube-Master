import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Zap, LayoutDashboard, Sparkles, LogOut, CreditCard, Menu, X } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const navLink = (path: string) => `${base}${path}`;

  const planColor: Record<string, string> = {
    free: "bg-zinc-700 text-zinc-300",
    starter: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
    pro: "bg-purple-500/20 text-purple-400 border border-purple-500/30",
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-black/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href={navLink("/")}
            className="flex items-center gap-2 group"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-orange-500 shadow-lg shadow-red-500/20 group-hover:shadow-red-500/40 transition-all">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              ThumbBoost<span className="text-red-400">AI</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href={navLink("/pricing")}
              className={`text-sm transition-colors ${location === "/pricing" ? "text-white" : "text-zinc-400 hover:text-white"}`}
            >
              Pricing
            </Link>
            {isAuthenticated && (
              <>
                <Link
                  href={navLink("/dashboard")}
                  className={`text-sm transition-colors ${location === "/dashboard" ? "text-white" : "text-zinc-400 hover:text-white"}`}
                >
                  Dashboard
                </Link>
                <Link
                  href={navLink("/studio")}
                  className={`text-sm transition-colors ${location === "/studio" ? "text-white" : "text-zinc-400 hover:text-white"}`}
                >
                  Studio
                </Link>
              </>
            )}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {isLoading ? (
              <div className="h-8 w-20 animate-pulse rounded-lg bg-zinc-800" />
            ) : isAuthenticated && user ? (
              <>
                {/* Credits badge */}
                <div className="hidden sm:flex items-center gap-1.5 rounded-full px-3 py-1 bg-zinc-900 border border-white/10 text-sm">
                  <Zap className="h-3.5 w-3.5 text-yellow-400" />
                  <span className="font-semibold text-white">{user.credits ?? 0}</span>
                  <span className="text-zinc-400">credits</span>
                </div>
                <Link href={navLink("/studio")} className="hidden sm:block">
                  <Button size="sm" className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white border-0 shadow-lg shadow-red-500/20">
                    <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                    Generate
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 rounded-full outline-none">
                      <Avatar className="h-8 w-8 ring-2 ring-white/10 hover:ring-white/20 transition-all">
                        <AvatarImage src={user.profileImageUrl ?? undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-red-500 to-orange-500 text-white text-xs">
                          {(user.firstName?.[0] ?? user.email?.[0] ?? "U").toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-zinc-900 border-white/10">
                    <div className="px-3 py-2">
                      <p className="text-sm font-medium text-white">{user.firstName ?? user.email ?? "User"}</p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${planColor[user.plan ?? "free"] ?? planColor.free}`}>
                          {(user.plan ?? "free").charAt(0).toUpperCase() + (user.plan ?? "free").slice(1)}
                        </span>
                        <span className="text-xs text-zinc-500">· {user.credits ?? 0} credits</span>
                      </div>
                    </div>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem asChild className="text-zinc-300 focus:text-white focus:bg-white/10 cursor-pointer">
                      <Link href={navLink("/dashboard")} className="flex items-center gap-2 w-full">
                        <LayoutDashboard className="h-4 w-4" />Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="text-zinc-300 focus:text-white focus:bg-white/10 cursor-pointer">
                      <Link href={navLink("/pricing")} className="flex items-center gap-2 w-full">
                        <CreditCard className="h-4 w-4" />Buy Credits
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem onClick={() => logout()} className="text-zinc-300 focus:text-white focus:bg-white/10 cursor-pointer">
                      <LogOut className="h-4 w-4 mr-2" />Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <button onClick={() => login("/dashboard")} className="text-sm text-zinc-400 hover:text-white transition-colors hidden sm:block">
                  Sign in
                </button>
                <Button onClick={() => login("/studio")} size="sm" className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white border-0 shadow-lg shadow-red-500/20">
                  Get Started Free
                </Button>
              </>
            )}
            {/* Mobile menu button */}
            <button className="md:hidden text-zinc-400 hover:text-white" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/5 bg-black/95 px-4 py-4 space-y-3">
          <Link href={navLink("/pricing")} className="block text-zinc-400 hover:text-white py-2">Pricing</Link>
          {isAuthenticated && (
            <>
              <Link href={navLink("/dashboard")} className="block text-zinc-400 hover:text-white py-2">Dashboard</Link>
              <Link href={navLink("/studio")} className="block text-zinc-400 hover:text-white py-2">Studio</Link>
            </>
          )}
          {!isAuthenticated && (
            <button onClick={() => login("/studio")} className="w-full text-left text-zinc-400 hover:text-white py-2">Sign In</button>
          )}
        </div>
      )}
    </header>
  );
}
