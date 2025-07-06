import { supabase } from "@/lib/supabase/client";

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
  fields: { nombre?: string; cantidad?: number; precio?: number }
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
