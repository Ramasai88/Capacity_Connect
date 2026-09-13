"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { useDemoStore } from "@/lib/demo/demo-store";
import { isDemoMode } from "@/lib/demo/config";
import { apiClient } from "@/lib/api/client";
import { AccessDenied } from "@/components/auth/access-denied";
import {
  Database,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Loader2,
  UserPlus,
  Shield,
  Users,
  Activity,
  UserCheck,
  Search,
  Clock,
  Briefcase,
  FileCheck,
  BarChart2,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type UserRole = "ADMIN" | "MANAGER" | "EMPLOYEE";

interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  lastLoginAt?: string | null;
  createdAt: string;
}

interface AuditLogItem {
  id: string;
  actorId?: string | null;
  actorName: string;
  actorRole?: UserRole | null;
  action: string;
  category: string;
  targetId?: string | null;
  targetName?: string | null;
  description: string;
  status: string;
  ipAddress?: string | null;
  metadata?: any;
  createdAt: string;
}

interface ManagerSummary {
  managerId: string;
  managerName: string;
  managerEmail: string;
  lastLoginAt: string | null;
  managedEmployeesCount: number;
  skillGapReviewsCount: number;
  reportsAccessedCount: number;
  reassessmentsCount: number;
  recentActivities: {
    id: string;
    action: string;
    description: string;
    createdAt: string;
    targetName?: string | null;
  }[];
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

const CATEGORY_LABELS: Record<string, string> = {
  AUTHENTICATION: "Authentication",
  USER_MANAGEMENT: "User Management",
  MANAGER_OPERATION: "Manager Operation",
  LEARNING: "Learning & Curriculum",
};

function formatDateTime(isoString?: string | null): string {
  if (!isoString) return "Never";
  try {
    const d = new Date(isoString);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. User Management Section
// ─────────────────────────────────────────────────────────────────────────────

function UserManagementSection() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
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
      // ignore
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
        `${ROLE_LABELS[newRole]} account created for ${data.user?.name}. Credentials are active immediately.`
      );
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setNewConfirmPassword("");
      setNewRole("EMPLOYEE");
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
          <CardTitle className="text-base">User Management & Provisioning</CardTitle>
        </div>
        <CardDescription className="text-xs">
          Provision Admin, Manager, or Employee accounts. All accounts are tied strictly to your organization scope and require server-verified credentials.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Create User Form */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Shield className="h-4 w-4 text-indigo-600" />
            Provision New Organization User
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
                <PasswordInput
                  id="new-user-password"
                  name="create_new_user_password"
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
                <PasswordInput
                  id="new-user-confirm-password"
                  name="create_new_user_confirm_password"
                  autoComplete="new-password"
                  placeholder="Re-enter password"
                  value={newConfirmPassword}
                  onChange={(e) => { setNewConfirmPassword(e.target.value); setFieldErrors(p => ({ ...p, confirmPassword: "" })); }}
                  className="h-8.5 text-xs shadow-2xs"
                />
                {fieldErrors.confirmPassword && <p className="text-xs text-destructive">{fieldErrors.confirmPassword}</p>}
              </div>
            </div>

            {/* Role selection */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Assigned Role</Label>
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
                {newRole === "ADMIN" && "⚠️ Admin accounts possess administrative rights, user provisioning, and full audit logs access."}
                {newRole === "MANAGER" && "Manager accounts can review team competencies, view workforce analytics, and evaluate reassessments."}
                {newRole === "EMPLOYEE" && "Employee accounts access personalized course pathways, modules, and diagnostic skill assessments."}
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
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Provisioning Account...</>
                ) : (
                  <><UserPlus className="h-3.5 w-3.5" /> Provision Account</>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Existing Users Table */}
        <div className="pt-4 border-t border-border/60">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-600" />
              Organization Accounts ({users.length})
            </h3>
            <Button
              size="sm"
              variant="outline"
              onClick={loadUsers}
              disabled={loadingUsers}
              className="h-7 text-xs gap-1.5 shadow-2xs font-semibold"
            >
              {loadingUsers ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
              Refresh List
            </Button>
          </div>

          {loadingUsers ? (
            <div className="flex items-center justify-center py-8 text-xs text-muted-foreground gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" /> Loading users...
            </div>
          ) : users.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4">No users found in database.</p>
          ) : (
            <div className="rounded-xl border border-border/80 overflow-hidden shadow-2xs">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground">
                  <tr>
                    <th className="py-2.5 px-4 text-left font-semibold">User</th>
                    <th className="py-2.5 px-4 text-left font-semibold">Email</th>
                    <th className="py-2.5 px-4 text-left font-semibold">Role</th>
                    <th className="py-2.5 px-4 text-left font-semibold">Last Login</th>
                    <th className="py-2.5 px-4 text-left font-semibold">Created Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 bg-white">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-4 font-semibold text-foreground">{u.name}</td>
                      <td className="py-2.5 px-4 font-mono text-muted-foreground">{u.email}</td>
                      <td className="py-2.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-semibold ${ROLE_BADGE_STYLES[u.role]}`}>
                          {ROLE_LABELS[u.role]}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-muted-foreground">
                        {u.lastLoginAt ? (
                          <span className="flex items-center gap-1.5 font-medium text-slate-700">
                            <Clock className="h-3 w-3 text-emerald-600" />
                            {formatDateTime(u.lastLoginAt)}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Never logged in</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-muted-foreground">
                        {formatDateTime(u.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Security & System Audit Logs Section
// ─────────────────────────────────────────────────────────────────────────────

function AuditLogSection() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [category, setCategory] = useState("ALL");
  const [actorRole, setActorRole] = useState("ALL");
  const [search, setSearch] = useState("");

  const loadAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "15",
      });
      if (category !== "ALL") params.set("category", category);
      if (actorRole !== "ALL") params.set("actorRole", actorRole);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page, category, actorRole, search]);

  useEffect(() => {
    if (!isDemoMode()) {
      loadAuditLogs();
    } else {
      setLoading(false);
    }
  }, [loadAuditLogs]);

  if (isDemoMode()) {
    return (
      <Card className="shadow-xs border-amber-200 bg-amber-50/40">
        <CardHeader className="pb-4 border-b border-border/60">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <Activity className="h-3.5 w-3.5" />
            </div>
            <CardTitle className="text-base">Security & Activity Audit Logs</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Persistent audit logging requires PostgreSQL (Demo Mode active).
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="shadow-xs">
      <CardHeader className="pb-4 border-b border-border/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
              <Activity className="h-3.5 w-3.5" />
            </div>
            <div>
              <CardTitle className="text-base">System Activity & Security Audit Logs</CardTitle>
              <CardDescription className="text-xs">
                Real-time operational audit trail covering authentication, user provisioning, manager operations, and curriculum events.
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="text-xs font-mono font-bold bg-white">
            {total} Total Events
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search description, actor, or action..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-8 h-8.5 text-xs shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <Label className="text-xs font-bold text-muted-foreground whitespace-nowrap">Category:</Label>
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              className="h-8.5 rounded-lg border border-input bg-card px-2.5 py-1 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="ALL">All Categories</option>
              <option value="AUTHENTICATION">Authentication</option>
              <option value="USER_MANAGEMENT">User Management</option>
              <option value="MANAGER_OPERATION">Manager Operation</option>
              <option value="LEARNING">Learning & Curriculum</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Label className="text-xs font-bold text-muted-foreground whitespace-nowrap">Role:</Label>
            <select
              value={actorRole}
              onChange={(e) => { setActorRole(e.target.value); setPage(1); }}
              className="h-8.5 rounded-lg border border-input bg-card px-2.5 py-1 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="MANAGER">Manager</option>
              <option value="EMPLOYEE">Employee</option>
            </select>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={loadAuditLogs}
            disabled={loading}
            className="h-8.5 text-xs gap-1.5 shadow-2xs font-semibold"
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
            Refresh
          </Button>
        </div>

        {/* Audit Log Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12 text-xs text-muted-foreground gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" /> Loading audit trail...
          </div>
        ) : logs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center text-xs text-muted-foreground">
            No audit records matching the selected filters.
          </div>
        ) : (
          <div className="rounded-xl border border-border/80 overflow-hidden shadow-2xs">
            <table className="w-full text-xs">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground">
                <tr>
                  <th className="py-2.5 px-4 text-left font-semibold">Timestamp</th>
                  <th className="py-2.5 px-4 text-left font-semibold">Actor</th>
                  <th className="py-2.5 px-4 text-left font-semibold">Category</th>
                  <th className="py-2.5 px-4 text-left font-semibold">Activity Description</th>
                  <th className="py-2.5 px-4 text-left font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 bg-white">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-4 font-mono text-muted-foreground whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-foreground">{log.actorName}</span>
                        {log.actorRole && (
                          <span className={`px-1.5 py-0.2 rounded border text-[10px] font-semibold ${ROLE_BADGE_STYLES[log.actorRole]}`}>
                            {log.actorRole}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-muted-foreground">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[11px] font-medium text-slate-700">
                        {CATEGORY_LABELS[log.category] || log.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-medium text-slate-800 leading-snug">
                      {log.description}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        log.status === "SUCCESS"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}>
                        {log.status === "SUCCESS" ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 text-xs">
            <span className="text-muted-foreground font-medium">
              Page {page} of {totalPages} ({total} events)
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="h-8 text-xs gap-1"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
                className="h-8 text-xs gap-1"
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Manager Operational Oversight Section
// ─────────────────────────────────────────────────────────────────────────────

function ManagerMonitoringSection() {
  const [managers, setManagers] = useState<ManagerSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const loadManagers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/manager-activity");
      if (res.ok) {
        const data = await res.json();
        setManagers(data.managers || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isDemoMode()) {
      loadManagers();
    } else {
      setLoading(false);
    }
  }, [loadManagers]);

  if (isDemoMode()) {
    return (
      <Card className="shadow-xs border-amber-200 bg-amber-50/40">
        <CardHeader className="pb-4 border-b border-border/60">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <UserCheck className="h-3.5 w-3.5" />
            </div>
            <CardTitle className="text-base">Manager Operational Activity</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Manager oversight metrics require PostgreSQL (Demo Mode active).
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="shadow-xs">
      <CardHeader className="pb-4 border-b border-border/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
              <UserCheck className="h-3.5 w-3.5" />
            </div>
            <div>
              <CardTitle className="text-base">Manager Operational Activity & Oversight</CardTitle>
              <CardDescription className="text-xs">
                Administrative monitoring of manager activity, login frequency, competency reviews conducted, and reports generated.
              </CardDescription>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={loadManagers}
            disabled={loading}
            className="h-8 text-xs gap-1.5 shadow-2xs font-semibold"
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-xs text-muted-foreground gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" /> Loading manager oversight data...
          </div>
        ) : managers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center text-xs text-muted-foreground">
            No active managers found in this organization.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5">
            {managers.map((mgr) => (
              <Card key={mgr.managerId} className="border border-border/80 shadow-2xs bg-gradient-to-b from-slate-50/40 to-white">
                <CardHeader className="p-5 pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-xs">
                        {mgr.managerName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-sm font-bold text-foreground">{mgr.managerName}</CardTitle>
                          <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px]">MANAGER</Badge>
                        </div>
                        <span className="text-xs font-mono text-muted-foreground">{mgr.managerEmail}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-2xs">
                      <Clock className="h-3.5 w-3.5 text-indigo-600" />
                      <span>Last Login: </span>
                      <span className="font-semibold text-foreground">
                        {mgr.lastLoginAt ? formatDateTime(mgr.lastLoginAt) : "Never"}
                      </span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-5 pt-0 space-y-4">
                  {/* Activity Counters */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    <div className="rounded-xl bg-white p-3 border border-slate-200/80 shadow-2xs">
                      <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-medium">
                        <Users className="h-3.5 w-3.5 text-slate-500" />
                        <span>Managed Team</span>
                      </div>
                      <span className="font-bold text-base text-foreground mt-1 block">
                        {mgr.managedEmployeesCount}
                      </span>
                    </div>

                    <div className="rounded-xl bg-white p-3 border border-slate-200/80 shadow-2xs">
                      <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-medium">
                        <BarChart2 className="h-3.5 w-3.5 text-indigo-600" />
                        <span>Skill Gap Reviews</span>
                      </div>
                      <span className="font-bold text-base text-indigo-700 mt-1 block">
                        {mgr.skillGapReviewsCount}
                      </span>
                    </div>

                    <div className="rounded-xl bg-white p-3 border border-slate-200/80 shadow-2xs">
                      <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-medium">
                        <FileCheck className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Reports Accessed</span>
                      </div>
                      <span className="font-bold text-base text-emerald-700 mt-1 block">
                        {mgr.reportsAccessedCount}
                      </span>
                    </div>

                    <div className="rounded-xl bg-white p-3 border border-slate-200/80 shadow-2xs">
                      <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-medium">
                        <Briefcase className="h-3.5 w-3.5 text-amber-600" />
                        <span>Reassessments</span>
                      </div>
                      <span className="font-bold text-base text-amber-700 mt-1 block">
                        {mgr.reassessmentsCount}
                      </span>
                    </div>
                  </div>

                  {/* Recent Operations */}
                  {mgr.recentActivities.length > 0 && (
                    <div className="space-y-2 pt-1 border-t border-slate-100">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                        Recent Operational Actions
                      </span>
                      <div className="space-y-1.5">
                        {mgr.recentActivities.map((act) => (
                          <div key={act.id} className="flex items-center justify-between text-xs bg-white p-2 rounded-lg border border-slate-100">
                            <span className="font-medium text-slate-800">{act.description}</span>
                            <span className="text-muted-foreground font-mono text-[10px] shrink-0 ml-3">
                              {formatDateTime(act.createdAt)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Organization Settings Page
// ─────────────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role || "ADMIN";
  const demoStore = useDemoStore();
  const demoActive = isDemoMode();

  const [activeTab, setActiveTab] = useState<"users" | "audit" | "managers" | "org">("users");

  const [orgName, setOrgName] = useState("");
  const [orgIndustry, setOrgIndustry] = useState("");
  const [orgDesc, setOrgDesc] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(!demoActive);

  const loadOrgData = useCallback(async () => {
    if (demoActive) {
      setOrgName(demoStore.organization.name);
      setOrgIndustry(demoStore.organization.industry);
      setOrgDesc(demoStore.organization.description || "");
      return;
    }

    try {
      setIsLoading(true);
      const res = await apiClient.organization.get();
      if (res.data) {
        setOrgName(res.data.name);
        setOrgIndustry(res.data.industry || "");
        setOrgDesc(res.data.description || "");
      }
    } catch {
      setOrgName(demoStore.organization.name);
      setOrgIndustry(demoStore.organization.industry);
      setOrgDesc(demoStore.organization.description || "");
    } finally {
      setIsLoading(false);
    }
  }, [demoActive, demoStore.organization]);

  useEffect(() => {
    loadOrgData();
  }, [loadOrgData]);

  if (role !== "ADMIN") {
    return <AccessDenied requiredRole="ADMIN" currentRole={role} resourceName="Organization Settings & Administration" />;
  }

  async function handleSaveOrg(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);

    if (!orgName.trim()) {
      setFeedback({ type: "error", message: "Organization name cannot be empty." });
      return;
    }

    if (demoActive) {
      demoStore.updateOrganization({
        name: orgName.trim(),
        industry: orgIndustry.trim(),
        description: orgDesc.trim(),
      });
      setFeedback({ type: "success", message: "Organization profile updated." });
    } else {
      try {
        await apiClient.organization.update({
          name: orgName.trim(),
          industry: orgIndustry.trim(),
          description: orgDesc.trim(),
        });
        setFeedback({ type: "success", message: "Organization profile updated in database." });
      } catch (err: any) {
        setFeedback({ type: "error", message: err.message || "Failed to update organization profile." });
      }
    }
    setTimeout(() => setFeedback(null), 3500);
  }

  function handleResetDemo() {
    if (confirm("Reset demo data to default baseline?")) {
      demoStore.resetToDefaults();
      loadOrgData();
      setFeedback({ type: "success", message: "Demo data reset to defaults." });
      setTimeout(() => setFeedback(null), 3000);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Administration & Security Settings</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Organization account provisioning, security audit monitoring, and operational governance
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        <Button
          size="sm"
          variant={activeTab === "users" ? "default" : "outline"}
          onClick={() => setActiveTab("users")}
          className="h-8.5 text-xs gap-1.5 font-semibold"
        >
          <UserPlus className="h-3.5 w-3.5" /> User Provisioning
        </Button>
        <Button
          size="sm"
          variant={activeTab === "audit" ? "default" : "outline"}
          onClick={() => setActiveTab("audit")}
          className="h-8.5 text-xs gap-1.5 font-semibold"
        >
          <Activity className="h-3.5 w-3.5" /> Activity Audit Logs
        </Button>
        <Button
          size="sm"
          variant={activeTab === "managers" ? "default" : "outline"}
          onClick={() => setActiveTab("managers")}
          className="h-8.5 text-xs gap-1.5 font-semibold"
        >
          <UserCheck className="h-3.5 w-3.5" /> Manager Oversight
        </Button>
        <Button
          size="sm"
          variant={activeTab === "org" ? "default" : "outline"}
          onClick={() => setActiveTab("org")}
          className="h-8.5 text-xs gap-1.5 font-semibold"
        >
          <Briefcase className="h-3.5 w-3.5" /> Organization Profile
        </Button>
      </div>

      {/* Tab 1: User Management */}
      {activeTab === "users" && <UserManagementSection />}

      {/* Tab 2: Activity Audit Logs */}
      {activeTab === "audit" && <AuditLogSection />}

      {/* Tab 3: Manager Oversight */}
      {activeTab === "managers" && <ManagerMonitoringSection />}

      {/* Tab 4: Organization Profile */}
      {activeTab === "org" && (
        <div className="space-y-6">
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
                  : "The application is actively running against your PostgreSQL database with full ACID transactions and multi-tenant security."}
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
        </div>
      )}
    </div>
  );
}
