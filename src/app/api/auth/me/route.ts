import { defaultAuthController } from '@/server/controllers';

export async function GET(request: Request) {
  return defaultAuthController.me(request);
}
