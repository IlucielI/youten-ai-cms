import {
  SystemOverviewStats,
  CostOversight,
  AdminUserItem,
  AdminListUsersQuery,
  AdminRoleItem,
  AdminCreateRoleRequest,
  AdminUpdateRoleRequest,
  AdminTemplateItem,
  AdminCreateTemplateRequest,
  AdminUpdateTemplateRequest,
  AdminTestTemplateRequest,
  AdminTestTemplateResult,
  AdminDLQItem,
  AdminRetryDLQRequest,
  AdminSystemConfig,
  AdminUpdateSystemConfigRequest,
  AdminReportItem,
  AdminResolveReportRequest,
  AdminAuditLogItem,
  AdminAuditLogQuery,
} from '../schemas/admin.schema';

export interface IAdminService {
  getOverviewStats(): Promise<SystemOverviewStats>;
  getCostOversight(): Promise<CostOversight>;
  listUsers(query?: AdminListUsersQuery): Promise<{ items: AdminUserItem[]; total: number }>;
  overrideUserQuota(userId: string, dailyQuotaMinutes: number): Promise<void>;
  revokeUserSessions(userId: string): Promise<void>;
  listRoles(): Promise<AdminRoleItem[]>;
  createRole(data: AdminCreateRoleRequest): Promise<AdminRoleItem>;
  updateRole(id: string, data: AdminUpdateRoleRequest): Promise<AdminRoleItem>;
  listTemplates(): Promise<AdminTemplateItem[]>;
  createTemplate(data: AdminCreateTemplateRequest): Promise<AdminTemplateItem>;
  updateTemplate(id: string, data: AdminUpdateTemplateRequest): Promise<AdminTemplateItem>;
  testTemplate(data: AdminTestTemplateRequest): Promise<AdminTestTemplateResult>;
  getDLQMessages(query?: { stage?: string; page?: number; limit?: number }): Promise<{ items: AdminDLQItem[]; total: number }>;
  retryDLQJob(data: AdminRetryDLQRequest): Promise<void>;
  getSystemConfig(): Promise<AdminSystemConfig>;
  updateSystemConfig(data: AdminUpdateSystemConfigRequest): Promise<AdminSystemConfig>;
  listReports(query?: { status?: string; page?: number; limit?: number }): Promise<{ items: AdminReportItem[]; total: number }>;
  resolveReport(id: string, data: AdminResolveReportRequest): Promise<void>;
  listAuditLogs(query?: AdminAuditLogQuery): Promise<{ items: AdminAuditLogItem[]; total: number }>;
}
