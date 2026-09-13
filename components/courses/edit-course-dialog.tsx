"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDemoStore } from "@/lib/demo/demo-store";
import { isDemoMode } from "@/lib/demo/config";
import { apiClient } from "@/lib/api/client";
import { getCourseCurriculum } from "@/lib/demo/learning-curriculum";
import {
  CheckCircle2,
  AlertCircle,
  Pencil,
  Plus,
  Trash2,
  BookOpen,
  ArrowUp,
  ArrowDown,
  Code,
  Layers,
  Sparkles,
} from "lucide-react";

interface EditCourseDialogProps {
  course: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface EditableModule {
  id?: string;
  order: number;
  title: string;
  summary: string;
  durationMinutes: number;
  overview: string;
  keyConcepts: {
    topic?: string;
    title: string;
    description: string;
    codeSnippet?: string;
  }[];
  learningObjectives?: string[];
  practicalExercise: string;
  competencyVerification: string;
}

export function EditCourseDialog({
  course,
  open,
  onOpenChange,
  onSuccess,
}: EditCourseDialogProps) {
  const { updateCourse } = useDemoStore();

  const [activeTab, setActiveTab] = useState<"general" | "modules">("general");

  // Metadata State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [durationHours, setDurationHours] = useState(10);
  const [targetLevel, setTargetLevel] = useState(3);
  const [status, setStatus] = useState<"PUBLISHED" | "DRAFT">("PUBLISHED");

  // Modules State
  const [modules, setModules] = useState<EditableModule[]>([]);

  // Expanded module accordion
  const [expandedModuleIdx, setExpandedModuleIdx] = useState<number | null>(0);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (course && open) {
      setTitle(course.title || "");
      setDescription(course.description || "");
      setCategory(course.category || "Technical / Programming");
      setDurationHours(course.durationHours || 10);
      setTargetLevel(course.targetLevel || 3);
      setStatus(course.status || "PUBLISHED");
      setErrors({});
      setFeedback(null);
      setActiveTab("general");

      async function loadFullCourse() {
        let rawModules = course.modules;
        if (!isDemoMode()) {
          try {
            const res = await apiClient.courses.getById(course.id);
            if (res.data) {
              if (res.data.title) setTitle(res.data.title);
              if (res.data.description) setDescription(res.data.description);
              if (res.data.category) setCategory(res.data.category);
              if (res.data.durationHours) setDurationHours(res.data.durationHours);
              if (res.data.targetLevel) setTargetLevel(res.data.targetLevel);
              if (res.data.status) setStatus(res.data.status);
              rawModules = res.data.modules;
            }
          } catch (e) {
            console.error("Failed to fetch full course for editing:", e);
          }
        }

        // Load modules
        let initialModules: EditableModule[] = [];
        if (rawModules && rawModules.length > 0) {
          initialModules = rawModules.map((m: any, idx: number) => ({
            id: m.id,
            order: m.order ?? idx + 1,
            title: m.title || `Module ${idx + 1}`,
            summary: m.summary || m.overview || "",
            durationMinutes: m.durationMinutes || 60,
            overview: m.overview || m.summary || "",
            keyConcepts: Array.isArray(m.keyConcepts)
              ? m.keyConcepts
              : Array.isArray(m.content?.keyConcepts)
              ? m.content.keyConcepts
              : [],
            learningObjectives: Array.isArray(m.learningObjectives)
              ? m.learningObjectives
              : [],
            practicalExercise:
              m.practicalExercise ||
              m.content?.practicalExercise ||
              "Apply the concepts to practical scenarios.",
            competencyVerification:
              m.competencyVerification ||
              m.content?.competencyVerification ||
              "Meets required domain standards.",
          }));
        } else {
          const curriculum = getCourseCurriculum(course.id);
          if (curriculum && curriculum.modules.length > 0) {
            initialModules = curriculum.modules.map((m: any, idx: number) => ({
              id: m.id,
              order: m.order ?? idx + 1,
              title: m.title || `Module ${idx + 1}`,
              summary: m.summary || m.content?.overview || "",
              durationMinutes: m.durationMinutes || 60,
              overview: m.content?.overview || m.summary || "",
              keyConcepts: m.content?.keyConcepts || [],
              learningObjectives: m.learningObjectives || [],
              practicalExercise:
                m.content?.practicalExercise || "Complete module practice.",
              competencyVerification:
                m.content?.competencyVerification ||
                "Attains proficiency standards.",
            }));
          }
        }

        setModules(initialModules);
        setExpandedModuleIdx(initialModules.length > 0 ? 0 : null);
      }

      loadFullCourse();
    }
  }, [course, open]);

  function handleAddModule() {
    const nextOrder = modules.length + 1;
    const newMod: EditableModule = {
      order: nextOrder,
      title: `Module ${nextOrder}: Specialized Focus & Applications`,
      summary: "Core principles, execution patterns, and best practices.",
      durationMinutes: 120,
      overview:
        "Comprehensive architectural concepts and production techniques.",
      keyConcepts: [
        {
          title: "Core Mechanics",
          description: "Essential workflows and operational guidelines.",
        },
      ],
      learningObjectives: [
        "Master foundational mechanics and patterns",
        "Implement production-grade architecture",
      ],
      practicalExercise: "Build and test the domain component.",
      competencyVerification:
        "Demonstrates proficiency aligned with target competency level.",
    };
    setModules([...modules, newMod]);
    setExpandedModuleIdx(modules.length);
  }

  function handleRemoveModule(index: number) {
    const mod = modules[index];
    if (
      mod?.id &&
      !confirm(
        `Are you sure you want to remove "${mod.title}"? If this module has existing employee progress, removing it will be safely blocked by the system.`
      )
    ) {
      return;
    }
    const updated = modules.filter((_, i) => i !== index);
    setModules(updated.map((m, i) => ({ ...m, order: i + 1 })));
    setExpandedModuleIdx(null);
  }

  function handleMoveModule(index: number, direction: "up" | "down") {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === modules.length - 1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const updated = [...modules];
    const temp = updated[index];
    const target = updated[targetIndex];
    if (temp && target) {
      updated[index] = target;
      updated[targetIndex] = temp;
      setModules(updated.map((m, i) => ({ ...m, order: i + 1 })));
      setExpandedModuleIdx(targetIndex);
    }
  }

  function handleUpdateModuleField(
    index: number,
    field: keyof EditableModule,
    val: any
  ) {
    const updated = [...modules];
    if (updated[index]) {
      updated[index] = { ...updated[index], [field]: val };
      setModules(updated);
    }
  }

  function handleAddConcept(moduleIdx: number) {
    const updated = [...modules];
    const mod = updated[moduleIdx];
    if (!mod) return;
    const concepts = mod.keyConcepts || [];
    mod.keyConcepts = [
      ...concepts,
      {
        title: "New Concept / Topic",
        description: "Description of the topic and core takeaway.",
      },
    ];
    setModules(updated);
  }

  function handleRemoveConcept(moduleIdx: number, conceptIdx: number) {
    const updated = [...modules];
    const mod = updated[moduleIdx];
    if (!mod) return;
    mod.keyConcepts = mod.keyConcepts.filter((_, i) => i !== conceptIdx);
    setModules(updated);
  }

  function handleUpdateConcept(
    moduleIdx: number,
    conceptIdx: number,
    field: "topic" | "title" | "description" | "codeSnippet",
    val: string
  ) {
    const updated = [...modules];
    const mod = updated[moduleIdx];
    if (!mod || !mod.keyConcepts[conceptIdx]) return;
    mod.keyConcepts[conceptIdx] = {
      ...mod.keyConcepts[conceptIdx],
      [field]: val,
    };
    setModules(updated);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!course) return;

    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = "Course title is required";
    if (modules.length === 0)
      newErrors.modules = "At least one module is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    setFeedback(null);

    async function executeUpdate() {
      const formattedModules = modules.map((m, idx) => ({
        id: m.id,
        order: idx + 1,
        title: m.title.trim(),
        summary: m.summary.trim() || m.title.trim(),
        durationMinutes: Number(m.durationMinutes) || 60,
        overview: m.overview.trim() || m.summary.trim() || m.title.trim(),
        keyConcepts: m.keyConcepts || [],
        practicalExercise:
          m.practicalExercise?.trim() || "Complete practical exercise.",
        competencyVerification:
          m.competencyVerification?.trim() || "Verified by competency test.",
      }));

      if (isDemoMode()) {
        const result = updateCourse(course.id, {
          title,
          description,
          category,
          durationHours: Number(durationHours) || 10,
          targetLevel: Number(targetLevel) || 3,
          status,
          modules: formattedModules,
        });

        setIsSubmitting(false);

        if (!result.success) {
          setFeedback({
            type: "error",
            message: result.error || "Failed to update course",
          });
          return;
        }

        setFeedback({
          type: "success",
          message: `"${title}" and its ${formattedModules.length} modules updated successfully. Existing employee learning records are preserved.`,
        });

        setTimeout(() => {
          onOpenChange(false);
          setFeedback(null);
          onSuccess?.();
        }, 1200);
      } else {
        try {
          await apiClient.courses.update(course.id, {
            title,
            description,
            category,
            durationHours: Number(durationHours) || 10,
            targetLevel: Number(targetLevel) || 3,
            status,
            modules: formattedModules,
          });

          setIsSubmitting(false);
          setFeedback({
            type: "success",
            message: `"${title}" updated successfully in PostgreSQL with learning history preserved.`,
          });

          setTimeout(() => {
            onOpenChange(false);
            setFeedback(null);
            onSuccess?.();
          }, 1200);
        } catch (err: any) {
          setIsSubmitting(false);
          setFeedback({
            type: "error",
            message: err.message || "Failed to update course",
          });
        }
      }
    }

    executeUpdate();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden">
        <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <DialogHeader className="p-5 pb-3 border-b bg-muted/20 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-xs">
                  <Pencil className="h-4.5 w-4.5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold">
                    Edit Course &amp; Curriculum Roadmap
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    Course Code: <span className="font-mono font-semibold">{course?.code}</span> • ID: <span className="font-mono text-[11px]">{course?.id}</span>
                  </DialogDescription>
                </div>
              </div>
              <Badge variant="outline" className="text-xs font-mono font-bold bg-white">
                Level {targetLevel}
              </Badge>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 pt-3 border-t border-border/40 mt-3">
              <Button
                type="button"
                size="sm"
                variant={activeTab === "general" ? "default" : "outline"}
                className="text-xs h-7 gap-1.5"
                onClick={() => setActiveTab("general")}
              >
                <BookOpen className="h-3.5 w-3.5" />
                Course Information
              </Button>
              <Button
                type="button"
                size="sm"
                variant={activeTab === "modules" ? "default" : "outline"}
                className="text-xs h-7 gap-1.5"
                onClick={() => setActiveTab("modules")}
              >
                <Layers className="h-3.5 w-3.5" />
                Curriculum &amp; Modules ({modules.length})
              </Button>
            </div>
          </DialogHeader>

          {/* Feedback Banner */}
          {feedback && (
            <div
              className={`mx-5 mt-3 flex items-center gap-2 rounded-lg p-3 text-xs shrink-0 ${
                feedback.type === "success"
                  ? "bg-emerald-500/10 text-emerald-800 border border-emerald-300"
                  : "bg-destructive/10 text-destructive border border-destructive/20"
              }`}
            >
              {feedback.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" />
              )}
              <span className="font-medium">{feedback.message}</span>
            </div>
          )}

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {activeTab === "general" && (
              <div className="space-y-4 text-xs">
                <div>
                  <Label className="text-xs font-bold text-foreground">Course Title *</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Advanced Distributed Systems & Cloud Architecture"
                    className="h-9 text-xs mt-1 bg-background"
                  />
                  {errors.title && (
                    <p className="text-[11px] text-destructive mt-1">{errors.title}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <Label className="text-xs font-bold text-foreground">Category</Label>
                    <Input
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="e.g. Backend Development"
                      className="h-8 text-xs mt-1 bg-background"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-foreground">Duration (Hours)</Label>
                    <Input
                      type="number"
                      min={1}
                      value={durationHours}
                      onChange={(e) => setDurationHours(parseInt(e.target.value) || 1)}
                      className="h-8 text-xs mt-1 bg-background"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-foreground">Target Proficiency</Label>
                    <Select
                      value={String(targetLevel)}
                      onValueChange={(val) => setTargetLevel(parseInt(val))}
                    >
                      <SelectTrigger className="h-8 text-xs mt-1 bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map((lvl) => (
                          <SelectItem key={lvl} value={String(lvl)}>
                            Level {lvl} {lvl === 1 ? "(Foundational)" : lvl === 3 ? "(Intermediate)" : lvl === 5 ? "(Principal / Expert)" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-bold text-foreground">Description &amp; Objectives</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide a comprehensive course description..."
                    rows={4}
                    className="text-xs mt-1 bg-background leading-relaxed"
                  />
                </div>

                <div>
                  <Label className="text-xs font-bold text-foreground">Publishing Status</Label>
                  <Select
                    value={status}
                    onValueChange={(val: "PUBLISHED" | "DRAFT") => setStatus(val)}
                  >
                    <SelectTrigger className="h-8 text-xs mt-1 bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PUBLISHED">Published (Available for Enrollment &amp; Recommendations)</SelectItem>
                      <SelectItem value="DRAFT">Draft (Authoring in Progress)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {activeTab === "modules" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                      Course Curriculum &amp; Learning Modules
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Structured topics, concepts, code snippets, and hands-on exercises. Existing module IDs are preserved.
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs gap-1.5 font-semibold bg-background"
                    onClick={handleAddModule}
                  >
                    <Plus className="h-3.5 w-3.5 text-primary" />
                    Add Module
                  </Button>
                </div>

                {errors.modules && (
                  <p className="text-xs text-destructive">{errors.modules}</p>
                )}

                <div className="space-y-3">
                  {modules.map((mod, idx) => {
                    const isExpanded = expandedModuleIdx === idx;

                    return (
                      <div
                        key={mod.id || `new-mod-${idx}`}
                        className="rounded-xl border border-border/80 bg-card p-4 space-y-3 shadow-2xs transition-all"
                      >
                        {/* Module Header Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2.5">
                          <div className="flex items-center gap-2.5 flex-1 min-w-[200px]">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-mono text-xs font-bold shadow-2xs">
                              {idx + 1}
                            </div>
                            <div className="flex-1">
                              <span className="font-bold text-xs text-foreground block">
                                {mod.title || `Module ${idx + 1}`}
                              </span>
                              {mod.id && (
                                <span className="font-mono text-[10px] text-muted-foreground">
                                  ID: {mod.id}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              disabled={idx === 0}
                              onClick={() => handleMoveModule(idx, "up")}
                              title="Move Up"
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              disabled={idx === modules.length - 1}
                              onClick={() => handleMoveModule(idx, "down")}
                              title="Move Down"
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs font-medium px-2"
                              onClick={() =>
                                setExpandedModuleIdx(isExpanded ? null : idx)
                              }
                            >
                              {isExpanded ? "Collapse" : "Edit Module"}
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-destructive hover:bg-destructive/10"
                              onClick={() => handleRemoveModule(idx)}
                              title="Remove Module"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>

                        {/* Collapsed summary pill */}
                        {!isExpanded && (
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="line-clamp-1">{mod.summary || mod.overview}</span>
                            <span className="shrink-0 font-mono text-[11px]">
                              {mod.durationMinutes}m • {mod.keyConcepts?.length || 0} concepts
                            </span>
                          </div>
                        )}

                        {/* Expanded Edit Form */}
                        {isExpanded && (
                          <div className="space-y-3 pt-1 text-xs">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div className="sm:col-span-2">
                                <Label className="text-[11px] font-bold text-foreground">
                                  Module Title *
                                </Label>
                                <Input
                                  value={mod.title}
                                  onChange={(e) =>
                                    handleUpdateModuleField(idx, "title", e.target.value)
                                  }
                                  className="h-8 text-xs mt-1 bg-background"
                                />
                              </div>
                              <div>
                                <Label className="text-[11px] font-bold text-foreground">
                                  Duration (Minutes)
                                </Label>
                                <Input
                                  type="number"
                                  min={15}
                                  step={15}
                                  value={mod.durationMinutes}
                                  onChange={(e) =>
                                    handleUpdateModuleField(
                                      idx,
                                      "durationMinutes",
                                      parseInt(e.target.value) || 30
                                    )
                                  }
                                  className="h-8 text-xs mt-1 bg-background"
                                />
                              </div>
                            </div>

                            <div>
                              <Label className="text-[11px] font-bold text-foreground">
                                Summary / High-Level Focus
                              </Label>
                              <Input
                                value={mod.summary}
                                onChange={(e) =>
                                  handleUpdateModuleField(idx, "summary", e.target.value)
                                }
                                className="h-8 text-xs mt-1 bg-background"
                              />
                            </div>

                            <div>
                              <Label className="text-[11px] font-bold text-foreground">
                                Detailed Overview &amp; Learning Architecture
                              </Label>
                              <Textarea
                                value={mod.overview}
                                onChange={(e) =>
                                  handleUpdateModuleField(idx, "overview", e.target.value)
                                }
                                rows={2}
                                className="text-xs mt-1 bg-background leading-relaxed"
                              />
                            </div>

                            {/* Key Concepts List */}
                            <div className="space-y-2 rounded-lg border border-border/60 bg-muted/20 p-3">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-[11px] text-foreground flex items-center gap-1.5">
                                  <Code className="h-3.5 w-3.5 text-primary" />
                                  Topics &amp; Key Concepts ({mod.keyConcepts?.length || 0})
                                </span>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="h-6 text-[10px] gap-1 bg-background"
                                  onClick={() => handleAddConcept(idx)}
                                >
                                  <Plus className="h-3 w-3" />
                                  Add Topic / Concept
                                </Button>
                              </div>

                              <div className="space-y-2">
                                {(mod.keyConcepts || []).map((concept, cIdx) => (
                                  <div
                                    key={cIdx}
                                    className="rounded-lg border border-border/70 bg-card p-2.5 space-y-2"
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <Input
                                        value={concept.title}
                                        onChange={(e) =>
                                          handleUpdateConcept(
                                            idx,
                                            cIdx,
                                            "title",
                                            e.target.value
                                          )
                                        }
                                        placeholder="Concept Title (e.g. Memory Layout & Zero-Copy I/O)"
                                        className="h-7 text-xs font-semibold bg-background"
                                      />
                                      <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        className="h-6 w-6 text-destructive shrink-0"
                                        onClick={() =>
                                          handleRemoveConcept(idx, cIdx)
                                        }
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>

                                    <Textarea
                                      value={concept.description}
                                      onChange={(e) =>
                                        handleUpdateConcept(
                                          idx,
                                          cIdx,
                                          "description",
                                          e.target.value
                                        )
                                      }
                                      placeholder="Explain the concept in depth..."
                                      rows={2}
                                      className="text-xs bg-background leading-relaxed"
                                    />

                                    <div>
                                      <Label className="text-[10px] text-muted-foreground font-mono">
                                        Code Snippet / Implementation Example (Optional)
                                      </Label>
                                      <Textarea
                                        value={concept.codeSnippet || ""}
                                        onChange={(e) =>
                                          handleUpdateConcept(
                                            idx,
                                            cIdx,
                                            "codeSnippet",
                                            e.target.value
                                          )
                                        }
                                        placeholder={`// Example code snippet\nfunction process() { ... }`}
                                        rows={2}
                                        className="font-mono text-[11px] bg-slate-900 text-slate-100 mt-1"
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <Label className="text-[11px] font-bold text-foreground">
                                  Practical Hands-On Exercise
                                </Label>
                                <Textarea
                                  value={mod.practicalExercise}
                                  onChange={(e) =>
                                    handleUpdateModuleField(
                                      idx,
                                      "practicalExercise",
                                      e.target.value
                                    )
                                  }
                                  rows={2}
                                  className="text-xs mt-1 bg-background leading-relaxed"
                                />
                              </div>
                              <div>
                                <Label className="text-[11px] font-bold text-foreground">
                                  Competency Verification Standard
                                </Label>
                                <Textarea
                                  value={mod.competencyVerification}
                                  onChange={(e) =>
                                    handleUpdateModuleField(
                                      idx,
                                      "competencyVerification",
                                      e.target.value
                                    )
                                  }
                                  rows={2}
                                  className="text-xs mt-1 bg-background leading-relaxed"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <DialogFooter className="p-4 border-t bg-muted/10 shrink-0 flex sm:justify-between items-center gap-2">
            <div className="text-[11px] text-muted-foreground">
              {modules.length} module{modules.length === 1 ? "" : "s"} in roadmap
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="text-xs h-8"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="text-xs h-8 font-semibold bg-primary text-primary-foreground gap-1.5"
              >
                <CheckCircle2 className="h-4 w-4" />
                {isSubmitting ? "Saving..." : "Save Course & Curriculum"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
