"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDemoStore } from "@/lib/demo/demo-store";
import { isDemoMode } from "@/lib/demo/config";
import { apiClient } from "@/lib/api/client";
import { AccessDenied } from "@/components/auth/access-denied";
import { Database, Sparkles, CheckCircle2, AlertCircle, RotateCcw, Loader2, UserPlus, Shield, Users } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// User Management Component (Admin only)
// ─────────────────────────────────────────────────────────────────────────────

type UserRole = "ADMIN" | "MANAGER" | "EMPLOYEE";

interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  EMPLOYEE: "Employee",
};

const ROLE_BADGE_STYLES: Record<UserRole, string> = {
  ADMIN: "bg-rose-50 text-rose-700 border-rose-200",
  MANAGER: "bg-indigo-50 text-indigo-700 border-indigo-200",
  EMPLOYEE: "bg-slate-50 text-slate-600 border-slate-200",
};

function UserManagementSection() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Create user form state
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newConfirmPassword, setNewConfirmPassword] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("EMPLOYEE");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const loadUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch {
      // silently handle error
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    if (!isDemoMode()) {
      loadUsers();
    } else {
      setLoadingUsers(false);
    }
  }, [loadUsers]);

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    setCreateSuccess(null);
    setFieldErrors({});

    // Client-side validation
    const errors: Record<string, string> = {};
    if (!newName.trim() || newName.trim().length < 2) errors.name = "Full Name must be at least 2 characters";
    if (!newEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) errors.email = "Enter a valid email address";
    if (!newPassword || newPassword.length < 8) errors.password = "Password must be at least 8 characters";
    if (newPassword !== newConfirmPassword) errors.confirmPassword = "Passwords do not match";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          email: newEmail.trim(),
          password: newPassword,
          confirmPassword: newConfirmPassword,
          role: newRole,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setCreateError(data?.error?.message || "Failed to create account.");
        setSubmitting(false);
        return;
      }

      setCreateSuccess(
        `${ROLE_LABELS[newRole]} account created for ${data.user?.name}. They can now sign in with their credentials.`
      );
      // Reset form
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setNewConfirmPassword("");
      setNewRole("EMPLOYEE");
      // Refresh user list
      await loadUsers();
    } catch {
      setCreateError("An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (isDemoMode()) {
    return (
      <Card className="shadow-xs border-amber-200 bg-amber-50/40">
        <CardHeader className="pb-4 border-b border-border/60">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <Users className="h-3.5 w-3.5" />
            </div>
            <CardTitle className="text-base">User Management</CardTitle>
          </div>
          <CardDescription className="text-xs">
            User account creation requires PostgreSQL (Demo Mode active).
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="shadow-xs">
      <CardHeader className="pb-4 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
            <UserPlus className="h-3.5 w-3.5" />
          </div>
          <CardTitle className="text-base">User Management</CardTitle>
        </div>
        <CardDescription className="text-xs">
          Create Admin, Manager, or Employee accounts. Accounts require real credentials — roles are
          enforced server-side and stored in PostgreSQL.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Create User Form */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Shield className="h-4 w-4 text-indigo-600" />
            Create New Account
          </h3>

          {createError && (
            <div className="flex items-center gap-2 rounded-xl p-3.5 text-xs shadow-2xs bg-rose-50 text-rose-900 border border-rose-200 mb-4">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span className="font-medium">{createError}</span>
            </div>
          )}

          {createSuccess && (
            <div className="flex items-center gap-2 rounded-xl p-3.5 text-xs shadow-2xs bg-emerald-50 text-emerald-900 border border-emerald-200 mb-4">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span className="font-medium">{createSuccess}</span>
            </div>
          )}

          <form onSubmit={handleCreateUser} autoComplete="off" className="space-y-4 max-w-lg">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="new-user-name" className="text-xs font-bold text-foreground">Full Name</Label>
                <Input
                  id="new-user-name"
                  name="create_new_user_name"
                  type="text"
                  autoComplete="off"
                  placeholder="Jane Smith"
                  value={newName}
                  onChange={(e) => { setNewName(e.target.value); setFieldErrors(p => ({ ...p, name: "" })); }}
                  className="h-8.5 text-xs shadow-2xs"
                />
                {fieldErrors.name && <p className="text-xs text-destructive">{fieldErrors.name}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="new-user-email" className="text-xs font-bold text-foreground">Email Address</Label>
                <Input
                  id="new-user-email"
                  name="create_new_user_email"
                  type="email"
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="jane@example.com"
                  value={newEmail}
                  onChange={(e) => { setNewEmail(e.target.value); setFieldErrors(p => ({ ...p, email: "" })); }}
                  className="h-8.5 text-xs shadow-2xs"
                />
                {fieldErrors.email && <p className="text-xs text-destructive">{fieldErrors.email}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="new-user-password" className="text-xs font-bold text-foreground">Password</Label>
                <Input
                  id="new-user-password"
                  name="create_new_user_password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Min 8 characters"
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setFieldErrors(p => ({ ...p, password: "" })); }}
                  className="h-8.5 text-xs shadow-2xs"
                />
                {fieldErrors.password && <p className="text-xs text-destructive">{fieldErrors.password}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="new-user-confirm-password" className="text-xs font-bold text-foreground">Confirm Password</Label>
                <Input
                  id="new-user-confirm-password"
                  name="create_new_user_confirm_password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Re-enter password"
                  value={newConfirmPassword}
                  onChange={(e) => { setNewConfirmPassword(e.target.value); setFieldErrors(p => ({ ...p, confirmPassword: "" })); }}
                  className="h-8.5 text-xs shadow-2xs"
                />
                {fieldErrors.confirmPassword && <p className="text-xs text-destructive">{fieldErrors.confirmPassword}</p>}
              </div>
            </div>

            {/* Role selection — full control for ADMIN */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Role</Label>
              <div className="flex gap-3">
                {(["EMPLOYEE", "MANAGER", "ADMIN"] as UserRole[]).map((r) => (
                  <label
                    key={r}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-xs font-semibold transition-all ${
                      newRole === r
                        ? ROLE_BADGE_STYLES[r] + " ring-2 ring-offset-1 ring-current"
                        : "border-border text-muted-foreground hover:border-muted-foreground/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="new-user-role"
                      value={r}
                      checked={newRole === r}
                      onChange={() => setNewRole(r)}
                      className="sr-only"
                    />
                    {ROLE_LABELS[r]}
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {newRole === "ADMIN" && "⚠️ Admin accounts have full access to all system settings and can create/delete data."}
                {newRole === "MANAGER" && "Manager accounts can view workforce data and approve reassessments."}
                {newRole === "EMPLOYEE" && "Employee accounts can view courses, enroll, and track their own progress."}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Button
                type="submit"
                size="sm"
                className="text-xs font-semibold px-4 h-8.5 shadow-xs gap-2"
                disabled={submitting}
              >
                {submitting ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Creating Account...</>
                ) : (
                  <><UserPlus className="h-3.5 w-3.5" /> Create {ROLE_LABELS[newRole]} Account</>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs h-8.5 px-3 text-muted-foreground"
                onClick={() => {
                  setNewName("");
                  setNewEmail("");
                  setNewPassword("");
                  setNewConfirmPassword("");
                  setNewRole("EMPLOYEE");
                  setFieldErrors({});
                  setCreateError(null);
                  setCreateSuccess(null);
                }}
              >
                Reset Form
              </Button>
            </div>
          </form>
        </div>

        {/* Existing Users List */}
        <div className="border-t border-border/60 pt-6">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-500" />
            Organisation Users
          </h3>

          {loadingUsers ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-4">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading users...
            </div>
          ) : users.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4">No users found.</p>
          ) : (
            <div className="space-y-2">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-4 py-2.5"
                >
                  <div>
                    <p className="text-xs font-semibold text-foreground">{u.name}</p>
                    <p className="text-[11px] text-muted-foreground">{u.email}</p>
                  </div>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold tracking-wide ${ROLE_BADGE_STYLES[u.role]}`}
                  >
                    {ROLE_LABELS[u.role]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Settings Page
// ─────────────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role || "ADMIN";
  const demoStore = useDemoStore();

  const [realOrg, setRealOrg] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(!isDemoMode());

  const [orgName, setOrgName] = useState("");
  const [orgDesc, setOrgDesc] = useState("");
  const [orgIndustry, setOrgIndustry] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const loadRealData = useCallback(async () => {
    if (isDemoMode()) return;
    try {
      setIsLoading(true);
      const res = await apiClient.organization.get();
      setRealOrg(res.data);
      if (res.data) {
        setOrgName(res.data.name || "");
        setOrgDesc(res.data.description || "");
        setOrgIndustry(res.data.industry || "");
      }
    } catch (err) {
      console.error("Failed to load real organization:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isDemoMode()) {
      if (demoStore.organization) {
        setOrgName(demoStore.organization.name);
        setOrgDesc(demoStore.organization.description || "");
        setOrgIndustry(demoStore.organization.industry || "");
      }
    } else {
      loadRealData();
    }
  }, [demoStore.organization, loadRealData]);

  if (role !== "ADMIN") {
    return <AccessDenied requiredRole="ADMIN" currentRole={role} resourceName="Organization Configuration & System Settings" />;
  }

  const demoActive = isDemoMode();

  async function handleSaveOrg(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);

    if (isDemoMode()) {
      const result = demoStore.updateOrganization({ name: orgName, description: orgDesc, industry: orgIndustry });
      if (result.success) {
        setFeedback({ type: "success", message: "Organization settings saved successfully." });
      } else {
        setFeedback({ type: "error", message: result.error || "Failed to save" });
      }
      setTimeout(() => setFeedback(null), 3000);
    } else {
      try {
        await apiClient.organization.update({
          name: orgName,
          description: orgDesc,
          industry: orgIndustry,
        });
        setFeedback({ type: "success", message: "Organization settings updated in PostgreSQL successfully." });
        await loadRealData();
        setTimeout(() => setFeedback(null), 3000);
      } catch (err: any) {
        setFeedback({ type: "error", message: err.message || "Failed to save settings." });
      }
    }
  }

  function handleResetDemo() {
    if (confirm("Reset all demo data to factory defaults? All your CRUD changes will be lost.")) {
      demoStore.resetToDefaults();
      setFeedback({ type: "success", message: "Demo data reset to defaults." });
      setTimeout(() => setFeedback(null), 3000);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Organization Settings</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Manage organization profile, user accounts, multi-tenancy configurations, and database system modes
        </p>
      </div>

      {/* System Mode Card */}
      <Card className={`shadow-xs ${demoActive ? "border-amber-200 bg-amber-50/40" : "border-emerald-200 bg-emerald-50/40"}`}>
        <CardHeader className="p-5 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${demoActive ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                <Database className="h-3.5 w-3.5" />
              </div>
              <CardTitle className="text-sm font-bold text-foreground">System Mode Status</CardTitle>
            </div>
            <Badge variant={demoActive ? "warning" : "success"} className="text-xs font-mono font-bold">
              {demoActive ? "DEMO_MODE=true" : "DEMO_MODE=false (PostgreSQL Live)"}
            </Badge>
          </div>
          <CardDescription className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {demoActive
              ? "The application is currently running in zero-dependency Demo Mode with browser-persisted centralized store."
              : "The application is actively running against your local PostgreSQL database via Prisma ORM."}
          </CardDescription>
        </CardHeader>
        {demoActive && (
          <CardContent className="p-5 pt-0">
            <Button size="sm" variant="outline" onClick={handleResetDemo} className="h-8 text-xs gap-1.5 border-amber-300 hover:bg-amber-100 text-amber-900 shadow-2xs font-semibold">
              <RotateCcw className="h-3.5 w-3.5" />Reset Demo Data to Initial Seed
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Profile Form */}
      <Card className="shadow-xs">
        <CardHeader className="pb-4 border-b border-border/60">
          <CardTitle className="text-base">Organization Profile</CardTitle>
          <CardDescription className="text-xs">Update your organization title, industry, and core description</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-xs text-muted-foreground gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" /> Loading organization settings...
            </div>
          ) : (
            <form onSubmit={handleSaveOrg} className="space-y-4 max-w-lg">
              {feedback && (
                <div className={`flex items-center gap-2 rounded-xl p-3.5 text-xs shadow-2xs ${feedback.type === "success" ? "bg-emerald-50 text-emerald-900 border border-emerald-200" : "bg-rose-50 text-rose-900 border border-rose-200"}`}>
                  {feedback.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> : <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />}
                  <span className="font-medium">{feedback.message}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Organization Name</Label>
                <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} className="h-8.5 text-xs shadow-2xs" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Industry / Domain</Label>
                <Input value={orgIndustry} onChange={(e) => setOrgIndustry(e.target.value)} className="h-8.5 text-xs shadow-2xs" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Description</Label>
                <Input value={orgDesc} onChange={(e) => setOrgDesc(e.target.value)} className="h-8.5 text-xs shadow-2xs" />
              </div>

              <div className="pt-2">
                <Button type="submit" size="sm" className="text-xs font-semibold px-4 h-8.5 shadow-xs">Save Changes</Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Admin-only User Management */}
      <UserManagementSection />
    </div>
  );
}
