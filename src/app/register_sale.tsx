import { Dropdown, DropdownItem, Toast, ToastToggle } from "flowbite-react"
import { useState, useEffect } from "react";
import Select from "react-dropdown-select";
import { listUsers } from "@/lib/userservice";
import { useUser } from "@/lib/context/Usercontext";
import { createSaleRecord } from '@/lib/supabase/sales';
import { getAllServices } from "@/lib/supabase/services";
import { HiFire } from "react-icons/hi";
import Accessmodal from "./components/accessmodal";
import { getAllProducts, registrarVentaProducto } from "@/lib/supabase/products";





interface ServicioItem {
    id: number;
    servicio: string;
    cantidad: number;
    precio: number;
    ganado: number;
}


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

type EmpleadoOption = { label: string; value: string; id: string; };

type ProductsOption = { label: string; value: number; id: number; descuento: number | null; };










export const Register_sale = () => {
    const { user, loading } = useUser();

    // Estados

    const [servicios, setServicios] = useState<string[]>([]);
    const [empleados, setEmpleados] = useState<EmpleadoOption[]>([]);
    const [cargando, setcargando] = useState(false)
    const [productos, setproductos] = useState<ProductsOption[]>([]);
    const [CantP, setCantP] = useState(1);
    const [items, setItems] = useState<ServicioItem[]>([]);
    const [Cant, setCant] = useState(1);
    const [isOpen, setIsOpen] = useState(false);
    const openModal = () => setIsOpen(true);
    const closeModal = () => setIsOpen(false);
    const [Price, setPrice] = useState<number>(0);
    const [rawPrice, setRawPrice] = useState<string>('');
    const [visible, setVisible] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [values, setValues] = useState<{ label: string; value: string }[]>([]);
    const [values2, setValues2] = useState<{ label: string; value: string; id: string }[]>([]);
    const [values3, setValues3] = useState<{ label: string; value: number; id: number; descuento: number | null }[]>([]);
    const [selectedEmpleado, setSelectedEmpleado] = useState(
        user?.userProfile?.rol === 'admin'
            ? ''
            : `${user?.userProfile?.nombres ?? ''} ${user?.userProfile?.apellidos ?? ''}`
    );
    const [selectedMetodo, setselectedMetodo] = useState('');
    const metodos = ['Efectivo', 'Bold', 'Transferencia'];

    // Carga inicial de datos
    useEffect(() => {
        async function fetchData() {
            try {
                const data = await listUsers(1, 100);
                const empleadosFormateados = data.map((user) => {
                    const nombre = user.nombres.charAt(0).toUpperCase() + user.nombres.slice(1).toLowerCase();
                    const inicialesApellidos = user.apellidos
                        .split(' ')
                        .filter((palabra: string) => palabra.trim() !== '')
                        .map((palabra: string) => palabra.charAt(0).toUpperCase())
                        .join('.') + '.';

                    return {
                        label: `${nombre} ${inicialesApellidos}`,
                        value: `${nombre} ${inicialesApellidos}`,
                        id: user.id,
                    };
                });
                setEmpleados(empleadosFormateados);

                const prod = await getAllProducts()
                const productosformateados = prod.map((ser) => {
                    return {
                        label: ser.nombre,
                        value: ser.precio,
                        id: ser.id,
                        descuento: ser.descuento,
                    }
                })
                setproductos(productosformateados)
            } catch (err) {
                setError(err instanceof Error ? err.message : String(err));
                console.log(error)
            }

            try {
                const service = await getAllServices();
                if (service.length > 0) {
                    const nombres = service.map((s) => s.nombre); // extraes solo los nombres (string[])
                    setServicios(nombres); // ahora sí encaja con useState<string[]>
                }
            } catch (error) {
                console.log(error);
            }
        }

        fetchData();
    }, []);

    if (loading) return <div>Cargando...</div>;

    // Funciones auxiliares
    const addItem = (nuevo: Omit<ServicioItem, 'id'>) => {
        setItems((prev) => [...prev, { id: prev.length, ...nuevo }]);
        setCant(1);
        setPrice(0);
        setValues([]);
        setRawPrice('');
    };

    const removeItem = (idToRemove: number) => {
        setItems((prev) => {
            const filtrados = prev.filter((item) => item.id !== idToRemove);
            return filtrados.map((item, index) => ({ ...item, id: index }));
        });
    };

    const totalPrecioXCantidad =
        items.reduce((sum, item) => sum + item.precio * item.cantidad, 0) + Price * Cant;

    const totalGanado =
        items.reduce((sum, item) => sum + item.ganado, 0) + (Price * Cant) * 0.5;

    const Make_sales = async () => {
        setcargando(true)
        if (!user?.userProfile?.id) {
            setError('No hay usuario autenticado');
            return;
        }

        if (!items.length) {
            setError('Agrega al menos un ítem antes de finalizar');
            return;
        }

        if (!selectedMetodo) {
            setError('Selecciona un método de pago');
            return;
        }

        const metodo: 'cash' | 'card' | 'transaction' =
            selectedMetodo === 'Bold'
                ? 'card'
                : selectedMetodo === 'Transferencia'
                    ? 'transaction'
                    : 'cash';

        const response = await createSaleRecord(values2[0].id, metodo, items);

        if (response.success) {
            setVisible(true);
            setCant(1);
            setPrice(0);
            setValues([]);
            setRawPrice('');
            setItems([]);
            setSelectedEmpleado('');
            setselectedMetodo('');
            setTimeout(() => setVisible(false), 3000);

        } else {
            setError(response?.error?.message || "");
            console.error('Error al crear la venta:', response?.error?.message, response?.error);
        }
        setcargando(false)
    };

    const Register_sale_product = async () => {
        try {
            await registrarVentaProducto(values3[0].id, CantP)
            setValues3([])
            setCantP(1)
        } catch {
            console.log("Fallo al registrar venta")
        }
    }

    const opciones = servicios.map((s) => ({ label: s, value: s }));


    return (
        <div className=" w-full h-full flex flex-row">
            <div className=" flex flex-col w-[100%]  h-full  items-center justify-center ">
                <div className=" w-full h-full sm:w-[98%] sm:h-[98%] flex  sm:rounded-2xl sm:border-2 bg-pink-200 sm:border-gray-700  items-center justify-center">
                    <div className=" w-[95%] h-[95%] ">
                        <div className=" border-2 border-gray-700 rounded-t-md w-full h-[6%] sm:h-[10%] flex items-center justify-center bg-pink-800"><p className="  text-3xl font-semibold bg-gradient-to-r from-yellow-300 via-yellow-200 to-yellow-400 bg-clip-text text-transparent">Registrar venta</p></div>

                        <div className="flex h-[89%] sm:h-[85%] flex-col sm:flex-row w-full sm:justify-evenly items-center justify-center">
                            <div className=" sm:pr-5 pb-5 pt-2 sm:pt-5 w-full sm:w-[80%] h-[70%] sm:h-full flex flex-col    items-center justify-center">
                                <div className=" relative border-2 font-bold border-gray-700  w-full h-[70%] sm:h-full flex flex-row rounded-t-md   bg-red-100 items-center justify-center">


                                    <Accessmodal isOpen={isOpen} onClose={closeModal}>
                                        <div>
                                            <div className=" mb-5 w-full flex items-center justify-center bg-pink-800"><p className="  text-2xl font-bold bg-gradient-to-r from-yellow-300 via-yellow-200 to-yellow-400 bg-clip-text text-transparent">Registrar venta de producto</p></div>
                                            <div className=" w-full bg-amber-200 "><p className=" text-red-700 text-xs ">La venta de productos se gestionará de forma independiente a los registros de servicios, por lo tanto, no estará vinculada a ninguna venta de servicio ni asociada a ningún empleado.</p></div>
                                            <p className=" pt-3 pb-2 text-black">Producto</p>
                                            <Select
                                                className="w-[100%] h-10 border text-black border-gray-700 rounded bg-white"
                                                options={productos}
                                                values={values3}
                                                onChange={(selected) => {
                                                    setValues3(selected);
                                                }}
                                                placeholder="Seleccionar producto"
                                                searchable
                                                clearable
                                                dropdownHandle={false}
                                                dropdownHeight="110px" // Altura máxima del menú desplegable
                                                onSelect={(selected) => {
                                                    console.log("Seleccionado:", selected);
                                                }}
                                                onDeselect={(deselected) => {
                                                    console.log("Deseleccionado:", deselected);
                                                }}
                                            />
                                            <p className=" pt-3 pb-2 text-black">Cantidad</p>
                                            <input type="number" value={CantP} onChange={(e) => setCantP(parseInt(e.target.value))} min={1} className=" w-[100%] py-2 pl-2  border text-black border-gray-700 rounded bg-white" placeholder="Cantidad a vender" />
                                            {values3.length > 0 && (
                                                <div className=" w-full flex flex-col mt-2">
                                                    <p className="text-gray-700">Valor Unitario: {formatCurrency(values3[0]?.descuento === null ? values3[0]?.value : values3[0]?.value * (values3[0]?.descuento / 100))}</p>
                                                    {values3[0]?.descuento !== null && (
                                                        <p className="text-gray-700">Descuento aplicado: {values3[0]?.descuento}%</p>
                                                    )}
                                                    <p className=" text-gray-700">Valor Total: {formatCurrency(CantP > 0 ? (CantP * (values3[0]?.descuento === null ? values3[0]?.value : values3[0]?.value * (values3[0]?.descuento / 100))) : 0)}</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className=" w-full flex items-center justify-center mt-5"><button onClick={() => { closeModal(); Register_sale_product() }} className=" bg-pink-800 text-amber-300 p-2 rounded">Registrar</button></div>
                                    </Accessmodal>

                                    <div className="absolute top-3 left-5">
                                        <button onClick={openModal} className=" cursor-pointer p-1 text-sm bg-gradient-to-r from-yellow-300 via-yellow-200 to-yellow-400 text-black rounded shadow">
                                            Registrar venta de producto
                                        </button>
                                    </div>

                                    <div className=" flex flex-col w-[50%] gap-2.5  items-center justify-center ">

                                        <div className=" w-[80%] ">
                                            {visible && (
                                                <div className="fixed bottom-4 right-4 z-50">
                                                    <Toast>
                                                        <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-200 text-pink-600 dark:bg-pink-600 dark:text-cyan-200">
                                                            <HiFire className="h-5 w-5" />
                                                        </div>
                                                        <div className="ml-3 text-sm  font-bold">
                                                            Venta Registrada con exito
                                                        </div>
                                                        {/* Muestra el icono de cerrar */}
                                                        <ToastToggle onClick={() => setVisible(false)} />
                                                    </Toast>
                                                </div>
                                            )}

                                            <Select
                                                className="w-[100%] h-10 border text-black border-gray-700 rounded bg-white"
                                                options={empleados}
                                                values={
                                                    user?.userProfile?.rol === "admin" || user?.userProfile?.rol === "cashier"
                                                        ? values2
                                                        : [{
                                                            label: (user?.userProfile?.nombres ?? "") + " " + (user?.userProfile?.apellidos ?? ""),
                                                            value: (user?.userProfile?.nombres ?? "") + " " + (user?.userProfile?.apellidos ?? ""),
                                                            id: (user?.userProfile?.id ?? ""),
                                                        }]
                                                }
                                                disabled={user?.userProfile?.rol === "employee" || items.length > 0}
                                                onChange={(selected) => {
                                                    setValues2(selected);
                                                    if (selected.length > 0) {
                                                        setSelectedEmpleado(selected[0].value);
                                                    } else {
                                                        setSelectedEmpleado(''); // O null, o lo que consideres cuando no haya selección
                                                    }
                                                }}
                                                placeholder="Buscar empleado"
                                                searchable
                                                clearable
                                                dropdownHandle={false}
                                                dropdownHeight="110px" // Altura máxima del menú desplegable
                                                onSelect={(selected) => {
                                                    console.log("Seleccionado:", selected);
                                                }}
                                                onDeselect={(deselected) => {
                                                    console.log("Deseleccionado:", deselected);
                                                }}
                                            />
                                        </div>
                                        <div className=" w-[80%]">
                                            <p className=" text-black text-xs font-semibold">Servicio</p>
                                            <Select
                                                disabled={selectedEmpleado === ""}
                                                className=" w-[100%] h-10  border text-black border-gray-700 rounded bg-white"
                                                options={opciones}
                                                values={values}
                                                onChange={setValues}
                                                placeholder="Busca"
                                                searchable // activa el input de búsqueda
                                                clearable // permite limpiar la selección
                                                dropdownHandle={false} // oculta el “handle” si no lo necesitas
                                                dropdownHeight="110px" // Altura máxima del menú desplegable
                                                onSelect={(selected) => {
                                                    console.log("Seleccionado:", selected);
                                                }}
                                                onDeselect={(deselected) => {
                                                    console.log("Deseleccionado:", deselected);
                                                }} />
                                        </div>
                                        <div className=" w-[80%] flex flex-col">
                                            <p className=" text-black text-xs font-semibold">Precio Servicio</p>
                                            <input
                                                disabled={selectedEmpleado === ""}
                                                placeholder="Precio"
                                                value={rawPrice}
                                                className="w-[100%] h-10 text-black rounded bg-white"
                                                onChange={(e) => {
                                                    const inputValue = e.target.value;
                                                    const numericValue = inputValue.replace(/[^\d]/g, '');

                                                    if (numericValue === '') {
                                                        setRawPrice('');
                                                        setPrice(0);
                                                        return;
                                                    }

                                                    const price = parseFloat(numericValue);
                                                    const formatted = formatCurrency(price);

                                                    setRawPrice(formatted);
                                                    setPrice(price);
                                                }}

                                            />

                                        </div>

                                    </div>
                                    <div className=" flex flex-col w-[50%] gap-2.5 items-center justify-center" >
                                        <div className=" w-[80%]  flex justify-center">
                                            <Dropdown color="pink" className=" max-w-sm sm:w-full bg-pink-800 text-sm truncate text-yellow-300 font-extrabold" label={selectedMetodo || "Metodo de pago"}>
                                                {metodos.map((metodo) => (
                                                    <DropdownItem key={metodo} onClick={() => setselectedMetodo(metodo)}>
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="radio"
                                                                name="metodos"
                                                                checked={selectedMetodo === metodo}
                                                                readOnly
                                                            />
                                                            <span>{metodo}</span>
                                                        </div>
                                                    </DropdownItem>
                                                ))}
                                            </Dropdown>

                                        </div>

                                        <div className=" w-[80%]">
                                            <p className=" text-black text-xs font-semibold">Cantidad Servicio</p>
                                            <input
                                                disabled={selectedEmpleado === ""}
                                                className=" w-[100%] h-10   text-black  rounded bg-white"
                                                placeholder="Cantidad"
                                                type="number"
                                                value={!values[0]?.value ? "" : Cant}
                                                onChange={(e) => setCant(parseFloat(e.target.value))}
                                            />
                                        </div>

                                        <div className=" w-[80%]">
                                            <p className=" text-black text-xs font-semibold">Ganancia por Servicio</p>
                                            <input
                                                disabled={true}
                                                value={!Number.isNaN((Cant * Price) * 0.5) ? formatCurrency((Cant * Price) * 0.5) : "$ " + 0}
                                                placeholder="Ganancia"
                                                onChange={(e) => setCant(parseFloat(e.target.value))}
                                                className="  w-[100%] h-10  text-black  rounded bg-white"
                                            />
                                        </div>



                                    </div>

                                </div>
                                <div className=" rounded-b-md border-2 border-gray-700 border-t-0 justify-center w-full h-[30%] bg-amber-300 flex flex-col">
                                    <p className=" px-2.5 text-black font-semibold">{"Total " + formatCurrency(totalPrecioXCantidad)}</p>
                                    <p className=" px-2.5 text-black font-semibold">{"Total Ganado " + formatCurrency(totalGanado)}</p>
                                </div>
                            </div>

                            <div className="  sm:w-[20%] sm:h-full h-[30%] w-full pb-5 sm:pt-5 flex flex-col">
                                <div className=" text-center text-black text-2xl border-2 rounded-t-md border-gray-700 bg-pink-800"><p className=" font-semibold bg-gradient-to-r from-yellow-300 via-yellow-200 to-yellow-400 bg-clip-text text-transparent">Servicios</p></div>
                                <div className=" bg-white w-full h-full border-2 rounded-b-md border-gray-700 border-t-0  overflow-auto flex flex-col gap-0.5">
                                    {items.map(item => (
                                        <div key={item.id} className="pl-2.5 mb-0.5 mt-0.5 text-start content-center w-full h-[30%] sm:h-[10%] bg-pink-600 flex flex-row">
                                            <div className="text-start content-center w-[90%] h-full">
                                                <p className="text-sm sm:text-xs">{item.servicio}</p>
                                            </div>
                                            <div className="text-start content-center w-[10%] h-full cursor-pointer" onClick={() => removeItem(item.id)}>
                                                <p className="text-sm sm:text-xs">X</p>
                                            </div>
                                        </div>
                                    ))}

                                </div>
                            </div>
                        </div>
                        <div className=" flex flex-row w-[100%] sm:w-[80%] h-[5%] ">

                            <div className=" justify-center w-full h-full flex flex-row">
                                <div className=" text-center  w-[50%] h-full"><button disabled={Cant === 0 || Price === 0 || !values || selectedMetodo === "" || cargando} onClick={() =>
                                    addItem({
                                        servicio: values[0].value,
                                        cantidad: Cant,
                                        precio: Price,
                                        ganado: (Price * Cant) * 0.5
                                    })
                                } className={`   rounded-md w-[50%] h-full  font-semibold ${(Cant === 0 || Price === 0 || !values || selectedMetodo === "") ? "bg-gray-700 text-gray-300" : "bg-pink-600 cursor-pointer text-yellow-300"}`}>Agregar</button></div>
                                <div className="text-center w-[50%] h-full"><button onClick={Make_sales} disabled={items.length === 0 || cargando} className={`  rounded-md w-[50%] h-full font-semibold ${items.length > 0 ? "bg-pink-600 cursor-pointer" : "bg-gray-700 text-gray-300"}`}>Finalizar</button></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>

    )
}



/*

<Dropdown color="pink" className=" max-w-sm sm:max-w-sm w-full bg-pink-800 text-xs " label={selectedEmpleado || "Empleado"}>
                                                {empleados.map((empleado) => (
                                                    <DropdownItem key={empleado} onClick={() => setSelectedEmpleado(empleado)}>
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="radio"
                                                                name="empleado"
                                                                checked={selectedEmpleado === empleado}
                                                                readOnly
                                                            />
                                                            <span>{empleado}</span>
                                                        </div>
                                                    </DropdownItem>
                                                ))}
                                            </Dropdown>

*/