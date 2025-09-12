

import { supabase } from "@/lib/supabaseClient";
import { PostgrestError } from '@supabase/supabase-js';

type ServicioItem = {
  id: number;
  servicio: string;
  cantidad: number;
  precio: number;
  ganado: number;
};

type SaleRecord = {
  id: number;
  sale_code: string;
  payment_method: 'cash' | 'card' | 'transaction';
  total_amount: number;
  earnings_amount: number;
  user_id: string;
  created_at?: string;
};

type SalesItemInsert = {
  sale_id: number;
  service_name: string;
  service_cost: number;
  employee_earnings: number;
  service_quantity: number;
};

export async function createSaleRecord(
  userId: string,
  paymentMethod: 'cash' | 'card' | 'transaction',
  items: ServicioItem[]
): Promise<{
  success: boolean;
  data?: { saleRecord: SaleRecord; salesItems: SalesItemInsert[] };
  error?: PostgrestError | Error;
}> {
  try {
  

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) throw new Error('No hay sesión activa');

  // Si quieres asegurar que puede insertar por otro user_id:
  const { data: profile } = await supabase
    .from('users')
    .select('rol')
    .eq('id', session.user.id)
    .single();

  if (!profile || !['admin', 'cashier', 'developer'].includes(profile.rol)) {
    throw new Error('No tienes permisos');
  }


    const sale_code = `SALE-${Date.now()}`;
    const total_amount = items.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
    const earnings_amount = items.reduce((acc, item) => acc + item.ganado, 0);

    const { data: saleRecord, error: saleError } = await supabase
      .from('sales_records')
      .insert({
        sale_code,
        payment_method: paymentMethod,
        total_amount,
        earnings_amount,
        user_id: userId,
      })
      .select()
      .single<SaleRecord>();

    if (saleError) {
      console.error('Error creando sale record:', saleError.message);
      return { success: false, error: saleError };
    }

    const saleId = saleRecord.id;

    const salesItemsPayload: SalesItemInsert[] = items.map(item => ({
      sale_id: saleId,
      service_name: item.servicio,
      service_cost: item.precio,
      employee_earnings: item.ganado,
      service_quantity: item.cantidad,
    }));

    const { error: itemsError } = await supabase
      .from('sales_items')
      .insert(salesItemsPayload);

    if (itemsError) {
      console.error('Error creando sales items:', itemsError.message);
      return { success: false, error: itemsError };
    }

    return {
      success: true,
      data: { saleRecord, salesItems: salesItemsPayload },
    };
  } catch (err) {
    console.error('Unexpected error:', err);
    const error = err instanceof Error ? err : new Error('Unknown error');
    return { success: false, error };
  }
}





