"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Building2, LogOut, Database, Menu } from "lucide-react";
import { MobileNav } from "@/components/layout/mobile-nav";

export interface TopNavProps {
  userName: string;
  role: "ADMIN" | "MANAGER" | "EMPLOYEE";
  organizationName: string;
  isDemo?: boolean;
}

export function TopNav({
  userName = "User",
  role = "EMPLOYEE",
  organizationName = "",
  isDemo = false,
}: TopNavProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const safeName = userName || "User";
  const userInitials =
    safeName
      .split(" ")
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";

  const displayOrgName =
    organizationName && organizationName !== "KL University"
      ? organizationName
      : "";

  return (
    <>
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border/80 bg-card/90 backdrop-blur-md px-3 sm:px-6 shadow-xs transition-all">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Hamburger Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileNavOpen(true)}
            className="md:hidden h-8 w-8 text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
            aria-label="Open navigation"
            aria-expanded={mobileNavOpen}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open navigation</span>
          </Button>

          {displayOrgName && (
            <div className="flex items-center gap-1.5 sm:gap-2 rounded-lg bg-slate-100/80 px-2 sm:px-2.5 py-1 border border-slate-200/60 shadow-2xs hover:bg-slate-100 transition-colors">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-xs font-semibold text-foreground tracking-tight max-w-[130px] xs:max-w-[200px] sm:max-w-md truncate">
                {displayOrgName}
              </span>
            </div>
          )}

          {isDemo ? (
            <Badge
              variant="warning"
              className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium py-0.5 px-2.5 bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300/40 rounded-full shadow-2xs"
            >
              <Sparkles className="h-3 w-3" />
              Demo Mode
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-medium py-0.5 px-2.5 bg-emerald-500/10 text-emerald-700 border-emerald-300/50 rounded-full shadow-2xs"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Database className="h-3 w-3 text-emerald-600 ml-0.5" />
              Live Database
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 group cursor-pointer">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-slate-900 via-indigo-950 to-indigo-800 text-[11px] font-bold text-white shadow-xs ring-2 ring-indigo-500/20 group-hover:ring-indigo-500/40 group-hover:scale-105 transition-all duration-200">
              {userInitials}
            </div>
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-semibold text-foreground leading-tight group-hover:text-primary transition-colors">
                {userName}
              </span>
              <span className="text-[10px] font-medium text-muted-foreground tracking-wider uppercase">
                {role}
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/5 transition-all active:scale-95 px-2.5 sm:px-3"
            aria-label="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </div>
      </header>

      <MobileNav
        open={mobileNavOpen}
        onOpenChange={setMobileNavOpen}
        role={role}
      />
    </>
  );
}
