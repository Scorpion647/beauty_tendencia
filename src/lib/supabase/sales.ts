'use server'

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

type ServicioItem = {
  id: number;
  servicio: string;
  cantidad: number;
  precio: number;
  ganado: number;
};

export async function createSaleRecord(
  userId: string,
  paymentMethod: 'cash' | 'card' | 'transaction',
  items: ServicioItem[]
): Promise<{
  success: boolean;
  data?: { saleRecord: any; salesItems: any[] };
  error?: any;
}> {
  try {
    // ✅ Esta es la forma correcta en server actions
    const supabase = createRouteHandlerClient({ cookies })

    const total_amount = items.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
    const earnings_amount = items.reduce((acc, item) => acc + ((item.precio * item.cantidad) * 0.5), 0);

    const sale_code = `SALE-${Date.now()}`;

    const { data: saleRecord, error: saleError } = await supabase
      .from('sales_records')
      .insert({
        sale_code,
        payment_method: paymentMethod,
        total_amount,
        earnings_amount,
        user_id: userId
      })
      .select()
      .single();

    if (saleError) {
      console.error('Error creating sale record:', saleError.message, saleError.details);
      return { success: false, error: saleError };
    }

    const saleId = saleRecord.id;

    const salesItemsPayload = items.map(item => ({
      sale_id: saleId,
      service_name: item.servicio,
      service_cost: item.precio,
      employee_earnings: item.ganado,
      service_quantity: item.cantidad
    }));

    const { error: itemsError } = await supabase
      .from('sales_items')
      .insert(salesItemsPayload);

    if (itemsError) {
      console.error('Error creating sales items:', itemsError.message, itemsError.details);
      return { success: false, error: itemsError };
    }

    return { success: true, data: { saleRecord, salesItems: salesItemsPayload } };

  } catch (err) {
    console.error('Unexpected error:', err);
    return { success: false, error: err };
  }
}



