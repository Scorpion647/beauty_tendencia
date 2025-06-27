import { toZonedTime, format } from 'date-fns-tz';
import { supabase } from "@/lib/supabaseClient";

// define tu zona
const timeZone = 'America/Bogota';


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
  user_id: string;
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
 const zonedSale = toZonedTime(new Date(saleDate), timeZone);
  const zonedToday = toZonedTime(new Date(), timeZone);

  switch (filterType) {
    case "today":
      return (
        zonedSale.getDate() === zonedToday.getDate() &&
        zonedSale.getMonth() === zonedToday.getMonth() &&
        zonedSale.getFullYear() === zonedToday.getFullYear()
      );
    case "specific_day":
      return format(zonedSale, 'yyyy-MM-dd') === options.day;
    case "specific_week":
      const saleWeek = getWeekNumber(zonedSale);
      return (
        saleWeek === options.week &&
        zonedSale.getFullYear() === (options.year || zonedToday.getFullYear())
      );
    case "specific_month":
      return (
        zonedSale.getMonth() + 1 === options.month &&
        zonedSale.getFullYear() === (options.year || zonedToday.getFullYear())
      );
    case "current_week":
      const currentWeek = getWeekNumber(zonedToday);
      return (
        getWeekNumber(zonedSale) === currentWeek &&
        zonedSale.getFullYear() === zonedToday.getFullYear()
      );
    case "current_month":
      return (
        zonedSale.getMonth() === zonedToday.getMonth() &&
        zonedSale.getFullYear() === zonedToday.getFullYear()
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
  let { data: users, error: userError } =
    await supabase.from("users").select("id, nombres");
  if (userError) throw new Error(`Error al obtener usuarios: ${userError.message}`);
  users = users ?? [];

  // 1.1 Filtrar usuarios si se especifica userId
  const relevantUsers = userId
    ? users.filter((user) => user.id === userId)
    : users;

  // 2. Traer todos los registros de venta
  let { data: salesRecords, error: salesError } =
    await supabase.from("sales_records").select("*");
  if (salesError) throw new Error(`Error al obtener ventas: ${salesError.message}`);
  salesRecords = salesRecords ?? [];

  // 3. Traer todos los ítems de venta
  const { data: salesItems, error: itemsError } =
    await supabase.from("sales_items").select("*");
  if (itemsError) throw new Error(`Error al obtener ítems de venta: ${itemsError.message}`);

  // 4. Filtrar por usuario en los registros si se especifica
  if (userId) {
    salesRecords = salesRecords.filter((zonedSale) => zonedSale.user_id === userId);
  }

  // 5. Filtrar por fecha
  const filteredSales = salesRecords.filter((zonedSale) =>
    isWithinFilter(zonedSale.sale_date, filterType, options)
  );

  // 6. Enlazar ítems con ventas
  const salesWithItems = filteredSales.map((zonedSale) => ({
    ...zonedSale,
    sales_items: (salesItems ?? [])
      .filter((item) => item.sale_id === zonedSale.id)
      .map((item) => ({
        service_name: item.service_name,
        service_cost: item.service_cost,
        service_quantity: item.service_quantity,
      })),
  }));

  // 7. Agrupar por usuario filtrado
  const result: UserSalesData[] = relevantUsers.map((user) => {
    const userSales = salesWithItems.filter((zonedSale) => zonedSale.user_id === user.id);

    const total = userSales.reduce((sum, zonedSale) => sum + zonedSale.total_amount, 0);
    const Ganado = userSales.reduce((sum, zonedSale) => sum + zonedSale.earnings_amount, 0);

    return {
      name: user.nombres,
      total,
      Ganado,
      sales_records: userSales.map((zonedSale) => ({
        sale_code: zonedSale.sale_code,
        total_amount: zonedSale.total_amount,
        earnings_amount: zonedSale.earnings_amount,
        sale_date: zonedSale.sale_date,
        user_id: zonedSale.user_id,
        payment_method: zonedSale.payment_method,
        sales_items: zonedSale.sales_items,
      })),
    };
  });

  return result;
}






