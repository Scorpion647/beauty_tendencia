import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Cliente con acceso administrativo
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY!
)

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, nombres, apellidos, celular, correo, rol } = body

    if (!id || !nombres || !apellidos || !celular || !correo || !rol) {
      return NextResponse.json({ message: 'Faltan campos requeridos' }, { status: 400 })
    }

    // 1. Actualizar el correo en `auth.users`
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, {
      email: correo,
    })

    if (authError) {
      console.error('Error actualizando correo en auth:', authError.message)
      return NextResponse.json({ message: authError.message }, { status: 500 })
    }

    // 2. Actualizar la tabla `users`
    const { error: dbError } = await supabaseAdmin
      .from('users')
      .update({ nombres, apellidos, celular, correo, rol })
      .eq('id', id)

    if (dbError) {
      console.error('Error actualizando perfil:', dbError.message)
      return NextResponse.json({ message: dbError.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Usuario actualizado correctamente', rol })
  } catch (err) {
    console.error('Error inesperado:', err)
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 })
  }
}



