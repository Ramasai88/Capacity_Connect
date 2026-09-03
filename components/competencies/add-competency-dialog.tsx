"use client";

import { useState } from "react";
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
import { Plus, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";

interface AddCompetencyDialogProps {
  onSuccess?: () => void;
}

export function AddCompetencyDialog({ onSuccess }: AddCompetencyDialogProps = {}) {
  const { addCompetency } = useDemoStore();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [category, setCategory] = useState<
    "Technical / Programming" | "Data & AI" | "Soft Skills" | "Management"
  >("Technical / Programming");
  const [description, setDescription] = useState("");

  // Level definitions (1-5)
  const [l1Desc, setL1Desc] = useState(
    "Basic conceptual understanding, requires guidance and supervision."
  );
  const [l2Desc, setL2Desc] = useState(
    "Practical working knowledge, executes routine tasks independently."
  );
  const [l3Desc, setL3Desc] = useState(
    "Competent independent contributor, solves problems and implements standard patterns."
  );
  const [l4Desc, setL4Desc] = useState(
    "Deep technical expertise, handles complex challenges, mentors others."
  );
  const [l5Desc, setL5Desc] = useState(
    "Subject matter authority, drives organization-wide strategy and architecture."
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setFeedback(null);

    const trimmedName = name.trim();
    const trimmedCode = code.trim().toUpperCase();
    const trimmedCategory = category.trim();
    const trimmedDescription = description.trim();
    const trimmedL1 = l1Desc.trim();
    const trimmedL2 = l2Desc.trim();
    const trimmedL3 = l3Desc.trim();
    const trimmedL4 = l4Desc.trim();
    const trimmedL5 = l5Desc.trim();

    const newErrors: Record<string, string> = {};
    if (!trimmedName) {
      newErrors.name = "Competency name is required (minimum 2 characters)";
    } else if (trimmedName.length < 2) {
      newErrors.name = "Competency name must be at least 2 characters";
    }

    if (!trimmedCode) {
      newErrors.code = "Competency code is required (e.g. GCP-DB-01)";
    } else if (!/^[A-Za-z0-9-_]+$/.test(trimmedCode)) {
      newErrors.code = "Code can only contain letters, numbers, hyphens, and underscores";
    }

    if (!trimmedCategory) {
      newErrors.category = "Domain category is required";
    }

    if (!trimmedDescription) {
      newErrors.description = "Description & core scope is required";
    }

    if (!trimmedL1) newErrors.l1 = "Level 1 proficiency definition is required";
    if (!trimmedL2) newErrors.l2 = "Level 2 proficiency definition is required";
    if (!trimmedL3) newErrors.l3 = "Level 3 proficiency definition is required";
    if (!trimmedL4) newErrors.l4 = "Level 4 proficiency definition is required";
    if (!trimmedL5) newErrors.l5 = "Level 5 proficiency definition is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Auto-focus first invalid input
      const firstKey = Object.keys(newErrors)[0];
      const targetId =
        firstKey === "name"
          ? "comp-name"
          : firstKey === "code"
          ? "comp-code"
          : firstKey === "description"
          ? "comp-desc"
          : firstKey === "category"
          ? "comp-category"
          : `comp-level-${firstKey}`;
      document.getElementById(targetId)?.focus();
      return;
    }

    const levels = [
      {
        level: 1,
        label: "Beginner / Foundational",
        description: trimmedL1,
        behavioralIndicators: ["Understands core terminology", "Executes with supervision"],
      },
      {
        level: 2,
        label: "Intermediate / Working",
        description: trimmedL2,
        behavioralIndicators: ["Solves standard workflows", "Works with limited supervision"],
      },
      {
        level: 3,
        label: "Proficient / Practitioner",
        description: trimmedL3,
        behavioralIndicators: ["Independent contributor", "Applies best-practice standards"],
      },
      {
        level: 4,
        label: "Advanced / Specialist",
        description: trimmedL4,
        behavioralIndicators: ["Architects complex subsystems", "Mentors junior engineers"],
      },
      {
        level: 5,
        label: "Expert / Master",
        description: trimmedL5,
        behavioralIndicators: ["Drives strategy and standards", "Industry thought leader"],
      },
    ];

    async function executeCreate() {
      setIsSubmitting(true);
      if (isDemoMode()) {
        const result = addCompetency({
          name: trimmedName,
          code: trimmedCode,
          category: trimmedCategory as "Technical / Programming" | "Data & AI" | "Soft Skills" | "Management",
          description: trimmedDescription,
          levels,
        });

        setIsSubmitting(false);
        if (!result.success) {
          setFeedback({ type: "error", message: result.error || "Failed to create competency" });
          return;
        }

        setFeedback({
          type: "success",
          message: `Competency "${trimmedName}" created successfully and added to universal rubric!`,
        });

        setTimeout(() => {
          setName("");
          setCode("");
          setDescription("");
          setErrors({});
          setFeedback(null);
          setOpen(false);
          onSuccess?.();
        }, 1000);
      } else {
        try {
          await apiClient.competencies.create({
            name: trimmedName,
            code: trimmedCode,
            category: trimmedCategory,
            description: trimmedDescription,
            levels: levels.map((l) => ({
              level: l.level,
              label: l.label,
              name: l.label,
              description: l.description,
              behavioralIndicators: l.behavioralIndicators,
            })),
          });

          setIsSubmitting(false);
          setFeedback({
            type: "success",
            message: `Competency "${trimmedName}" created successfully and saved to PostgreSQL!`,
          });

          setTimeout(() => {
            setName("");
            setCode("");
            setDescription("");
            setErrors({});
            setFeedback(null);
            setOpen(false);
            onSuccess?.();
          }, 1000);
        } catch (err: any) {
          setIsSubmitting(false);
          // Map backend validation issues to field errors if available
          if (err.details && Array.isArray(err.details)) {
            const backendErrors: Record<string, string> = {};
            for (const issue of err.details) {
              const path = issue.path?.join(".") || "";
              if (path.includes("name")) backendErrors.name = issue.message;
              else if (path.includes("code")) backendErrors.code = issue.message;
              else if (path.includes("category")) backendErrors.category = issue.message;
              else if (path.includes("description")) backendErrors.description = issue.message;
              else if (path.includes("levels.0") || path.includes("levels[0]")) backendErrors.l1 = issue.message;
              else if (path.includes("levels.1") || path.includes("levels[1]")) backendErrors.l2 = issue.message;
              else if (path.includes("levels.2") || path.includes("levels[2]")) backendErrors.l3 = issue.message;
              else if (path.includes("levels.3") || path.includes("levels[3]")) backendErrors.l4 = issue.message;
              else if (path.includes("levels.4") || path.includes("levels[4]")) backendErrors.l5 = issue.message;
            }
            if (Object.keys(backendErrors).length > 0) {
              setErrors(backendErrors);
            }
          }
          setFeedback({ type: "error", message: err.message || "Failed to create competency" });
        }
      }
    }

    executeCreate();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 bg-primary text-primary-foreground">
          <Plus className="h-4 w-4" />
          New Competency
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader className="border-b pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">Define New Competency</DialogTitle>
                <DialogDescription className="text-xs">
                  Create a standardized 1–5 proficiency rubric for organizational capacity building
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="comp-name" className="text-xs font-medium">
                Competency Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="comp-name"
                placeholder="e.g. Cloud Architecture (AWS / GCP)"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
                }}
                className={`h-8 text-xs ${errors.name ? "border-destructive focus-visible:ring-destructive" : ""}`}
              />
              {errors.name && <p className="text-[11px] font-medium text-destructive">{errors.name}</p>}
            </div>

            {/* Code */}
            <div className="space-y-1.5">
              <Label htmlFor="comp-code" className="text-xs font-medium">
                Competency Code <span className="text-destructive">*</span>
              </Label>
              <Input
                id="comp-code"
                placeholder="e.g. TECH-CLD-08"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  if (errors.code) setErrors((prev) => ({ ...prev, code: "" }));
                }}
                className={`h-8 text-xs font-mono uppercase ${errors.code ? "border-destructive focus-visible:ring-destructive" : ""}`}
              />
              {errors.code && <p className="text-[11px] font-medium text-destructive">{errors.code}</p>}
            </div>

            {/* Category */}
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="comp-category" className="text-xs font-medium">
                Domain Category <span className="text-destructive">*</span>
              </Label>
              <Select
                value={category}
                onValueChange={(val: typeof category) => {
                  setCategory(val);
                  if (errors.category) setErrors((prev) => ({ ...prev, category: "" }));
                }}
              >
                <SelectTrigger id="comp-category" className={`h-8 text-xs ${errors.category ? "border-destructive" : ""}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Technical / Programming">Technical / Programming</SelectItem>
                  <SelectItem value="Data & AI">Data &amp; AI</SelectItem>
                  <SelectItem value="Soft Skills">Soft Skills</SelectItem>
                  <SelectItem value="Management">Management</SelectItem>
                </SelectContent>
              </Select>
              {errors.category && <p className="text-[11px] font-medium text-destructive">{errors.category}</p>}
            </div>

            {/* Description */}
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="comp-desc" className="text-xs font-medium">
                Description &amp; Core Scope <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="comp-desc"
                placeholder="Describe what this competency encompasses across software engineering or business domains..."
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (errors.description) setErrors((prev) => ({ ...prev, description: "" }));
                }}
                rows={2}
                className={`text-xs ${errors.description ? "border-destructive focus-visible:ring-destructive" : ""}`}
              />
              {errors.description && (
                <p className="text-[11px] font-medium text-destructive">{errors.description}</p>
              )}
            </div>
          </div>

          {/* Universal 1-5 Level Rubric Definitions */}
          <div className="rounded-lg border bg-muted/20 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">
                Universal 1–5 Proficiency Scale Definitions
              </span>
              <span className="text-[11px] text-muted-foreground">Required Rubric Standards</span>
            </div>

            <div className="space-y-2.5 text-xs">
              {/* Level 1 */}
              <div className="space-y-1">
                <Label htmlFor="comp-level-l1" className="text-[11px] font-semibold text-foreground">
                  Level 1 — Beginner / Foundational <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="comp-level-l1"
                  value={l1Desc}
                  onChange={(e) => {
                    setL1Desc(e.target.value);
                    if (errors.l1) setErrors((prev) => ({ ...prev, l1: "" }));
                  }}
                  className={`h-7 text-xs ${errors.l1 ? "border-destructive focus-visible:ring-destructive" : ""}`}
                />
                {errors.l1 && <p className="text-[11px] font-medium text-destructive">{errors.l1}</p>}
              </div>

              {/* Level 2 */}
              <div className="space-y-1">
                <Label htmlFor="comp-level-l2" className="text-[11px] font-semibold text-foreground">
                  Level 2 — Intermediate / Working <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="comp-level-l2"
                  value={l2Desc}
                  onChange={(e) => {
                    setL2Desc(e.target.value);
                    if (errors.l2) setErrors((prev) => ({ ...prev, l2: "" }));
                  }}
                  className={`h-7 text-xs ${errors.l2 ? "border-destructive focus-visible:ring-destructive" : ""}`}
                />
                {errors.l2 && <p className="text-[11px] font-medium text-destructive">{errors.l2}</p>}
              </div>

              {/* Level 3 */}
              <div className="space-y-1">
                <Label htmlFor="comp-level-l3" className="text-[11px] font-semibold text-foreground">
                  Level 3 — Proficient / Practitioner <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="comp-level-l3"
                  value={l3Desc}
                  onChange={(e) => {
                    setL3Desc(e.target.value);
                    if (errors.l3) setErrors((prev) => ({ ...prev, l3: "" }));
                  }}
                  className={`h-7 text-xs ${errors.l3 ? "border-destructive focus-visible:ring-destructive" : ""}`}
                />
                {errors.l3 && <p className="text-[11px] font-medium text-destructive">{errors.l3}</p>}
              </div>

              {/* Level 4 */}
              <div className="space-y-1">
                <Label htmlFor="comp-level-l4" className="text-[11px] font-semibold text-foreground">
                  Level 4 — Advanced / Specialist <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="comp-level-l4"
                  value={l4Desc}
                  onChange={(e) => {
                    setL4Desc(e.target.value);
                    if (errors.l4) setErrors((prev) => ({ ...prev, l4: "" }));
                  }}
                  className={`h-7 text-xs ${errors.l4 ? "border-destructive focus-visible:ring-destructive" : ""}`}
                />
                {errors.l4 && <p className="text-[11px] font-medium text-destructive">{errors.l4}</p>}
              </div>

              {/* Level 5 */}
              <div className="space-y-1">
                <Label htmlFor="comp-level-l5" className="text-[11px] font-semibold text-foreground">
                  Level 5 — Expert / Master <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="comp-level-l5"
                  value={l5Desc}
                  onChange={(e) => {
                    setL5Desc(e.target.value);
                    if (errors.l5) setErrors((prev) => ({ ...prev, l5: "" }));
                  }}
                  className={`h-7 text-xs ${errors.l5 ? "border-destructive focus-visible:ring-destructive" : ""}`}
                />
                {errors.l5 && <p className="text-[11px] font-medium text-destructive">{errors.l5}</p>}
              </div>
            </div>
          </div>

          <DialogFooter className="border-t pt-3 flex sm:justify-between items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              className="text-xs"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" className="text-xs gap-1.5 font-semibold" disabled={isSubmitting}>
              <CheckCircle2 className="h-3.5 w-3.5" />
              {isSubmitting ? "Creating..." : "Save & Publish Competency"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
