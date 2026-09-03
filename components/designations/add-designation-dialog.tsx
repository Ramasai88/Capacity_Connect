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
import { Briefcase, Plus, Trash2, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";

interface AddDesignationDialogProps {
  onSuccess?: () => void;
}

export function AddDesignationDialog({ onSuccess }: AddDesignationDialogProps = {}) {
  const { competencies, addDesignation } = useDemoStore();
  const [open, setOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [department, setDepartment] = useState("Engineering");
  const [description, setDescription] = useState("");

  // Competency requirements list
  const [requirements, setRequirements] = useState<
    { competencyId: string; requiredLevel: number }[]
  >([
    { competencyId: competencies[0]?.id || "comp-python", requiredLevel: 4 },
    { competencyId: competencies[1]?.id || "comp-java", requiredLevel: 3 },
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  function handleAddRequirement() {
    // Find first competency not yet added
    const unused = competencies.find((c) => !requirements.some((r) => r.competencyId === c.id));
    const compId = unused?.id || competencies[0]?.id || "";
    setRequirements([...requirements, { competencyId: compId, requiredLevel: 3 }]);
  }

  function handleRemoveRequirement(index: number) {
    setRequirements(requirements.filter((_, i) => i !== index));
  }

  function handleRequirementChange(index: number, competencyId: string, requiredLevel: number) {
    const updated = [...requirements];
    updated[index] = { competencyId, requiredLevel };
    setRequirements(updated);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setFeedback(null);

    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = "Designation Title is required";
    if (!code.trim()) newErrors.code = "Designation Code is required";
    if (!department.trim()) newErrors.department = "Department is required";
    if (requirements.length === 0)
      newErrors.requirements = "At least one required competency must be specified";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    async function executeCreate() {
      if (isDemoMode()) {
        const result = addDesignation({
          title,
          code,
          department,
          description,
          requirements,
        });

        if (!result.success) {
          setFeedback({ type: "error", message: result.error || "Failed to create designation" });
          return;
        }

        setFeedback({
          type: "success",
          message: `Role "${title}" created with ${requirements.length} competency requirements!`,
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
          await apiClient.designations.create({
            title,
            code,
            department,
            description,
            competencyRequirements: requirements,
          });

          setFeedback({
            type: "success",
            message: `Role "${title}" created in PostgreSQL with ${requirements.length} competency requirements!`,
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
          setFeedback({ type: "error", message: err.message || "Failed to create designation" });
        }
      }
    }

    executeCreate();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 bg-primary text-primary-foreground">
          <Briefcase className="h-4 w-4" />
          New Role
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader className="border-b pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Briefcase className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">Create Role / Designation</DialogTitle>
                <DialogDescription className="text-xs">
                  Define job requirements and baseline proficiency standards for capacity alignment
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
            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="desig-title" className="text-xs font-medium">
                Designation Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="desig-title"
                placeholder="e.g. Lead Cloud Solutions Architect"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-8 text-xs"
              />
              {errors.title && <p className="text-[11px] text-destructive">{errors.title}</p>}
            </div>

            {/* Code */}
            <div className="space-y-1.5">
              <Label htmlFor="desig-code" className="text-xs font-medium">
                Role Code <span className="text-destructive">*</span>
              </Label>
              <Input
                id="desig-code"
                placeholder="e.g. CSA"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="h-8 text-xs font-mono uppercase"
              />
              {errors.code && <p className="text-[11px] text-destructive">{errors.code}</p>}
            </div>

            {/* Department */}
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="desig-dept" className="text-xs font-medium">
                Department <span className="text-destructive">*</span>
              </Label>
              <Input
                id="desig-dept"
                placeholder="e.g. Cloud Engineering &amp; Operations"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="h-8 text-xs"
              />
              {errors.department && (
                <p className="text-[11px] text-destructive">{errors.department}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="desig-desc" className="text-xs font-medium">
                Role Summary
              </Label>
              <Textarea
                id="desig-desc"
                placeholder="Key organizational duties and technical expectations..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="text-xs"
              />
            </div>
          </div>

          {/* Interactive Competency Requirements Builder */}
          <div className="rounded-lg border bg-muted/20 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-foreground">
                  Required Competency Matrix Mapping
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Select competencies and target 1–5 level benchmarks required for this role
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddRequirement}
                className="h-7 text-xs gap-1"
              >
                <Plus className="h-3 w-3" />
                Add Competency
              </Button>
            </div>

            {errors.requirements && (
              <p className="text-[11px] text-destructive">{errors.requirements}</p>
            )}

            <div className="space-y-2">
              {requirements.map((req, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 rounded-lg border bg-background p-2.5 text-xs"
                >
                  <div className="flex-1 w-full sm:w-auto">
                    <Select
                      value={req.competencyId}
                      onValueChange={(compVal) =>
                        handleRequirementChange(idx, compVal, req.requiredLevel)
                      }
                    >
                      <SelectTrigger className="h-8 text-xs w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {competencies.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name} ({c.category})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground text-[11px]">Target:</span>
                      <Select
                        value={String(req.requiredLevel)}
                        onValueChange={(lvlVal) =>
                          handleRequirementChange(idx, req.competencyId, parseInt(lvlVal, 10))
                        }
                      >
                        <SelectTrigger className="h-8 w-28 text-xs font-mono font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Level 1</SelectItem>
                          <SelectItem value="2">Level 2</SelectItem>
                          <SelectItem value="3">Level 3</SelectItem>
                          <SelectItem value="4">Level 4</SelectItem>
                          <SelectItem value="5">Level 5</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveRequirement(idx)}
                      disabled={requirements.length <= 1}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
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
              Save &amp; Map Role
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
