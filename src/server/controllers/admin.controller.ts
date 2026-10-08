import { NextResponse } from 'next/server';
import { BaseController } from './base.controller';
import { IAdminService } from '../services/admin.service.interface';
import { adminService } from '../services/admin.service';
import { ILogger } from '../logger/logger.interface';
import {
  AdminListUsersQuerySchema,
  AdminOverrideQuotaRequestSchema,
  AdminCreateRoleRequestSchema,
  AdminUpdateRoleRequestSchema,
  AdminCreateTemplateRequestSchema,
  AdminUpdateTemplateRequestSchema,
  AdminTestTemplateRequestSchema,
  AdminRetryDLQRequestSchema,
  AdminUpdateSystemConfigRequestSchema,
  AdminResolveReportRequestSchema,
  AdminAuditLogQuerySchema,
  AdminJobQuerySchema,
} from '../schemas/admin.schema';

export class AdminController extends BaseController {
  constructor(
    private readonly service: IAdminService = adminService,
    logger?: ILogger
  ) {
    super(logger);
  }

  async getOverviewStats(req?: Request): Promise<NextResponse> {
    return this.handle(req, async () => {
      const data = await this.service.getOverviewStats();
      return { status: 'success', data };
    });
  }

  async getCostOversight(req?: Request): Promise<NextResponse> {
    return this.handle(req, async () => {
      const data = await this.service.getCostOversight();
      return { status: 'success', data };
    });
  }

  async listUsers(req: Request): Promise<NextResponse> {
    return this.handle(req, async () => {
      const query = this.getQuery(req, AdminListUsersQuerySchema);
      const res = await this.service.listUsers(query);
      return {
        status: 'success',
        data: res.items,
        pagination: {
          total: res.total,
          page: query.page,
          limit: query.limit,
          totalPages: Math.ceil(res.total / query.limit) || 1,
        },
      };
    });
  }

  async overrideUserQuota(req: Request, userId: string): Promise<NextResponse> {
    return this.handle(req, async () => {
      const body = await this.getBody(req, AdminOverrideQuotaRequestSchema);
      await this.service.overrideUserQuota(userId, body.daily_quota_minutes);
      return { status: 'success', message: 'Quota successfully overridden' };
    });
  }

  async revokeUserSessions(req: Request, userId: string): Promise<NextResponse> {
    return this.handle(req, async () => {
      await this.service.revokeUserSessions(userId);
      return { status: 'success', message: 'Active sessions revoked' };
    });
  }

  async listRoles(req?: Request): Promise<NextResponse> {
    return this.handle(req, async () => {
      const data = await this.service.listRoles();
      return { status: 'success', data };
    });
  }

  async createRole(req: Request): Promise<NextResponse> {
    return this.handle(req, async () => {
      const body = await this.getBody(req, AdminCreateRoleRequestSchema);
      const data = await this.service.createRole(body);
      return { status: 'success', data };
    }, { status: 201 });
  }

  async updateRole(req: Request, roleId: string): Promise<NextResponse> {
    return this.handle(req, async () => {
      const body = await this.getBody(req, AdminUpdateRoleRequestSchema);
      const data = await this.service.updateRole(roleId, body);
      return { status: 'success', data };
    });
  }

  async listTemplates(req?: Request): Promise<NextResponse> {
    return this.handle(req, async () => {
      const data = await this.service.listTemplates();
      return { status: 'success', data };
    });
  }

  async createTemplate(req: Request): Promise<NextResponse> {
    return this.handle(req, async () => {
      const body = await this.getBody(req, AdminCreateTemplateRequestSchema);
      const data = await this.service.createTemplate(body);
      return { status: 'success', data };
    }, { status: 201 });
  }

  async updateTemplate(req: Request, templateId: string): Promise<NextResponse> {
    return this.handle(req, async () => {
      const body = await this.getBody(req, AdminUpdateTemplateRequestSchema);
      const data = await this.service.updateTemplate(templateId, body);
      return { status: 'success', data };
    });
  }

  async testTemplate(req: Request): Promise<NextResponse> {
    return this.handle(req, async () => {
      const body = await this.getBody(req, AdminTestTemplateRequestSchema);
      const data = await this.service.testTemplate(body);
      return { status: 'success', data };
    });
  }

  async getDLQMessages(req: Request): Promise<NextResponse> {
    return this.handle(req, async () => {
      const url = new URL(req.url);
      const stage = url.searchParams.get('stage') || undefined;
      const page = Number(url.searchParams.get('page')) || 1;
      const limit = Number(url.searchParams.get('limit')) || 20;

      const res = await this.service.getDLQMessages({ stage, page, limit });
      return {
        status: 'success',
        data: res.items,
        pagination: {
          total: res.total,
          page,
          limit,
          totalPages: Math.ceil(res.total / limit) || 1,
        },
      };
    });
  }

  async retryDLQJob(req: Request): Promise<NextResponse> {
    return this.handle(req, async () => {
      const body = await this.getBody(req, AdminRetryDLQRequestSchema);
      await this.service.retryDLQJob(body);
      return { status: 'success', message: 'Job retry scheduled' };
    });
  }

  async getSystemConfig(req?: Request): Promise<NextResponse> {
    return this.handle(req, async () => {
      const data = await this.service.getSystemConfig();
      return { status: 'success', data };
    });
  }

  async updateSystemConfig(req: Request): Promise<NextResponse> {
    return this.handle(req, async () => {
      const body = await this.getBody(req, AdminUpdateSystemConfigRequestSchema);
      const data = await this.service.updateSystemConfig(body);
      return { status: 'success', data };
    });
  }

  async listReports(req: Request): Promise<NextResponse> {
    return this.handle(req, async () => {
      const url = new URL(req.url);
      const status = url.searchParams.get('status') || undefined;
      const page = Number(url.searchParams.get('page')) || 1;
      const limit = Number(url.searchParams.get('limit')) || 20;

      const res = await this.service.listReports({ status, page, limit });
      return {
        status: 'success',
        data: res.items,
        pagination: {
          total: res.total,
          page,
          limit,
          totalPages: Math.ceil(res.total / limit) || 1,
        },
      };
    });
  }

  async resolveReport(req: Request, reportId: string): Promise<NextResponse> {
    return this.handle(req, async () => {
      const body = await this.getBody(req, AdminResolveReportRequestSchema);
      await this.service.resolveReport(reportId, body);
      return { status: 'success', message: 'Report resolved' };
    });
  }

  async listAuditLogs(req: Request): Promise<NextResponse> {
    return this.handle(req, async () => {
      const query = this.getQuery(req, AdminAuditLogQuerySchema);
      const res = await this.service.listAuditLogs(query);
      return {
        status: 'success',
        data: res.items,
        pagination: {
          total: res.total,
          page: query.page,
          limit: query.limit,
          totalPages: Math.ceil(res.total / query.limit) || 1,
        },
      };
    });
  }

  async getJobs(req: Request): Promise<NextResponse> {
    return this.handle(req, async () => {
      const query = this.getQuery(req, AdminJobQuerySchema);
      const res = await this.service.getJobs(query);
      return {
        status: 'success',
        data: res.items,
        pagination: {
          total: res.total,
          page: res.page,
          limit: res.limit,
          totalPages: res.total_pages,
        },
      };
    });
  }
}

export const adminController = new AdminController();
