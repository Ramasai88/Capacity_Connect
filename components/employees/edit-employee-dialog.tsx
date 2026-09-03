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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDemoStore, type DemoEmployee } from "@/lib/demo/demo-store";
import { isDemoMode } from "@/lib/demo/config";
import { apiClient } from "@/lib/api/client";
import { CheckCircle2, AlertCircle, UserCog } from "lucide-react";

interface EditEmployeeDialogProps {
  employee: DemoEmployee | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditEmployeeDialog({ employee, open, onOpenChange, onSuccess }: EditEmployeeDialogProps) {
  const { designations, updateEmployee } = useDemoStore();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [designationId, setDesignationId] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [joiningDate, setJoiningDate] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (employee && open) {
      setName(employee.name);
      setEmail(employee.email);
      setDepartment(employee.department);
      setDesignationId(employee.designationId);
      setStatus(employee.status);
      setJoiningDate(employee.joiningDate);
      setErrors({});
      setFeedback(null);
    }
  }, [employee, open]);

  function handleDesignationChange(desigId: string) {
    setDesignationId(desigId);
    const desig = designations.find((d) => d.id === desigId);
    if (desig) setDepartment(desig.department);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!employee) return;
    setErrors({});
    setFeedback(null);

    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Full name is required";
    if (!email.trim() || !email.includes("@")) newErrors.email = "A valid email is required";
    if (!designationId) newErrors.designationId = "Designation is required";

    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    async function executeUpdate() {
      if (isDemoMode()) {
        const result = updateEmployee(employee!.id, { name, email, department, designationId, status, joiningDate });

        if (!result.success) {
          setFeedback({ type: "error", message: result.error || "Failed to update employee" });
          return;
        }

        setFeedback({ type: "success", message: `"${name}" has been updated successfully.` });
        setTimeout(() => { onOpenChange(false); setFeedback(null); onSuccess?.(); }, 1000);
      } else {
        try {
          await apiClient.employees.update(employee!.id, { name, email, department, designationId, status });
          setFeedback({ type: "success", message: `"${name}" has been updated successfully.` });
          setTimeout(() => { onOpenChange(false); setFeedback(null); onSuccess?.(); }, 1000);
        } catch (err: any) {
          setFeedback({ type: "error", message: err.message || "Failed to update employee" });
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
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UserCog className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">Edit Employee</DialogTitle>
                <DialogDescription className="text-xs">
                  {employee?.employeeCode} — update profile and designation
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {feedback && (
            <div className={`flex items-center gap-2 rounded-lg p-3 text-xs ${feedback.type === "success" ? "bg-emerald-500/10 text-emerald-800 border border-emerald-300 dark:text-emerald-300" : "bg-destructive/10 text-destructive border border-destructive/20"}`}>
              {feedback.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> : <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />}
              <span>{feedback.message}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-emp-name" className="text-xs font-medium">Full Name <span className="text-destructive">*</span></Label>
              <Input id="edit-emp-name" value={name} onChange={(e) => setName(e.target.value)} className="h-8 text-xs" />
              {errors.name && <p className="text-[11px] text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-emp-email" className="text-xs font-medium">Work Email <span className="text-destructive">*</span></Label>
              <Input id="edit-emp-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-8 text-xs" />
              {errors.email && <p className="text-[11px] text-destructive">{errors.email}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-emp-desig" className="text-xs font-medium">Designation <span className="text-destructive">*</span></Label>
              <Select value={designationId} onValueChange={handleDesignationChange}>
                <SelectTrigger id="edit-emp-desig" className="h-8 text-xs"><SelectValue placeholder="Select designation" /></SelectTrigger>
                <SelectContent>{designations.map((d) => (<SelectItem key={d.id} value={d.id}>{d.title} ({d.department})</SelectItem>))}</SelectContent>
              </Select>
              {errors.designationId && <p className="text-[11px] text-destructive">{errors.designationId}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-emp-dept" className="text-xs font-medium">Department</Label>
              <Input id="edit-emp-dept" value={department} onChange={(e) => setDepartment(e.target.value)} className="h-8 text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-emp-status" className="text-xs font-medium">Status</Label>
              <Select value={status} onValueChange={(val: "ACTIVE" | "INACTIVE") => setStatus(val)}>
                <SelectTrigger id="edit-emp-status" className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="ACTIVE">ACTIVE</SelectItem><SelectItem value="INACTIVE">INACTIVE</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-emp-date" className="text-xs font-medium">Joining Date</Label>
              <Input id="edit-emp-date" type="date" value={joiningDate} onChange={(e) => setJoiningDate(e.target.value)} className="h-8 text-xs" />
            </div>
          </div>

          <DialogFooter className="border-t pt-3 flex sm:justify-between items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs">Cancel</Button>
            <Button type="submit" size="sm" className="text-xs gap-1.5 font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" />Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
