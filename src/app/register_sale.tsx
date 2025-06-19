import { Dropdown, DropdownItem } from "flowbite-react"
import { useState, useEffect } from "react";
import Select from "react-dropdown-select";
import { listUsers } from "@/lib/userservice";
import { useUser } from "@/lib/context/Usercontext";
import { createSaleRecord } from '@/lib/supabase/sales';





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

const servicios = ["Manicura", "Pedicura", "Pelo", "Planchado"];

const opciones = servicios.map(s => ({ label: s, value: s }));


export const Register_sale = () => {

    const [empleados, setEmpleados] = useState<EmpleadoOption[]>([]);
    const metodos = ["Efectivo", "Bold", "Transferencia"];
    const [items, setItems] = useState<ServicioItem[]>([]);
    const [Cant, setCant] = useState(0)
    const [Price, setPrice] = useState<number>(0);
    const [rawPrice, setRawPrice] = useState<string>('');
    const { user, loading } = useUser(); // Aquí obtienes el user directamente


    interface User {
        id: string;
        nombres: string;
        apellidos: string;
        celular: string;
        correo: string;
        rol: "admin" | "employee" | "guest";
        created_at: string;
        updated_at: string;
    }



    const [users, setUsers] = useState<User[]>([]);

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
    // Traer primera página con 100 usuarios
    listUsers(1, 100)
        .then((data) => {
            setUsers(data);

            // Aquí armamos el array de empleados con la estructura solicitada
            const empleadosFormateados = data.map((user) => {
                const nombre = user.nombres.charAt(0).toUpperCase() + user.nombres.slice(1).toLowerCase();

                const inicialesApellidos = user.apellidos
                    .split(' ')
                    .filter((palabra: string) => palabra.trim() !== '') // evita errores si hay espacios extra
                    .map((palabra: string) => palabra.charAt(0).toUpperCase())
                    .join('.') + '.';

                return {
                    label: `${nombre} ${inicialesApellidos}`,
                    value: `${nombre} ${inicialesApellidos}`,
                    id: user.id
                };
            });

            setEmpleados(empleadosFormateados);
        })
        .catch((err) => {
            setError(err instanceof Error ? err.message : String(err));
        });
}, []);



    const [values, setValues] = useState<{ label: string; value: string }[]>([]);
    const [values2, setValues2] = useState<{ label: string; value: string; id: string }[]>([]);

    const addItem = (nuevo: Omit<ServicioItem, 'id'>) => {
        setItems(prev => [
            ...prev,
            { id: prev.length, ...nuevo }
        ]);
        setCant(0)
        setPrice(0)
        setValues([]);
        setRawPrice("")
    };

    const removeItem = (idToRemove: number) => {
        setItems(prev => {
            const filtrados = prev.filter(item => item.id !== idToRemove);
            return filtrados.map((item, index) => ({ ...item, id: index }));
        });
    };



    const totalPrecioXCantidad = items.reduce(
        (sum, item) => sum + item.precio * item.cantidad,
        0
    ) + Price * Cant;
    const totalGanado = items.reduce(
        (sum, item) => sum + item.ganado,
        0
    ) + (Price * Cant) * 0.5;

    const [selectedEmpleado, setSelectedEmpleado] = useState((user?.userProfile?.rol === "admin" ? "" : user?.userProfile?.nombres + " " + user?.userProfile?.apellidos));
    const [selectedMetodo, setselectedMetodo] = useState("");



    const Make_sales = async () => {
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
            selectedMetodo === 'Bold' ? 'card'
                : (selectedMetodo === 'Transferencia' ? 'transaction' : 'cash');

        const response = await createSaleRecord(values2[0].id, metodo, items);
        console.log(user.userProfile.id)

        if (response.success) {
            console.log('Venta creada con éxito:', response.data);
            setCant(0)
            setPrice(0)
            setValues([]);
            setRawPrice("")
            setItems([]);
            setSelectedEmpleado("");
            setselectedMetodo("");
        } else {
            console.error('Error al crear la venta:', response.error.message, response.error.details);
            setError(response.error.message);
        }
    };


    return (
        <div className=" w-full h-full flex flex-row">
            <div className=" flex flex-col w-[100%]  h-full  items-center justify-center ">
                <div className=" w-full h-full sm:w-[98%] sm:h-[98%] flex  sm:rounded-2xl sm:border-2 bg-pink-200 sm:border-black  items-center justify-center">
                    <div className=" w-[95%] h-[95%] ">
                        <div className=" border-2 border-black rounded-t-md w-full h-[6%] sm:h-[10%] text-center bg-pink-600"><p className=" text-white text-3xl font-semibold">Registrar venta</p></div>

                        <div className="flex h-[89%] sm:h-[85%] flex-col sm:flex-row w-full sm:justify-evenly items-center justify-center">
                            <div className=" sm:pr-5 pb-5 pt-2 sm:pt-5 w-full sm:w-[80%] h-[70%] sm:h-full flex flex-col    items-center justify-center">
                                <div className=" border-2 border-black  w-full h-[70%] sm:h-full flex flex-row rounded-t-md   bg-red-100 items-center justify-center">
                                    <div className=" flex flex-col w-[50%] gap-2.5  items-center justify-center">
                                        <div className=" w-[80%] ">
                                            <Select
                                                className="w-[100%] h-10 border text-black border-black rounded bg-white"
                                                options={empleados}
                                                values={
                                                    user?.userProfile?.rol === "admin"
                                                        ? values2
                                                        : [{
                                                            label: (user?.userProfile?.nombres ?? "") + " " + (user?.userProfile?.apellidos ?? ""),
                                                            value: (user?.userProfile?.nombres ?? "") + " " + (user?.userProfile?.apellidos ?? ""),
                                                            id: (user?.userProfile?.id ?? ""),
                                                        }]
                                                }
                                                disabled={user?.userProfile?.rol === "employee"}
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
                                            <p className=" text-black text-xs">Servicio</p>
                                            <Select
                                                disabled={selectedEmpleado === ""}
                                                className=" w-[100%] h-10  border text-black border-black rounded bg-white"
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
                                            <p className=" text-black text-xs">Precio Servicio</p>
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
                                            <Dropdown color="pink" className=" max-w-sm sm:w-full bg-pink-600 text-xs truncate" label={selectedMetodo || "Metodo de pago"}>
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
                                            <p className=" text-black text-xs">Cantidad Servicio</p>
                                            <input
                                                disabled={selectedEmpleado === ""}
                                                className=" w-[100%] h-10   text-black  rounded bg-white"
                                                placeholder="Cantidad"
                                                type="number"
                                                value={Cant > 0 ? Cant : ""}
                                                onChange={(e) => setCant(parseFloat(e.target.value))}
                                            />
                                        </div>

                                        <div className=" w-[80%]">
                                            <p className=" text-black text-xs">Ganancia por Servicio</p>
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
                                <div className=" rounded-b-md border-2 border-black border-t-0 justify-center w-full h-[30%] bg-amber-300 flex flex-col">
                                    <p className=" px-2.5 text-black">{"Total " + formatCurrency(totalPrecioXCantidad)}</p>
                                    <p className=" px-2.5 text-black">{"Total Ganado " + formatCurrency(totalGanado)}</p>
                                </div>
                            </div>

                            <div className="  sm:w-[20%] sm:h-full h-[30%] w-full pb-5 sm:pt-5 flex flex-col">
                                <div className=" text-center text-black text-2xl border-2 rounded-t-md border-black bg-white"><p>Servicios</p></div>
                                <div className=" bg-white w-full h-full border-2 rounded-b-md border-black border-t-0  overflow-auto flex flex-col gap-0.5">
                                    {items.map(item => (
                                        <div key={item.id} className="pl-2.5 text-start content-center w-full h-[30%] sm:h-[10%] bg-pink-700 flex flex-row">
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
                                <div className=" text-center  w-[50%] h-full"><button disabled={Cant === 0 || Price === 0 || !values} onClick={() =>
                                    addItem({
                                        servicio: values[0].value,
                                        cantidad: Cant,
                                        precio: Price,
                                        ganado: (Price * Cant) * 0.5
                                    })
                                } className=" cursor-pointer  bg-pink-600 rounded-md w-[50%] h-full">Agregar</button></div>
                                <div className="text-center w-[50%] h-full"><button onClick={Make_sales} className="  bg-pink-600 rounded-md w-[50%] h-full">Finalizar</button></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>

    )
}



/*

<Dropdown color="pink" className=" max-w-sm sm:max-w-sm w-full bg-pink-600 text-xs " label={selectedEmpleado || "Empleado"}>
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