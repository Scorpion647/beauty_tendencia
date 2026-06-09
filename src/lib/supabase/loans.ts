import { supabase } from "@/lib/supabaseClient";

export interface LoanRecord {
  id: string;
  user_id: string;
  monto: number;
  tipo_operacion: "prestamo" | "abono";
  creado_en: string;
}

type FilterOption = "Dia" | "Semana" | "Mes";

const BOGOTA_UTC_OFFSET = "-05:00";

function toLoanAmount(value: number | string | null): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function addUtcDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function getBogotaDateRange(date: string, filtro: FilterOption) {
  const selected = new Date(`${date}T00:00:00.000${BOGOTA_UTC_OFFSET}`);
  const year = selected.getUTCFullYear();
  const month = selected.getUTCMonth();

  if (filtro === "Semana") {
    const diffToMonday = (selected.getUTCDay() + 6) % 7;
    const start = addUtcDays(selected, -diffToMonday);
    return { start, end: addUtcDays(start, 7) };
  }

  if (filtro === "Mes") {
    return {
      start: new Date(Date.UTC(year, month, 1, 5, 0, 0, 0)),
      end: new Date(Date.UTC(year, month + 1, 1, 5, 0, 0, 0)),
    };
  }

  return { start: selected, end: addUtcDays(selected, 1) };
}

export async function createLoanRecord(
  userId: string,
  tipo_operacion: "prestamo" | "abono",
  monto: number
) {
  if (!userId) throw new Error("Debes seleccionar un empleado.");
  if (!Number.isFinite(monto) || monto <= 0) {
    throw new Error("El monto debe ser mayor a cero.");
  }

  const { data, error } = await supabase
    .from("employee_loans")
    .insert([{ user_id: userId, tipo_operacion, monto }])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getEmployeeDebt(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from("employee_loans")
    .select("tipo_operacion, monto")
    .eq("user_id", userId);

  if (error) throw new Error(error.message);

  return (data ?? []).reduce(
    (total: number, record: { tipo_operacion: string; monto: number | string }) => {
      const monto = toLoanAmount(record.monto);
      return record.tipo_operacion === "prestamo" ? total + monto : total - monto;
    },
    0
  );
}

export async function getLoanRecords(
  userId?: string,
  date?: string,
  filtro?: FilterOption
): Promise<LoanRecord[]> {
  let query = supabase
    .from("employee_loans")
    .select("*")
    .order("creado_en", { ascending: false });

  if (userId) {
    query = query.eq("user_id", userId);
  }

  if (date) {
    const { start, end } = getBogotaDateRange(date, filtro || "Dia");
    query = query.gte("creado_en", start.toISOString()).lt("creado_en", end.toISOString());
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);

  return (data ?? []).map((record) => ({
    ...record,
    monto: toLoanAmount(record.monto as number | string),
  })) as LoanRecord[];
}
