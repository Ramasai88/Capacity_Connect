"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/api/client";
import { AccessDenied } from "@/components/auth/access-denied";
import {
  UserCog, Loader2, CheckCircle2, AlertCircle, X, Plus, Save,
} from "lucide-react";

function TagEditor({ label, values, onChange }: { label: string; values: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = useState("");

  function add() {
    const trimmed = input.trim();
    if (!trimmed || values.includes(trimmed)) return;
    onChange([...values, trimmed]);
    setInput("");
  }

  function remove(v: string) {
    onChange(values.filter((x) => x !== v));
  }

  return (
    <div className="space-y-2">
      <Label className="text-xs font-bold">{label}</Label>
      <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 rounded-md border border-input bg-background">
        {values.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-[11px] font-semibold text-indigo-700"
          >
            {v}
            <button type="button" onClick={() => remove(v)} className="hover:text-rose-600 transition-colors">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={`Add ${label.toLowerCase()}...`}
          className="h-8 text-xs flex-1"
        />
        <Button type="button" size="sm" variant="outline" onClick={add} className="h-8 text-xs gap-1 shrink-0">
          <Plus className="h-3 w-3" /> Add
        </Button>
      </div>
    </div>
  );
}

export default function TrainerProfilePage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role as string;

  const [profile, setProfile] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [teachingDomains, setTeachingDomains] = useState<string[]>([]);
  const [bio, setBio] = useState("");
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.trainerProfile.get();
      const data = res.data;
      setProfile(data);
      setSpecializations(data?.specializations ?? []);
      setTeachingDomains(data?.teachingDomains ?? []);
      setBio(data?.bio ?? "");
      setName(data?.name ?? "");
      setDepartment(data?.department ?? "");
    } catch (err: any) {
      setError(err.message || "Failed to load trainer profile.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (role !== "TRAINER") {
    return <AccessDenied requiredRole="TRAINER" currentRole={role} resourceName="Trainer Profile" />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    setSubmitting(true);
    try {
      await apiClient.trainerProfile.update({
        name: name.trim() || undefined,
        department: department.trim() || undefined,
        bio: bio.trim() || undefined,
        specializations,
        teachingDomains,
      });
      setFeedback({ type: "success", msg: "Trainer profile updated successfully." });
      await load();
    } catch (err: any) {
      setFeedback({ type: "error", msg: err.message || "Failed to update profile." });
    } finally {
      setSubmitting(false);
    }
    setTimeout(() => setFeedback(null), 4000);
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <UserCog className="h-5 w-5 text-indigo-600" />
          Trainer Profile
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Manage your professional profile, specializations, and teaching domains.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-xs text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-indigo-600" /> Loading profile...
        </div>
      ) : error ? (
        <Card className="border-rose-200 bg-rose-50/50">
          <CardContent className="flex items-center gap-2 p-4 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />{error}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Profile summary card */}
          {profile && (
            <Card className="border border-indigo-200/80 bg-gradient-to-b from-indigo-50/40 to-white shadow-xs">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-sm text-lg font-extrabold shrink-0">
                  {(profile.name ?? "T").charAt(0).toUpperCase()}
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="font-bold text-sm text-foreground">{profile.name}</div>
                  <div className="text-xs text-muted-foreground">{profile.email}</div>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className="text-[10px] font-mono bg-white">TRAINER</Badge>
                    {profile.employeeCode && (
                      <Badge variant="outline" className="text-[10px] font-mono bg-white">{profile.employeeCode}</Badge>
                    )}
                    {profile.department && (
                      <Badge variant="outline" className="text-[10px] bg-white">{profile.department}</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Edit form */}
          <Card className="border border-border/80 shadow-xs">
            <CardHeader className="pb-4 border-b border-border/60">
              <CardTitle className="text-base">Edit Trainer Profile</CardTitle>
              <CardDescription className="text-xs">Update your training specializations, domains, and bio.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                {feedback && (
                  <div className={`flex items-center gap-2 rounded-xl p-3.5 text-xs border font-medium ${
                    feedback.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"
                  }`}>
                    {feedback.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                    {feedback.msg}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Display Name</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" className="h-8.5 text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Department</Label>
                    <Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Engineering" className="h-8.5 text-xs" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Professional Bio</Label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Brief professional bio visible to trainees and administrators..."
                    rows={4}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                  />
                </div>

                <TagEditor
                  label="Specializations"
                  values={specializations}
                  onChange={setSpecializations}
                />

                <TagEditor
                  label="Teaching Domains"
                  values={teachingDomains}
                  onChange={setTeachingDomains}
                />

                <div className="flex items-center justify-end pt-2 border-t border-border/60">
                  <Button type="submit" disabled={submitting} className="gap-2 font-semibold">
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Profile
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
