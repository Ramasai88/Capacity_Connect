"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { NavLinks } from "@/components/layout/sidebar";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: "ADMIN" | "MANAGER" | "EMPLOYEE";
}

export function MobileNav({ open, onOpenChange, role }: MobileNavProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 md:hidden" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex h-full w-72 max-w-[85vw] flex-col justify-between bg-card border-r border-border shadow-2xl duration-200 ease-in-out focus:outline-none",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
            "md:hidden"
          )}
        >
          <DialogPrimitive.Title className="sr-only">Navigation Menu</DialogPrimitive.Title>

          <div className="flex-1 overflow-y-auto">
            {/* Header */}
            <div className="flex h-16 items-center justify-between border-b border-border/80 px-5 sticky top-0 bg-card z-10">
              <div className="flex items-center gap-3">
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

              <DialogPrimitive.Close
                className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label="Close navigation"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close navigation</span>
              </DialogPrimitive.Close>
            </div>

            {/* Navigation Items */}
            <div className="px-3 py-4">
              <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
                Main Menu
              </div>
              <NavLinks role={role} onNavigate={() => onOpenChange(false)} />
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
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
