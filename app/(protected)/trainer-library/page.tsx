"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiClient } from "@/lib/api/client";
import {
  Library,
  Plus,
  Search,
  ExternalLink,
  Pencil,
  Trash2,
  Loader2,
  BookOpen,
  Video,
  Presentation,
  FileText,
  Globe,
  RefreshCcw,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Link as LinkIcon,
  Upload,
  FileUp,
  HardDrive,
  File,
} from "lucide-react";

const RESOURCE_TYPE_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  RECORDED_LECTURE: { label: "Recorded Lecture", icon: Video, color: "text-rose-600 bg-rose-50 border-rose-200" },
  PRESENTATION: { label: "Presentation", icon: Presentation, color: "text-indigo-600 bg-indigo-50 border-indigo-200" },
  STUDY_MATERIAL: { label: "Study Material", icon: BookOpen, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  DOCUMENT: { label: "Document", icon: FileText, color: "text-amber-600 bg-amber-50 border-amber-200" },
  EXTERNAL_LINK: { label: "External Link", icon: Globe, color: "text-sky-600 bg-sky-50 border-sky-200" },
};

const RESOURCE_TYPES = Object.keys(RESOURCE_TYPE_META);

function ResourceTypeBadge({ type }: { type: string }) {
  const meta = RESOURCE_TYPE_META[type] || { label: type, icon: FileText, color: "text-slate-600 bg-slate-50 border-slate-200" };
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-semibold ${meta.color}`}>
      <Icon className="h-3 w-3" />
      {meta.label}
    </span>
  );
}

function formatBytes(bytes?: number | bigint | null): string | null {
  if (!bytes) return null;
  const num = Number(bytes);
  if (num < 1024) return `${num} B`;
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
  return `${(num / (1024 * 1024)).toFixed(2)} MB`;
}

interface ResourceFormData {
  title: string;
  description: string;
  resourceType: string;
  fileUrl: string;
  fileFormat: string;
  fileSize: string;
  isPublished: boolean;
}

const BLANK_FORM: ResourceFormData = {
  title: "",
  description: "",
  resourceType: "STUDY_MATERIAL",
  fileUrl: "",
  fileFormat: "",
  fileSize: "",
  isPublished: true,
};

export default function TrainerLibraryPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role as "ADMIN" | "TRAINER" | "TRAINEE" || "TRAINEE";
  const userId = (session?.user as any)?.id as string | undefined;
  const canMutate = role === "ADMIN" || role === "TRAINER";

  const [resources, setResources] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sourceMode, setSourceMode] = useState<"UPLOAD" | "URL">("UPLOAD");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<ResourceFormData>(BLANK_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.trainerLibrary.list({
        search: search || undefined,
        resourceType: typeFilter !== "ALL" ? typeFilter : undefined,
      });
      setResources(res.data?.resources ?? res.data ?? []);
      setTotal(res.data?.total ?? 0);
    } catch (err: any) {
      setError(err.message || "Failed to load resources.");
    } finally {
      setIsLoading(false);
    }
  }, [search, typeFilter]);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditing(null);
    setSourceMode("UPLOAD");
    setSelectedFile(null);
    setForm(BLANK_FORM);
    setFormError(null);
    setDialogOpen(true);
  }

  function openEdit(resource: any) {
    setEditing(resource);
    setSourceMode("URL");
    setSelectedFile(null);
    setForm({
      title: resource.title || "",
      description: resource.description || "",
      resourceType: resource.resourceType || "STUDY_MATERIAL",
      fileUrl: resource.fileUrl || "",
      fileFormat: resource.fileFormat || "",
      fileSize: resource.fileSize ? String(resource.fileSize) : "",
      isPublished: resource.isPublished ?? true,
    });
    setFormError(null);
    setDialogOpen(true);
  }

  function handleFileSelection(file: File) {
    setSelectedFile(file);
    setFormError(null);
    // Suggest type based on extension
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (["mp4", "webm", "mov", "m4v"].includes(ext)) {
      setForm((p) => ({ ...p, resourceType: "RECORDED_LECTURE", title: p.title || file.name.replace(/\.[^/.]+$/, "") }));
    } else if (["pptx", "ppt", "odp"].includes(ext)) {
      setForm((p) => ({ ...p, resourceType: "PRESENTATION", title: p.title || file.name.replace(/\.[^/.]+$/, "") }));
    } else if (["pdf", "docx", "doc", "txt", "epub"].includes(ext)) {
      setForm((p) => ({ ...p, resourceType: p.resourceType === "RECORDED_LECTURE" ? "STUDY_MATERIAL" : p.resourceType, title: p.title || file.name.replace(/\.[^/.]+$/, "") }));
    } else {
      setForm((p) => ({ ...p, title: p.title || file.name.replace(/\.[^/.]+$/, "") }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!form.title.trim()) {
      setFormError("Title is required.");
      return;
    }

    if (!editing && sourceMode === "UPLOAD") {
      if (!selectedFile) {
        setFormError("Please select a file to upload.");
        return;
      }
      setSubmitting(true);
      try {
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("title", form.title.trim());
        if (form.description.trim()) formData.append("description", form.description.trim());
        formData.append("resourceType", form.resourceType);
        formData.append("isPublished", String(form.isPublished));

        await apiClient.trainerLibrary.upload(formData);
        setDialogOpen(false);
        await load();
      } catch (err: any) {
        setFormError(err.message || "Failed to upload resource.");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // External URL mode or Editing mode
    if (!form.fileUrl.trim()) {
      setFormError("File URL / Link is required.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        resourceType: form.resourceType,
        fileUrl: form.fileUrl.trim(),
        fileFormat: form.fileFormat.trim() || undefined,
        fileSize: form.fileSize ? parseInt(form.fileSize) : undefined,
        isPublished: form.isPublished,
      };

      if (editing) {
        await apiClient.trainerLibrary.update(editing.id, payload);
      } else {
        await apiClient.trainerLibrary.create(payload);
      }

      setDialogOpen(false);
      await load();
    } catch (err: any) {
      setFormError(err.message || "Failed to save resource.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiClient.trainerLibrary.delete(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch (err: any) {
      alert(err.message || "Failed to delete resource.");
    } finally {
      setDeleting(false);
    }
  }

  const canEditResource = (resource: any) =>
    role === "ADMIN" || resource.trainerId === userId || resource.trainer?.id === userId;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-lg border border-slate-800/80">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[11px] font-semibold text-indigo-200 border border-white/15">
              <Library className="h-3 w-3" />
              Trainer Resource Library
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Learning Resources</h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              {role === "TRAINEE"
                ? "Browse trainer-curated lectures, presentations, and study materials."
                : "Manage and publish training resources for your organization."}
            </p>
          </div>
          {canMutate && (
            <Button
              onClick={openCreate}
              className="shrink-0 bg-white/10 hover:bg-white/20 text-white border border-white/20 gap-2 text-sm font-semibold backdrop-blur-sm"
            >
              <Plus className="h-4 w-4" /> Add Resource
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search resources..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8.5 text-xs shadow-2xs"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {["ALL", ...RESOURCE_TYPES].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg border text-[11px] font-semibold transition-all ${
                typeFilter === t
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:border-indigo-400 hover:text-indigo-700"
              }`}
            >
              {t === "ALL" ? "All Types" : (RESOURCE_TYPE_META[t]?.label ?? t)}
            </button>
          ))}
        </div>
        <Button size="sm" variant="outline" onClick={load} disabled={isLoading} className="h-8.5 text-xs gap-1.5 shadow-2xs">
          {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCcw className="h-3 w-3" />}
          Refresh
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-xs text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
          Loading resources...
        </div>
      ) : error ? (
        <Card className="border-rose-200 bg-rose-50/50">
          <CardContent className="flex items-center gap-2 p-4 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </CardContent>
        </Card>
      ) : resources.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <Library className="h-10 w-10 text-slate-300" />
            <p className="font-semibold text-sm text-foreground">No resources found</p>
            <p className="text-xs text-muted-foreground">
              {canMutate ? "Add your first resource to get started." : "No published resources are available yet."}
            </p>
            {canMutate && (
              <Button size="sm" onClick={openCreate} className="mt-2 gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Add Resource
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="text-xs text-muted-foreground font-medium">{total || resources.length} resource(s) found</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {resources.map((resource) => {
              const meta = RESOURCE_TYPE_META[resource.resourceType] || { label: resource.resourceType, icon: FileText, color: "text-slate-600 bg-slate-50 border-slate-200" };
              const Icon = meta.icon;
              const isOwner = canEditResource(resource);
              const isUploaded = Boolean(resource.storageKey);
              const accessUrl = isUploaded
                ? `/api/trainer/library/files/${resource.storageKey}`
                : resource.fileUrl;
              const displaySize = formatBytes(resource.fileSizeBytes ?? resource.fileSize);

              return (
                <Card
                  key={resource.id}
                  className="border border-border/80 shadow-xs hover:shadow-md transition-all group"
                >
                  <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${meta.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-sm font-bold truncate">{resource.title}</CardTitle>
                        <CardDescription className="text-[11px] truncate">
                          {resource.trainer?.name ?? "Unknown Trainer"}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {isUploaded ? (
                        <Badge variant="outline" className="text-[10px] font-mono text-indigo-700 border-indigo-200 bg-indigo-50/50">
                          <HardDrive className="h-2.5 w-2.5 mr-0.5" /> File
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] font-mono text-slate-600 border-slate-200 bg-slate-50">
                          <Globe className="h-2.5 w-2.5 mr-0.5" /> URL
                        </Badge>
                      )}
                      {canMutate && (
                        <Badge variant="outline" className={`text-[10px] font-mono ${resource.isPublished ? "text-emerald-700 border-emerald-300 bg-emerald-50" : "text-slate-500 border-slate-300"}`}>
                          {resource.isPublished ? <Eye className="h-2.5 w-2.5 mr-0.5" /> : <EyeOff className="h-2.5 w-2.5 mr-0.5" />}
                          {resource.isPublished ? "Published" : "Draft"}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-1">
                    {resource.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{resource.description}</p>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      <ResourceTypeBadge type={resource.resourceType} />
                      {resource.fileFormat && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[11px] font-mono text-slate-600">
                          {resource.fileFormat.toUpperCase()}
                        </span>
                      )}
                      {displaySize && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[11px] font-mono text-slate-600">
                          {displaySize}
                        </span>
                      )}
                      {resource.course?.title && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-[11px] font-medium text-indigo-700">
                          📚 {resource.course.title}
                        </span>
                      )}
                      {resource.competency?.name && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 border border-sky-200 text-[11px] font-medium text-sky-700">
                          🎯 {resource.competency.name}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <a
                        href={accessUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                      >
                        {isUploaded ? <FileUp className="h-3.5 w-3.5" /> : <LinkIcon className="h-3.5 w-3.5" />}
                        {isUploaded ? "View / Download File" : "Open Resource"}
                      </a>
                      {canMutate && isOwner && (
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-indigo-600"
                            onClick={() => openEdit(resource)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-600"
                            onClick={() => setDeleteTarget(resource)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Library className="h-4 w-4 text-indigo-600" />
              {editing ? "Edit Resource" : "Add Resource"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {editing ? "Update resource details." : "Add a file upload or external link to the Trainer Library."}
            </DialogDescription>
          </DialogHeader>

          {!editing && (
            <div className="flex p-1 bg-slate-100 rounded-lg gap-1">
              <button
                type="button"
                onClick={() => setSourceMode("UPLOAD")}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                  sourceMode === "UPLOAD"
                    ? "bg-white text-indigo-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Upload className="h-3.5 w-3.5" /> Upload File
              </button>
              <button
                type="button"
                onClick={() => setSourceMode("URL")}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                  sourceMode === "URL"
                    ? "bg-white text-indigo-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Globe className="h-3.5 w-3.5" /> External URL / Link
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 mt-1">
            {formError && (
              <div className="flex items-center gap-2 rounded-xl p-3 text-xs bg-rose-50 text-rose-900 border border-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                {formError}
              </div>
            )}

            {!editing && sourceMode === "UPLOAD" && (
              <div className="space-y-2">
                <Label className="text-xs font-bold">File <span className="text-destructive">*</span></Label>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleFileSelection(e.dataTransfer.files[0]);
                    }
                  }}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                    isDragging
                      ? "border-indigo-600 bg-indigo-50/50"
                      : selectedFile
                      ? "border-emerald-400 bg-emerald-50/30"
                      : "border-slate-200 hover:border-indigo-400 hover:bg-slate-50"
                  }`}
                  onClick={() => document.getElementById("trainer-file-input")?.click()}
                >
                  <input
                    id="trainer-file-input"
                    type="file"
                    className="hidden"
                    accept=".mp4,.webm,.mov,.m4v,.pptx,.ppt,.pdf,.odp,.docx,.doc,.txt,.epub"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileSelection(e.target.files[0]);
                      }
                    }}
                  />
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <File className="h-6 w-6 text-emerald-600 shrink-0" />
                      <div className="text-left min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">{selectedFile.name}</p>
                        <p className="text-[11px] text-muted-foreground font-mono">{formatBytes(selectedFile.size)}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-1.5 py-2 text-slate-500">
                      <Upload className="h-6 w-6 text-indigo-500" />
                      <p className="text-xs font-semibold text-foreground">Click to browse or drag file here</p>
                      <p className="text-[10px] text-muted-foreground">
                        Max 100MB (MP4, WEBM, MOV) or 30MB (PDF, PPTX, DOCX, TXT, EPUB)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Title <span className="text-destructive">*</span></Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Introduction to Cloud Architecture"
                className="h-8.5 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Resource Type</Label>
              <select
                value={form.resourceType}
                onChange={(e) => setForm((p) => ({ ...p, resourceType: e.target.value }))}
                className="w-full h-8.5 text-xs rounded-md border border-input bg-background px-3 py-1 text-foreground shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {RESOURCE_TYPES.map((t) => (
                  <option key={t} value={t}>{RESOURCE_TYPE_META[t]?.label ?? t}</option>
                ))}
              </select>
            </div>

            {(editing || sourceMode === "URL") && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">File URL / Link <span className="text-destructive">*</span></Label>
                  <Input
                    value={form.fileUrl}
                    onChange={(e) => setForm((p) => ({ ...p, fileUrl: e.target.value }))}
                    placeholder="https://example.com/resource.pdf"
                    className="h-8.5 text-xs font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Format</Label>
                    <Input
                      value={form.fileFormat}
                      onChange={(e) => setForm((p) => ({ ...p, fileFormat: e.target.value }))}
                      placeholder="PDF, MP4, PPTX…"
                      className="h-8.5 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Size (bytes)</Label>
                    <Input
                      type="number"
                      value={form.fileSize}
                      onChange={(e) => setForm((p) => ({ ...p, fileSize: e.target.value }))}
                      placeholder="e.g. 2048000"
                      className="h-8.5 text-xs"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Description</Label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Brief description of this resource..."
                rows={2}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) => setForm((p) => ({ ...p, isPublished: e.target.checked }))}
                className="rounded"
              />
              <span className="text-xs font-semibold text-foreground">Publish immediately</span>
              <span className="text-xs text-muted-foreground">(Trainees can see published resources)</span>
            </label>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setDialogOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submitting} className="gap-1.5">
                {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                {editing ? "Save Changes" : sourceMode === "UPLOAD" ? "Upload & Save" : "Create Resource"}
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
              <Trash2 className="h-4 w-4" /> Delete Resource
            </DialogTitle>
            <DialogDescription className="text-xs">
              This will permanently remove <strong>{deleteTarget?.title}</strong>. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </Button>
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
