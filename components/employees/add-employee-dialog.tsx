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
import { UserPlus, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";

interface AddEmployeeDialogProps {
  onSuccess?: () => void;
}

export function AddEmployeeDialog({ onSuccess }: AddEmployeeDialogProps = {}) {
  const { designations, competencies, addEmployee } = useDemoStore();
  const [open, setOpen] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [employeeCode, setEmployeeCode] = useState("");
  const [department, setDepartment] = useState("");
  const [designationId, setDesignationId] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [assessments, setAssessments] = useState<Record<string, number>>({});

  // Error & Feedback State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  // Auto-generate employee code on open
  useEffect(() => {
    if (open) {
      const randomNum = Math.floor(100 + Math.random() * 900);
      setEmployeeCode(`EMP0${randomNum}`);
      if (designations.length > 0 && !designationId) {
        setDesignationId(designations[0]?.id || "");
        setDepartment(designations[0]?.department || "Engineering");
      }
    }
  }, [open, designations, designationId]);

  // When designation changes, update department and setup assessment inputs
  function handleDesignationChange(desigId: string) {
    setDesignationId(desigId);
    const desig = designations.find((d) => d.id === desigId);
    if (desig) {
      setDepartment(desig.department);
      // Initialize assessments for required competencies to baseline level 2
      const initialMap: Record<string, number> = {};
      for (const req of desig.requirements) {
        initialMap[req.competencyId] = Math.max(1, req.requiredLevel - 1);
      }
      setAssessments(initialMap);
    }
  }

  function handleAssessmentChange(competencyId: string, level: number) {
    setAssessments((prev) => ({
      ...prev,
      [competencyId]: level,
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setFeedback(null);

    // Validation
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Full Name is required";
    if (!email.trim() || !email.includes("@"))
      newErrors.email = "A valid organizational email is required";
    if (!employeeCode.trim()) newErrors.employeeCode = "Employee Code is required";
    if (!designationId) newErrors.designationId = "Please select a designation";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const initialAssessments = Object.entries(assessments).map(([competencyId, currentLevel]) => ({
      competencyId,
      currentLevel,
    }));

    async function executeAdd() {
      if (isDemoMode()) {
        const result = addEmployee({
          name,
          email,
          employeeCode,
          department,
          designationId,
          status,
          initialAssessments,
        });

        if (!result.success) {
          setFeedback({ type: "error", message: result.error || "Failed to add employee" });
          return;
        }

        setFeedback({
          type: "success",
          message: `Employee "${name}" (${employeeCode}) added successfully!`,
        });

        setTimeout(() => {
          setName("");
          setEmail("");
          setErrors({});
          setFeedback(null);
          setOpen(false);
          onSuccess?.();
        }, 1200);
      } else {
        try {
          await apiClient.employees.create({
            name,
            email,
            employeeCode,
            department,
            designationId,
            status,
            initialAssessments,
          });

          setFeedback({
            type: "success",
            message: `Employee "${name}" (${employeeCode}) created successfully!`,
          });

          setTimeout(() => {
            setName("");
            setEmail("");
            setErrors({});
            setFeedback(null);
            setOpen(false);
            onSuccess?.();
          }, 1200);
        } catch (err: any) {
          setFeedback({ type: "error", message: err.message || "Failed to create employee" });
        }
      }
    }

    executeAdd();
  }

  const selectedDesignation = designations.find((d) => d.id === designationId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 bg-primary text-primary-foreground">
          <UserPlus className="h-4 w-4" />
          Add Employee
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader className="border-b pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UserPlus className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">Add New Employee</DialogTitle>
                <DialogDescription className="text-xs">
                  Create an employee profile and record initial baseline competencies
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
            {/* Full Name */}
            <div className="space-y-1.5">
              <Label htmlFor="emp-name" className="text-xs font-medium">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="emp-name"
                placeholder="e.g. Ramesh Chandra"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-8 text-xs"
              />
              {errors.name && <p className="text-[11px] text-destructive">{errors.name}</p>}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="emp-email" className="text-xs font-medium">
                Work Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="emp-email"
                type="email"
                placeholder="e.g. ramesh.c@capacityconnect.demo"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-8 text-xs"
              />
              {errors.email && <p className="text-[11px] text-destructive">{errors.email}</p>}
            </div>

            {/* Employee Code */}
            <div className="space-y-1.5">
              <Label htmlFor="emp-code" className="text-xs font-medium">
                Employee Code <span className="text-destructive">*</span>
              </Label>
              <Input
                id="emp-code"
                placeholder="e.g. EMP006"
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value)}
                className="h-8 text-xs font-mono uppercase"
              />
              {errors.employeeCode && (
                <p className="text-[11px] text-destructive">{errors.employeeCode}</p>
              )}
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <Label htmlFor="emp-status" className="text-xs font-medium">
                Status
              </Label>
              <Select
                value={status}
                onValueChange={(val: "ACTIVE" | "INACTIVE") => setStatus(val)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                  <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Designation */}
            <div className="space-y-1.5">
              <Label htmlFor="emp-desig" className="text-xs font-medium">
                Designation / Role <span className="text-destructive">*</span>
              </Label>
              <Select value={designationId} onValueChange={handleDesignationChange}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select designation" />
                </SelectTrigger>
                <SelectContent>
                  {designations.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.title} ({d.department})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.designationId && (
                <p className="text-[11px] text-destructive">{errors.designationId}</p>
              )}
            </div>

            {/* Department */}
            <div className="space-y-1.5">
              <Label htmlFor="emp-dept" className="text-xs font-medium">
                Department
              </Label>
              <Input
                id="emp-dept"
                placeholder="e.g. Engineering"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* Initial Competency Assessments for the chosen role */}
          {selectedDesignation && selectedDesignation.requirements.length > 0 && (
            <div className="rounded-lg border bg-muted/20 p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">
                  Initial Baseline Assessment (1–5 Proficiency Scale)
                </span>
                <Badge variant="outline" className="text-[10px] gap-1">
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  Role Requirements
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Set employee&apos;s verified current level for each requirement of{" "}
                <strong>{selectedDesignation.title}</strong>:
              </p>


              <div className="space-y-2">
                {selectedDesignation.requirements.map((req) => {
                  const comp = competencies.find((c) => c.id === req.competencyId);
                  const currentAssessed = assessments[req.competencyId] ?? 1;

                  return (
                    <div
                      key={req.competencyId}
                      className="flex items-center justify-between rounded border bg-background p-2 text-xs"
                    >
                      <div>
                        <div className="font-semibold text-foreground">
                          {comp?.name ?? req.competencyId}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          Required for role: Level {req.requiredLevel}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Assessed:</span>
                        <Select
                          value={String(currentAssessed)}
                          onValueChange={(val) =>
                            handleAssessmentChange(req.competencyId, parseInt(val, 10))
                          }
                        >
                          <SelectTrigger className="h-7 w-28 text-xs">
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
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
              Save &amp; Add Employee
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
