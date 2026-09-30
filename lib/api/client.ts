/**
 * Centralized API client for Capacity Connect.
 * Performs authenticated HTTP fetch calls to real backend API endpoints.
 */

async function fetchJson<T>(
  url: string,
  options?: RequestInit
): Promise<{ success: boolean; data: T; message?: string; meta?: any }> {
  const isFormData = typeof FormData !== "undefined" && options?.body instanceof FormData;
  const headers: Record<string, string> = { ...((options?.headers as Record<string, string>) || {}) };
  if (!isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const json = await res.json();

  if (!res.ok || json.error) {
    const errorMsg = json.error?.message || `HTTP ${res.status}: ${res.statusText}`;
    const err = new Error(errorMsg) as Error & { code?: string; statusCode?: number; details?: any };
    err.code = json.error?.code;
    err.statusCode = res.status;
    err.details = json.error?.details || json.error?.issues;
    throw err;
  }

  return json;
}

export const apiClient = {
  employees: {
    list: (query?: { search?: string; department?: string; designationId?: string; status?: string; page?: number; limit?: number }) => {
      const params = new URLSearchParams();
      if (query?.search) params.set("search", query.search);
      if (query?.department && query.department !== "All") params.set("department", query.department);
      if (query?.designationId) params.set("designationId", query.designationId);
      if (query?.status && query.status !== "All") params.set("status", query.status);
      if (query?.page) params.set("page", String(query.page));
      if (query?.limit) params.set("limit", String(query.limit));
      const qs = params.toString();
      return fetchJson<any[]>(`/api/employees${qs ? `?${qs}` : ""}`);
    },
    getById: (id: string) => fetchJson<any>(`/api/employees/${id}`),
    create: (data: any) =>
      fetchJson<any>("/api/employees", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      fetchJson<any>(`/api/employees/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      fetchJson<any>(`/api/employees/${id}`, {
        method: "DELETE",
      }),
    remove: (id: string) =>
      fetchJson<any>(`/api/employees/${id}`, {
        method: "DELETE",
      }),
    permanentlyDelete: (id: string) =>
      fetchJson<any>(`/api/employees/${id}?permanent=true`, {
        method: "DELETE",
      }),
    restore: (id: string) =>
      fetchJson<any>(`/api/employees/${id}/restore`, {
        method: "POST",
      }),
  },

  competencies: {
    list: (query?: { search?: string; category?: string; page?: number; limit?: number }) => {
      const params = new URLSearchParams();
      if (query?.search) params.set("search", query.search);
      if (query?.category && query.category !== "All") params.set("category", query.category);
      if (query?.page) params.set("page", String(query.page));
      if (query?.limit) params.set("limit", String(query.limit));
      const qs = params.toString();
      return fetchJson<any[]>(`/api/competencies${qs ? `?${qs}` : ""}`);
    },
    getById: (id: string) => fetchJson<any>(`/api/competencies/${id}`),
    create: (data: any) =>
      fetchJson<any>("/api/competencies", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      fetchJson<any>(`/api/competencies/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      fetchJson<any>(`/api/competencies/${id}`, {
        method: "DELETE",
      }),
  },

  designations: {
    list: (query?: { search?: string; department?: string; page?: number; limit?: number }) => {
      const params = new URLSearchParams();
      if (query?.search) params.set("search", query.search);
      if (query?.department && query.department !== "All") params.set("department", query.department);
      if (query?.page) params.set("page", String(query.page));
      if (query?.limit) params.set("limit", String(query.limit));
      const qs = params.toString();
      return fetchJson<any[]>(`/api/designations${qs ? `?${qs}` : ""}`);
    },
    getById: (id: string) => fetchJson<any>(`/api/designations/${id}`),
    create: (data: any) =>
      fetchJson<any>("/api/designations", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      fetchJson<any>(`/api/designations/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      fetchJson<any>(`/api/designations/${id}`, {
        method: "DELETE",
      }),
  },

  courses: {
    list: (query?: { search?: string; category?: string; targetLevel?: number; status?: string; page?: number; limit?: number }) => {
      const params = new URLSearchParams();
      if (query?.search) params.set("search", query.search);
      if (query?.category && query.category !== "All") params.set("category", query.category);
      if (query?.targetLevel) params.set("targetLevel", String(query.targetLevel));
      if (query?.status) params.set("status", query.status);
      if (query?.page) params.set("page", String(query.page));
      if (query?.limit) params.set("limit", String(query.limit));
      const qs = params.toString();
      return fetchJson<any[]>(`/api/courses${qs ? `?${qs}` : ""}`);
    },
    getById: (id: string) => fetchJson<any>(`/api/courses/${id}`),
    create: (data: any) =>
      fetchJson<any>("/api/courses", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      fetchJson<any>(`/api/courses/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      fetchJson<any>(`/api/courses/${id}`, {
        method: "DELETE",
      }),
  },

  learning: {
    getEnrollments: (query?: { employeeId?: string; courseId?: string; status?: string }) => {
      const params = new URLSearchParams();
      if (query?.employeeId) params.set("employeeId", query.employeeId);
      if (query?.courseId) params.set("courseId", query.courseId);
      if (query?.status) params.set("status", query.status);
      const qs = params.toString();
      return fetchJson<any[]>(`/api/enrollments${qs ? `?${qs}` : ""}`);
    },
    enroll: (courseId: string, employeeId?: string) =>
      fetchJson<any>(`/api/courses/${courseId}/enroll`, {
        method: "POST",
        body: JSON.stringify({ employeeId }),
      }),
    completeModule: (courseId: string, moduleId: string, employeeId?: string) =>
      fetchJson<any>(`/api/courses/${courseId}/modules/${moduleId}/complete`, {
        method: "POST",
        body: JSON.stringify({ employeeId }),
      }),
  },

  reassessments: {
    list: (query?: { status?: string; employeeId?: string; courseId?: string }) => {
      const params = new URLSearchParams();
      if (query?.status && query.status !== "All") params.set("status", query.status);
      if (query?.employeeId) params.set("employeeId", query.employeeId);
      if (query?.courseId) params.set("courseId", query.courseId);
      const qs = params.toString();
      return fetchJson<any[]>(`/api/reassessments${qs ? `?${qs}` : ""}`);
    },
    getById: (id: string) => fetchJson<any>(`/api/reassessments/${id}`),
    review: (id: string, data: { status: "APPROVED" | "REJECTED"; reviewerComments?: string }) =>
      fetchJson<any>(`/api/reassessments/${id}/review`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  skillGaps: {
    list: (department?: string) => {
      const qs = department && department !== "All" ? `?department=${encodeURIComponent(department)}` : "";
      return fetchJson<any[]>(`/api/skill-gaps${qs}`);
    },
    getForEmployee: (employeeId: string) => fetchJson<any>(`/api/skill-gaps/${employeeId}`),
    summary: () => fetchJson<any>("/api/skill-gaps/summary"),
  },

  myDevelopment: {
    get: (employeeId?: string) => {
      const qs = employeeId ? `?employeeId=${encodeURIComponent(employeeId)}` : "";
      return fetchJson<any>(`/api/my-development${qs}`);
    },
    updateProfile: (data: any) =>
      fetchJson<any>("/api/my-development", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
  },

  reports: {
    summary: () => fetchJson<any>("/api/reports/summary"),
  },

  organization: {
    get: () => fetchJson<any>("/api/organization"),
    update: (data: any) =>
      fetchJson<any>("/api/organization", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
  },

  // ── Phase 2 ───────────────────────────────────────────────────────────────

  trainerLibrary: {
    list: (query?: { search?: string; resourceType?: string; competencyId?: string; courseId?: string; onlyPublished?: boolean }) => {
      const params = new URLSearchParams();
      if (query?.search) params.set("search", query.search);
      if (query?.resourceType) params.set("resourceType", query.resourceType);
      if (query?.competencyId) params.set("competencyId", query.competencyId);
      if (query?.courseId) params.set("courseId", query.courseId);
      if (query?.onlyPublished !== undefined) params.set("onlyPublished", String(query.onlyPublished));
      const qs = params.toString();
      return fetchJson<any>(`/api/trainer/library${qs ? `?${qs}` : ""}`);
    },
    getById: (id: string) => fetchJson<any>(`/api/trainer/library/${id}`),
    create: (data: any) =>
      fetchJson<any>("/api/trainer/library", { method: "POST", body: JSON.stringify(data) }),
    upload: (formData: FormData) =>
      fetchJson<any>("/api/trainer/library/upload", { method: "POST", body: formData }),
    update: (id: string, data: any) =>
      fetchJson<any>(`/api/trainer/library/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) =>
      fetchJson<any>(`/api/trainer/library/${id}`, { method: "DELETE" }),
  },

  questionnaires: {
    list: (query?: { status?: string; courseId?: string; competencyId?: string; search?: string }) => {
      const params = new URLSearchParams();
      if (query?.status) params.set("status", query.status);
      if (query?.courseId) params.set("courseId", query.courseId);
      if (query?.competencyId) params.set("competencyId", query.competencyId);
      if (query?.search) params.set("search", query.search);
      const qs = params.toString();
      return fetchJson<any>(`/api/questionnaires${qs ? `?${qs}` : ""}`);
    },
    getById: (id: string) => fetchJson<any>(`/api/questionnaires/${id}`),
    create: (data: any) =>
      fetchJson<any>("/api/questionnaires", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      fetchJson<any>(`/api/questionnaires/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    publish: (id: string) =>
      fetchJson<any>(`/api/questionnaires/${id}/publish`, { method: "POST" }),
    archive: (id: string) =>
      fetchJson<any>(`/api/questionnaires/${id}/archive`, { method: "POST" }),
    submit: (id: string, data: { answers: Array<{ questionId: string; selectedOption: number }>; timeSpentMinutes?: number }) =>
      fetchJson<any>(`/api/questionnaires/${id}/submit`, { method: "POST", body: JSON.stringify(data) }),
    analytics: (id: string) => fetchJson<any>(`/api/questionnaires/${id}/analytics`),
  },

  feedback: {
    list: (query?: { courseId?: string }) => {
      const params = new URLSearchParams();
      if (query?.courseId) params.set("courseId", query.courseId);
      const qs = params.toString();
      return fetchJson<any>(`/api/feedback${qs ? `?${qs}` : ""}`);
    },
    submit: (data: {
      courseId: string;
      rating: number;
      isAnonymous?: boolean;
      contentQualityRating?: number;
      trainerClarityRating?: number;
      applicabilityRating?: number;
      comments?: string;
    }) => fetchJson<any>("/api/feedback", { method: "POST", body: JSON.stringify(data) }),
  },

  publishing: {
    list: (query?: { category?: string; search?: string }) => {
      const params = new URLSearchParams();
      if (query?.category) params.set("category", query.category);
      if (query?.search) params.set("search", query.search);
      const qs = params.toString();
      return fetchJson<any>(`/api/admin/publishing${qs ? `?${qs}` : ""}`);
    },
    getById: (id: string) => fetchJson<any>(`/api/admin/publishing/${id}`),
    create: (data: any) =>
      fetchJson<any>("/api/admin/publishing", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      fetchJson<any>(`/api/admin/publishing/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) =>
      fetchJson<any>(`/api/admin/publishing/${id}`, { method: "DELETE" }),
  },

  trainerProfile: {
    get: () => fetchJson<any>("/api/trainer/profile"),
    update: (data: { specializations?: string[]; teachingDomains?: string[]; bio?: string; name?: string; department?: string }) =>
      fetchJson<any>("/api/trainer/profile", { method: "PUT", body: JSON.stringify(data) }),
  },

  users: {
    list: () => fetchJson<any[]>("/api/users"),
    create: (data: any) =>
      fetchJson<any>("/api/users", { method: "POST", body: JSON.stringify(data) }),
    getPending: () => fetchJson<{ pendingUsers: any[]; count: number }>("/api/users/pending"),
    approve: (id: string) =>
      fetchJson<any>(`/api/users/${id}/approve`, { method: "PATCH" }),
    reject: (id: string, reason?: string) =>
      fetchJson<any>(`/api/users/${id}/reject`, {
        method: "PATCH",
        body: JSON.stringify({ reason }),
      }),
  },
};

