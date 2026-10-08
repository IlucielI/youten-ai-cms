import { adminController } from '@/server/controllers';

export async function GET(request: Request) {
  return adminController.listUserRoles(request);
}

export async function POST(request: Request) {
  return adminController.createUserRole(request);
}
