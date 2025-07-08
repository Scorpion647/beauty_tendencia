import { useState, useEffect } from "react";
import { Toast, ToastToggle } from "flowbite-react";
import { HiFire } from "react-icons/hi";
import {
    addProduct,
    deleteProduct,
    updateProduct,
    getAllProducts,
    searchProducts,
} from "@/lib/supabase/products";
import {
    addService,
    deleteServiceById,
    getAllServices,
    searchServices,
} from "@/lib/supabase/services";
import Accessmodal from "./components/accessmodal";

interface Product {
    id: number;
    nombre: string;
    cantidad: number;
    precio: number;
    descuento: number | null;
    created_at: string;
}

export type Service = {
    id: number;
    nombre: string;
    creado_en: string;
};


function formatCurrency(
    value: number,
    locale: string = 'es-CO',
    currency: string = 'COP'
): string {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 0, // ó 2 si quieres siempre centavos
        maximumFractionDigits: 2,
    }).format(value);
}

export function ProductServiceManager() {
    const [productos, setProductos] = useState<Product[]>([]);
    const [servicios, setServicios] = useState<Service[]>([]);
    const [productoEdit, setProductoEdit] = useState<Partial<Product> | null>(null);

    const [nombreProducto, setNombreProducto] = useState("");
    const [cantidadProducto, setCantidadProducto] = useState(0);
    const [precioProducto, setPrecioProducto] = useState(0);

    const [nuevoServicio, setNuevoServicio] = useState("");

    const [modoGestion, setModoGestion] = useState<"productos" | "servicios">("productos");
    const [soloVisualizar, setSoloVisualizar] = useState(false);

    const [showToast, setShowToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const [searchProductQuery, setSearchProductQuery] = useState("");
    const [searchServiceQuery, setSearchServiceQuery] = useState("");

    const [productoSeleccionado, setProductoSeleccionado] = useState<Product | null>(null);
    const [cantidadExtra, setCantidadExtra] = useState<number>(1);
    const [busquedaProducto, setBusquedaProducto] = useState<string>("");
    const [productosFiltrados, setProductosFiltrados] = useState<Product[]>([]);
    const [descuentoProducto, setDescuentoProducto] = useState<number | null>(null);
    const [autoAbono, setAutoAbono] = useState(false);



    const [isOpen, setIsOpen] = useState(false);
    const openModal = () => setIsOpen(true);
    const closeModal = () => setIsOpen(false);

    const [isOpen2, setIsOpen2] = useState(false);
    const openModal2 = () => setIsOpen2(true);
    const closeModal2 = () => setIsOpen2(false);


    const loadProductos = async () => {
        const result = await getAllProducts();
        setProductos(result);
    };

    const loadServicios = async () => {
        const result = await getAllServices();
        setServicios(result);
    };

    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        if (!startDate) {
            alert("Por favor selecciona la fecha de inicio");
            return;
        }
        setLoading(true);

        try {
            const res = await fetch("/api/report", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ startDate, endDate: endDate || undefined, crearAbono: autoAbono }),
            });

            if (!res.ok) {
                // Lee JSON de error
                const err = await res.json();
                throw new Error(err.error || "Error desconocido");
            }

            // **Aquí**: leemos el blob directamente
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            const filename = `corte_${startDate}_${endDate || "hoy"}.xlsx`;
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch (error: unknown) {
            let errorMessage = "Ocurrió un error inesperado";

            if (error instanceof Error) {
                console.error("🚨 Error en handleGenerate:", error.message);
                errorMessage = error.message;
            } else if (typeof error === "string") {
                console.error("🚨 Error en handleGenerate:", error);
                errorMessage = error;
            } else {
                console.error("🚨 Error en handleGenerate:", JSON.stringify(error));
            }

            alert(`Ocurrió un error: ${errorMessage}`);
        }
        finally {
            setLoading(false);
        }
    };




    useEffect(() => {
        loadProductos();
        loadServicios();
    }, []);


    useEffect(() => {
        if (busquedaProducto.trim() === "") {
            setProductosFiltrados([]);
            return;
        }

        const resultado = productos.filter((p) =>
            p.nombre.toLowerCase().includes(busquedaProducto.toLowerCase())
        );
        setProductosFiltrados(resultado.slice(0, 5)); // Limita resultados
    }, [busquedaProducto, productos]);


    const handleAgregarCantidad = async () => {
        if (!productoSeleccionado || cantidadExtra <= 0) {
            setShowToast({ type: "error", message: "Debe seleccionar un producto y una cantidad válida" });
            setTimeout(() => setShowToast(null), 3000);
            return;
        }

        try {
            await updateProduct(productoSeleccionado.id, {
                cantidad: productoSeleccionado.cantidad + cantidadExtra,
            });

            setShowToast({ type: "success", message: `Se agregó ${cantidadExtra} unidades a ${productoSeleccionado.nombre}` });
            setProductoSeleccionado(null);
            setCantidadExtra(0);
            setBusquedaProducto("");
            setProductosFiltrados([]);
            loadProductos();

            setTimeout(() => setShowToast(null), 3000);
        } catch {
            setShowToast({ type: "error", message: "Error al agregar cantidad" });
            setTimeout(() => setShowToast(null), 3000);
        }
    };


    const handleAddOrUpdateProducto = async () => {
        try {
            if (productoEdit?.id) {
                await updateProduct(productoEdit.id, { nombre: nombreProducto, cantidad: cantidadProducto, precio: precioProducto, descuento: descuentoProducto });
                setShowToast({ type: "success", message: "Producto actualizado con éxito" });
            } else {
                await addProduct(nombreProducto, cantidadProducto, precioProducto);
                setShowToast({ type: "success", message: "Producto agregado con éxito" });
            }
            setNombreProducto("");
            setDescuentoProducto(null)
            setCantidadProducto(0);
            setPrecioProducto(0);
            setProductoEdit(null);
            loadProductos();
            setTimeout(() => setShowToast(null), 3000);
        } catch {
            setShowToast({ type: "error", message: "Error al guardar el producto" });
            setTimeout(() => setShowToast(null), 3000);
        }
    };

    const handleDeleteProducto = async (id: number) => {
        try {
            await deleteProduct(id);
            setShowToast({ type: "success", message: "Producto eliminado" });
            loadProductos();
            setTimeout(() => setShowToast(null), 3000);
        } catch {
            setShowToast({ type: "error", message: "Error al eliminar" });
            setTimeout(() => setShowToast(null), 3000);
        }
    };

    const handleAddServicio = async () => {
        try {
            console.log("este es el nuevo servicio: ", nuevoServicio)
            await addService(nuevoServicio);
            setShowToast({ type: "success", message: "Servicio agregado" });
            setNuevoServicio("");
            loadServicios();
            setTimeout(() => setShowToast(null), 3000);
        } catch {
            setShowToast({ type: "error", message: "Error al agregar servicio" });
            setTimeout(() => setShowToast(null), 3000);
        }
    };


    const handleDeleteServicio = async (id?: number) => {
        if (!id) {
            setShowToast({ type: "error", message: "ID inválido para eliminar" });
            setTimeout(() => setShowToast(null), 3000);
            return;
        }
        try {
            await deleteServiceById(id);
            setShowToast({ type: "success", message: "Servicio eliminado" });
            setTimeout(() => setShowToast(null), 3000);

            loadServicios();
        } catch {
            setShowToast({ type: "error", message: "Error al eliminar servicio" });
            setTimeout(() => setShowToast(null), 3000);
        }
    };


    const handleSearchProducts = async () => {
        try {
            const result = await searchProducts(searchProductQuery);
            setProductos(result);
        } catch {
            setShowToast({ type: "error", message: "Error al buscar productos" });
            setTimeout(() => setShowToast(null), 3000);
        }
    };

    const handleSearchServices = async () => {
        try {
            const result = await searchServices(searchServiceQuery);
            setServicios(result);
        } catch {
            setShowToast({ type: "error", message: "Error al buscar servicios" });
            setTimeout(() => setShowToast(null), 3000);
        }
    };

    return (
        <div className="w-full p-4 bg-pink-100 min-h-screen overflow-hidden">
            <div className="flex justify-between items-center mb-4">
                <div className="flex gap-4">
                    <button onClick={() => setModoGestion("productos")} className={` ${modoGestion === "productos" ? "bg-pink-800 text-yellow-300" : " bg-gray-500 text-white"} cursor-pointer  px-4 py-1 rounded font-bold`}>Productos</button>
                    <button onClick={() => setModoGestion("servicios")} className={` ${modoGestion === "servicios" ? "bg-pink-800 text-yellow-300" : " bg-gray-500 text-white"} cursor-pointer px-4 py-1 rounded font-bold`}>Servicios</button>
                    <button onClick={openModal2} className={`bg-gradient-to-r from-yellow-300 via-yellow-200 to-yellow-400 text-black  cursor-pointer px-4 py-1 rounded font-bold`}>Generar Reporte</button>
                </div>
                <Accessmodal isOpen={isOpen2} onClose={closeModal2}>
                    <div className=" flex items-center justify-center bg-pink-50 p-4">
                        <div className="w-full max-w-xl bg-white rounded-2xl shadow-md p-6">
                            <h1 className="text-2xl font-bold text-center mb-6 text-pink-700">Generar reporte de corte</h1>
                            <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0 mb-3">
                                <div className="flex-1">
                                    <label htmlFor="start" className="block text-sm font-semibold text-gray-700 mb-1">
                                        Fecha de inicio
                                    </label>
                                    <input
                                        id="start"
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-lg text-black"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label htmlFor="end" className="block text-sm font-semibold text-gray-700 mb-1">
                                        Fecha de fin (opcional)
                                    </label>
                                    <input
                                        id="end"
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-lg text-black"
                                    />
                                </div>
                            </div>
                            <div className="w-full flex items-center gap-4 mb-4">
                                <p className=" text-black">Hacer Abono automático</p>
                                <input
                                    type="checkbox"
                                    checked={autoAbono}
                                    onChange={(e) => setAutoAbono(e.target.checked)}
                                    className="w-4 h-4"
                                />
                            </div>

                            <button
                                onClick={handleGenerate}
                                disabled={loading}
                                className="w-full bg-pink-700 text-white font-bold py-2 rounded-lg hover:bg-pink-800 transition disabled:opacity-50"
                            >
                                {loading ? 'Generando...' : 'Descargar Excel'}
                            </button>
                        </div>
                    </div>
                </Accessmodal>
                {modoGestion === "productos" && (
                    <label className="flex items-center gap-2">
                        <input type="checkbox" checked={soloVisualizar} onChange={() => setSoloVisualizar(!soloVisualizar)} />
                        <span className="text-sm font-semibold">Solo visualizar</span>
                    </label>
                )}
            </div>

            {modoGestion === "productos" && (
                <div className="border-2 border-gray-700 bg-white rounded-md p-4">
                    {!soloVisualizar && (
                        <div className={` ${productoEdit ? "grid-cols-4" : "grid-cols-3"} grid gap-4 mb-4`}>
                            <div>
                                <p className="text-sm font-bold text-black">Nombre del producto</p>
                                <input value={nombreProducto} onChange={(e) => setNombreProducto(e.target.value)} className=" text-black w-full p-1 rounded border border-gray-500" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-black">Cantidad</p>
                                <input type="number" value={cantidadProducto} onChange={(e) => setCantidadProducto(parseInt(e.target.value))} className=" text-black w-full p-1 rounded border border-gray-500" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-black">Precio</p>
                                <input type="number" value={precioProducto} onChange={(e) => setPrecioProducto(parseInt(e.target.value))} className=" text-black w-full p-1 rounded border border-gray-500" />
                            </div>
                            {productoEdit?.id && (
                                <div>
                                    <p className="text-sm font-bold text-black">Descuento (%)</p>
                                    <input
                                        type="number"
                                        min={0}
                                        max={100}
                                        value={descuentoProducto ?? 0}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value);
                                            setDescuentoProducto(val === 0 ? null : Math.min(Math.max(val, 1), 100));
                                        }}
                                        className="text-black w-full p-1 rounded border border-gray-500"
                                    />
                                    <p className="text-xs text-gray-600 mt-1">Coloca 0 si no deseas aplicar descuento</p>
                                </div>
                            )}

                            <div className="col-span-3 ">
                                <button onClick={handleAddOrUpdateProducto} className=" mr-2 bg-pink-800 cursor-pointer text-yellow-300 px-6 py-1 rounded">{productoEdit ? "Actualizar" : "Agregar"}</button>
                                <button
                                    onClick={openModal}
                                    className="bg-pink-800 cursor-pointer text-yellow-300 px-4 py-1 rounded font-bold"
                                >
                                    Agregar cantidad a producto
                                </button>
                            </div>
                            <Accessmodal isOpen={isOpen} onClose={closeModal}>


                                <div className=" mb-2 w-full bg-pink-200 flex items-center justify-center"><p className="text-lg font-bold text-white ">Agregar cantidad a un producto existente</p></div>

                                <div className=" flex flex-col gap-3">
                                    <div className=" grid grid-cols-2 gap-4">
                                        <div className="relative">
                                            <p className="text-sm font-bold text-black">Buscar producto</p>
                                            <input
                                                value={busquedaProducto}
                                                onChange={(e) => setBusquedaProducto(e.target.value)}
                                                className="text-black w-full p-1 rounded border border-gray-500"
                                                placeholder="Escribe el nombre..."
                                            />
                                            {productosFiltrados.length > 0 && (
                                                <div className="absolute z-10 bg-white border border-gray-400 rounded mt-1 max-h-40 overflow-auto w-full">
                                                    {productosFiltrados.map((prod) => (
                                                        <div
                                                            key={prod.id}
                                                            className="px-2 py-1 hover:bg-pink-200 cursor-pointer text-black"
                                                            onClick={() => {
                                                                setProductoSeleccionado(prod);
                                                                setBusquedaProducto(prod.nombre);
                                                                setProductosFiltrados([]);
                                                            }}
                                                        >
                                                            {prod.nombre}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <p className="text-sm font-bold text-black">Cantidad a agregar</p>
                                            <input

                                                type="number"
                                                value={cantidadExtra}
                                                onChange={(e) => setCantidadExtra(parseInt(e.target.value))}
                                                className="text-black w-full p-1 rounded border border-gray-500"
                                                min="1"
                                            />
                                        </div>
                                    </div>


                                    <div className="flex items-end">
                                        <button
                                            onClick={() => { handleAgregarCantidad(); closeModal() }}
                                            className="bg-pink-800 cursor-pointer text-yellow-300 font-bold px-6 py-1 rounded w-full"
                                        >
                                            Agregar
                                        </button>
                                    </div>
                                </div>



                            </Accessmodal>
                        </div>

                    )}

                    <div className="flex gap-2 mb-2">
                        <input type="text" className=" text-black w-full rounded border border-gray-700 px-2 py-1" placeholder="Buscar producto..." value={searchProductQuery} onChange={(e) => setSearchProductQuery(e.target.value)} />
                        <button className="bg-pink-700 cursor-pointer text-yellow-300 rounded px-4" onClick={handleSearchProducts}>Buscar</button>
                    </div>

                    <div className="overflow-auto">
                        <div className={`grid  ${soloVisualizar ? "grid-cols-4" : "grid-cols-5"} gap-4 font-bold border-b pb-2 text-black`}>
                            <span className=" text-black">Nombre</span>
                            <span className=" text-black">Cantidad</span>
                            <span className=" text-black">Precio</span>
                            <span className=" text-black">Descuento</span>
                            {!soloVisualizar && (
                                <span className=" text-black">Acciones</span>
                            )}
                        </div>
                        {productos.map((p) => (
                            <div key={p.id} className={`grid ${soloVisualizar ? "grid-cols-4" : "grid-cols-5"} gap-4 border-b py-1`}>
                                <span className=" text-black">{p.nombre}</span>
                                <span className=" text-black">{p.cantidad}</span>
                                <span className=" text-black">{formatCurrency(p.precio)}</span>
                                <span className=" text-black">{p.descuento === null ? "0%" : p.descuento + "%"}</span>
                                <div className="flex gap-2">
                                    {!soloVisualizar && (
                                        <>
                                            <button onClick={() => handleDeleteProducto(p.id)} className="bg-red-600 cursor-pointer text-white font-bold px-2 py-0.5 rounded">Eliminar</button>
                                            <button onClick={() => {
                                                setProductoEdit(p);
                                                setNombreProducto(p.nombre);
                                                setCantidadProducto(p.cantidad);
                                                setPrecioProducto(p.precio);
                                                setDescuentoProducto(p.descuento)
                                            }} className="bg-amber-300 cursor-pointer text-black font-bold px-3 py-1 rounded">Actualizar</button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {modoGestion === "servicios" && (
                <div className="border-2 border-gray-700 bg-white rounded-md p-4">
                    <div className="mb-4">
                        <p className="text-sm font-bold text-black">Nombre del servicio</p>
                        <input value={nuevoServicio} onChange={(e) => setNuevoServicio(e.target.value)} className=" text-black w-full p-1 rounded border border-gray-500" />
                        <button onClick={handleAddServicio} className="mt-2 bg-pink-800 cursor-pointer text-yellow-300 px-6 py-1 rounded">Agregar</button>
                    </div>

                    <div className="flex gap-2 mb-2">
                        <input type="text" className=" text-black w-full rounded border border-gray-700 px-2 py-1" placeholder="Buscar servicio..." value={searchServiceQuery} onChange={(e) => setSearchServiceQuery(e.target.value)} />
                        <button className="bg-pink-700 cursor-pointer text-yellow-300 rounded px-4" onClick={handleSearchServices}>Buscar</button>
                    </div>

                    <div className="overflow-auto">
                        <div className="grid grid-cols-[1fr_auto] font-bold border-b pb-2 text-black">
                            <span>Nombre</span>
                            <span>Acciones</span>
                        </div>

                        {servicios.map((s) => (
                            <div key={s.id} className="grid grid-cols-[1fr_auto] border-b py-1 items-center">
                                <span className="text-black ">{s.nombre}</span>
                                <button
                                    onClick={() => handleDeleteServicio(s.id)}
                                    className="cursor-pointer bg-red-600 text-white font-bold px-3 py-1 rounded"
                                >
                                    Eliminar
                                </button>
                            </div>
                        ))}

                    </div>
                </div>
            )}

            {showToast && (
                <div className="fixed bottom-5 right-5 z-50">
                    <Toast>
                        <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-200 text-pink-600 dark:bg-pink-600 dark:text-cyan-200">
                            <HiFire className="h-5 w-5" />
                        </div>
                        <div className="ml-3 text-sm font-bold">
                            {showToast.message}
                        </div>
                        <ToastToggle onClick={() => setShowToast(null)} />
                    </Toast>
                </div>
            )}
        </div>
    );
}


