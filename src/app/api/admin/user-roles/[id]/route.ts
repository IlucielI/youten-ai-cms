import { adminController } from '@/server/controllers';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return adminController.updateUserRole(request, id);
}
