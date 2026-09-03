"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useDemoStore } from "@/lib/demo/demo-store";
import { isDemoMode } from "@/lib/demo/config";
import { apiClient } from "@/lib/api/client";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Award,
  AlertCircle,
  Sparkles,
} from "lucide-react";

export interface ReviewReassessmentDialogProps {
  reassessment: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reviewerName?: string;
  onSuccess?: () => void;
}

export function ReviewReassessmentDialog({
  reassessment,
  open,
  onOpenChange,
  reviewerName = "Sarah Jenkins",
  onSuccess,
}: ReviewReassessmentDialogProps) {
  const { reviewReassessment } = useDemoStore();
  const [comments, setComments] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  if (!reassessment) return null;

  async function handleAction(decision: "APPROVE" | "REJECT") {
    setFeedback(null);
    if (!reassessment) return;

    if (isDemoMode()) {
      const res = reviewReassessment(reassessment.id, decision, reviewerName, comments);
      if (!res.success) {
        setFeedback({ type: "error", message: res.message });
        return;
      }

      setFeedback({
        type: "success",
        message: res.message,
      });

      setTimeout(() => {
        setFeedback(null);
        setComments("");
        onOpenChange(false);
        onSuccess?.();
      }, 1500);
    } else {
      try {
        const res = await apiClient.reassessments.review(reassessment.id, {
          status: decision === "APPROVE" ? "APPROVED" : "REJECTED",
          reviewerComments: comments,
        });

        setFeedback({
          type: "success",
          message: `Reassessment ${decision.toLowerCase()}d successfully in PostgreSQL. Employee competency updated.`,
        });

        setTimeout(() => {
          setFeedback(null);
          setComments("");
          onOpenChange(false);
          onSuccess?.();
        }, 1500);
      } catch (err: any) {
        setFeedback({ type: "error", message: err.message || "Failed to review reassessment" });
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader className="border-b pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">Review Level Reassessment</DialogTitle>
              <DialogDescription className="text-xs">
                Verify curriculum completion evidence and calibrate employee baseline competency
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
            <span className="font-medium">{feedback.message}</span>
          </div>
        )}

        <div className="space-y-4 text-xs py-1">
          <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/40 border">
            <div>
              <span className="text-[11px] text-muted-foreground block">Employee Candidate</span>
              <span className="font-semibold text-foreground text-sm block mt-0.5">
                {reassessment.employeeName}
              </span>
              <span className="text-[11px] text-muted-foreground font-mono">
                {reassessment.employeeCode}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block">Target Competency</span>
              <span className="font-semibold text-foreground text-sm block mt-0.5">
                {reassessment.competencyName}
              </span>
              <span className="text-[11px] text-muted-foreground">
                Course: {reassessment.courseTitle}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
            <div className="flex items-center gap-3">
              <div className="text-center">
                <span className="text-[10px] text-muted-foreground block uppercase font-semibold">
                  Previous
                </span>
                <Badge variant="secondary" className="font-mono text-xs mt-0.5">
                  L{reassessment.previousLevel}
                </Badge>
              </div>
              <TrendingUp className="h-4 w-4 text-primary" />
              <div className="text-center">
                <span className="text-[10px] text-muted-foreground block uppercase font-semibold">
                  Requested
                </span>
                <Badge variant="default" className="font-mono text-xs mt-0.5">
                  L{reassessment.requestedLevel}
                </Badge>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-muted-foreground block">Submitted</span>
              <span className="font-medium text-foreground">
                {reassessment.submittedAt ? reassessment.submittedAt.split("T")[0] : "Recent"}
              </span>
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold">Reviewer Observations & Notes</Label>
            <Textarea
              placeholder="Enter assessment verification remarks (e.g., confirmed practical exercise completion)..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="text-xs mt-1 h-20"
            />
          </div>
        </div>

        <DialogFooter className="border-t pt-3 flex sm:justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Cancel
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="text-xs gap-1"
              onClick={() => handleAction("REJECT")}
            >
              <XCircle className="h-3.5 w-3.5" />
              Reject Reassessment
            </Button>
            <Button
              type="button"
              size="sm"
              className="text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => handleAction("APPROVE")}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Approve & Update Level
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
