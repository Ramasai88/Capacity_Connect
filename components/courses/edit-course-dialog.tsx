"use client";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDemoStore } from "@/lib/demo/demo-store";
import { isDemoMode } from "@/lib/demo/config";
import { apiClient } from "@/lib/api/client";
import { CheckCircle2, AlertCircle, Pencil } from "lucide-react";

interface EditCourseDialogProps {
  course: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditCourseDialog({ course, open, onOpenChange, onSuccess }: EditCourseDialogProps) {
  const { updateCourse } = useDemoStore();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [durationHours, setDurationHours] = useState(10);
  const [targetLevel, setTargetLevel] = useState(3);
  const [status, setStatus] = useState<"PUBLISHED" | "DRAFT">("PUBLISHED");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (course && open) {
      setTitle(course.title);
      setDescription(course.description || "");
      setCategory(course.category || "Technical / Programming");
      setDurationHours(course.durationHours || 10);
      setTargetLevel(course.targetLevel || 3);
      setStatus(course.status || "PUBLISHED");
      setErrors({});
      setFeedback(null);
    }
  }, [course, open]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!course) return;
    if (!title.trim()) { setErrors({ title: "Title is required" }); return; }

    async function executeUpdate() {
      if (isDemoMode()) {
        const result = updateCourse(course.id, { title, description, category, durationHours, targetLevel, status });
        if (!result.success) { setFeedback({ type: "error", message: result.error || "Failed" }); return; }
        setFeedback({ type: "success", message: `"${title}" updated successfully.` });
        setTimeout(() => { onOpenChange(false); setFeedback(null); onSuccess?.(); }, 1000);
      } else {
        try {
          await apiClient.courses.update(course.id, { title, description, category, durationHours, targetLevel, status });
          setFeedback({ type: "success", message: `"${title}" updated successfully in PostgreSQL.` });
          setTimeout(() => { onOpenChange(false); setFeedback(null); onSuccess?.(); }, 1000);
        } catch (err: any) {
          setFeedback({ type: "error", message: err.message || "Failed to update course" });
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
              <div><DialogTitle className="text-lg font-bold">Edit Course</DialogTitle><DialogDescription className="text-xs">{course?.code}</DialogDescription></div>
            </div>
          </DialogHeader>
          {feedback && (
            <div className={`flex items-center gap-2 rounded-lg p-3 text-xs ${feedback.type === "success" ? "bg-emerald-500/10 text-emerald-800 border border-emerald-300" : "bg-destructive/10 text-destructive border border-destructive/20"}`}>
              {feedback.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
              <span>{feedback.message}</span>
            </div>
          )}
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-semibold">Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-8 text-xs mt-1" />
              {errors.title && <p className="text-[11px] text-destructive mt-0.5">{errors.title}</p>}
            </div>
            <div>
              <Label className="text-xs font-semibold">Description</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} className="h-8 text-xs mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Duration (hours)</Label>
                <Input type="number" min={1} value={durationHours} onChange={(e) => setDurationHours(parseInt(e.target.value) || 1)} className="h-8 text-xs mt-1" />
              </div>
              <div>
                <Label className="text-xs font-semibold">Target Level</Label>
                <Select value={String(targetLevel)} onValueChange={(val) => setTargetLevel(parseInt(val))}>
                  <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <SelectItem key={lvl} value={String(lvl)}>Level {lvl}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold">Status</Label>
              <Select value={status} onValueChange={(val: "PUBLISHED" | "DRAFT") => setStatus(val)}>
                <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUBLISHED">Published</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                </SelectContent>
              </Select>
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
