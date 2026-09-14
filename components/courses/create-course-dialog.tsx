"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
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
import {
  GraduationCap,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Code,
  Sparkles,
} from "lucide-react";

interface CreateCourseDialogProps {
  onSuccess?: () => void;
}

export function CreateCourseDialog({ onSuccess }: CreateCourseDialogProps = {}) {
  const { competencies: demoCompetencies, addCourse } = useDemoStore();
  const [realCompetencies, setRealCompetencies] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isDemoMode() && open) {
      apiClient.competencies
        .list()
        .then((res) => {
          if (res.data && res.data.length > 0) {
            setRealCompetencies(res.data);
          }
        })
        .catch((err) => {
          console.error("Failed to load competencies for course authoring:", err);
        });
    }
  }, [open]);

  const availableCompetencies =
    !isDemoMode() && realCompetencies.length > 0 ? realCompetencies : demoCompetencies;

  // Form State
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [category, setCategory] = useState("Technical / Programming");
  const [competencyId, setCompetencyId] = useState(availableCompetencies[0]?.id || "comp-python");

  useEffect(() => {
    if (!competencyId && availableCompetencies.length > 0) {
      setCompetencyId(availableCompetencies[0].id);
    }
  }, [competencyId, availableCompetencies]);
  const [targetLevel, setTargetLevel] = useState(4);
  const [durationHours, setDurationHours] = useState(20);
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"PUBLISHED" | "DRAFT">("PUBLISHED");

  // Module Builder State
  const [modules, setModules] = useState<
    {
      title: string;
      summary: string;
      durationMinutes: number;
      overview: string;
      keyConcepts: { title: string; description: string; codeSnippet?: string }[];
      practicalExercise: string;
      competencyVerification: string;
    }[]
  >([
    {
      title: "Foundations & Architecture Overview",
      summary: "Core system architecture and operational concepts.",
      durationMinutes: 180,
      overview: "Comprehensive deep-dive into fundamental patterns and core execution models.",
      keyConcepts: [
        {
          title: "System Principles",
          description: "Understanding clean boundaries and asynchronous task lifecycle.",
          codeSnippet: `// Example baseline pattern\nconst worker = new TaskRunner({ concurrency: 4 });`,
        },
      ],
      practicalExercise: "Build an end-to-end processing pipeline adhering to modular patterns.",
      competencyVerification: "Demonstrates practitioner proficiency in core domain tasks.",
    },
    {
      title: "Advanced Optimization & Production Delivery",
      summary: "High-scale performance tuning, resilience, and monitoring.",
      durationMinutes: 240,
      overview: "Diagnosing bottlenecks, edge cases, and multi-tier scaling strategies.",
      keyConcepts: [
        {
          title: "Throughput Maximization",
          description: "Applying non-blocking I/O and optimal memory bounds.",
        },
      ],
      practicalExercise: "Optimize system response latency and write automated verification tests.",
      competencyVerification: "Meets high-level production readiness standards.",
    },
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  function handleAddModule() {
    const nextIdx = modules.length + 1;
    setModules([
      ...modules,
      {
        title: `Module ${nextIdx}: Advanced Domain Application`,
        summary: "Practical engineering workflows and architectural guidelines.",
        durationMinutes: 180,
        overview: "Structured deep-dive into specialized methodologies.",
        keyConcepts: [
          {
            title: "Core Mechanics",
            description: "Executing complex operations efficiently.",
          },
        ],
        practicalExercise: "Complete milestone project implementation.",
        competencyVerification: "Attains target proficiency level.",
      },
    ]);
  }

  function handleRemoveModule(index: number) {
    setModules(modules.filter((_, i) => i !== index));
  }

  function handleModuleTitleChange(index: number, val: string) {
    const updated = [...modules];
    if (updated[index]) {
      updated[index].title = val;
      setModules(updated);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setFeedback(null);

    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = "Course Title is required";
    if (!competencyId) newErrors.competencyId = "Target Competency is required";
    if (modules.length === 0) newErrors.modules = "At least one module is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    async function executeCreate() {
      const courseCode = code || `CRS-${Date.now().toString().slice(-4)}`;
      const courseDesc = description || `Comprehensive training pathway for Level ${targetLevel} competency.`;

      if (isDemoMode()) {
        const result = addCourse(
          {
            title,
            code: courseCode,
            category,
            competencyId,
            targetLevel,
            durationHours: Number(durationHours) || 20,
            description: courseDesc,
            status,
          },
          modules
        );

        if (!result.success) {
          setFeedback({ type: "error", message: result.error || "Failed to create course" });
          return;
        }

        setFeedback({
          type: "success",
          message: `Course "${title}" published with ${modules.length} interactive modules!`,
        });

        setTimeout(() => {
          setTitle("");
          setCode("");
          setDescription("");
          setErrors({});
          setFeedback(null);
          setOpen(false);
          onSuccess?.();
        }, 1200);
      } else {
        try {
          await apiClient.courses.create({
            title,
            code: courseCode,
            category,
            competencyId,
            targetLevel,
            durationHours: Number(durationHours) || 20,
            description: courseDesc,
            status,
            modules: modules.map((m, idx) => ({
              order: idx + 1,
              title: m.title,
              summary: m.summary || m.title,
              durationMinutes: m.durationMinutes || 30,
              overview: m.overview || m.summary || m.title,
              keyConcepts: m.keyConcepts || [],
              practicalExercise: m.practicalExercise || "Complete module practice exercise.",
              competencyVerification: m.competencyVerification || "Attains target proficiency level.",
            })),
          });

          setFeedback({
            type: "success",
            message: `Course "${title}" created and saved to PostgreSQL!`,
          });

          setTimeout(() => {
            setTitle("");
            setCode("");
            setDescription("");
            setErrors({});
            setFeedback(null);
            setOpen(false);
            onSuccess?.();
          }, 1200);
        } catch (err: any) {
          setFeedback({ type: "error", message: err.message || "Failed to create course" });
        }
      }
    }

    executeCreate();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 bg-primary text-primary-foreground">
          <GraduationCap className="h-4 w-4" />
          Create Course
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader className="border-b pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <GraduationCap className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">Create Capacity Building Course</DialogTitle>
                <DialogDescription className="text-xs">
                  Design a structured curriculum mapped directly to targeted competency elevation
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {feedback && (
            <div
              className={`flex items-center gap-2 rounded-lg p-3 text-xs ${
                feedback.type === "success"
                  ? "bg-emerald-500/10 text-emerald-800 border border-emerald-300 dark:text-emerald-300"
                  : "bg-destructive/10 text-destructive border border-destructive/20"
              }`}
            >
              {feedback.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {/* Title */}
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="crs-title" className="text-xs font-medium">
                Course Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="crs-title"
                placeholder="e.g. Distributed Systems &amp; Microservices Architecture"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-8 text-xs"
              />
              {errors.title && <p className="text-[11px] text-destructive">{errors.title}</p>}
            </div>

            {/* Code */}
            <div className="space-y-1.5">
              <Label htmlFor="crs-code" className="text-xs font-medium">
                Course Code
              </Label>
              <Input
                id="crs-code"
                placeholder="e.g. CRS-DIST-501"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="h-8 text-xs font-mono uppercase"
              />
            </div>

            {/* Target Competency */}
            <div className="space-y-1.5">
              <Label htmlFor="crs-comp" className="text-xs font-medium">
                Target Competency <span className="text-destructive">*</span>
              </Label>
              <Select value={competencyId} onValueChange={setCompetencyId}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableCompetencies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} ({c.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Target Level */}
            <div className="space-y-1.5">
              <Label htmlFor="crs-lvl" className="text-xs font-medium">
                Target Proficiency Level <span className="text-destructive">*</span>
              </Label>
              <Select
                value={String(targetLevel)}
                onValueChange={(val) => setTargetLevel(parseInt(val, 10))}
              >
                <SelectTrigger className="h-8 text-xs font-mono font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Level 1 (Beginner)</SelectItem>
                  <SelectItem value="2">Level 2 (Working)</SelectItem>
                  <SelectItem value="3">Level 3 (Practitioner)</SelectItem>
                  <SelectItem value="4">Level 4 (Advanced)</SelectItem>
                  <SelectItem value="5">Level 5 (Expert)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Total Duration */}
            <div className="space-y-1.5">
              <Label htmlFor="crs-dur" className="text-xs font-medium">
                Total Hours
              </Label>
              <Input
                id="crs-dur"
                type="number"
                value={durationHours}
                onChange={(e) => setDurationHours(parseInt(e.target.value, 10))}
                className="h-8 text-xs"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5 sm:col-span-3">
              <Label htmlFor="crs-desc" className="text-xs font-medium">
                Course Description &amp; Objectives
              </Label>
              <Textarea
                id="crs-desc"
                placeholder="Core learning outcomes and target capability elevation..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="text-xs"
              />
            </div>
          </div>

          {/* Module Builder */}
          <div className="rounded-lg border bg-muted/20 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-foreground">
                  Curriculum Module Roadmap Builder ({modules.length} Modules)
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Sequential modules required for 100% course completion and manager reassessment
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddModule}
                className="h-7 text-xs gap-1"
              >
                <Plus className="h-3 w-3" />
                Add Module
              </Button>
            </div>

            {errors.modules && (
              <p className="text-[11px] text-destructive">{errors.modules}</p>
            )}

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {modules.map((mod, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 rounded border bg-background p-2.5 text-xs"
                >
                  <div className="flex items-center gap-2.5 flex-1">
                    <Badge variant="secondary" className="text-[10px] font-mono shrink-0">
                      Module {idx + 1}
                    </Badge>
                    <Input
                      value={mod.title}
                      onChange={(e) => handleModuleTitleChange(idx, e.target.value)}
                      className="h-7 text-xs flex-1"
                      placeholder="Module Title"
                    />
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveModule(idx)}
                    disabled={modules.length <= 1}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="border-t pt-3 flex sm:justify-between items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" className="text-xs gap-1.5 font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Publish Course &amp; Roadmap
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
