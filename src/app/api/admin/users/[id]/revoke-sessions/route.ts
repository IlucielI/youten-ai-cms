import { adminController } from '@/server/controllers';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return adminController.revokeUserSessions(request, id);
}
