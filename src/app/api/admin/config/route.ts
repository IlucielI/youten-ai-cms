import { adminController } from '@/server/controllers';

export async function GET(request: Request) {
  return adminController.getSystemConfig(request);
}

export async function PATCH(request: Request) {
  return adminController.updateSystemConfig(request);
}
