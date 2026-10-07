import { adminController } from '@/server/controllers';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return adminController.overrideUserQuota(request, id);
}
