import { supabase } from "@/lib/supabase/client";

export async function addService(nombre: string) {
  const { data, error } = await supabase
    .from("servicios_peluqueria")
    .insert([{ nombre }]);

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteService(nombre: string) {
  const { data, error } = await supabase
    .from("servicios_peluqueria")
    .delete()
    .eq("nombre", nombre);

  if (error) throw new Error(error.message);
  return data;
}

export async function getAllServices(): Promise<string[]> {
  const { data, error } = await supabase
    .from("servicios_peluqueria")
    .select("nombre")
    .order("nombre", { ascending: true });

  if (error) throw new Error(error.message);

  return data.map((item) => item.nombre);
}
