import { prisma } from "@/lib/db/prisma";
import { UserRole } from "@prisma/client";

export interface LogActivityParams {
  organizationId: string;
  actorId?: string | null;
  actorName?: string | null;
  actorRole?: UserRole | "ADMIN" | "MANAGER" | "EMPLOYEE" | null;
  action: string;
  category: "AUTHENTICATION" | "USER_MANAGEMENT" | "MANAGER_OPERATION" | "LEARNING";
  targetId?: string | null;
  targetName?: string | null;
  description: string;
  status?: "SUCCESS" | "FAILURE";
  ipAddress?: string | null;
  metadata?: Record<string, any> | null;
}

export interface AuditLogQueryFilters {
  page?: number;
  limit?: number;
  category?: string;
  actorId?: string;
  actorRole?: string;
  action?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface ManagerActivitySummary {
  managerId: string;
  managerName: string;
  managerEmail: string;
  lastLoginAt: string | null;
  managedEmployeesCount: number;
  skillGapReviewsCount: number;
  reportsAccessedCount: number;
  reassessmentsCount: number;
  recentActivities: {
    id: string;
    action: string;
    description: string;
    createdAt: string;
    targetName?: string | null;
  }[];
}

/**
 * Sanitizes metadata to strictly ensure no credentials, tokens, or hashes are logged.
 */
function sanitizeMetadata(metadata?: Record<string, any> | null): Record<string, any> | undefined {
  if (!metadata) return undefined;
  const sensitiveKeys = [
    "password",
    "passwordhash",
    "confirmPassword",
    "token",
    "secret",
    "authorization",
    "apikey",
    "cookie",
    "session",
  ];

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (sensitiveKeys.some((s) => key.toLowerCase().includes(s.toLowerCase()))) {
      continue;
    }
    sanitized[key] = value;
  }
  return sanitized;
}

export class AuditService {
  /**
   * Records a security, administrative, or operational audit event.
   * Lightweight, non-blocking, and never throws to the caller.
   */
  static async log(params: LogActivityParams): Promise<void> {
    try {
      if (!params.organizationId) return;

      const safeMeta = sanitizeMetadata(params.metadata);

      await prisma.auditLog.create({
        data: {
          organizationId: params.organizationId,
          actorId: params.actorId ?? null,
          actorName: params.actorName ?? null,
          actorRole: (params.actorRole as UserRole) ?? null,
          action: params.action,
          category: params.category,
          targetId: params.targetId ?? null,
          targetName: params.targetName ?? null,
          description: params.description,
          status: params.status ?? "SUCCESS",
          ipAddress: params.ipAddress ?? null,
          metadata: safeMeta ?? undefined,
        },
      });
    } catch (err) {
      console.error("[AuditService.log] Failed to record audit log:", err);
    }
  }

  /**
   * Retrieves paginated, filtered audit logs for an organization.
   * Strictly enforces organization isolation.
   */
  static async getAuditLogs(
    organizationId: string,
    filters: AuditLogQueryFilters = {}
  ) {
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filters.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {
      organizationId,
    };

    if (filters.category && filters.category !== "ALL") {
      where.category = filters.category;
    }

    if (filters.actorRole && filters.actorRole !== "ALL") {
      where.actorRole = filters.actorRole;
    }

    if (filters.actorId) {
      where.actorId = filters.actorId;
    }

    if (filters.action) {
      where.action = filters.action;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.createdAt.lte = new Date(filters.endDate);
      }
    }

    if (filters.search && filters.search.trim().length > 0) {
      const s = filters.search.trim();
      where.OR = [
        { description: { contains: s, mode: "insensitive" } },
        { actorName: { contains: s, mode: "insensitive" } },
        { targetName: { contains: s, mode: "insensitive" } },
        { action: { contains: s, mode: "insensitive" } },
      ];
    }

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return {
      logs: logs.map((l) => ({
        id: l.id,
        organizationId: l.organizationId,
        actorId: l.actorId,
        actorName: l.actorName || "System / Unauthenticated",
        actorRole: l.actorRole,
        action: l.action,
        category: l.category,
        targetId: l.targetId,
        targetName: l.targetName,
        description: l.description,
        status: l.status,
        ipAddress: l.ipAddress,
        metadata: l.metadata,
        createdAt: l.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Aggregates managerial activity metrics and recent operations for administrative oversight.
   */
  static async getManagerActivityOverview(organizationId: string): Promise<ManagerActivitySummary[]> {
    // 1. Fetch all managers in the organization
    const managers = await prisma.user.findMany({
      where: {
        organizationId,
        role: "MANAGER",
      },
      select: {
        id: true,
        name: true,
        email: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { name: "asc" },
    });

    const totalEmployees = await prisma.employee.count({
      where: { organizationId },
    });

    // 2. Aggregate metrics for each manager from audit logs
    const summaries = await Promise.all(
      managers.map(async (m) => {
        const [skillGapCount, reportCount, reassessmentCount, recentLogs] = await Promise.all([
          prisma.auditLog.count({
            where: {
              organizationId,
              actorId: m.id,
              action: { in: ["MANAGER_VIEW_SKILL_GAP", "MANAGER_VIEW_COMPETENCY"] },
            },
          }),
          prisma.auditLog.count({
            where: {
              organizationId,
              actorId: m.id,
              action: "MANAGER_REPORT_ACCESSED",
            },
          }),
          prisma.auditLog.count({
            where: {
              organizationId,
              actorId: m.id,
              action: "MANAGER_REASSESSMENT_REVIEW",
            },
          }),
          prisma.auditLog.findMany({
            where: {
              organizationId,
              actorId: m.id,
            },
            orderBy: { createdAt: "desc" },
            take: 5,
            select: {
              id: true,
              action: true,
              description: true,
              createdAt: true,
              targetName: true,
            },
          }),
        ]);

        return {
          managerId: m.id,
          managerName: m.name,
          managerEmail: m.email,
          lastLoginAt: m.lastLoginAt ? m.lastLoginAt.toISOString() : null,
          managedEmployeesCount: totalEmployees,
          skillGapReviewsCount: skillGapCount,
          reportsAccessedCount: reportCount,
          reassessmentsCount: reassessmentCount,
          recentActivities: recentLogs.map((l) => ({
            id: l.id,
            action: l.action,
            description: l.description,
            createdAt: l.createdAt.toISOString(),
            targetName: l.targetName,
          })),
        };
      })
    );

    return summaries;
  }
}
