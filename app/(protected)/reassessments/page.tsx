"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDemoStore } from "@/lib/demo/demo-store";
import { isDemoMode } from "@/lib/demo/config";
import { apiClient } from "@/lib/api/client";
import { ReviewReassessmentDialog } from "@/components/reassessments/review-reassessment-dialog";
import { AccessDenied } from "@/components/auth/access-denied";
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Loader2,
  TrendingUp,
} from "lucide-react";

export default function ReassessmentsPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role || "ADMIN";

  const demoStore = useDemoStore();
  const [realReassessments, setRealReassessments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(!isDemoMode());

  const [selectedReassessment, setSelectedReassessment] = useState<any | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");

  const loadRealData = useCallback(async () => {
    if (isDemoMode()) return;
    try {
      setIsLoading(true);
      const res = await apiClient.reassessments.list();
      setRealReassessments(res.data || []);
    } catch (err) {
      console.error("Failed to load real reassessments:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isDemoMode()) {
      loadRealData();
    }
  }, [loadRealData]);

  // Check role authorization
  if (role === "EMPLOYEE") {
    return (
      <AccessDenied
        requiredRole="MANAGER or ADMIN"
        currentRole="EMPLOYEE"
        resourceName="the Manager Reassessment & Level Verification portal"
      />
    );
  }

  const reassessments: any[] = isDemoMode()
    ? demoStore.reassessments
    : realReassessments;

  const filteredReassessments = reassessments.filter((r) => {
    if (filterStatus === "ALL") return true;
    if (filterStatus === "PENDING") return r.status === "PENDING_REASSESSMENT";
    if (filterStatus === "APPROVED") return r.status === "APPROVED";
    if (filterStatus === "REJECTED") return r.status === "REJECTED";
    return true;
  });

  const pendingCount = reassessments.filter((r) => r.status === "PENDING_REASSESSMENT").length;
  const approvedCount = reassessments.filter((r) => r.status === "APPROVED").length;

  function handleOpenReview(req: any) {
    setSelectedReassessment(req);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Competency Reassessments</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Manager verification portal to review post-course completion evidence and calibrate employee levels
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs h-8 px-2.5 shadow-2xs font-semibold">
            <Clock className="h-3.5 w-3.5 text-amber-500 mr-1.5" />
            {pendingCount} Pending Verification
          </Badge>
          <Badge variant="outline" className="text-xs h-8 px-2.5 shadow-2xs font-semibold">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 mr-1.5" />
            {approvedCount} Calibrated
          </Badge>
        </div>
      </div>

      {/* Directory Card */}
      <Card className="shadow-xs">
        <CardHeader className="pb-4 border-b border-border/60">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-base">Pending & Verified Reassessment Requests</CardTitle>
              <CardDescription className="text-xs">
                Showing {filteredReassessments.length} of {reassessments.length} requests
              </CardDescription>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Button
                size="sm"
                variant={filterStatus === "ALL" ? "default" : "outline"}
                className="h-7 text-xs shadow-2xs font-semibold"
                onClick={() => setFilterStatus("ALL")}
              >
                All ({reassessments.length})
              </Button>
              <Button
                size="sm"
                variant={filterStatus === "PENDING" ? "default" : "outline"}
                className="h-7 text-xs shadow-2xs font-semibold"
                onClick={() => setFilterStatus("PENDING")}
              >
                Pending ({pendingCount})
              </Button>
              <Button
                size="sm"
                variant={filterStatus === "APPROVED" ? "default" : "outline"}
                className="h-7 text-xs shadow-2xs font-semibold"
                onClick={() => setFilterStatus("APPROVED")}
              >
                Approved ({approvedCount})
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-xs text-muted-foreground gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" /> Loading reassessments...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Competency</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Previous Level</TableHead>
                  <TableHead>Target Level</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReassessments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-xs text-muted-foreground">
                      No reassessment requests found matching this filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReassessments.map((r) => {
                    const isPending = r.status === "PENDING_REASSESSMENT";
                    return (
                      <TableRow key={r.id}>
                        <TableCell>
                          <div className="font-semibold text-xs text-foreground">{r.employeeName}</div>
                          <div className="text-[11px] font-mono text-muted-foreground">{r.employeeCode}</div>
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-indigo-700 dark:text-indigo-400">{r.competencyName}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{r.courseTitle}</TableCell>
                        <TableCell><Badge variant="secondary" className="font-mono text-xs font-bold">L{r.previousLevel}</Badge></TableCell>
                        <TableCell><Badge variant="default" className="font-mono text-xs font-bold bg-indigo-600">L{r.requestedLevel}</Badge></TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              r.status === "APPROVED"
                                ? "success"
                                : r.status === "REJECTED"
                                ? "destructive"
                                : "warning"
                            }
                            className="text-[10px] font-semibold"
                          >
                            {r.status === "PENDING_REASSESSMENT" ? "Pending Review" : r.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {isPending ? (
                            <Button
                              size="sm"
                              className="h-7 text-xs gap-1.5 font-semibold shadow-xs"
                              onClick={() => handleOpenReview(r)}
                            >
                              <ShieldCheck className="h-3.5 w-3.5" />
                              Review
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1 font-semibold shadow-2xs"
                              onClick={() => handleOpenReview(r)}
                            >
                              Details
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ReviewReassessmentDialog
        reassessment={selectedReassessment}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        reviewerName={session?.user?.name || "Manager Reviewer"}
        onSuccess={loadRealData}
      />
    </div>
  );
}
