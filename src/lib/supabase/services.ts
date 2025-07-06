import { supabase } from "@/lib/supabase/client";

export type Service = {
  id: number;
  nombre: string;
  creado_en: string;
};


export async function addService(nombre: string): Promise<Service> {
  const { data, error } = await supabase
    .from("servicios_peluqueria")
    .insert([{ nombre }])
    .select("id, nombre, creado_en")
    .single();

  if (error) {
    console.error("Supabase insert error:", error.message, error.details, error.hint);
    throw new Error("Error al agregar servicio");
  }

  return data;
}




export async function deleteServiceById(id: number) {
  const { data, error } = await supabase
    .from("servicios_peluqueria")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
  return data;
}


export async function getAllServices(): Promise<Service[]> {
  const { data, error } = await supabase
    .from("servicios_peluqueria")
    .select("id, nombre, creado_en")
    .order("nombre", { ascending: true });

  if (error) throw new Error(error.message);
  return data as Service[];
}



export const searchServices = async (query: string) => {
  const { data, error } = await supabase
    .from("servicios_peluqueria")
    .select("*")
    .ilike("nombre", `%${query}%`)
    .order("nombre", { ascending: true });

  if (error) throw error;
  return data;
};

