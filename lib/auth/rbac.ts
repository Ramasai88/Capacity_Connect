export type UserRole = "ADMIN" | "MANAGER" | "EMPLOYEE";

export interface RolePermissions {
  canAddEmployee: boolean;
  canEditEmployee: boolean;
  canCreateCompetency: boolean;
  canEditCompetency: boolean;
  canCreateDesignation: boolean;
  canEditDesignation: boolean;
  canCreateCourse: boolean;
  canReviewReassessments: boolean;
  canViewAllEmployees: boolean;
  canViewAllSkillGaps: boolean;
  canViewReports: boolean;
  canExportData: boolean;
  canAccessSettings: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  ADMIN: {
    canAddEmployee: true,
    canEditEmployee: true,
    canCreateCompetency: true,
    canEditCompetency: true,
    canCreateDesignation: true,
    canEditDesignation: true,
    canCreateCourse: true,
    canReviewReassessments: true,
    canViewAllEmployees: true,
    canViewAllSkillGaps: true,
    canViewReports: true,
    canExportData: true,
    canAccessSettings: true,
  },
  MANAGER: {
    canAddEmployee: false,
    canEditEmployee: false,
    canCreateCompetency: false,
    canEditCompetency: false,
    canCreateDesignation: false,
    canEditDesignation: false,
    canCreateCourse: true,
    canReviewReassessments: true,
    canViewAllEmployees: true,
    canViewAllSkillGaps: true,
    canViewReports: true,
    canExportData: true,
    canAccessSettings: false,
  },
  EMPLOYEE: {
    canAddEmployee: false,
    canEditEmployee: false,
    canCreateCompetency: false,
    canEditCompetency: false,
    canCreateDesignation: false,
    canEditDesignation: false,
    canCreateCourse: false,
    canReviewReassessments: false,
    canViewAllEmployees: false,
    canViewAllSkillGaps: false,
    canViewReports: false,
    canExportData: false,
    canAccessSettings: false,
  },
};

export function hasPermission(role: UserRole | undefined | null, permission: keyof RolePermissions): boolean {
  if (!role) return false;
  return !!ROLE_PERMISSIONS[role]?.[permission];
}

export function isRouteAllowed(role: UserRole | undefined | null, pathname: string): boolean {
  if (!role) return false;

  // My Skill Development: Employee only (self-service profile)
  if (pathname.startsWith("/my-development")) {
    return role === "EMPLOYEE";
  }

  // My Learning: Employee only (personal learning workspace)
  if (pathname.startsWith("/my-learning")) {
    return role === "EMPLOYEE";
  }

  // Settings: Admin only
  if (pathname.startsWith("/settings")) {
    return role === "ADMIN";
  }

  // Reassessments: Manager & Admin
  if (pathname.startsWith("/reassessments")) {
    return role === "ADMIN" || role === "MANAGER";
  }

  // Reports: Admin & Manager
  if (pathname.startsWith("/reports")) {
    return role === "ADMIN" || role === "MANAGER";
  }

  // Employees, Competencies, Designations: Admin & Manager can view
  if (
    pathname.startsWith("/employees") ||
    pathname.startsWith("/competencies") ||
    pathname.startsWith("/designations")
  ) {
    return role === "ADMIN" || role === "MANAGER";
  }

  // Skill gaps: Admin & Manager can view org table, Employee can view their own
  if (pathname.startsWith("/skill-gaps")) {
    return true;
  }

  // Dashboard, Courses, My Learning: All roles
  return true;
}
