"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { apiClient } from "@/lib/api/client";
import { AccessDenied } from "@/components/auth/access-denied";
import {
  Megaphone, Plus, Search, Pencil, Trash2, Loader2, AlertCircle,
  CheckCircle2, RefreshCcw, Pin, PinOff, Eye, EyeOff, Bell, Trophy, Sparkles,
} from "lucide-react";

const CATEGORY_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  ANNOUNCEMENT: { label: "Announcement", icon: Megaphone, color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  NOTIFICATION:  { label: "Notification",  icon: Bell,      color: "bg-sky-50 text-sky-700 border-sky-200"          },
  ACHIEVEMENT:   { label: "Achievement",   icon: Trophy,    color: "bg-amber-50 text-amber-700 border-amber-200"    },
  FEATURED:      { label: "Featured",      icon: Sparkles,  color: "bg-purple-50 text-purple-700 border-purple-200" },
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Low", NORMAL: "Normal", HIGH: "High", URGENT: "Urgent",
};

const TARGET_ROLES = ["ALL", "ADMIN", "TRAINER", "TRAINEE"];

interface PostForm {
  title: string;
  summary: string;
  content: string;
  category: string;
  priority: string;
  targetRole: string;
  isPublished: boolean;
  isPinned: boolean;
  expiresAt: string;
}

const BLANK: PostForm = {
  title: "", summary: "", content: "",
  category: "ANNOUNCEMENT", priority: "NORMAL",
  targetRole: "ALL", isPublished: false, isPinned: false, expiresAt: "",
};

export default function AdminPublishingPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role as string;

  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("ALL");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<PostForm>(BLANK);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.publishing.list({
        category: catFilter !== "ALL" ? catFilter : undefined,
        search: search || undefined,
      });
      setPosts(res.data?.posts ?? res.data ?? []);
    } catch (err: any) {
      setError(err.message || "Failed to load posts.");
    } finally {
      setIsLoading(false);
    }
  }, [catFilter, search]);

  useEffect(() => { load(); }, [load]);

  if (role !== "ADMIN") return <AccessDenied />;

  function openCreate() {
    setEditing(null);
    setForm(BLANK);
    setFormError(null);
    setDialogOpen(true);
  }

  function openEdit(post: any) {
    setEditing(post);
    setForm({
      title: post.title ?? "",
      summary: post.summary ?? "",
      content: post.content ?? "",
      category: post.category ?? "ANNOUNCEMENT",
      priority: post.priority ?? "NORMAL",
      targetRole: post.targetRole ?? "ALL",
      isPublished: post.isPublished ?? false,
      isPinned: post.isPinned ?? false,
      expiresAt: post.expiresAt ? post.expiresAt.slice(0, 16) : "",
    });
    setFormError(null);
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!form.title.trim()) { setFormError("Title is required."); return; }
    setSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        summary: form.summary.trim() || undefined,
        content: form.content.trim() || undefined,
        category: form.category,
        priority: form.priority,
        targetRole: form.targetRole,
        isPublished: form.isPublished,
        isPinned: form.isPinned,
        expiresAt: form.expiresAt || undefined,
      };
      if (editing) {
        await apiClient.publishing.update(editing.id, payload);
      } else {
        await apiClient.publishing.create(payload);
      }
      setDialogOpen(false);
      await load();
      setActionMsg({ type: "success", msg: editing ? "Post updated." : "Post created." });
    } catch (err: any) {
      setFormError(err.message || "Failed to save post.");
    } finally {
      setSubmitting(false);
    }
    setTimeout(() => setActionMsg(null), 3000);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiClient.publishing.delete(deleteTarget.id);
      setDeleteTarget(null);
      setActionMsg({ type: "success", msg: "Post deleted." });
      await load();
    } catch (err: any) {
      setActionMsg({ type: "error", msg: err.message || "Failed to delete." });
    } finally {
      setDeleting(false);
    }
    setTimeout(() => setActionMsg(null), 3000);
  }

  async function togglePublish(post: any) {
    try {
      await apiClient.publishing.update(post.id, { isPublished: !post.isPublished });
      await load();
    } catch (err: any) {
      setActionMsg({ type: "error", msg: err.message || "Failed to toggle publish state." });
      setTimeout(() => setActionMsg(null), 3000);
    }
  }

  async function togglePin(post: any) {
    try {
      await apiClient.publishing.update(post.id, { isPinned: !post.isPinned });
      await load();
    } catch (err: any) {
      setActionMsg({ type: "error", msg: err.message || "Failed to toggle pin." });
      setTimeout(() => setActionMsg(null), 3000);
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-lg border border-slate-800/80">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[11px] font-semibold text-indigo-200 border border-white/15">
              <Megaphone className="h-3 w-3" /> Admin Publishing
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Content Publishing</h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Publish announcements, notifications, achievements, and featured content to your organization.
            </p>
          </div>
          <Button onClick={openCreate} className="shrink-0 bg-white/10 hover:bg-white/20 text-white border border-white/20 gap-2 text-sm font-semibold">
            <Plus className="h-4 w-4" /> Create Post
          </Button>
        </div>
      </div>

      {actionMsg && (
        <div className={`flex items-center gap-2 rounded-xl px-4 py-3 text-xs border font-medium ${
          actionMsg.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"
        }`}>
          {actionMsg.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {actionMsg.msg}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search posts..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8.5 text-xs shadow-2xs" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {["ALL", ...Object.keys(CATEGORY_META)].map((c) => (
            <button key={c} onClick={() => setCatFilter(c)} className={`px-3 py-1.5 rounded-lg border text-[11px] font-semibold transition-all ${
              catFilter === c ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-200 hover:border-indigo-400 hover:text-indigo-700"
            }`}>
              {c === "ALL" ? "All" : CATEGORY_META[c]?.label}
            </button>
          ))}
        </div>
        <Button size="sm" variant="outline" onClick={load} disabled={isLoading} className="h-8.5 text-xs gap-1.5">
          {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCcw className="h-3 w-3" />}
          Refresh
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-xs text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-indigo-600" /> Loading posts...
        </div>
      ) : error ? (
        <Card className="border-rose-200 bg-rose-50/50">
          <CardContent className="flex items-center gap-2 p-4 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />{error}
          </CardContent>
        </Card>
      ) : posts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <Megaphone className="h-10 w-10 text-slate-300" />
            <p className="font-semibold text-sm">No posts found</p>
            <p className="text-xs text-muted-foreground">Create your first announcement or notification.</p>
            <Button size="sm" onClick={openCreate} className="mt-2 gap-1.5"><Plus className="h-3.5 w-3.5" />Create Post</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => {
            const rawMeta = CATEGORY_META[post.category];
            const meta: { label: string; icon: React.ElementType; color: string } = rawMeta ?? CATEGORY_META.ANNOUNCEMENT!;
            const CatIcon = meta.icon;
            const isExpired = post.expiresAt && new Date(post.expiresAt) < new Date();

            return (
              <Card key={post.id} className={`border border-border/80 shadow-xs hover:shadow-md transition-all ${post.isPinned ? "border-l-4 border-l-indigo-500" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 flex-wrap">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${meta.color}`}>
                      <CatIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-foreground">{post.title}</span>
                        {post.isPinned && <Pin className="h-3.5 w-3.5 text-indigo-500" />}
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-semibold ${meta.color}`}>{meta.label}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-semibold ${post.isPublished ? "bg-emerald-50 text-emerald-700 border-emerald-300" : "bg-slate-100 text-slate-500 border-slate-300"}`}>
                          {post.isPublished ? "Published" : "Draft"}
                        </span>
                        {post.targetRole && post.targetRole !== "ALL" && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[10px] font-mono font-medium text-slate-600">
                            → {post.targetRole}
                          </span>
                        )}
                        {isExpired && <span className="text-[10px] text-rose-600 font-semibold">Expired</span>}
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          post.priority === "URGENT" ? "bg-rose-50 text-rose-700 border border-rose-300"
                          : post.priority === "HIGH" ? "bg-amber-50 text-amber-700 border border-amber-300"
                          : "bg-slate-100 text-slate-500 border border-slate-200"
                        }`}>
                          {PRIORITY_LABELS[post.priority] ?? post.priority}
                        </span>
                      </div>
                      {post.summary && <p className="text-xs text-muted-foreground line-clamp-2">{post.summary}</p>}
                      {post.expiresAt && !isExpired && (
                        <p className="text-[11px] text-amber-700">Expires {new Date(post.expiresAt).toLocaleDateString()}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button size="sm" variant="ghost" title={post.isPinned ? "Unpin" : "Pin"} onClick={() => togglePin(post)} className="h-7 w-7 p-0">
                        {post.isPinned ? <PinOff className="h-3.5 w-3.5 text-indigo-600" /> : <Pin className="h-3.5 w-3.5 text-muted-foreground" />}
                      </Button>
                      <Button size="sm" variant="ghost" title={post.isPublished ? "Unpublish" : "Publish"} onClick={() => togglePublish(post)} className="h-7 w-7 p-0">
                        {post.isPublished ? <EyeOff className="h-3.5 w-3.5 text-slate-500" /> : <Eye className="h-3.5 w-3.5 text-emerald-600" />}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => openEdit(post)} className="h-7 w-7 p-0">
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground hover:text-indigo-600" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(post)} className="h-7 w-7 p-0">
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-rose-600" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-indigo-600" />
              {editing ? "Edit Post" : "Create Post"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {editing ? "Update the post details." : "Create a new published item for your organization."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3 mt-1">
            {formError && (
              <div className="flex items-center gap-2 rounded-xl p-3 text-xs bg-rose-50 text-rose-900 border border-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0" />{formError}
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Title <span className="text-destructive">*</span></Label>
              <Input value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. System Maintenance Notice" className="h-8.5 text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Category</Label>
                <select value={form.category} onChange={(e) => setForm(p => ({ ...p, category: e.target.value }))} className="w-full h-8.5 text-xs rounded-md border border-input bg-background px-3 py-1 shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                  {Object.entries(CATEGORY_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Priority</Label>
                <select value={form.priority} onChange={(e) => setForm(p => ({ ...p, priority: e.target.value }))} className="w-full h-8.5 text-xs rounded-md border border-input bg-background px-3 py-1 shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                  {Object.entries(PRIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Target Audience</Label>
              <select value={form.targetRole} onChange={(e) => setForm(p => ({ ...p, targetRole: e.target.value }))} className="w-full h-8.5 text-xs rounded-md border border-input bg-background px-3 py-1 shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                {TARGET_ROLES.map(r => <option key={r} value={r}>{r === "ALL" ? "All Roles" : r}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Summary</Label>
              <Input value={form.summary} onChange={(e) => setForm(p => ({ ...p, summary: e.target.value }))} placeholder="Short one-line summary..." className="h-8.5 text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Content</Label>
              <textarea
                value={form.content}
                onChange={(e) => setForm(p => ({ ...p, content: e.target.value }))}
                placeholder="Full post content..."
                rows={4}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Expiry Date (optional)</Label>
              <Input type="datetime-local" value={form.expiresAt} onChange={(e) => setForm(p => ({ ...p, expiresAt: e.target.value }))} className="h-8.5 text-xs" />
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm(p => ({ ...p, isPublished: e.target.checked }))} className="rounded" />
                <span className="text-xs font-semibold">Publish now</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isPinned} onChange={(e) => setForm(p => ({ ...p, isPinned: e.target.checked }))} className="rounded" />
                <span className="text-xs font-semibold">Pin to top</span>
              </label>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setDialogOpen(false)} disabled={submitting}>Cancel</Button>
              <Button type="submit" size="sm" disabled={submitting} className="gap-1.5">
                {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                {editing ? "Save Changes" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-700">
              <Trash2 className="h-4 w-4" /> Delete Post
            </DialogTitle>
            <DialogDescription className="text-xs">
              Permanently remove <strong>{deleteTarget?.title}</strong>? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</Button>
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting} className="gap-1.5">
              {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
