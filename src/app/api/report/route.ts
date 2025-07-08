// app/api/report/route.ts
import { generateCutReport } from "@/lib/generateCutReport"

export async function POST(req: Request) {
  try {
    const { startDate, endDate, crearAbono } = await req.json();
    if (!startDate) {
      return new Response(
        JSON.stringify({ error: 'startDate es obligatorio' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generamos el ArrayBuffer
    const arrayBuffer = await generateCutReport({ startDate, endDate, crearAbono });

    // Convertimos a Buffer de Node.js
    const buffer = Buffer.from(arrayBuffer);
    const filename = `corte_${startDate}_${endDate || 'hoy'}.xlsx`;

    // Éxito: devolvemos el archivo
    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error: any) {
    // 🚨 Muestra stack en consola del servidor Next.js
    console.error('💥 Error en /api/report:', error.stack || error);

    // Siempre respondemos JSON en error
    return new Response(
      JSON.stringify({ error: error.message || 'Error generando reporte' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
