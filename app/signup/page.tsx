"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Layers, ArrowLeft, Clock, CheckCircle2, ShieldCheck, Loader2, AlertCircle } from "lucide-react";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim() || !password) {
      setError("Please fill in all required fields.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error?.message || data?.message || "Failed to submit registration request.");
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

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
              <CardDescription className="text-xs">User Registration & Approval</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 pt-0 space-y-4">
          {submitted ? (
            <div className="space-y-4 animate-fade-in">
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-4 space-y-2">
                <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-300 font-bold text-xs">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Request Submitted Successfully</span>
                </div>
                <p className="text-xs text-emerald-800 dark:text-emerald-400 leading-relaxed">
                  Your registration request for <strong>{email}</strong> has been submitted and is currently <strong>PENDING</strong> administrator approval.
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 space-y-1.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5 font-medium text-foreground">
                  <Clock className="h-3.5 w-3.5 text-indigo-600" />
                  <span>What happens next?</span>
                </div>
                <p className="text-xs leading-relaxed">
                  1. An organization administrator will review your account request.<br />
                  2. Once approved, you will receive an account activation notification.<br />
                  3. You will then be able to log in to access your learning portal.
                </p>
              </div>

              <div className="pt-2">
                <Link href="/login" className="block">
                  <Button className="w-full h-9 text-xs font-semibold gap-1.5 shadow-xs">
                    <ArrowLeft className="h-3.5 w-3.5" /> Return to Sign In
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 p-3 text-xs text-indigo-900 dark:text-indigo-300 flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Registration requests require administrator approval. Once approved, your account will be activated.
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-xl p-3 text-xs bg-rose-50 text-rose-900 border border-rose-200">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span className="font-medium">{error}</span>
                </div>
              )}

              <div className="space-y-1">
                <Label htmlFor="name" className="text-xs font-medium">Full Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="email" className="text-xs font-medium">Work Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@organization.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="password" className="text-xs font-medium">Password (min. 8 characters)</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="confirmPassword" className="text-xs font-medium">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full h-9 text-xs font-semibold gap-1.5 shadow-xs mt-2">
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Submit Registration Request"}
              </Button>

              <div className="text-center pt-2">
                <Link href="/login" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors">
                  <ArrowLeft className="h-3 w-3" /> Already have an account? Sign In
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

