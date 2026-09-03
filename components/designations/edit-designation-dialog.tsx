"use client";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useDemoStore } from "@/lib/demo/demo-store";
import { isDemoMode } from "@/lib/demo/config";
import { apiClient } from "@/lib/api/client";
import { CheckCircle2, AlertCircle, Pencil, Plus, Trash2 } from "lucide-react";

interface EditDesignationDialogProps {
  designation: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditDesignationDialog({ designation, open, onOpenChange, onSuccess }: EditDesignationDialogProps) {
  const { competencies, updateDesignation } = useDemoStore();
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [department, setDepartment] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState<{ competencyId: string; requiredLevel: number }[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (designation && open) {
      setTitle(designation.title);
      setCode(designation.code);
      setDepartment(designation.department || "Engineering");
      setDescription(designation.description || "");
      setRequirements((designation.requirements || []).map((r: any) => ({ competencyId: r.competencyId, requiredLevel: r.requiredLevel })));
      setErrors({});
      setFeedback(null);
    }
  }, [designation, open]);

  function addRequirement() {
    if (competencies.length === 0) return;
    const firstUnused = competencies.find((c) => !requirements.some((r) => r.competencyId === c.id));
    if (!firstUnused) return;
    setRequirements((prev) => [...prev, { competencyId: firstUnused.id, requiredLevel: 3 }]);
  }

  function removeRequirement(idx: number) {
    setRequirements((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateRequirement(idx: number, field: "competencyId" | "requiredLevel", value: string | number) {
    setRequirements((prev) => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!designation) return;
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = "Title is required";
    if (!code.trim()) newErrors.code = "Code is required";
    if (!department.trim()) newErrors.department = "Department is required";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    async function executeUpdate() {
      if (isDemoMode()) {
        const result = updateDesignation(designation.id, { title, code, department, description, requirements });
        if (!result.success) { setFeedback({ type: "error", message: result.error || "Failed" }); return; }
        setFeedback({ type: "success", message: `"${title}" updated successfully.` });
        setTimeout(() => { onOpenChange(false); setFeedback(null); onSuccess?.(); }, 1000);
      } else {
        try {
          await apiClient.designations.update(designation.id, {
            title,
            code,
            department,
            description,
            competencyRequirements: requirements,
          });
          setFeedback({ type: "success", message: `"${title}" updated successfully in PostgreSQL.` });
          setTimeout(() => { onOpenChange(false); setFeedback(null); onSuccess?.(); }, 1000);
        } catch (err: any) {
          setFeedback({ type: "error", message: err.message || "Failed to update designation" });
        }
      }
    }

    executeUpdate();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader className="border-b pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary"><Pencil className="h-4 w-4" /></div>
              <div><DialogTitle className="text-lg font-bold">Edit Designation</DialogTitle><DialogDescription className="text-xs">{designation?.code} — update role details and required competency levels</DialogDescription></div>
            </div>
          </DialogHeader>

          {feedback && (
            <div className={`flex items-center gap-2 rounded-lg p-3 text-xs ${feedback.type === "success" ? "bg-emerald-500/10 text-emerald-800 border border-emerald-300 dark:text-emerald-300" : "bg-destructive/10 text-destructive border border-destructive/20"}`}>
              {feedback.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> : <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />}
              <span>{feedback.message}</span>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <Label className="text-xs font-semibold">Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-8 text-xs mt-1" />
              {errors.title && <p className="text-[11px] text-destructive mt-0.5">{errors.title}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Code</Label>
                <Input value={code} onChange={(e) => setCode(e.target.value)} className="h-8 text-xs mt-1 font-mono uppercase" />
                {errors.code && <p className="text-[11px] text-destructive mt-0.5">{errors.code}</p>}
              </div>
              <div>
                <Label className="text-xs font-semibold">Department</Label>
                <Input value={department} onChange={(e) => setDepartment(e.target.value)} className="h-8 text-xs mt-1" />
                {errors.department && <p className="text-[11px] text-destructive mt-0.5">{errors.department}</p>}
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold">Description</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} className="h-8 text-xs mt-1" />
            </div>

            <div className="border-t pt-3 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Required Competencies ({requirements.length})</Label>
                <Button type="button" size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={addRequirement}>
                  <Plus className="h-3 w-3" />Add
                </Button>
              </div>

              {requirements.map((req, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 border">
                  <Select value={req.competencyId} onValueChange={(val) => updateRequirement(idx, "competencyId", val)}>
                    <SelectTrigger className="h-7 text-xs flex-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {competencies.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={String(req.requiredLevel)} onValueChange={(val) => updateRequirement(idx, "requiredLevel", parseInt(val))}>
                    <SelectTrigger className="h-7 text-xs w-20"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((lvl) => (
                        <SelectItem key={lvl} value={String(lvl)}>L{lvl}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => removeRequirement(idx)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="border-t pt-3 flex sm:justify-between gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs">Cancel</Button>
            <Button type="submit" size="sm" className="text-xs">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
