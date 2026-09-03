"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDemoStore } from "@/lib/demo/demo-store";
import { isDemoMode } from "@/lib/demo/config";
import { apiClient } from "@/lib/api/client";
import { AddEmployeeDialog } from "@/components/employees/add-employee-dialog";
import { EditEmployeeDialog } from "@/components/employees/edit-employee-dialog";
import { AccessDenied } from "@/components/auth/access-denied";
import { exportEmployeesCSV } from "@/lib/export/csv-export";
import { exportEmployeesPDF } from "@/lib/export/pdf-export";
import { Users, Eye, TrendingUp, Download, FileText, Pencil, UserMinus, UserCheck, Search, Loader2 } from "lucide-react";

export default function EmployeesPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role || "ADMIN";
  const demoStore = useDemoStore();

  const [realEmployees, setRealEmployees] = useState<any[]>([]);
  const [realSummaries, setRealSummaries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(!isDemoMode());
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  const loadRealData = useCallback(async () => {
    if (isDemoMode()) return;
    try {
      setIsLoading(true);
      const [empRes, gapRes] = await Promise.all([
        apiClient.employees.list(),
        apiClient.skillGaps.list(),
      ]);
      setRealEmployees(empRes.data || []);
      setRealSummaries(gapRes.data || []);
    } catch (err) {
      console.error("Failed to load real employees:", err);
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
    return <AccessDenied requiredRole="MANAGER or ADMIN" currentRole="EMPLOYEE" resourceName="the Employee Directory" />;
  }

  const isAdmin = role === "ADMIN";

  const employees: any[] = isDemoMode() ? demoStore.employees : realEmployees;
  const summaries: any[] = isDemoMode() ? demoStore.employeeSummaries : realSummaries;

  const filteredEmployees = employees.filter((emp) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      emp.name.toLowerCase().includes(q) ||
      emp.email.toLowerCase().includes(q) ||
      emp.employeeCode.toLowerCase().includes(q) ||
      (emp.department && emp.department.toLowerCase().includes(q)) ||
      (emp.designationTitle && emp.designationTitle.toLowerCase().includes(q)) ||
      (emp.designation?.title && emp.designation.title.toLowerCase().includes(q));
    const matchesStatus = statusFilter === "ALL" || emp.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  function handleEdit(emp: any) {
    setEditTarget(emp);
    setEditOpen(true);
  }

  async function handleToggleStatus(emp: any) {
    if (isDemoMode()) {
      if (emp.status === "ACTIVE") demoStore.deactivateEmployee(emp.id);
      else demoStore.reactivateEmployee(emp.id);
    } else {
      try {
        if (emp.status === "ACTIVE") {
          await apiClient.employees.delete(emp.id);
        } else {
          await apiClient.employees.update(emp.id, { status: "ACTIVE" });
        }
        await loadRealData();
      } catch (err) {
        console.error("Failed to toggle status:", err);
      }
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Employees</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Manage organization workforce, designation roles, and competency baseline profiles
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => exportEmployeesCSV(employees, summaries)} className="h-8 text-xs gap-1.5 shadow-2xs">
            <Download className="h-3.5 w-3.5" />Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportEmployeesPDF(employees, summaries)} className="h-8 text-xs gap-1.5 shadow-2xs">
            <FileText className="h-3.5 w-3.5" />Export PDF
          </Button>
          {isAdmin && <AddEmployeeDialog onSuccess={loadRealData} />}
        </div>
      </div>

      {/* Directory Card */}
      <Card className="shadow-xs">
        <CardHeader className="pb-4 border-b border-border/60">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-base">Employee Directory</CardTitle>
              <CardDescription className="text-xs">{filteredEmployees.length} of {employees.length} registered employees</CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search employees..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="h-8 pl-8 text-xs w-48 shadow-2xs" />
              </div>
              <Select value={statusFilter} onValueChange={(val: "ALL" | "ACTIVE" | "INACTIVE") => setStatusFilter(val)}>
                <SelectTrigger className="h-8 w-32 text-xs shadow-2xs"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Badge variant="outline" className="text-xs h-8 px-2.5 font-mono shadow-2xs">
                <Users className="h-3 w-3 mr-1" />{employees.length} Total
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-xs text-muted-foreground gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" /> Loading workforce records...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Code</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assessed Skills</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-12 text-xs text-muted-foreground">No employees found matching your search or filters.</TableCell></TableRow>
                ) : (
                  filteredEmployees.map((emp) => {
                    const summary = summaries.find((s) => s.employeeId === emp.id);
                    const hasGaps = summary && summary.needsImprovementCount > 0;
                    const designationTitle = emp.designationTitle || emp.designation?.title || "Unassigned";
                    const initials = emp.name.split(" ").map((n: string) => n[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();

                    return (
                      <TableRow key={emp.id} className={emp.status === "INACTIVE" ? "opacity-60" : ""}>
                        <TableCell className="font-mono text-xs font-bold text-slate-700">{emp.employeeCode}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-700 border border-slate-200 shadow-2xs">
                              {initials}
                            </div>
                            <div>
                              <div className="font-semibold text-foreground text-xs">{emp.name}</div>
                              <div className="text-[11px] text-muted-foreground">{emp.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="secondary" className="text-[11px] font-medium">{designationTitle}</Badge></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{emp.department || "—"}</TableCell>
                        <TableCell><Badge variant={emp.status === "ACTIVE" ? "success" : "secondary"} className="text-[10px] font-mono">{emp.status}</Badge></TableCell>
                        <TableCell>
                          <div className="text-xs">
                            <span className="font-semibold text-foreground">{(emp.competencies || []).length} Skills</span>
                            {hasGaps && <div className="text-[10px] text-amber-700 dark:text-amber-400 font-bold mt-0.5">{summary?.needsImprovementCount} gap{(summary?.needsImprovementCount ?? 0) > 1 ? "s" : ""}</div>}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link href={`/employees/${emp.id}`}><Button variant="outline" size="sm" className="h-7 gap-1 text-xs px-2.5"><Eye className="h-3 w-3" />Profile</Button></Link>
                            <Link href={`/skill-gaps/${emp.id}`}><Button size="sm" variant="secondary" className="h-7 gap-1 text-xs px-2.5"><TrendingUp className="h-3 w-3 text-indigo-600" />Gaps</Button></Link>
                            {isAdmin && (
                              <>
                                <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => handleEdit(emp)} title="Edit"><Pencil className="h-3 w-3" /></Button>
                                <Button size="sm" variant="outline" className={`h-7 px-2 text-xs ${emp.status === "ACTIVE" ? "text-amber-600 border-amber-300 hover:bg-amber-50" : "text-emerald-600"}`} onClick={() => handleToggleStatus(emp)} title={emp.status === "ACTIVE" ? "Deactivate" : "Reactivate"}>
                                  {emp.status === "ACTIVE" ? <UserMinus className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}
                                </Button>
                              </>
                            )}
                          </div>
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

      <EditEmployeeDialog employee={editTarget} open={editOpen} onOpenChange={setEditOpen} onSuccess={loadRealData} />
    </div>
  );
}
