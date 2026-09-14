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
import { useDemoStore, type DemoEmployee } from "@/lib/demo/demo-store";
import { isDemoMode } from "@/lib/demo/config";
import { apiClient } from "@/lib/api/client";
import { CheckCircle2, AlertCircle, UserCog, Loader2 } from "lucide-react";

interface EditEmployeeDialogProps {
  employee: DemoEmployee | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditEmployeeDialog({ employee, open, onOpenChange, onSuccess }: EditEmployeeDialogProps) {
  const { updateEmployee } = useDemoStore();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (employee && open) {
      setName(employee.name || "");
      setEmail(employee.email || "");
      setErrors({});
      setFeedback(null);
      setSubmitting(false);
    }
  }, [employee, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!employee || submitting) return;
    setErrors({});
    setFeedback(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const newErrors: Record<string, string> = {};

    if (!trimmedName) {
      newErrors.name = "Full name is required";
    } else if (trimmedName.length < 2) {
      newErrors.name = "Full name must be at least 2 characters";
    }

    if (!trimmedEmail) {
      newErrors.email = "Work email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);

    try {
      if (isDemoMode()) {
        const result = updateEmployee(employee.id, { name: trimmedName, email: trimmedEmail });
        if (!result.success) {
          setFeedback({ type: "error", message: result.error || "Failed to update profile." });
          setSubmitting(false);
          return;
        }
      } else {
        await apiClient.employees.update(employee.id, { name: trimmedName, email: trimmedEmail });
      }

      setFeedback({ type: "success", message: `Profile for "${trimmedName}" updated successfully.` });
      setTimeout(() => {
        onOpenChange(false);
        setFeedback(null);
        setSubmitting(false);
        onSuccess?.();
      }, 800);
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to update profile." });
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!submitting) onOpenChange(val); }}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader className="border-b pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UserCog className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">Update Profile</DialogTitle>
                <DialogDescription className="text-xs">
                  {employee?.employeeCode} — modify full name and work email
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

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-emp-name" className="text-xs font-medium">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-emp-name"
                value={name}
                disabled={submitting}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Jane Doe"
                className="h-8 text-xs"
              />
              {errors.name && <p className="text-[11px] text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-emp-email" className="text-xs font-medium">
                Work Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-emp-email"
                type="email"
                value={email}
                disabled={submitting}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. jane.doe@acme.com"
                className="h-8 text-xs"
              />
              {errors.email && <p className="text-[11px] text-destructive">{errors.email}</p>}
            </div>
          </div>

          <DialogFooter className="border-t pt-3 flex sm:justify-between items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={submitting}
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={submitting} className="text-xs gap-1.5 font-semibold">
              {submitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
