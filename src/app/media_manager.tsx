// app/components/MediaManager.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { HiOutlineUpload } from "react-icons/hi";
import { FaTrash } from "react-icons/fa";
import { CarouselComponent } from "@/app/components/Carousel"; // ajusta ruta si hace falta
import { PositionPicker } from "./components/PositionPicker";


export type SectionKey = "inicio" | "nosotros" | "ofertas";

export type LocalMediaItem = {
  id: string;
  name: string;
  src: string;
  mimeType: string;
  section?: SectionKey | null;
  order: number;
  position?: string;
  createdAt: string;
  storage_path?: string | null;
};

type MediaItemRow = {
  id: string;
  name: string;
  url: string | null;
  mime_type: string | null;
  section: SectionKey | null;
  order: number | null;
  position: string | null;
  created_at: string | null;
  storage_path: string | null;
};

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (typeof err === "object" && err && "message" in err) {
    const m = (err as Record<string, unknown>).message;
    if (typeof m === "string") return m;
  }
  return "Error desconocido";
}

type MediaItemUpdatePayload = {
  position: string | undefined;
  section: SectionKey | null | undefined;
  order: number;
};


const STORAGE_KEY = "tendencias_media_v1";
const SECTIONS: { key: SectionKey; label: string }[] = [
  { key: "inicio", label: "Inicio" },
  { key: "nosotros", label: "Nosotros" },
  { key: "ofertas", label: "Ofertas" },
];

function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}


function formatFileName(name: string, maxLength = 18): string {
  const dotIndex = name.lastIndexOf(".");
  if (dotIndex === -1) {
    // Si no hay extensión, truncamos incluyendo puntos si es necesario
    if (name.length <= maxLength) return name;
    const available = maxLength - 3;
    return name.substring(0, available) + "...";
  }

  const base = name.substring(0, dotIndex); // nombre sin extensión
  const ext = name.substring(dotIndex); // extensión (incluye el punto)

  // si caben completos
  if (name.length <= maxLength) return name;

  // Reservamos espacio para ext y "..."
  const available = maxLength - ext.length - 3;
  if (available <= 0) {
    // si ext ocupa casi todo, mostramos sólo parte de la extensión + puntos
    return "..." + ext.slice(-Math.max(1, maxLength - 3));
  }
  const truncated = base.substring(0, available);
  return truncated + "..." + ext;
}

export default function MediaManager() {
  // Estados y refs
  const [media, setMedia] = useState<LocalMediaItem[]>([]);
  const [mode] = useState<"local" | "supabase">("supabase");
  const [filterText, setFilterText] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stagedChanges, setStagedChanges] = useState<Record<string, LocalMediaItem>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // swipe (mobile) state
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [activePanel, setActivePanel] = useState(0);

  useEffect(() => {
    if (mode === "local") loadFromLocal();
    else loadFromSupabase();
  }, [mode]);

  // ---------- Local helpers ----------
  function saveToLocal(items: LocalMediaItem[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }
  function loadFromLocal() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      setMedia([]);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as LocalMediaItem[];
      setMedia(parsed.sort((a, b) => a.order - b.order));
      setStagedChanges({});
    } catch (e) {
      console.error("Error parseando media local:", e);
      setMedia([]);
    }
  }

  // ---------- Supabase load ----------
  async function loadFromSupabase() {
    setLoading(true);
    setError(null);
    try {
      const { data: rows, error: selectErr } = await supabase
        .from("media_items")
        .select("*")
        .order("order", { ascending: true });

      if (selectErr) {
        console.error("Error obteniendo media_items:", selectErr);
        setError("No se pudieron obtener los medios desde Supabase.");
        setMedia([]);
        return;
      }
      if (!rows || rows.length === 0) {
        setMedia([]);
        setStagedChanges({});
        return;
      }

      const typedRows = (rows ?? []) as MediaItemRow[];

      const mapped: LocalMediaItem[] = typedRows.map((r) => ({
        id: r.id,
        name: r.name,
        src: r.url ?? "",
        mimeType: r.mime_type ?? "",
        section: r.section ?? null,
        order: r.order ?? 0,
        position: r.position ?? "center",
        createdAt: r.created_at ?? new Date().toISOString(),
        storage_path: r.storage_path ?? null,
      }));
      setMedia(mapped);
      setStagedChanges({});
    } catch (err) {
      console.error("Excepción loadFromSupabase:", err);
      setError("Error inesperado cargando medios.");
      setMedia([]);
    } finally {
      setLoading(false);
    }
  }

  // ---------- upload ----------
  async function uploadToSupabase(file: File) {
    setUploading(true);
    setError(null);
    try {
      const userResp = await supabase.auth.getUser();
      const user = userResp.data.user;
      if (!user) throw new Error("No estás autenticado.");

      const path = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadErr } = await supabase.storage
        .from("media")
        .upload(path, file, { cacheControl: "3600", upsert: false });


      if (uploadErr) throw uploadErr;

      const { data: publicData } = supabase.storage.from("media").getPublicUrl(path);
      const publicUrl = publicData.publicUrl;
      if (!publicUrl) throw new Error("No se pudo obtener la URL pública del archivo.");

      // crear fila en media_items
      const payload = {
        name: file.name,
        url: publicUrl,
        storage_path: path,
        mime_type: file.type,
        section: null,
        order: 0,
        position: "center",
        owner: user.id,
      };

      const { data: inserted, error: insertErr } = await supabase.from("media_items").insert(payload).select().single();

      if (insertErr) {
        try {
          await supabase.storage.from("media").remove([path]);
        } catch (e) {
          console.warn("No se pudo eliminar archivo tras fallo insert:", e);
        }
        throw insertErr;
      }

      const newItem: LocalMediaItem = {
        id: inserted.id,
        name: inserted.name,
        src: inserted.url,
        mimeType: inserted.mime_type,
        section: inserted.section,
        order: inserted.order ?? 0,
        position: inserted.position ?? "center",
        createdAt: inserted.created_at ?? new Date().toISOString(),
        storage_path: inserted.storage_path ?? null,
      };
      setMedia((prev) => [...prev, newItem]);
      return newItem;
    } finally {
      setUploading(false);
    }
  }

  // ---------- delete ----------
  async function deleteItem(id: string) {
    setError(null);
    const item = media.find((m) => m.id === id);
    if (!item) return;

    if (mode === "local") {
      const updated = media.filter((m) => m.id !== id);
      setMedia(updated);
      saveToLocal(updated);
      setStagedChanges((s) => {
        const copy = { ...s };
        delete copy[id];
        return copy;
      });
      return;
    }

    setLoading(true);
    try {
      const { error: delDbErr } = await supabase.from("media_items").delete().eq("id", id);
      if (delDbErr) throw delDbErr;

      if (item.storage_path) {
        const { error: remErr } = await supabase.storage.from("media").remove([item.storage_path]);
        if (remErr) console.warn("No se pudo eliminar del storage:", remErr);
      }

      setMedia((prev) => prev.filter((m) => m.id !== id));
      setStagedChanges((s) => {
        const copy = { ...s };
        delete copy[id];
        return copy;
      });
    } catch (err: unknown) {
      console.error("Error borrando item:", err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  // ---------- persist helpers ----------
  async function persistUpdateOne(item: LocalMediaItem) {
    const payload: MediaItemUpdatePayload = {
    position: item.position,
    section: item.section,
    order: item.order,
  };
    const { error } = await supabase.from("media_items").update(payload).eq("id", item.id);
    if (error) throw error;
  }

  function stageChange(item: LocalMediaItem) {
    setStagedChanges((s) => ({ ...s, [item.id]: item }));
  }

  // ---------- assign / reorder (local staging) ----------
  function assignToSection(id: string, section: SectionKey | null, orderAtEnd = true) {
    const copy = media.map((m) => ({ ...m }));
    const item = copy.find((m) => m.id === id);
    if (!item) return;
    item.section = section;
    if (section && orderAtEnd) {
      const maxOrder = copy.filter((x) => x.section === section).reduce((acc, cur) => Math.max(acc, cur.order), -1);
      item.order = maxOrder + 1;
    }
    normalizeOrders(copy);
    setMedia(copy);
    stageChange(item);
    if (mode === "local") saveToLocal(copy);
  }

  function assignAllUnassignedToSection(section: SectionKey) {
    const copy = media.map((m) => ({ ...m }));
    let nextOrder = copy.filter((x) => x.section === section).length;
    copy.forEach((x) => {
      if (x.section === null) {
        x.section = section;
        x.order = nextOrder++;
        stageChange(x);
      }
    });
    normalizeOrders(copy);
    setMedia(copy);
    if (mode === "local") saveToLocal(copy);
  }

  function normalizeOrders(arr: LocalMediaItem[]) {
    for (const s of SECTIONS) {
      const list = arr.filter((x) => x.section === s.key).sort((a, b) => a.order - b.order);
      for (let i = 0; i < list.length; i++) list[i].order = i;
    }
    arr.forEach((x) => stageChange(x));
  }

  function moveUp(id: string) {
    const item = media.find((m) => m.id === id);
    if (!item || !item.section) return;
    const siblings = media.filter((m) => m.section === item.section).sort((a, b) => a.order - b.order);
    const idx = siblings.findIndex((s) => s.id === id);
    if (idx <= 0) return;
    const a = siblings[idx - 1];
    const b = siblings[idx];
    const copy = media.map((m) => ({ ...m }));
    const ai = copy.findIndex((c) => c.id === a.id);
    const bi = copy.findIndex((c) => c.id === b.id);
    if (ai >= 0 && bi >= 0) {
      copy[ai].order = b.order;
      copy[bi].order = a.order;
      normalizeOrders(copy);
      setMedia(copy);
      stageChange(copy[ai]);
      stageChange(copy[bi]);
      if (mode === "local") saveToLocal(copy);
    }
  }

  function moveDown(id: string) {
    const item = media.find((m) => m.id === id);
    if (!item || !item.section) return;
    const siblings = media.filter((m) => m.section === item.section).sort((a, b) => a.order - b.order);
    const idx = siblings.findIndex((s) => s.id === id);
    if (idx < 0 || idx >= siblings.length - 1) return;
    const a = siblings[idx];
    const b = siblings[idx + 1];
    const copy = media.map((m) => ({ ...m }));
    const ai = copy.findIndex((c) => c.id === a.id);
    const bi = copy.findIndex((c) => c.id === b.id);
    if (ai >= 0 && bi >= 0) {
      copy[ai].order = b.order;
      copy[bi].order = a.order;
      normalizeOrders(copy);
      setMedia(copy);
      stageChange(copy[ai]);
      stageChange(copy[bi]);
      if (mode === "local") saveToLocal(copy);
    }
  }

  // ---------- drag & drop ----------
  function onDragStart(e: React.DragEvent, id: string) {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  }
  function onDropToSection(e: React.DragEvent, section: SectionKey) {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (!id) return;
    assignToSection(id, section, true);
  }
  function allowDrop(e: React.DragEvent) {
    e.preventDefault();
  }

  // ---------- file handlers ----------
  async function handleFiles(files: FileList | null) {
    if (!files) return;

    if (mode === "local") {
      const arr = Array.from(files);
      const newItems: LocalMediaItem[] = [];
      for (const f of arr) {
        const dataUrl = await readFileAsDataURL(f);
        const item: LocalMediaItem = {
          id: uuidv4(),
          name: f.name,
          src: dataUrl,
          mimeType: f.type,
          section: null,
          order: 0,
          position: "center",
          createdAt: new Date().toISOString(),
          storage_path: null,
        };
        newItems.push(item);
      }
      const updated = [...media, ...newItems];
      setMedia(updated);
      saveToLocal(updated);
      return;
    }

    setError(null);
    setUploading(true);
    try {
      for (const f of Array.from(files)) {
        try {
          const result = await uploadToSupabase(f);
          console.log("Subida completada:", result);
        } catch (uploadErr: any) {
          console.error("Error en uploadToSupabase:", uploadErr);
          if (uploadErr?.message) setError(uploadErr.message);
          else setError("Error subiendo archivo: " + f.name);
        }
      }
      await loadFromSupabase();
    } catch (err: any) {
      console.error("Error global en handleFiles:", err);
      setError(err.message ?? "Error subiendo archivos.");
    } finally {
      setUploading(false);
    }
  }

  function readFileAsDataURL(file: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const res = reader.result as string;
        resolve(res);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }



  // ---------- Save / Revert ----------
  async function saveChanges() {
    if (mode !== "supabase") {
      alert("El modo actual no es Supabase. Cambia a Supabase para persistir cambios.");
      return;
    }
    const ids = Object.keys(stagedChanges);
    if (ids.length === 0) {
      alert("No hay cambios para guardar.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      for (const id of ids) {
        const item = stagedChanges[id];
        if (!item.storage_path) {
          throw new Error(`El item "${item.name}" no está subido al storage. Sube el archivo primero.`);
        }
        await persistUpdateOne(item);
      }
      await loadFromSupabase();
      alert("Cambios guardados correctamente.");
    } catch (err: any) {
      console.error("Error guardando cambios:", err);
      setError(err.message ?? "Error guardando cambios.");
    } finally {
      setLoading(false);
    }
  }

  async function revertChanges() {
    if (!confirm("¿Descartar cambios no guardados y recargar desde Supabase?")) return;
    await loadFromSupabase();
    setStagedChanges({});
  }

  // ---------- helpers UI ----------
  function isImage(m: LocalMediaItem) {
    return m.mimeType.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp)$/i.test(m.src);
  }
  function isVideo(m: LocalMediaItem) {
    return m.mimeType.startsWith("video/") || /\.(mp4|webm|ogg)$/i.test(m.src);
  }

  const allFiltered = media.filter((m) => m.name.toLowerCase().includes(filterText.toLowerCase()));

  // ---------- Mobile swipe logic ----------
  // Observa scroll para actualizar indicador (throttled simple)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let raf = 0;
    function onScroll() {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (!el) return;
        const w = el.clientWidth || 1;
        const idx = Math.round(el.scrollLeft / w);
        setActivePanel(idx);
      });
    }
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  function scrollToIndex(i: number) {
    const el = scrollRef.current;
    if (!el) return;
    const w = el.clientWidth || el.scrollWidth / 3;
    el.scrollTo({ left: i * w, behavior: "smooth" });
  }

  // ---------- Panels content (reused in desktop & mobile) ----------
  const LeftPanelContent = (
    <>
      <label className="block mb-2 font-semibold text-black">Subir archivos (imagen / video)</label>

      <div className="flex flex-wrap gap-2 items-center mb-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-3 py-2 rounded bg-pink-800 text-amber-300 hover:opacity-90"
        >
          <HiOutlineUpload /> <span className="text-sm font-semibold">Seleccionar archivos</span>
        </button>

        <button
          onClick={() => {
            setMedia([]);
            if (mode === "local") localStorage.removeItem(STORAGE_KEY);
            setStagedChanges({});
          }}
          className="px-3 py-2 rounded bg-red-600 text-white"
        >
          Limpiar todo
        </button>

        <div className="ml-auto text-xs text-gray-600">Subida: {mode === "supabase" ? (uploading ? "Subiendo..." : "Online") : "Local"}</div>
      </div>

      <label className="block mb-2 font-semibold text-black">Buscar</label>
      <input value={filterText} onChange={(e) => setFilterText(e.target.value)} placeholder="Nombre..." className="w-full mb-3 p-2 border rounded" />

      <div className="grid grid-cols-2 gap-3">
        {allFiltered.map((m) => (
          <div
            key={m.id}
            className="relative border rounded overflow-hidden bg-gray-50"
            draggable
            onDragStart={(e) => onDragStart(e, m.id)}
          >
            <div className="h-28 w-full flex items-center justify-center overflow-hidden bg-gray-200">
              {isImage(m) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.src} alt={m.name} className="object-cover w-full" />
              ) : isVideo(m) ? (
                <video src={m.src} className="object-cover w-full" />
              ) : (
                <div className="text-xs text-black p-2">Formato no soportado</div>
              )}
            </div>

            <div className="p-1">
              <div className="flex flex-col gap-2">
                <div className="truncate text-sm text-black">{formatFileName(m.name)}</div>

                <div className="flex flex-wrap gap-1">
                  <button
                    title="Inicio"
                    onClick={() => assignToSection(m.id, "inicio")}
                    className="px-2 py-0.5 rounded bg-yellow-300 text-black text-[10px] sm:text-xs"
                  >
                    Inicio
                  </button>
                  <button
                    title="Nosotros"
                    onClick={() => assignToSection(m.id, "nosotros")}
                    className="px-2 py-0.5 rounded bg-yellow-300 text-black text-[10px] sm:text-xs"
                  >
                    Nosotros
                  </button>
                  <button
                    title="Ofertas"
                    onClick={() => assignToSection(m.id, "ofertas")}
                    className="px-2 py-0.5 rounded bg-yellow-300 text-black text-[10px] sm:text-xs"
                  >
                    Ofertas
                  </button>
                </div>
              </div>

              <div className="mt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <PositionPicker
                  value={m.position ?? "50% 50%"}
                  onChange={(pos) => {
                    const updated = { ...m, position: pos };
                    setMedia((prev) => prev.map((p) => (p.id === m.id ? updated : p)));
                    stageChange(updated);

                    // IMPORTANTE: usa la versión "prev" para guardar, no `media` (stale)
                    if (mode === "local") {
                      setMedia((prev) => {
                        const next = prev.map((p) => (p.id === m.id ? updated : p));
                        saveToLocal(next);
                        return next;
                      });
                    }
                  }}
                />

                <button
                  onClick={() => deleteItem(m.id)}
                  className="px-2 py-1 bg-red-600 text-white rounded sm:w-[20%] text-sm flex items-center gap-1 justify-center"
                >
                  <FaTrash className="text-xs" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>


    </>
  );

  const MiddlePanelContent = (
    <>
      <h3 className="font-semibold mb-2 text-black">Secciones y orden</h3>
      <p className="text-sm text-black mb-3">Arrastra un elemento desde la galería a la sección deseada. Dentro de cada sección usa subir/bajar para reordenar.</p>

      {SECTIONS.map((s) => {
        const list = media.filter((m) => m.section === s.key).sort((a, b) => a.order - b.order);
        return (
          <div key={s.key} className="mb-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-black">{s.label} ({list.length})</h4>
              <div className="flex gap-2">
                <div className="text-xs text-gray-500"> (no persiste hasta Guardar)</div>
              </div>
            </div>

            <div onDragOver={allowDrop} onDrop={(e) => onDropToSection(e, s.key)} className="border rounded p-2 mt-2 min-h-[80px] bg-gray-50">
              {list.length === 0 && <div className="text-sm text-gray-400">Arrastra aquí</div>}
              {list.map((m) => (
                <div key={m.id} draggable onDragStart={(e) => onDragStart(e, m.id)} className="flex items-center gap-2 border-b py-2">
                  <div className="h-12 w-16 flex items-center justify-center overflow-hidden bg-gray-200">
                    {isImage(m) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.src} alt={m.name} className="object-cover h-full w-full" />
                    ) : (
                      <video src={m.src} className="object-cover h-full w-full" />
                    )}
                  </div>
                  <div className="flex-1 text-sm text-black">
                    <div className="font-medium truncate">{formatFileName(m.name)}</div>
                    <div className="text-xs text-gray-500">Pos: {m.position ?? "center"}</div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button onClick={() => moveUp(m.id)} className="px-2 py-0.5 rounded bg-gray-200 text-xs">↑</button>
                    <button onClick={() => moveDown(m.id)} className="px-2 py-0.5 rounded bg-gray-200 text-xs">↓</button>
                    <button onClick={() => { assignToSection(m.id, null); }} className="px-2 py-0.5 rounded bg-yellow-100 text-xs">Quitar</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </>
  );

  const RightPanelContent = (
    <>
      <h3 className="font-semibold mb-2 text-black">Previsualización</h3>
      <p className="text-sm text-black mb-3">Simula cómo se verán los medios en las secciones. Usa los ajustes de posición para experimentar.</p>

      {SECTIONS.map((s) => {
        const list = media.filter((m) => m.section === s.key).sort((a, b) => a.order - b.order);
        const carouselMedia = list.map((it) => ({ src: it.src, position: it.position }));
        return (
          <div key={s.key} className="mb-6">
            <h4 className="font-bold mb-2 text-black">{s.label}</h4>
            <div className="border rounded overflow-hidden">
              <div className="p-2 bg-white text-xs text-gray-600">Carrusel (simulado):</div>
              <div className="h-48 flex items-center justify-center bg-black relative">
                {list.length === 0 && <div className="text-white">(Sin elementos)</div>}
                {list.length > 0 && (
                  <div className="w-full h-full flex items-center justify-center">
                    <CarouselComponent media={carouselMedia} autoSlide={false} width={800} height={192} resize={false} />
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      <div className="text-xs text-gray-600 mt-2">Consejo: si vas a usar las imágenes como background en un carrusel real, pega aquí la propiedad <code>position</code> que quieres (p.ej. <code>50% 25%</code> o <code>top</code>).</div>
    </>
  );

  // ---------- Render ----------
  return (
    <div className="p-4 w-full h-full bg-pink-200 text-black">
      <div className="w-full mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold bg-pink-800 text-center">
            <span className="bg-gradient-to-r from-yellow-300 via-yellow-200 to-yellow-400 bg-clip-text text-transparent">Gestor de Contenido</span>
          </h2>
          <p className="text-sm text-black">Asigna imagenes y videos para el inicio de la pagina</p>
        </div>

        <div className="flex items-center gap-2">

          <button onClick={saveChanges} className="ml-2 px-3 py-1 rounded bg-pink-800 text-amber-300 text-sm">Guardar cambios</button>
          <button onClick={revertChanges} className="ml-1 px-3 py-1 rounded bg-gray-200 text-black text-sm">Revertir</button>
        </div>
      </div>

      {error && <div className="mb-2 p-2 rounded bg-red-600 text-white">{error}</div>}
      {loading && <div className="mb-2 p-2 rounded bg-yellow-100 text-black">Cargando...</div>}

      {/* ----- MOBILE: swipeable panels (visible < md) ----- */}
      <div className="md:hidden">
        <div
          ref={scrollRef}
          className="flex overflow-x-auto snap-x snap-mandatory touch-pan-x -mx-4"
          style={{ scrollBehavior: "smooth", WebkitOverflowScrolling: "touch" }}
        >
          {/* cada panel ocupa 100% del contenedor */}
          <div className="snap-start flex-shrink-0 w-full px-4">
            <div className="bg-white p-4 rounded-2xl shadow border border-gray-700 overflow-auto max-h-[70vh]">
              {LeftPanelContent}
            </div>
          </div>

          <div className="snap-start flex-shrink-0 w-full px-4">
            <div className="bg-white p-4 rounded-2xl shadow border border-gray-700 overflow-auto max-h-[70vh]">
              {MiddlePanelContent}
            </div>
          </div>

          <div className="snap-start flex-shrink-0 w-full px-4">
            <div className="bg-white p-4 rounded-2xl shadow border border-gray-700 overflow-auto max-h-[70vh]">
              {RightPanelContent}
            </div>
          </div>
        </div>

        {/* indicators */}
        <div className="flex justify-center gap-2 mt-3">
          {[0, 1, 2].map((i) => (
            <button
              key={i}
              onClick={() => scrollToIndex(i)}
              aria-label={`Ir a panel ${i + 1}`}
              className={`w-3 h-3 rounded-full ${activePanel === i ? "bg-pink-800" : "bg-gray-300"}`}
            />
          ))}
        </div>
      </div>

      {/* ----- DESKTOP/TABLET-LARGE: original 3-column layout (>= md) ----- */}
      <div className="hidden md:flex flex-row gap-4">
        <div className="w-full md:w-1/3 bg-white p-4 rounded-2xl shadow border border-gray-700 overflow-auto max-h-[70vh]">
          {LeftPanelContent}
        </div>

        <div className="w-full md:w-1/3 bg-white p-4 rounded-2xl shadow border border-gray-700 overflow-auto max-h-[70vh]">
          {MiddlePanelContent}
        </div>

        <div className="w-full md:w-1/3 bg-white p-4 rounded-2xl shadow border border-gray-700 overflow-auto max-h-[70vh]">
          {RightPanelContent}
        </div>
      </div>
    </div>
  );
}



