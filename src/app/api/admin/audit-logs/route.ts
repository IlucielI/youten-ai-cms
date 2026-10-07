import { adminController } from '@/server/controllers';

export async function GET(request: Request) {
  return adminController.listAuditLogs(request);
}
