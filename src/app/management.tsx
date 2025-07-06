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

interface Product {
    id: number;
    nombre: string;
    cantidad: number;
    precio: number;
    created_at: string;
}

export type Service = {
    id: number;
    nombre: string;
    creado_en: string;
};


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

    const loadProductos = async () => {
        const result = await getAllProducts();
        setProductos(result);
    };

    const loadServicios = async () => {
        const result = await getAllServices();
        setServicios(result);
    };

    useEffect(() => {
        loadProductos();
        loadServicios();
    }, []);

    const handleAddOrUpdateProducto = async () => {
        try {
            if (productoEdit?.id) {
                await updateProduct(productoEdit.id, { nombre: nombreProducto, cantidad: cantidadProducto, precio: precioProducto });
                setShowToast({ type: "success", message: "Producto actualizado con éxito" });
            } else {
                await addProduct(nombreProducto, cantidadProducto, precioProducto);
                setShowToast({ type: "success", message: "Producto agregado con éxito" });
            }
            setNombreProducto("");
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
                    <button onClick={() => setModoGestion("productos")} className={` ${ modoGestion === "productos" ? "bg-pink-800 text-yellow-300" : " bg-gray-500 text-white"} cursor-pointer  px-4 py-1 rounded font-bold`}>Productos</button>
                    <button onClick={() => setModoGestion("servicios")} className={` ${ modoGestion === "servicios" ? "bg-pink-800 text-yellow-300" : " bg-gray-500 text-white"} cursor-pointer px-4 py-1 rounded font-bold`}>Servicios</button>
                </div>
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
                        <div className="grid grid-cols-3 gap-4 mb-4">
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
                            <div className="col-span-3 ">
                                <button onClick={handleAddOrUpdateProducto} className="bg-pink-800 cursor-pointer text-yellow-300 px-6 py-1 rounded">{productoEdit ? "Actualizar" : "Agregar"}</button>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-2 mb-2">
                        <input type="text" className=" text-black w-full rounded border border-gray-700 px-2 py-1" placeholder="Buscar producto..." value={searchProductQuery} onChange={(e) => setSearchProductQuery(e.target.value)} />
                        <button className="bg-pink-700 cursor-pointer text-yellow-300 rounded px-4" onClick={handleSearchProducts}>Buscar</button>
                    </div>

                    <div className="overflow-auto">
                        <div className={`grid  ${soloVisualizar ? "grid-cols-3" : "grid-cols-4"} gap-4 font-bold border-b pb-2 text-black`}>
                            <span className=" text-black">Nombre</span>
                            <span className=" text-black">Cantidad</span>
                            <span className=" text-black">Precio</span>
                            {!soloVisualizar && (
                                <span className=" text-black">Acciones</span>
                            )}
                        </div>
                        {productos.map((p) => (
                            <div key={p.id} className={`grid ${soloVisualizar ? "grid-cols-3" : "grid-cols-4"} gap-4 border-b py-1`}>
                                <span className=" text-black">{p.nombre}</span>
                                <span className=" text-black">{p.cantidad}</span>
                                <span className=" text-black">{p.precio}</span>
                                <div className="flex gap-2">
                                    {!soloVisualizar && (
                                        <>
                                            <button onClick={() => handleDeleteProducto(p.id)} className="bg-red-600 cursor-pointer text-white font-bold px-2 py-0.5 rounded">Eliminar</button>
                                            <button onClick={() => {
                                                setProductoEdit(p);
                                                setNombreProducto(p.nombre);
                                                setCantidadProducto(p.cantidad);
                                                setPrecioProducto(p.precio);
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


