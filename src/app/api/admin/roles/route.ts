import { adminController } from '@/server/controllers';

export async function GET(request: Request) {
  return adminController.listRoles(request);
}

export async function POST(request: Request) {
  return adminController.createRole(request);
}
