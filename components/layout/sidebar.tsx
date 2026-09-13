"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  BadgeCheck,
  Briefcase,
  BarChart3,
  GraduationCap,
  BookOpen,
  FileText,
  Settings,
  ShieldCheck,
  Layers,
  Sparkles,
  Bot,
  Compass,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDemoStore } from "@/lib/demo/demo-store";
import { Badge } from "@/components/ui/badge";

export interface SidebarProps {
  role: "ADMIN" | "MANAGER" | "EMPLOYEE";
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: Array<"ADMIN" | "MANAGER" | "EMPLOYEE">;
  badgeKey?: "reassessments";
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "My Skill Development", href: "/my-development", icon: Compass, roles: ["EMPLOYEE"] },
  { label: "Employees", href: "/employees", icon: Users, roles: ["ADMIN", "MANAGER"] },
  { label: "Competencies", href: "/competencies", icon: BadgeCheck, roles: ["ADMIN", "MANAGER"] },
  { label: "Designations", href: "/designations", icon: Briefcase, roles: ["ADMIN", "MANAGER"] },
  { label: "Skill Gap Analysis", href: "/skill-gaps", icon: BarChart3 },
  { label: "AI Recommendations", href: "/recommendations", icon: Sparkles },
  { label: "AI Assistant", href: "/assistant", icon: Bot },
  { label: "Courses", href: "/courses", icon: GraduationCap },
  { label: "My Learning", href: "/my-learning", icon: BookOpen, roles: ["EMPLOYEE"] },
  {
    label: "Reassessments",
    href: "/reassessments",
    icon: ShieldCheck,
    roles: ["ADMIN", "MANAGER"],
    badgeKey: "reassessments",
  },
  { label: "Reports", href: "/reports", icon: FileText, roles: ["ADMIN", "MANAGER"] },
  { label: "Settings", href: "/settings", icon: Settings, roles: ["ADMIN"] },
];

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const { reassessments } = useDemoStore();

  const pendingCount = reassessments.filter(
    (r) => r.status === "PENDING_REASSESSMENT"
  ).length;

  const visibleItems = navItems.filter((item) => !item.roles || item.roles.includes(role));

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-card/95 backdrop-blur-sm md:flex md:flex-col justify-between shadow-[1px_0_4px_rgba(0,0,0,0.02)]">
      <div>
        {/* Brand Logo & Name */}
        <div className="flex h-16 items-center gap-3 border-b border-border/80 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-900 via-indigo-800 to-indigo-600 text-white shadow-sm shadow-indigo-950/20">
            <Layers className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-foreground leading-tight">
              Capacity Connect
            </span>
            <span className="text-[10px] font-medium text-muted-foreground tracking-wider uppercase">
              Enterprise Platform
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="px-3 py-4">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
            Main Menu
          </div>
          <nav className="space-y-1">
            {visibleItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150",
                    isActive
                      ? "bg-primary text-primary-foreground font-semibold shadow-sm shadow-primary/20"
                      : "text-muted-foreground hover:bg-slate-100 hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <item.icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-transform duration-150 group-hover:scale-105",
                        isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                      )}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badgeKey === "reassessments" && pendingCount > 0 && (
                    <Badge
                      variant={isActive ? "secondary" : "warning"}
                      className="text-[10px] py-0 px-1.5 font-mono h-4 font-bold rounded-full shadow-xs"
                    >
                      {pendingCount}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Role Footer */}
      <div className="p-3 border-t border-border/80 bg-slate-50/50 m-2 rounded-xl">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-medium text-muted-foreground">Signed in as</span>
          </div>
          <Badge variant="outline" className="text-[10px] font-semibold py-0 px-1.5 uppercase font-mono bg-white shadow-xs">
            {role}
          </Badge>
        </div>
      </div>
    </aside>
  );
}
