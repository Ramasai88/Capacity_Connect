/**
 * Centralized API client for Capacity Connect.
 * Performs authenticated HTTP fetch calls to real backend API endpoints.
 */

async function fetchJson<T>(
  url: string,
  options?: RequestInit
): Promise<{ success: boolean; data: T; message?: string; meta?: any }> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
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
};
