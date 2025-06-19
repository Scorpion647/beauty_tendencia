// app/api/createuser/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Aquí estamos usando la Service Role Key, que debe estar en .env.local:
//   NEXT_PUBLIC_SUPABASE_URL=…
//   SUPABASE_SERVICE_ROLE_KEY=…
// (OJO: Next.js inyecta automáticamente las variables de entorno en server code)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY!
);

interface CreateUserBody {
  nombres: string;
  apellidos: string;
  celular: string;
  correo: string;
  rol?: "admin" | "employee" | "guest";
}

export async function POST(req: NextRequest) {
  try {
    const body: CreateUserBody = await req.json();

    const { nombres, apellidos, celular, correo, rol = "guest" } = body;

    if (!nombres || !apellidos || !celular || !correo) {
      return NextResponse.json(
        { message: "Faltan datos obligatorios." },
        { status: 400 }
      );
    }

    // 1) Crear el usuario en Auth (admin) con password = correo y email_confirm = true
    const { data, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: correo,
      password: correo,
      email_confirm: true,
    });

    if (authError) {
      // Por ejemplo: “User not allowed” si la clave no es service_role o si algo no está bien
      console.error("[createuser] auth.createUser error:", authError);
      return NextResponse.json(
        { message: `Error al crear usuario en Auth: ${authError.message}` },
        { status: 500 }
      );
    }

    const userId = data.user?.id;
    if (!userId) {
      return NextResponse.json(
        { message: "No se obtuvo el ID tras crear el usuario en Auth." },
        { status: 500 }
      );
    }

    // 2) Insertar en la tabla `public.users`
    const { error: insertError } = await supabaseAdmin
      .from("users")
      .insert([{ id: userId, nombres, apellidos, celular, correo, rol }]);

    if (insertError) {
      console.error("[createuser] insert into users error:", insertError);
      // Opcional: podrías eliminar el usuario en Auth si falla el insert
      // await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { message: `Error al insertar en public.users: ${insertError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Usuario creado con éxito", userId },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("[createuser] Excepción inesperada:", err);
    let msg = "Error interno";
    if (err instanceof Error) msg = err.message;
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}
