"use client";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDemoStore, type DemoCompetency } from "@/lib/demo/demo-store";
import { isDemoMode } from "@/lib/demo/config";
import { apiClient } from "@/lib/api/client";
import { CheckCircle2, AlertCircle, Pencil } from "lucide-react";

type CompetencyCategory = "Technical / Programming" | "Data & AI" | "Soft Skills" | "Management";

interface EditCompetencyDialogProps {
  competency: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditCompetencyDialog({ competency, open, onOpenChange, onSuccess }: EditCompetencyDialogProps) {
  const { updateCompetency } = useDemoStore();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [category, setCategory] = useState<CompetencyCategory>("Technical / Programming");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (competency && open) {
      setName(competency.name);
      setCode(competency.code);
      setCategory(competency.category as CompetencyCategory);
      setDescription(competency.description);
      setErrors({});
      setFeedback(null);
    }
  }, [competency, open]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!competency) return;
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Name is required";
    if (!code.trim()) newErrors.code = "Code is required";
    if (!description.trim()) newErrors.description = "Description is required";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    async function executeUpdate() {
      if (isDemoMode()) {
        const result = updateCompetency(competency.id, { name, code, category, description });
        if (!result.success) { setFeedback({ type: "error", message: result.error || "Failed" }); return; }
        setFeedback({ type: "success", message: `"${name}" updated successfully.` });
        setTimeout(() => { onOpenChange(false); setFeedback(null); onSuccess?.(); }, 1000);
      } else {
        try {
          await apiClient.competencies.update(competency.id, { name, code, category, description });
          setFeedback({ type: "success", message: `"${name}" updated successfully in PostgreSQL.` });
          setTimeout(() => { onOpenChange(false); setFeedback(null); onSuccess?.(); }, 1000);
        } catch (err: any) {
          setFeedback({ type: "error", message: err.message || "Failed to update competency" });
        }
      }
    }

    executeUpdate();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader className="border-b pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary"><Pencil className="h-4 w-4" /></div>
              <div><DialogTitle className="text-lg font-bold">Edit Competency</DialogTitle><DialogDescription className="text-xs">{competency?.code} — update competency title, code, or description</DialogDescription></div>
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
              <Label className="text-xs font-semibold">Competency Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8 text-xs mt-1" />
              {errors.name && <p className="text-[11px] text-destructive mt-0.5">{errors.name}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Code</Label>
                <Input value={code} onChange={(e) => setCode(e.target.value)} className="h-8 text-xs mt-1 font-mono uppercase" />
                {errors.code && <p className="text-[11px] text-destructive mt-0.5">{errors.code}</p>}
              </div>
              <div>
                <Label className="text-xs font-semibold">Category</Label>
                <Select value={category} onValueChange={(val: CompetencyCategory) => setCategory(val)}>
                  <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Technical / Programming">Technical / Programming</SelectItem>
                    <SelectItem value="Data & AI">Data & AI</SelectItem>
                    <SelectItem value="Soft Skills">Soft Skills</SelectItem>
                    <SelectItem value="Management">Management</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold">Description</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} className="h-8 text-xs mt-1" />
              {errors.description && <p className="text-[11px] text-destructive mt-0.5">{errors.description}</p>}
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
