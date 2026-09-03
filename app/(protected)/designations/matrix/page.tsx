"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
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
import { exportDesignationsCSV } from "@/lib/export/csv-export";
import { exportDesignationsMatrixPDF } from "@/lib/export/pdf-export";
import { ArrowLeft, Grid, Download, FileText, Loader2 } from "lucide-react";

export default function DesignationCompetencyMatrixPage() {
  const demoStore = useDemoStore();
  const [realDesignations, setRealDesignations] = useState<any[]>([]);
  const [realCompetencies, setRealCompetencies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(!isDemoMode());

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
      console.error("Failed to load matrix data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isDemoMode()) {
      loadRealData();
    }
  }, [loadRealData]);

  const designations = isDemoMode() ? demoStore.designations : realDesignations;
  const competencies = isDemoMode() ? demoStore.competencies : realCompetencies;

  const levelColorMap: Record<number, string> = {
    1: "bg-slate-100 text-slate-800 border-slate-300",
    2: "bg-sky-50 text-sky-800 border-sky-300",
    3: "bg-indigo-50 text-indigo-800 border-indigo-300",
    4: "bg-violet-50 text-violet-800 border-violet-300",
    5: "bg-emerald-50 text-emerald-800 border-emerald-300",
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      <div>
        <Link
          href="/designations"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Designations
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Designation Competency Matrix
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Target required proficiency levels (1–5 scale) mapped per organizational role
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportDesignationsCSV(designations, competencies)}
            className="h-8 text-xs gap-1.5 shadow-2xs"
          >
            <Download className="h-3.5 w-3.5" />
            Export Matrix CSV
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => exportDesignationsMatrixPDF(designations, competencies)}
            className="h-8 text-xs gap-1.5 shadow-2xs"
          >
            <FileText className="h-3.5 w-3.5" />
            Export Matrix PDF
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 flex-wrap text-xs bg-white p-3 rounded-xl border border-border/80 shadow-2xs">
        <span className="font-semibold text-foreground text-xs mr-2">Proficiency Legend:</span>
        {[1, 2, 3, 4, 5].map((lvl) => (
          <span key={lvl} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[11px] font-bold border shadow-2xs ${levelColorMap[lvl]}`}>
            L{lvl}
          </span>
        ))}
      </div>

      <Card className="shadow-xs">
        <CardHeader className="pb-4 border-b border-border/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200">
                <Grid className="h-3.5 w-3.5" />
              </div>
              <div>
                <CardTitle className="text-base">Role Requirement Matrix</CardTitle>
                <CardDescription className="text-xs">
                  Cross-functional mapping of all {competencies.length} competencies across {designations.length} standardized roles
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-xs font-mono">
              {designations.length} Roles × {competencies.length} Competencies
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-xs text-muted-foreground gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" /> Loading competency matrix...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-56 sticky left-0 bg-slate-50 z-10 border-r border-border/80 shadow-xs">
                    Role / Designation
                  </TableHead>
                  <TableHead className="w-32">Department</TableHead>
                  {competencies.map((comp) => (
                    <TableHead key={comp.id} className="text-center min-w-[130px]">
                      <div className="font-bold text-xs text-foreground truncate">{comp.name}</div>
                      <div className="text-[10px] font-mono text-muted-foreground font-normal">{comp.code}</div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {designations.map((desig) => (
                  <TableRow key={desig.id}>
                    <TableCell className="font-semibold text-xs sticky left-0 bg-card z-10 border-r border-border/80 shadow-xs">
                      <div className="text-foreground">{desig.title}</div>
                      <div className="text-[10px] font-mono text-muted-foreground font-normal">{desig.code}</div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-medium">
                      {desig.department || "—"}
                    </TableCell>
                    {competencies.map((comp) => {
                      const req = (desig.requirements || []).find(
                        (r: any) => r.competencyId === comp.id
                      );
                      return (
                        <TableCell key={comp.id} className="text-center">
                          {req ? (
                            <span
                              className={`inline-flex items-center justify-center px-2 py-0.5 rounded-md font-mono text-xs font-bold border shadow-2xs ${levelColorMap[req.requiredLevel] || levelColorMap[1]}`}
                            >
                              L{req.requiredLevel}
                            </span>
                          ) : (
                            <span className="text-slate-300 text-xs">—</span>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
