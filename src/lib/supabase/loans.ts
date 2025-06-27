import { supabase } from "@/lib/supabase/client";

export async function createLoanRecord(
  userId: string,
  tipo_operacion: "prestamo" | "abono",
  monto: number
) {
  const { data, error } = await supabase
    .from("employee_loans")
    .insert([{ user_id: userId, tipo_operacion, monto }]);

  if (error) throw new Error(error.message);
  return data;
}

export async function getEmployeeDebt(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from("employee_loans")
    .select("tipo_operacion, monto")
    .eq("user_id", userId);

  if (error) throw new Error(error.message);

  return data.reduce((total: number, record: { tipo_operacion: string; monto: number; }) => {
    return record.tipo_operacion === "prestamo"
      ? total + record.monto
      : total - record.monto;
  }, 0);
}



export interface LoanRecord {
  id: string;
  user_id: string;
  monto: number;
  tipo_operacion: "prestamo" | "abono";
  creado_en: string;
}

type FilterOption = "Dia" | "Semana" | "Mes";

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

  // Solo aplicar filtros de fecha si date está definido
  if (date) {
    const selected = new Date(date);
    const start = new Date(selected);
    const end = new Date(selected);

    const finalFiltro = filtro || "Dia";

    if (finalFiltro === "Dia") {
      end.setDate(end.getDate() + 1);
    } else if (finalFiltro === "Semana") {
      const day = selected.getDay();
      const diffToMonday = (day + 6) % 7;
      start.setDate(start.getDate() - diffToMonday);
      end.setDate(start.getDate() + 7);
    } else if (finalFiltro === "Mes") {
      start.setDate(1);
      end.setMonth(start.getMonth() + 1);
      end.setDate(0);
    }

    query = query
      .gte("creado_en", start.toISOString())
      .lt("creado_en", end.toISOString());
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);
  return data as LoanRecord[];
}


