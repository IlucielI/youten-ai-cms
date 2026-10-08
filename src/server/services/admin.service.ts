import { IAdminService } from './admin.service.interface';
import { IAdminRepository } from '../repositories/admin.repository.interface';
import { adminRepository } from '../repositories/admin.repository';
import {
  SystemOverviewStats,
  CostOversight,
  AdminUserItem,
  AdminListUsersQuery,
  AdminRoleItem,
  AdminCreateRoleRequest,
  AdminUpdateRoleRequest,
  AdminUserRoleItem,
  AdminCreateUserRoleRequest,
  AdminUpdateUserRoleRequest,
  AdminAssignUserRoleRequest,
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
  AdminJobListResponse,
  AdminJobQuery,
} from '../schemas/admin.schema';

export class AdminService implements IAdminService {
  constructor(private readonly repo: IAdminRepository = adminRepository) {}

  async getOverviewStats(): Promise<SystemOverviewStats> {
    return this.repo.getOverviewStats();
  }

  async getCostOversight(): Promise<CostOversight> {
    return this.repo.getCostOversight();
  }

  async listUsers(query?: AdminListUsersQuery): Promise<{ items: AdminUserItem[]; total: number }> {
    return this.repo.listUsers(query);
  }

  async overrideUserQuota(userId: string, dailyQuotaMinutes: number): Promise<void> {
    return this.repo.overrideUserQuota(userId, dailyQuotaMinutes);
  }

  async revokeUserSessions(userId: string): Promise<void> {
    return this.repo.revokeUserSessions(userId);
  }

  async listRoles(): Promise<AdminRoleItem[]> {
    return this.repo.listRoles();
  }

  async createRole(data: AdminCreateRoleRequest): Promise<AdminRoleItem> {
    return this.repo.createRole(data);
  }

  async updateRole(id: string, data: AdminUpdateRoleRequest): Promise<AdminRoleItem> {
    return this.repo.updateRole(id, data);
  }

  async listUserRoles(): Promise<AdminUserRoleItem[]> {
    return this.repo.listUserRoles();
  }

  async createUserRole(data: AdminCreateUserRoleRequest): Promise<AdminUserRoleItem> {
    return this.repo.createUserRole(data);
  }

  async updateUserRole(id: string, data: AdminUpdateUserRoleRequest): Promise<AdminUserRoleItem> {
    return this.repo.updateUserRole(id, data);
  }

  async assignUserRole(userId: string, data: AdminAssignUserRoleRequest): Promise<AdminUserItem> {
    return this.repo.assignUserRole(userId, data);
  }

  async listTemplates(): Promise<AdminTemplateItem[]> {
    return this.repo.listTemplates();
  }

  async createTemplate(data: AdminCreateTemplateRequest): Promise<AdminTemplateItem> {
    return this.repo.createTemplate(data);
  }

  async updateTemplate(id: string, data: AdminUpdateTemplateRequest): Promise<AdminTemplateItem> {
    return this.repo.updateTemplate(id, data);
  }

  async testTemplate(data: AdminTestTemplateRequest): Promise<AdminTestTemplateResult> {
    return this.repo.testTemplate(data);
  }

  async getDLQMessages(query?: { stage?: string; page?: number; limit?: number }): Promise<{ items: AdminDLQItem[]; total: number }> {
    return this.repo.getDLQMessages(query);
  }

  async retryDLQJob(data: AdminRetryDLQRequest): Promise<void> {
    return this.repo.retryDLQJob(data);
  }

  async getSystemConfig(): Promise<AdminSystemConfig> {
    return this.repo.getSystemConfig();
  }

  async updateSystemConfig(data: AdminUpdateSystemConfigRequest): Promise<AdminSystemConfig> {
    return this.repo.updateSystemConfig(data);
  }

  async listReports(query?: { status?: string; page?: number; limit?: number }): Promise<{ items: AdminReportItem[]; total: number }> {
    return this.repo.listReports(query);
  }

  async resolveReport(id: string, data: AdminResolveReportRequest): Promise<void> {
    return this.repo.resolveReport(id, data);
  }

  async listAuditLogs(query?: AdminAuditLogQuery): Promise<{ items: AdminAuditLogItem[]; total: number }> {
    return this.repo.listAuditLogs(query);
  }

  async getJobs(query?: AdminJobQuery): Promise<AdminJobListResponse> {
    return this.repo.getJobs(query);
  }
}

export const adminService: IAdminService = new AdminService();
