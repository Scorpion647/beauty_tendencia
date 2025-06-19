import { supabase } from "@/lib/supabaseClient";

interface SalesItem {
  service_name: string;
  service_cost: number;
  service_quantity: number;
}
export type SalesRecord = {
  sale_code: string;
  total_amount: number;
  earnings_amount: number;
  payment_method: string;  // Añadir esto
  sale_date: string;       // Añadir esto
  sales_items: SalesItem[];
};

interface UserSalesData {
  name: string;
  total: number;
  Ganado: number;
  sales_records: SalesRecord[];
}

function isWithinFilter(
  saleDate: string,
  filterType: string,
  options: { day?: string; week?: number; month?: number; year?: number }
): boolean {
  const sale = new Date(saleDate);
  const today = new Date();

  switch (filterType) {
    case "today":
      return (
        sale.getDate() === today.getDate() &&
        sale.getMonth() === today.getMonth() &&
        sale.getFullYear() === today.getFullYear()
      );
    case "specific_day":
      return sale.toISOString().split("T")[0] === options.day;
    case "specific_week":
      const saleWeek = getWeekNumber(sale);
      return (
        saleWeek === options.week &&
        sale.getFullYear() === (options.year || today.getFullYear())
      );
    case "specific_month":
      return (
        sale.getMonth() + 1 === options.month &&
        sale.getFullYear() === (options.year || today.getFullYear())
      );
    case "current_week":
      const currentWeek = getWeekNumber(today);
      return (
        getWeekNumber(sale) === currentWeek &&
        sale.getFullYear() === today.getFullYear()
      );
    case "current_month":
      return (
        sale.getMonth() === today.getMonth() &&
        sale.getFullYear() === today.getFullYear()
      );
    default:
      return true;
  }
}

function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear =
    (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

export async function listSalesSummary(
  filterType: "today" | "specific_day" | "specific_week" | "specific_month" | "current_week" | "current_month",
  options: { day?: string; week?: number; month?: number; year?: number },
  userId?: string
): Promise<UserSalesData[]> {
  // 1. Traer todos los usuarios
  const { data: users, error: userError } = await supabase.from("users").select("id, nombres");
  if (userError) throw new Error(`Error al obtener usuarios: ${userError.message}`);

  // 2. Traer todos los registros de venta
  let { data: salesRecords, error: salesError } = await supabase.from("sales_records").select("*");
  if (salesError) throw new Error(`Error al obtener ventas: ${salesError.message}`);
  salesRecords = salesRecords ?? []; // Aseguramos que siempre sea un array
  // 3. Traer todos los ítems de venta
  const { data: salesItems, error: itemsError } = await supabase.from("sales_items").select("*");
  if (itemsError) throw new Error(`Error al obtener ítems de venta: ${itemsError.message}`);


  // 4. Filtrar por usuario si se especifica
  if (userId) {
    salesRecords = salesRecords.filter((sale) => sale.user_id === userId);
  }

  // 5. Filtrar por fecha
  const filteredSales = salesRecords.filter((sale) =>
    isWithinFilter(sale.sale_date, filterType, options)
  );

  // 6. Enlazar ítems con ventas
  const salesWithItems = filteredSales.map((sale) => ({
    ...sale,
    sales_items: salesItems
      .filter((item) => item.sale_id === sale.id)
      .map((item) => ({
        service_name: item.service_name,
        service_cost: item.service_cost,
        service_quantity: item.service_quantity,
      })),
  }));

  // 7. Agrupar por usuario
  const result: UserSalesData[] = users.map((user) => {
    const userSales = salesWithItems.filter((sale) => sale.user_id === user.id);

    const total = userSales.reduce((sum, sale) => sum + sale.total_amount, 0);
    const Ganado = userSales.reduce((sum, sale) => sum + sale.earnings_amount, 0);

    return {
      name: user.nombres,
      total,
      Ganado,
      sales_records: userSales.map((sale) => ({
        sale_code: sale.sale_code,
        total_amount: sale.total_amount,
        earnings_amount: sale.earnings_amount,
        sale_date: sale.sale_date,
        user_id: sale.user_id,
        payment_method: sale.payment_method, // ✅ Agregado
        sales_items: sale.sales_items,
      }))
      ,
    };
  });

  return result;
}





