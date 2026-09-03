"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDemoStore } from "@/lib/demo/demo-store";
import { isDemoMode } from "@/lib/demo/config";
import { apiClient } from "@/lib/api/client";
import { Trash2, AlertTriangle, CheckCircle2, AlertCircle } from "lucide-react";

interface DeleteCompetencyDialogProps {
  competency: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DeleteCompetencyDialog({ competency, open, onOpenChange, onSuccess }: DeleteCompetencyDialogProps) {
  const { deleteCompetency } = useDemoStore();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  async function handleDelete() {
    if (!competency) return;
    setFeedback(null);

    if (isDemoMode()) {
      const result = deleteCompetency(competency.id);
      if (!result.success) {
        setFeedback({ type: "error", message: result.error || "Cannot delete competency" });
        return;
      }
      setFeedback({ type: "success", message: `"${competency.name}" has been removed.` });
      setTimeout(() => { onOpenChange(false); setFeedback(null); onSuccess?.(); }, 1200);
    } else {
      try {
        await apiClient.competencies.delete(competency.id);
        setFeedback({ type: "success", message: `"${competency.name}" has been removed from PostgreSQL.` });
        setTimeout(() => { onOpenChange(false); setFeedback(null); onSuccess?.(); }, 1200);
      } catch (err: any) {
        setFeedback({ type: "error", message: err.message || "Failed to delete competency" });
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="border-b pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/10 text-destructive"><Trash2 className="h-4 w-4" /></div>
            <div><DialogTitle className="text-lg font-bold text-destructive">Delete Competency</DialogTitle><DialogDescription className="text-xs">This action cannot be undone.</DialogDescription></div>
          </div>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="rounded-lg border bg-muted/40 p-3 text-sm">
            <div className="font-semibold text-foreground">{competency?.name}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{competency?.code} — {competency?.category}</div>
          </div>
          <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-500/5 p-3 text-xs text-amber-900 dark:border-amber-900/50 dark:text-amber-300">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
            <span>Deletion is blocked if this competency is referenced by any designation, employee assessment, or course.</span>
          </div>
          {feedback && (
            <div className={`flex items-center gap-2 rounded-lg p-3 text-xs ${feedback.type === "success" ? "bg-emerald-500/10 text-emerald-800 border border-emerald-300" : "bg-destructive/10 text-destructive border border-destructive/20"}`}>
              {feedback.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
              <span>{feedback.message}</span>
            </div>
          )}
        </div>
        <DialogFooter className="border-t pt-3 flex sm:justify-between gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs">Cancel</Button>
          <Button type="button" variant="destructive" size="sm" onClick={handleDelete} className="text-xs gap-1.5">
            <Trash2 className="h-3.5 w-3.5" />Delete Competency
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
