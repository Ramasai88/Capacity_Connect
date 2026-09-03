"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDemoStore } from "@/lib/demo/demo-store";
import { isDemoMode } from "@/lib/demo/config";
import { apiClient } from "@/lib/api/client";
import { AddCompetencyDialog } from "@/components/competencies/add-competency-dialog";
import { EditCompetencyDialog } from "@/components/competencies/edit-competency-dialog";
import { DeleteCompetencyDialog } from "@/components/competencies/delete-competency-dialog";
import { AccessDenied } from "@/components/auth/access-denied";
import { exportCompetenciesCSV } from "@/lib/export/csv-export";
import { BadgeCheck, Eye, Download, Pencil, Trash2, Loader2, Search } from "lucide-react";

export default function CompetenciesPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role || "ADMIN";
  const demoStore = useDemoStore();

  const [realCompetencies, setRealCompetencies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(!isDemoMode());
  const [searchQuery, setSearchQuery] = useState("");
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const loadRealData = useCallback(async () => {
    if (isDemoMode()) return;
    try {
      setIsLoading(true);
      const res = await apiClient.competencies.list();
      setRealCompetencies(res.data || []);
    } catch (err) {
      console.error("Failed to load real competencies:", err);
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
    return <AccessDenied requiredRole="MANAGER or ADMIN" currentRole="EMPLOYEE" resourceName="the Competency Framework Catalog" />;
  }
  const isAdmin = role === "ADMIN";

  const competencies: any[] = isDemoMode() ? demoStore.competencies : realCompetencies;

  const filtered = competencies.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Competencies</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Standardized 1–5 proficiency framework across technical, analytical, soft skills, and leadership domains
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => exportCompetenciesCSV(competencies)} className="h-8 text-xs gap-1.5 shadow-2xs">
            <Download className="h-3.5 w-3.5" />Export CSV
          </Button>
          {isAdmin && <AddCompetencyDialog onSuccess={loadRealData} />}
        </div>
      </div>

      {/* Catalog Card */}
      <Card className="shadow-xs">
        <CardHeader className="pb-4 border-b border-border/60">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-base">Competency Framework Catalog</CardTitle>
              <CardDescription className="text-xs">Universal 5-level rubric indicators for benchmarking and capacity alignment</CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search competencies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 text-xs w-48 shadow-2xs"
                />
              </div>
              <Badge variant="outline" className="text-xs h-8 px-2.5 font-mono shadow-2xs">
                <BadgeCheck className="h-3 w-3 mr-1 text-indigo-600" />{competencies.length} Defined
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-xs text-muted-foreground gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" /> Loading competency rubrics...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Code</TableHead>
                  <TableHead>Competency Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Proficiency Scale</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-xs text-muted-foreground">
                      No competencies found matching your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((comp) => (
                    <TableRow key={comp.id}>
                      <TableCell className="font-mono text-xs font-bold text-slate-700">{comp.code}</TableCell>
                      <TableCell>
                        <Link href={`/competencies/${comp.id}`} className="font-semibold text-foreground text-xs hover:text-indigo-600 transition-colors">
                          {comp.name}
                        </Link>
                      </TableCell>
                      <TableCell><Badge variant="secondary" className="text-[11px] font-medium">{comp.category}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{comp.description}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((lvl) => (
                            <span
                              key={lvl}
                              className="flex h-5 w-5 items-center justify-center rounded-md bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-mono font-bold shadow-2xs"
                              title={`Level ${lvl}`}
                            >
                              L{lvl}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/competencies/${comp.id}`}>
                            <Button variant="outline" size="sm" className="h-7 gap-1 text-xs px-2.5 font-semibold">
                              <Eye className="h-3 w-3" />Rubric
                            </Button>
                          </Link>
                          {isAdmin && (
                            <>
                              <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => { setEditTarget(comp); setEditOpen(true); }} title="Edit">
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 px-2 text-xs text-rose-600 border-rose-200 hover:bg-rose-50" onClick={() => { setDeleteTarget(comp); setDeleteOpen(true); }} title="Delete">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <EditCompetencyDialog competency={editTarget} open={editOpen} onOpenChange={setEditOpen} onSuccess={loadRealData} />
      <DeleteCompetencyDialog competency={deleteTarget} open={deleteOpen} onOpenChange={setDeleteOpen} onSuccess={loadRealData} />
    </div>
  );
}
