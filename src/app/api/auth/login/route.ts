import { defaultAuthController } from '@/server/controllers';

export async function POST(request: Request) {
  return defaultAuthController.login(request);
}
