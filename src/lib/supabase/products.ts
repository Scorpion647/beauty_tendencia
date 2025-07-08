import { supabase } from "@/lib/supabase/client";

export type VentaProducto = {
  id: number;
  producto_id: number;
  cantidad: number;
  precio_unitario: number;
  descuento: number | null;
  total: number;
  created_at: string;
};

export async function addProduct(nombre: string, cantidad: number, precio: number) {
  const { data, error } = await supabase
    .from("productos")
    .insert([{ nombre, cantidad, precio }]);

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteProduct(id: number) {
  const { data, error } = await supabase
    .from("productos")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
  return data;
}

export async function updateProduct(
  id: number,
  fields: { nombre?: string; cantidad?: number; precio?: number; descuento?: number | null }
) {
  const { data, error } = await supabase
    .from("productos")
    .update(fields)
    .eq("id", id);

  if (error) throw new Error(error.message);
  return data;
}

export async function getAllProducts() {
  const { data, error } = await supabase
    .from("productos")
    .select("*")
    .order("nombre", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}


export const searchProducts = async (query: string) => {
  const { data, error } = await supabase
    .from("productos")
    .select("*")
    .ilike("nombre", `%${query}%`)
    .order("nombre", { ascending: true });

  if (error) throw error;
  return data;
};


export async function registrarVentaProducto(productoId: number, cantidad: number) {
  const { error } = await supabase.rpc("registrar_venta_producto", {
    p_producto_id: productoId,
    p_cantidad: cantidad,
  });

  if (error) throw new Error(error.message);
  return true;
}

export async function consultarVentasProductos({
  page,
  limit,
  productoId,
  desde,
  hasta,
}: {
  page: number;
  limit: number;
  productoId?: number;
  desde?: string; // formato ISO
  hasta?: string;
}): Promise<{ data: VentaProducto[]; total: number }> {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("ventas_productos")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (productoId !== undefined) {
    query = query.eq("producto_id", productoId);
  }
  if (desde) {
    query = query.gte("created_at", desde);
  }
  if (hasta) {
    query = query.lte("created_at", hasta);
  }

  const { data, count, error } = await query;

  if (error) throw new Error(error.message);

  return {
    data: data as VentaProducto[],
    total: count || 0,
  };
}
