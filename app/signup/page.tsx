"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Layers, ShieldAlert, ArrowLeft } from "lucide-react";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900/5 px-4 py-8 animate-fade-in">
      <Card className="w-full max-w-md shadow-lg border-border/80 rounded-2xl">
        <CardHeader className="space-y-2 p-6 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-slate-900 via-indigo-900 to-indigo-700 text-white shadow-xs">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold tracking-tight text-foreground">Capacity Connect</CardTitle>
              <CardDescription className="text-xs">Access Control & Security Policy</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 pt-0 space-y-4">
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 space-y-2">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
              <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
              <span>Self-Registration Disabled</span>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed">
              Public account creation is not permitted on this platform. All user accounts (Employee, Manager, and Admin) must be provisioned directly by an authorized organization administrator.
            </p>
          </div>

          <div className="space-y-2 pt-1">
            <p className="text-xs text-muted-foreground">
              If you are an employee or manager requiring access, please reach out to your organizational IT administrator or HR manager to obtain login credentials.
            </p>
          </div>

          <div className="pt-2">
            <Link href="/login" className="block">
              <Button className="w-full h-9 text-xs font-semibold gap-1.5 shadow-xs">
                <ArrowLeft className="h-3.5 w-3.5" /> Return to Sign In
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
