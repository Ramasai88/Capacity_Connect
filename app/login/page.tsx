"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Layers, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered");
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const result = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });

      if (!result || result.error) {
        setError("Invalid email or password.");
        setSubmitting(false);
        return;
      }

      // Safe internal redirect
      const targetUrl = callbackUrl.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : "/dashboard";
      window.location.href = targetUrl;
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-md space-y-4 animate-fade-in">
      <Card className="w-full shadow-lg border-border/80 rounded-2xl">
        <CardHeader className="space-y-2 p-6 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-slate-900 via-indigo-900 to-indigo-700 text-white shadow-xs">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold tracking-tight text-foreground">Capacity Connect</CardTitle>
              <CardDescription className="text-xs">Workforce Capacity & Skill-Gap Platform</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 pt-0 space-y-4">
          {registered && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-900 shadow-2xs font-medium">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Account created successfully. Please sign in with your credentials.</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-900 shadow-2xs font-medium">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-bold text-foreground">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="name@organization.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={submitting}
                className="h-9 text-xs shadow-2xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-bold text-foreground">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={submitting}
                className="h-9 text-xs shadow-2xs"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-9 text-xs font-semibold shadow-xs mt-2"
              disabled={submitting}
            >
              {submitting ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </Button>

            <div className="text-center text-xs text-muted-foreground pt-1.5">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="font-semibold text-indigo-600 underline-offset-4 hover:underline"
              >
                Create an account
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900/5 px-4 py-8">
      <Suspense fallback={<Card className="w-full max-w-md" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
