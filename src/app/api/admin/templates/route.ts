import { adminController } from '@/server/controllers';

export async function GET(request: Request) {
  return adminController.listTemplates(request);
}

export async function POST(request: Request) {
  return adminController.createTemplate(request);
}
