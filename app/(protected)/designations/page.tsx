"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDemoStore } from "@/lib/demo/demo-store";
import { isDemoMode } from "@/lib/demo/config";
import { apiClient } from "@/lib/api/client";
import { AddDesignationDialog } from "@/components/designations/add-designation-dialog";
import { EditDesignationDialog } from "@/components/designations/edit-designation-dialog";
import { DeleteDesignationDialog } from "@/components/designations/delete-designation-dialog";
import { AccessDenied } from "@/components/auth/access-denied";
import { exportDesignationsCSV } from "@/lib/export/csv-export";
import { exportDesignationsMatrixPDF } from "@/lib/export/pdf-export";
import { Briefcase, Eye, Download, FileText, Pencil, Trash2, Loader2, Grid } from "lucide-react";

export default function DesignationsPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role || "ADMIN";
  const demoStore = useDemoStore();

  const [realDesignations, setRealDesignations] = useState<any[]>([]);
  const [realCompetencies, setRealCompetencies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(!isDemoMode());
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const loadRealData = useCallback(async () => {
    if (isDemoMode()) return;
    try {
      setIsLoading(true);
      const [desigRes, compRes] = await Promise.all([
        apiClient.designations.list(),
        apiClient.competencies.list(),
      ]);
      setRealDesignations(desigRes.data || []);
      setRealCompetencies(compRes.data || []);
    } catch (err) {
      console.error("Failed to load real designations:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isDemoMode()) {
      loadRealData();
    }
  }, [loadRealData]);

  if (role === "EMPLOYEE") {
    return <AccessDenied requiredRole="MANAGER or ADMIN" currentRole="EMPLOYEE" resourceName="the Role Designations catalog" />;
  }
  const isAdmin = role === "ADMIN";

  const designations: any[] = isDemoMode() ? demoStore.designations : realDesignations;
  const competencies: any[] = isDemoMode() ? demoStore.competencies : realCompetencies;

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Designations</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Role profiles and competency level requirements for capacity gap evaluation
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/designations/matrix">
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 shadow-2xs font-semibold">
              <Grid className="h-3.5 w-3.5 text-indigo-600" />Competency Matrix
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={() => exportDesignationsCSV(designations, competencies)} className="h-8 text-xs gap-1.5 shadow-2xs">
            <Download className="h-3.5 w-3.5" />Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportDesignationsMatrixPDF(designations, competencies)} className="h-8 text-xs gap-1.5 shadow-2xs">
            <FileText className="h-3.5 w-3.5" />Export Matrix PDF
          </Button>
          {isAdmin && <AddDesignationDialog onSuccess={loadRealData} />}
        </div>
      </div>

      {/* Directory Card */}
      <Card className="shadow-xs">
        <CardHeader className="pb-4 border-b border-border/60">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Role Profiles Directory</CardTitle>
              <CardDescription className="text-xs">Showing {designations.length} standardized designation roles</CardDescription>
            </div>
            <Badge variant="outline" className="text-xs h-8 px-2.5 font-mono shadow-2xs">
              <Briefcase className="h-3 w-3 mr-1 text-amber-600" />{designations.length} Roles
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-xs text-muted-foreground gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" /> Loading designations...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[110px]">Code</TableHead>
                  <TableHead>Designation Title</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Required Competencies</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {designations.map((desig) => (
                  <TableRow key={desig.id}>
                    <TableCell className="font-mono text-xs font-bold text-slate-700">{desig.code}</TableCell>
                    <TableCell className="font-semibold text-foreground text-xs">{desig.title}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{desig.department || "—"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5 max-w-md">
                        {(desig.requirements || []).map((req: any) => {
                          const compName = req.competencyName || competencies.find((c) => c.id === req.competencyId)?.name || req.competencyId;
                          return (
                            <Badge key={req.competencyId} variant="secondary" className="text-[10px] font-medium bg-slate-100 text-slate-800 border-slate-200">
                              {compName}: <strong className="font-mono ml-1 text-indigo-700 font-bold">L{req.requiredLevel}</strong>
                            </Badge>
                          );
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href="/designations/matrix">
                          <Button variant="outline" size="sm" className="h-7 gap-1 text-xs px-2.5 font-semibold">
                            <Eye className="h-3 w-3" />Matrix
                          </Button>
                        </Link>
                        {isAdmin && (
                          <>
                            <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => { setEditTarget(desig); setEditOpen(true); }} title="Edit"><Pencil className="h-3 w-3" /></Button>
                            <Button size="sm" variant="outline" className="h-7 px-2 text-xs text-rose-600 border-rose-200 hover:bg-rose-50" onClick={() => { setDeleteTarget(desig); setDeleteOpen(true); }} title="Delete"><Trash2 className="h-3 w-3" /></Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <EditDesignationDialog designation={editTarget} open={editOpen} onOpenChange={setEditOpen} onSuccess={loadRealData} />
      <DeleteDesignationDialog designation={deleteTarget} open={deleteOpen} onOpenChange={setDeleteOpen} onSuccess={loadRealData} />
    </div>
  );
}
