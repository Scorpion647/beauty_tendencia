import { supabaseServer as supabase } from '@/lib/pruebasupa';
import ExcelJS from 'exceljs';

interface ReportParams {
  startDate: string;
  endDate?: string;
  crearAbono?: boolean;
}

function formatCurrency(
    value: number,
    locale: string = 'es-CO',
    currency: string = 'COP'
): string {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 0, // ó 2 si quieres siempre centavos
        maximumFractionDigits: 2,
    }).format(value);
}

export async function generateCutReport({ startDate, endDate, crearAbono }: ReportParams): Promise<ArrayBuffer> {
  const start = `${startDate.slice(0, 10)}T00:00:00Z`;
  const finish = endDate
    ? `${endDate.slice(0, 10)}T23:59:59Z`
    : new Date().toISOString();

  const { data: loansData, error: loansError } = await supabase
    .from('employee_loans')
    .select('user_id, tipo_operacion, monto');
  if (loansError) throw new Error(`Error loans: ${loansError.message}`);

  const { data: salesData, error: salesError } = await supabase
    .from('sales_records')
    .select('user_id, earnings_amount, total_amount')
    .gte('sale_date', start)
    .lte('sale_date', finish);
  if (salesError) throw new Error(`Error sales_records: ${salesError.message}`);

  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, nombres, apellidos');
  if (usersError) throw new Error(`Error users: ${usersError.message}`);

  const reportUsers = [];

  for (const u of users!) {
    const userLoans = loansData!.filter(l => l.user_id === u.id);
    const totalLoans = userLoans
      .filter(l => l.tipo_operacion === 'prestamo')
      .reduce((s, l) => s + Number(l.monto), 0);
    const totalPayments = userLoans
      .filter(l => l.tipo_operacion === 'abono')
      .reduce((s, l) => s + Number(l.monto), 0);
    const netLoans = totalLoans - totalPayments;

    const userSales = salesData!.filter(s => s.user_id === u.id);
    const totalEarned = userSales.reduce((s, r) => s + Number(r.total_amount), 0);
    const earningsAmount = userSales.reduce((s, r) => s + Number(r.earnings_amount), 0);

    const restadoDelPrestamo = Math.min(netLoans, earningsAmount);
    const toPay = Math.max(earningsAmount - restadoDelPrestamo, 0);

    reportUsers.push({
      fullName: `${u.nombres} ${u.apellidos}`,
      totalEarned: formatCurrency(totalEarned),
      netLoans: formatCurrency(netLoans),
      toPay: formatCurrency(toPay),
      restadoDelPrestamo: formatCurrency(restadoDelPrestamo),
      userId: u.id,
    });

    if (crearAbono && restadoDelPrestamo > 0) {
      const { error: insertError } = await supabase
        .from('employee_loans')
        .insert({
          user_id: u.id,
          tipo_operacion: 'abono',
          monto: restadoDelPrestamo,
        });

      if (insertError) {
        console.error(`❌ Error al registrar abono de ${restadoDelPrestamo} para ${u.id}:`, insertError.message);
      }
    }
  }

  const { data: prodData, error: prodDataError } = await supabase
    .from('ventas_productos')
    .select('producto_id, cantidad, total')
    .gte('created_at', start)
    .lte('created_at', finish);
  if (prodDataError) throw new Error(`Error ventas_productos: ${prodDataError.message}`);

  const prodIds = Array.from(new Set(prodData!.map(r => r.producto_id)));
  const { data: prodNames, error: prodNamesError } = await supabase
    .from('productos')
    .select('id, nombre')
    .in('id', prodIds);
  if (prodNamesError) throw new Error(`Error productos: ${prodNamesError.message}`);

  const reportProducts = prodIds.map(id => {
    const recs = prodData!.filter(r => r.producto_id === id);
    const qty = recs.reduce((s, r) => s + Number(r.cantidad), 0);
    const rev = recs.reduce((s, r) => s + Number(r.total), 0);
    const name = prodNames!.find(p => p.id === id)?.nombre ?? '—';
    return { nombre: name, qty, rev };
  });

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Corte');

  // 🟣 Encabezados con estilo
  const headerStyle = {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'BE185D' } }, // pink.800
    font: { bold: true, color: { argb: 'FDE68A' } }, // yellow.300
    alignment: { horizontal: 'center', vertical: 'middle' },
  };

  // Usuarios
  const header1 = ['Nombre completo', 'Total ganado', 'Préstamos netos', 'A pagar', 'Préstamo abonado', "¿Abono automatico Aplicado?"];
  const rowHeader1 = ws.addRow(header1);
  rowHeader1.eachCell(cell => Object.assign(cell, headerStyle));

  reportUsers.forEach((u, idx) =>
    ws.addRow([
      u.fullName,
      u.totalEarned,
      u.netLoans,
      u.toPay,
      u.restadoDelPrestamo,
      idx === 0 ? (crearAbono ? "Si" : "No") : '', // solo en la primera fila
    ])
  );

  ws.addRow([]);
  ws.addRow([]);

  // Productos
  const header2 = ['Producto', 'Cantidad vendida', 'Total ganado'];
  const rowHeader2 = ws.addRow(header2);
  rowHeader2.eachCell(cell => Object.assign(cell, headerStyle));

  reportProducts.forEach(p =>
    ws.addRow([p.nombre, p.qty, formatCurrency(p.rev)])
  );

  // 🧠 Autoajustar ancho según contenido
  ws.columns.forEach((column) => {
    let maxLength = 10;

    if (column.eachCell) {
      column.eachCell({ includeEmpty: true }, (cell) => {
        const value = cell.value ? cell.value.toString() : '';
        maxLength = Math.max(maxLength, value.length);
      });
    }

    column.width = maxLength + 2;
    column.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  return await wb.xlsx.writeBuffer();
}




