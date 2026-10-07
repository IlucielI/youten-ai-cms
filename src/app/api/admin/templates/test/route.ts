import { adminController } from '@/server/controllers';

export async function POST(request: Request) {
  return adminController.testTemplate(request);
}
