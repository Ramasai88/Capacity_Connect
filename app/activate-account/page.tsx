"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Layers,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  UserCheck,
} from "lucide-react";

interface EmployeeSummary {
  id: string;
  employeeCode: string;
  name: string;
  email: string;
}

interface OrgSummary {
  id: string;
  name: string;
}

function ActivateAccountForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  // State
  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [employee, setEmployee] = useState<EmployeeSummary | null>(null);
  const [organization, setOrganization] = useState<OrgSummary | null>(null);

  // Form State
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [activatedSuccess, setActivatedSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setValid(false);
      setErrorMessage("Activation link is missing a valid token. Please check the link provided in your welcome email.");
      return;
    }

    async function checkToken() {
      try {
        setLoading(true);
        const res = await fetch(`/api/auth/activate?token=${encodeURIComponent(token)}`);
        const data = await res.json();

        if (res.ok && data.valid) {
          setValid(true);
          setEmployee(data.data.employee);
          setOrganization(data.data.organization);
        } else {
          setValid(false);
          setErrorCode(data.error?.code || "INVALID_TOKEN");
          setErrorMessage(
            data.error?.message ||
              "Your activation link is invalid or has expired. Please contact your organization administrator."
          );
        }
      } catch {
        setValid(false);
        setErrorMessage("Network error verifying activation link. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    checkToken();
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    // Client-side Validation
    if (!password) {
      setFormError("Password is required.");
      return;
    }

    if (password.length < 8) {
      setFormError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setFormError("Passwords do not match. Please ensure both passwords are identical.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/auth/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setFormError(data.error?.message || "Failed to activate account. Please try again.");
        setSubmitting(false);
        return;
      }

      setActivatedSuccess(true);
      setSubmitting(false);
    } catch {
      setFormError("An unexpected error occurred during activation. Please try again.");
      setSubmitting(false);
    }
  }

  // 1. Loading State
  if (loading) {
    return (
      <Card className="w-full max-w-md shadow-lg border-border/80 rounded-2xl animate-fade-in">
        <CardContent className="flex flex-col items-center justify-center p-12 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs font-medium text-muted-foreground">Verifying activation credential...</p>
        </CardContent>
      </Card>
    );
  }

  // 2. Success State
  if (activatedSuccess) {
    return (
      <Card className="w-full max-w-md shadow-lg border-border/80 rounded-2xl animate-fade-in">
        <CardHeader className="space-y-2 p-6 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold tracking-tight text-foreground">
                Account Activated!
              </CardTitle>
              <CardDescription className="text-xs">Password setup complete</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 pt-0 space-y-4">
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 space-y-2">
            <p className="text-xs text-emerald-900 leading-relaxed font-medium">
              Your account has been activated successfully. Your password has been securely configured and your workforce profile is ready.
            </p>
            {employee && (
              <div className="text-[11px] text-emerald-800 pt-1 font-mono">
                Account: {employee.email}
              </div>
            )}
          </div>

          <div className="pt-2">
            <Link href="/login" className="block">
              <Button className="w-full h-9 text-xs font-semibold gap-1.5 shadow-xs bg-primary text-primary-foreground hover:bg-primary/90">
                Proceed to Sign In <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 3. Invalid or Expired Token State
  if (!valid) {
    return (
      <Card className="w-full max-w-md shadow-lg border-border/80 rounded-2xl animate-fade-in">
        <CardHeader className="space-y-2 p-6 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-600 text-white shadow-xs">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold tracking-tight text-foreground">
                Activation Unavailable
              </CardTitle>
              <CardDescription className="text-xs">
                {errorCode === "TOKEN_EXPIRED"
                  ? "Link Expired"
                  : errorCode === "TOKEN_ALREADY_USED"
                  ? "Already Activated"
                  : "Invalid Activation Link"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 pt-0 space-y-4">
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 space-y-2">
            <p className="text-xs text-rose-900 leading-relaxed font-medium">
              {errorMessage || "Your activation link is invalid or has expired."}
            </p>
            {errorCode === "TOKEN_EXPIRED" && (
              <p className="text-[11px] text-rose-800">
                Activation links expire after 24 hours for security. Please contact your organization administrator to receive a fresh activation link.
              </p>
            )}
            {errorCode === "TOKEN_ALREADY_USED" && (
              <p className="text-[11px] text-rose-800">
                This account has already completed password creation. You can proceed directly to sign in.
              </p>
            )}
          </div>

          <div className="pt-2">
            <Link href="/login" className="block">
              <Button variant="outline" className="w-full h-9 text-xs font-semibold gap-1.5 shadow-xs">
                <ArrowLeft className="h-3.5 w-3.5" /> Return to Sign In
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 4. Valid Token — Password Setup Form
  return (
    <Card className="w-full max-w-md shadow-lg border-border/80 rounded-2xl animate-fade-in">
      <CardHeader className="space-y-2 p-6 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-slate-900 via-indigo-900 to-indigo-700 text-white shadow-xs">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold tracking-tight text-foreground">
              Create Your Password
            </CardTitle>
            <CardDescription className="text-xs">
              {organization?.name || "Capacity Connect"} &bull; Account Activation
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 pt-0 space-y-4">
        {employee && (
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">{employee.name}</span>
              <Badge variant="secondary" className="font-mono text-[10px] font-bold">
                {employee.employeeCode}
              </Badge>
            </div>
            <div className="text-slate-600 text-[11px] flex items-center gap-1.5">
              <UserCheck className="h-3.5 w-3.5 text-slate-500" />
              <span>{employee.email}</span>
            </div>
          </div>
        )}

        {formError && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-900 shadow-2xs font-medium animate-fade-in">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1.5">
            <Label htmlFor="new-password" className="text-xs font-bold text-foreground">
              New Password <span className="text-destructive">*</span>
            </Label>
            <PasswordInput
              id="new-password"
              placeholder="Minimum 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
              className="h-9 text-xs"
              autoComplete="new-password"
            />
            <p className="text-[10px] text-muted-foreground">Must be at least 8 characters</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm-password" className="text-xs font-bold text-foreground">
              Confirm Password <span className="text-destructive">*</span>
            </Label>
            <PasswordInput
              id="confirm-password"
              placeholder="Re-enter your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={submitting}
              className="h-9 text-xs"
              autoComplete="new-password"
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-9 text-xs font-semibold gap-1.5 shadow-xs bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Activating Account...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-3.5 w-3.5" /> Activate Account &amp; Save Password
                </>
              )}
            </Button>
          </div>
        </form>

        <div className="pt-1 text-center">
          <Link
            href="/login"
            className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Already know your password? Return to Sign In
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ActivateAccountPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900/5 px-4 py-8 animate-fade-in">
      <Suspense
        fallback={
          <Card className="w-full max-w-md shadow-lg border-border/80 rounded-2xl">
            <CardContent className="flex flex-col items-center justify-center p-12 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-xs font-medium text-muted-foreground">Loading activation portal...</p>
            </CardContent>
          </Card>
        }
      >
        <ActivateAccountForm />
      </Suspense>
    </div>
  );
}
