"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { apiClient } from "@/lib/api/client";
import {
  User,
  GraduationCap,
  Briefcase,
  Award,
  Star,
  Heart,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

interface QualificationItem {
  degree: string;
  institution: string;
  year?: string;
  field?: string;
}

interface WorkExperienceItem {
  role: string;
  company: string;
  duration?: string;
  description?: string;
}

interface CertificateItem {
  title: string;
  issuer: string;
  year?: string;
  credentialUrl?: string;
}

interface EditProfessionalProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: any;
  onSuccess: () => void;
}

export function EditProfessionalProfileDialog({
  open,
  onOpenChange,
  employee,
  onSuccess,
}: EditProfessionalProfileDialogProps) {
  const [activeTab, setActiveTab] = useState<string>("skills");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [bio, setBio] = useState<string>("");
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState<string>("");
  const [interests, setInterests] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState<string>("");

  const [qualifications, setQualifications] = useState<QualificationItem[]>([]);
  const [workExperience, setWorkExperience] = useState<WorkExperienceItem[]>([]);
  const [certificates, setCertificates] = useState<CertificateItem[]>([]);

  // Initialize from employee prop
  useEffect(() => {
    if (employee && open) {
      setBio(employee.bio || "");
      setSkills(Array.isArray(employee.skills) ? [...employee.skills] : []);
      setInterests(Array.isArray(employee.interests) ? [...employee.interests] : []);

      // Normalize qualifications
      if (Array.isArray(employee.qualifications)) {
        setQualifications(
          employee.qualifications.map((q: any) => ({
            degree: q.degree || q.title || "",
            institution: q.institution || "",
            year: q.year ? String(q.year) : "",
            field: q.field || "",
          }))
        );
      } else if (typeof employee.qualifications === "string" && employee.qualifications) {
        setQualifications([{ degree: employee.qualifications, institution: "", year: "", field: "" }]);
      } else {
        setQualifications([]);
      }

      // Normalize work experience
      if (Array.isArray(employee.workExperience)) {
        setWorkExperience(
          employee.workExperience.map((w: any) => ({
            role: w.role || w.title || "",
            company: w.company || "",
            duration: w.duration || w.years ? String(w.duration || w.years) : "",
            description: w.description || "",
          }))
        );
      } else if (typeof employee.workExperience === "string" && employee.workExperience) {
        setWorkExperience([{ role: employee.workExperience, company: "", duration: "", description: "" }]);
      } else {
        setWorkExperience([]);
      }

      // Normalize certificates
      if (Array.isArray(employee.certificates)) {
        setCertificates(
          employee.certificates.map((c: any) => ({
            title: typeof c === "string" ? c : c.title || c.name || "",
            issuer: c.issuer || "",
            year: c.year ? String(c.year) : "",
            credentialUrl: c.credentialUrl || "",
          }))
        );
      } else if (typeof employee.certificates === "string" && employee.certificates) {
        setCertificates([{ title: employee.certificates, issuer: "", year: "", credentialUrl: "" }]);
      } else {
        setCertificates([]);
      }

      setError(null);
      setSuccessMessage(null);
    }
  }, [employee, open]);

  // Skill handlers
  const handleAddSkill = () => {
    const trimmed = newSkill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  // Interest handlers
  const handleAddInterest = () => {
    const trimmed = newInterest.trim();
    if (trimmed && !interests.includes(trimmed)) {
      setInterests([...interests, trimmed]);
      setNewInterest("");
    }
  };

  const handleRemoveInterest = (index: number) => {
    setInterests(interests.filter((_, i) => i !== index));
  };

  // Qualification handlers
  const handleAddQualification = () => {
    setQualifications([...qualifications, { degree: "", institution: "", year: "", field: "" }]);
  };

  const handleUpdateQualification = (index: number, field: keyof QualificationItem, value: string) => {
    const updated = [...qualifications];
    updated[index] = { ...updated[index], [field]: value } as QualificationItem;
    setQualifications(updated);
  };

  const handleRemoveQualification = (index: number) => {
    setQualifications(qualifications.filter((_, i) => i !== index));
  };

  // Work experience handlers
  const handleAddWorkExperience = () => {
    setWorkExperience([...workExperience, { role: "", company: "", duration: "", description: "" }]);
  };

  const handleUpdateWorkExperience = (index: number, field: keyof WorkExperienceItem, value: string) => {
    const updated = [...workExperience];
    updated[index] = { ...updated[index], [field]: value } as WorkExperienceItem;
    setWorkExperience(updated);
  };

  const handleRemoveWorkExperience = (index: number) => {
    setWorkExperience(workExperience.filter((_, i) => i !== index));
  };

  // Certificate handlers
  const handleAddCertificate = () => {
    setCertificates([...certificates, { title: "", issuer: "", year: "", credentialUrl: "" }]);
  };

  const handleUpdateCertificate = (index: number, field: keyof CertificateItem, value: string) => {
    const updated = [...certificates];
    updated[index] = { ...updated[index], [field]: value } as CertificateItem;
    setCertificates(updated);
  };

  const handleRemoveCertificate = (index: number) => {
    setCertificates(certificates.filter((_, i) => i !== index));
  };

  // Submit profile updates
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Filter out empty entries
      const cleanedQualifications = qualifications.filter(
        (q) => q.degree.trim() || q.institution.trim()
      );
      const cleanedWorkExperience = workExperience.filter(
        (w) => w.role.trim() || w.company.trim()
      );
      const cleanedCertificates = certificates.filter(
        (c) => c.title.trim() || c.issuer.trim()
      );

      const payload = {
        bio: bio.trim() || undefined,
        skills,
        interests,
        qualifications: cleanedQualifications.length > 0 ? cleanedQualifications : [],
        workExperience: cleanedWorkExperience.length > 0 ? cleanedWorkExperience : [],
        certificates: cleanedCertificates.length > 0 ? cleanedCertificates : [],
      };

      await apiClient.myDevelopment.updateProfile(payload);

      setSuccessMessage("Professional profile updated successfully!");
      setTimeout(() => {
        onSuccess();
        onOpenChange(false);
      }, 700);
    } catch (err: any) {
      console.error("Failed to update professional profile:", err);
      setError(err.message || "Failed to save profile changes. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5 text-indigo-600" />
            Edit Professional Profile
          </DialogTitle>
          <DialogDescription>
            Update your qualifications, work experience, key skills, learning interests, and certificates.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-5 w-full h-10 p-1">
              <TabsTrigger value="skills" className="text-xs flex items-center gap-1">
                <Star className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Skills</span>
              </TabsTrigger>
              <TabsTrigger value="interests" className="text-xs flex items-center gap-1">
                <Heart className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Interests</span>
              </TabsTrigger>
              <TabsTrigger value="qualifications" className="text-xs flex items-center gap-1">
                <GraduationCap className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Education</span>
              </TabsTrigger>
              <TabsTrigger value="experience" className="text-xs flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Experience</span>
              </TabsTrigger>
              <TabsTrigger value="certificates" className="text-xs flex items-center gap-1">
                <Award className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Certificates</span>
              </TabsTrigger>
            </TabsList>

            {/* TAB: Skills & Bio */}
            <TabsContent value="skills" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="bio" className="text-xs font-semibold">
                  Professional Bio / Summary
                </Label>
                <Textarea
                  id="bio"
                  placeholder="Briefly introduce your career background and professional objectives..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">Key Skills & Competencies</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a skill (e.g., Python, PostgreSQL, Data Analysis)..."
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                    className="text-xs"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddSkill}
                    className="shrink-0 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add
                  </Button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-2 min-h-[40px] p-2 rounded-lg bg-slate-50 border border-border/60">
                  {skills.length === 0 ? (
                    <span className="text-xs text-muted-foreground italic">No skills added yet.</span>
                  ) : (
                    skills.map((skill, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="text-xs py-1 px-2.5 bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1.5"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(idx)}
                          className="text-indigo-400 hover:text-indigo-800 focus:outline-none"
                        >
                          ×
                        </button>
                      </Badge>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>

            {/* TAB: Interests */}
            <TabsContent value="interests" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Learning Interests & Growth Areas</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add an interest (e.g., Cloud Architecture, AI/ML, DevOps)..."
                    value={newInterest}
                    onChange={(e) => setNewInterest(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddInterest();
                      }
                    }}
                    className="text-xs"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddInterest}
                    className="shrink-0 text-xs bg-rose-600 hover:bg-rose-700 text-white"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add
                  </Button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-2 min-h-[40px] p-2 rounded-lg bg-slate-50 border border-border/60">
                  {interests.length === 0 ? (
                    <span className="text-xs text-muted-foreground italic">No interests added yet.</span>
                  ) : (
                    interests.map((interest, idx) => (
                      <Badge
                        key={idx}
                        variant="outline"
                        className="text-xs py-1 px-2.5 bg-white text-slate-700 border-slate-300 flex items-center gap-1.5"
                      >
                        {interest}
                        <button
                          type="button"
                          onClick={() => handleRemoveInterest(idx)}
                          className="text-slate-400 hover:text-rose-600 focus:outline-none font-bold"
                        >
                          ×
                        </button>
                      </Badge>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>

            {/* TAB: Qualifications */}
            <TabsContent value="qualifications" className="space-y-3 mt-4">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Academic Qualifications</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddQualification}
                  className="text-xs h-7 gap-1"
                >
                  <Plus className="h-3 w-3" /> Add Degree/Diploma
                </Button>
              </div>

              {qualifications.length === 0 ? (
                <div className="p-4 text-center rounded-lg bg-slate-50 border text-xs text-muted-foreground">
                  No qualifications listed. Click &quot;Add Degree/Diploma&quot; to add your education history.
                </div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {qualifications.map((q, idx) => (
                    <div key={idx} className="p-3 rounded-lg border bg-slate-50/50 space-y-2 relative">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-700">Entry #{idx + 1}</span>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveQualification(idx)}
                          className="h-6 w-6 p-0 text-rose-500 hover:bg-rose-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <Label className="text-[10px] text-muted-foreground">Degree / Certificate *</Label>
                          <Input
                            placeholder="e.g. B.Tech in Computer Science"
                            value={q.degree}
                            onChange={(e) => handleUpdateQualification(idx, "degree", e.target.value)}
                            className="text-xs h-8"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] text-muted-foreground">Institution *</Label>
                          <Input
                            placeholder="e.g. University of Engineering"
                            value={q.institution}
                            onChange={(e) => handleUpdateQualification(idx, "institution", e.target.value)}
                            className="text-xs h-8"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] text-muted-foreground">Year / Duration</Label>
                          <Input
                            placeholder="e.g. 2020 - 2024"
                            value={q.year}
                            onChange={(e) => handleUpdateQualification(idx, "year", e.target.value)}
                            className="text-xs h-8"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] text-muted-foreground">Specialization / Field</Label>
                          <Input
                            placeholder="e.g. Software Engineering"
                            value={q.field}
                            onChange={(e) => handleUpdateQualification(idx, "field", e.target.value)}
                            className="text-xs h-8"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* TAB: Work Experience */}
            <TabsContent value="experience" className="space-y-3 mt-4">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Work Experience</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddWorkExperience}
                  className="text-xs h-7 gap-1"
                >
                  <Plus className="h-3 w-3" /> Add Position
                </Button>
              </div>

              {workExperience.length === 0 ? (
                <div className="p-4 text-center rounded-lg bg-slate-50 border text-xs text-muted-foreground">
                  No work experience listed. Click &quot;Add Position&quot; to add relevant job experience.
                </div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {workExperience.map((w, idx) => (
                    <div key={idx} className="p-3 rounded-lg border bg-slate-50/50 space-y-2 relative">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-700">Position #{idx + 1}</span>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveWorkExperience(idx)}
                          className="h-6 w-6 p-0 text-rose-500 hover:bg-rose-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <Label className="text-[10px] text-muted-foreground">Job Title / Role *</Label>
                          <Input
                            placeholder="e.g. Junior Software Engineer"
                            value={w.role}
                            onChange={(e) => handleUpdateWorkExperience(idx, "role", e.target.value)}
                            className="text-xs h-8"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] text-muted-foreground">Company / Organization *</Label>
                          <Input
                            placeholder="e.g. Acme Tech Solutions"
                            value={w.company}
                            onChange={(e) => handleUpdateWorkExperience(idx, "company", e.target.value)}
                            className="text-xs h-8"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <Label className="text-[10px] text-muted-foreground">Duration / Period</Label>
                          <Input
                            placeholder="e.g. Jan 2023 - Present (1.5 years)"
                            value={w.duration}
                            onChange={(e) => handleUpdateWorkExperience(idx, "duration", e.target.value)}
                            className="text-xs h-8"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <Label className="text-[10px] text-muted-foreground">Key Responsibilities / Achievements</Label>
                          <Input
                            placeholder="e.g. Built REST APIs, optimized SQL queries, collaborated with QA..."
                            value={w.description}
                            onChange={(e) => handleUpdateWorkExperience(idx, "description", e.target.value)}
                            className="text-xs h-8"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* TAB: Certificates */}
            <TabsContent value="certificates" className="space-y-3 mt-4">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Certifications & Accreditations</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddCertificate}
                  className="text-xs h-7 gap-1"
                >
                  <Plus className="h-3 w-3" /> Add Certificate
                </Button>
              </div>

              {certificates.length === 0 ? (
                <div className="p-4 text-center rounded-lg bg-slate-50 border text-xs text-muted-foreground">
                  No certificates listed. Click &quot;Add Certificate&quot; to include your industry credentials.
                </div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {certificates.map((c, idx) => (
                    <div key={idx} className="p-3 rounded-lg border bg-slate-50/50 space-y-2 relative">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-700">Certificate #{idx + 1}</span>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveCertificate(idx)}
                          className="h-6 w-6 p-0 text-rose-500 hover:bg-rose-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <Label className="text-[10px] text-muted-foreground">Certificate Title *</Label>
                          <Input
                            placeholder="e.g. AWS Certified Developer Associate"
                            value={c.title}
                            onChange={(e) => handleUpdateCertificate(idx, "title", e.target.value)}
                            className="text-xs h-8"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] text-muted-foreground">Issuing Organization *</Label>
                          <Input
                            placeholder="e.g. Amazon Web Services"
                            value={c.issuer}
                            onChange={(e) => handleUpdateCertificate(idx, "issuer", e.target.value)}
                            className="text-xs h-8"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] text-muted-foreground">Issue Year</Label>
                          <Input
                            placeholder="e.g. 2024"
                            value={c.year}
                            onChange={(e) => handleUpdateCertificate(idx, "year", e.target.value)}
                            className="text-xs h-8"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] text-muted-foreground">Credential URL</Label>
                          <Input
                            placeholder="e.g. https://credly.com/badges/..."
                            value={c.credentialUrl}
                            onChange={(e) => handleUpdateCertificate(idx, "credentialUrl", e.target.value)}
                            className="text-xs h-8"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter className="pt-3 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  Saving Changes...
                </>
              ) : (
                "Save Profile"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
