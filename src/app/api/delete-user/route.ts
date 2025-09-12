import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/pruebasupa'; // Este usa la service_role

export async function POST(request: Request) {
  const { userId } = await request.json();

  if (!userId) {
    return NextResponse.json({ error: 'ID de usuario requerido' }, { status: 400 });
  }

  const { error: deleteAuthError } = await supabaseServer.auth.admin.deleteUser(userId);

  if (deleteAuthError) {
    return NextResponse.json({ error: `Error al eliminar Auth: ${deleteAuthError.message}` }, { status: 500 });
  }

  const { error: deleteRowError } = await supabaseServer
    .from('users')
    .delete()
    .eq('id', userId);

  if (deleteRowError) {
    return NextResponse.json({ error: `Error al eliminar fila: ${deleteRowError.message}` }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
