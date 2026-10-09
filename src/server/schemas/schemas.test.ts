import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  BaseResponseSchema,
  createApiResponseSchema,
  RawCoreApiHealthSchema,
  CoreApiToDomainHealthSchema,
  PaginationQuerySchema,
  createPaginatedResponseSchema,
  validateSchema,
  safeValidateSchema,
} from './index';
import { ResponseStatus, ResponseCode, HealthStatus } from '../constants';
import { BadRequestError } from '../errors/app.error';

describe('Zod Schemas & Validation Helpers', () => {
  describe('BaseResponseSchema', () => {
    it('should validate a valid base response payload', () => {
      const validPayload = {
        status: ResponseStatus.SUCCESS,
        code: ResponseCode.SUCCESS,
        message: 'Operation succeeded',
        timestamp: new Date().toISOString(),
      };

      const result = BaseResponseSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it('should fail on invalid status', () => {
      const invalidPayload = {
        status: 'UNKNOWN_STATUS',
        code: ResponseCode.SUCCESS,
        message: 'Operation succeeded',
        timestamp: new Date().toISOString(),
      };

      const result = BaseResponseSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });
  });

  describe('createApiResponseSchema', () => {
    it('should validate generic typed response envelope', () => {
      const DataSchema = z.object({ id: z.number(), name: z.string() });
      const UserResponseSchema = createApiResponseSchema(DataSchema);

      const validPayload = {
        status: ResponseStatus.SUCCESS,
        code: ResponseCode.SUCCESS,
        message: 'User found',
        timestamp: new Date().toISOString(),
        data: { id: 1, name: 'Alice' },
      };

      const result = UserResponseSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });
  });

  describe('Anti-Corruption Layer (ACL): CoreApiToDomainHealthSchema', () => {
    it('should parse raw external API snake_case payload into internal domain model', () => {
      const rawApiPayload = {
        app_version: '2.4.1',
        uptime_seconds: 3600,
        commit_hash: 'git-9988',
        service_status: 'ok',
        server_time: '2026-09-28T12:00:00Z',
      };

      const rawValidation = RawCoreApiHealthSchema.safeParse(rawApiPayload);
      expect(rawValidation.success).toBe(true);

      const domainModel = CoreApiToDomainHealthSchema.parse(rawApiPayload);
      expect(domainModel.version).toBe('2.4.1');
      expect(domainModel.gitHash).toBe('git-9988');
      expect(domainModel.status).toBe(HealthStatus.OK);
      expect(domainModel.startedAt).toBeInstanceOf(Date);
    });

    it('should map degraded/down raw status correctly to domain HealthStatus', () => {
      const rawDegraded = {
        app_version: '1.0.0',
        uptime_seconds: 120,
        commit_hash: 'hash-1',
        service_status: 'degraded',
        server_time: '2026-09-28T12:00:00Z',
      };

      const degradedDomain = CoreApiToDomainHealthSchema.parse(rawDegraded);
      expect(degradedDomain.status).toBe(HealthStatus.DEGRADED);

      const rawDown = {
        ...rawDegraded,
        service_status: 'down',
      };

      const downDomain = CoreApiToDomainHealthSchema.parse(rawDown);
      expect(downDomain.status).toBe(HealthStatus.ERROR);
    });
  });

  describe('Validation Helpers', () => {
    const TestSchema = z.object({
      name: z.string().min(2),
      count: z.number().positive(),
    });

    it('validateSchema should return parsed data on valid input', () => {
      const result = validateSchema(TestSchema, { name: 'Valid', count: 5 });
      expect(result).toEqual({ name: 'Valid', count: 5 });
    });

    it('validateSchema should throw BadRequestError on invalid input', () => {
      expect(() => validateSchema(TestSchema, { name: 'A', count: -1 })).toThrow(BadRequestError);
    });

    it('safeValidateSchema should safely return result without throwing', () => {
      const valid = safeValidateSchema(TestSchema, { name: 'Valid', count: 10 });
      expect(valid.success).toBe(true);

      const invalid = safeValidateSchema(TestSchema, { name: '' });
      expect(invalid.success).toBe(false);
    });
  });

  describe('Pagination Schemas & Helpers', () => {
    it('should coerce string query parameters to numbers with defaults', () => {
      const parsed = PaginationQuerySchema.parse({
        page: '3',
        limit: '20',
        search: '  product  ',
      });

      expect(parsed.page).toBe(3);
      expect(parsed.limit).toBe(20);
      expect(parsed.search).toBe('product');
      expect(parsed.sortOrder).toBe('asc');
    });

    it('should apply fallback defaults when query params are omitted', () => {
      const parsed = PaginationQuerySchema.parse({});

      expect(parsed.page).toBe(1);
      expect(parsed.limit).toBe(10);
      expect(parsed.sortOrder).toBe('asc');
    });

    it('should validate complete paginated response envelope', () => {
      const ItemSchema = z.object({ id: z.number(), title: z.string() });
      const PaginatedItemsSchema = createPaginatedResponseSchema(ItemSchema);

      const payload = {
        status: ResponseStatus.SUCCESS,
        code: ResponseCode.SUCCESS,
        message: 'Items retrieved',
        data: [{ id: 1, title: 'Item 1' }, { id: 2, title: 'Item 2' }],
        pagination: {
          page: 1,
          limit: 10,
          totalItems: 45,
          totalPages: 5,
          hasNextPage: true,
          hasPrevPage: false,
        },
        timestamp: new Date().toISOString(),
      };

      const result = PaginatedItemsSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('should calculate pagination metadata accurately with buildPaginationMeta', async () => {
      const { buildPaginationMeta } = await import('../dtos/response.dto');
      const meta = buildPaginationMeta(2, 10, 45);

      expect(meta.page).toBe(2);
      expect(meta.limit).toBe(10);
      expect(meta.totalItems).toBe(45);
      expect(meta.totalPages).toBe(5);
      expect(meta.hasNextPage).toBe(true);
      expect(meta.hasPrevPage).toBe(true);
    });
  });

  describe('AdminJobItemSchema & Meeting Bot Support', () => {
    it('should validate job with MEETING_BOT source_type, bot_provider, and analytics_data', async () => {
      const { AdminJobItemSchema, AdminJobQuerySchema } = await import('./admin.schema');

      const meetingBotJob = {
        id: 'd1000000-0000-4000-8000-000000000006',
        title: 'Board Sync (Google Meet)',
        original_filename: 'gmeet_rec.webm',
        file_size_bytes: 15400000,
        duration_seconds: 1800,
        source_type: 'MEETING_BOT',
        bot_provider: 'google_meet',
        status: 'COMPLETED',
        selected_template: 'MOM',
        output_language: 'id',
        is_guest: false,
        analytics_data: {
          session_id: 'bot-sess-123',
          meeting_url: 'https://meet.google.com/abc-defg-hij',
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const result = AdminJobItemSchema.safeParse(meetingBotJob);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.source_type).toBe('MEETING_BOT');
        expect(result.data.bot_provider).toBe('google_meet');
        expect(result.data.analytics_data?.session_id).toBe('bot-sess-123');
      }

      const queryResult = AdminJobQuerySchema.safeParse({
        source_type: 'MEETING_BOT',
        bot_provider: 'google_meet',
        page: '1',
      });
      expect(queryResult.success).toBe(true);
      if (queryResult.success) {
        expect(queryResult.data.source_type).toBe('MEETING_BOT');
        expect(queryResult.data.bot_provider).toBe('google_meet');
      }
    });
  });
});
