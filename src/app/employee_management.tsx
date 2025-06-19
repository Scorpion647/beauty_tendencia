
import { createUser, listUsers } from "@/lib/userservice";
import { Dropdown, DropdownItem } from "flowbite-react";
import { useState, useEffect } from "react";




export const Management_employee = () => {

    const [showemployee, setshowemployee] = useState(false)

    const [name, setname] = useState("")
    const [lastname, setlastname] = useState("")
    const [phone, setphone] = useState("")
    const [email, setemail] = useState("")
    const [userrol, setuserrole] = useState("")
    const Roles = ["Admininstrador", "Empleado", "No verificado"];

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

    const handleCreateUser = async () => {
        try {
            const res = await fetch("/api/createuser", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nombres: name,
                    apellidos: lastname,
                    celular: phone,
                    correo: email,
                    rol: (userrol === "Admininstrador" ? "admin" : (userrol === "Empleado" ? "employee" : "guest")),
                }),
            });

            // Primero comprobamos que venga JSON
            const contentType = res.headers.get("content-type") || "";
            if (!contentType.includes("application/json")) {
                const text = await res.text();
                throw new Error(`Respuesta no JSON del servidor:\n${text}`);
            }

            const result = await res.json();
            if (!res.ok) {
                // Backend devolvió status >=400
                throw new Error(result.message || "Error desconocido al crear usuario");
            }

            alert("Usuario creado correctamente");
            // Aquí podrías limpiar campos, mostrar modal, etc.
        } catch (err: unknown) {
            let errorMessage = "Error inesperado";
            if (err instanceof Error) errorMessage = err.message;
            else if (typeof err === "string") errorMessage = err;
            else {
                try {
                    errorMessage = JSON.stringify(err);
                } catch {
                    // se queda “Error inesperado”
                }
            }
            console.log(errorMessage)
            alert("Error al crear usuario: " + errorMessage);
        }
    };

    const ShowEmployee = (name: string, last_name: string, phone: string, email: string, rol: string) => {
        setshowemployee(true)
        setname(name)
        setlastname(last_name)
        setphone(phone)
        setemail(email)
        setuserrole(rol === "admin" ? "Admininstrador" : (rol === "employee" ? "Empleado" : "No verificado"))
    }

    useEffect(() => {
        if (showemployee === false) {
            if (name !== "" || lastname !== "" || phone !== "" || email !== "" || userrol !== "") {
                setname("")
                setlastname("")
                setphone("")
                setemail("")
                setuserrole("")
            }
        }
    }, [showemployee])


    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Traer primera página con 100 usuarios
        listUsers(1, 100)
            .then((data) => {
                setUsers(data);
                setLoading(false);
            })
            .catch((err) => {
                setError(err instanceof Error ? err.message : String(err));
                setLoading(false);
            });
    }, []);

    if (loading) return <p>Cargando usuarios…</p>;
    if (error) return <p>Error al cargar: {error}</p>;


    return (
        <div className=" w-full h-full flex flex-row">
            <div className=" flex flex-col w-[100%]  h-full  items-center justify-center ">
                <div className=" w-full h-full sm:w-[98%] sm:h-[98%] flex flex-col gap-2.5  sm:rounded-2xl sm:border-2 bg-pink-200 sm:border-black  items-center justify-center">
                    <div className=" w-[95%] h-[10%] flex bg-amber-500  items-center justify-center">
                        <p className=" text-white text-2xl">Gestion de empleados</p>
                    </div>
                    <div className=" w-[95%] flex flex-col sm:flex-row gap-2.5 h-[82%] ">
                        <div className=" flex flex-col w-full h-[70%] sm:w-[60%] sm:h-full bg-red-500">
                            <div className=" flex flex-row h-[10%] w-full bg-blue-500">

                                <div className={`${showemployee ? "w-[90%]" : "w-full"} h-full flex items-center justify-center`}>
                                    <p className={`${showemployee ? "text-lg sm:text-2xl" : "text-2xl"}  text-black`}>{showemployee ? (name + " " + lastname + ".") || "Empleado X" : "Agregar empleado"}</p>
                                </div>

                                <div className={`${showemployee ? " flex" : " hidden"} w-[10%] h-full flex items-center justify-center`}>
                                    <p onClick={() => setshowemployee(false)} className=" cursor-pointer text-3xl text-black">X</p>
                                </div>

                            </div>
                            <div className=" py-10 h-[80%] w-full flex flex-col sm:justify-evenly gap-8 bg-orange-500">
                                <div className=" px-2 sm:px-5 w-full h-[30%] sm:h-[25%] sm:max-h-[70px] flex flex-row gap-5">
                                    <div className="flex flex-col w-[50%] h-full ">
                                        <label className="text-sm mb-1">Nombres</label>
                                        <input
                                            value={name}
                                            onChange={(e) => setname(e.target.value)}
                                            className="bg-white w-full h-full  px-2 py-1 text-black border border-gray-300 rounded"
                                            placeholder="Escribe aquí"
                                        />
                                    </div>
                                    <div className="flex flex-col w-[50%] h-full">
                                        <label className="text-sm mb-1">Apellidos</label>
                                        <input
                                            value={lastname}
                                            onChange={(e) => setlastname(e.target.value)}
                                            className="bg-white w-full h-full px-2 py-1 text-black border border-gray-300 rounded"
                                            placeholder="Escribe aquí"
                                        />
                                    </div>
                                </div>
                                <div className=" px-2 sm:px-5 w-full h-[30%] sm:h-[25%] sm:max-h-[70px] flex flex-row gap-5">
                                    <div className="flex flex-col w-[50%] h-full">
                                        <label className="text-sm mb-1">Numero celular</label>
                                        <input
                                            value={phone}
                                            onChange={(e) => setphone(e.target.value)}
                                            className="bg-white w-full h-full px-2 py-1 text-black border border-gray-300 rounded"
                                            placeholder="Escribe aquí"
                                        />
                                    </div>
                                    <div className="flex flex-col w-[50%] h-full">
                                        <label className="text-sm mb-1">Correo electronico</label>
                                        <input
                                            value={email}
                                            onChange={(e) => setemail(e.target.value)}
                                            className="bg-white w-full h-full px-2 py-1 text-black border border-gray-300 rounded"
                                            placeholder="Escribe aquí"
                                        />
                                    </div>
                                </div>
                                <div className="px-2 sm:px-5 w-full h-[30%] sm:h-[25%] sm:max-h-[70px] flex justify-center  items-center ">
                                    <div className="flex flex-col w-[50%] h-full">
                                        
                                        
                                        <Dropdown color="pink" className=" max-w-sm sm:w-full bg-pink-600 text-xs truncate" label={userrol || "Rol"}>
                                            {Roles.map((metodo) => (
                                                <DropdownItem key={metodo} onClick={() => setuserrole(metodo)}>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="radio"
                                                            name="metodos"
                                                            checked={userrol === metodo}
                                                            readOnly
                                                        />
                                                        <span>{metodo}</span>
                                                    </div>
                                                </DropdownItem>
                                            ))}
                                        </Dropdown>
                                    </div>
                                </div>

                            </div>
                            <div className=" h-[10%] w-full flex bg-blue-500 justify-center items-center">
                                <button className=" w-[25%] bg-pink-500"
                                    onClick={handleCreateUser}
                                >
                                    {showemployee === false ? "Agregar" : "Actualizar"}
                                </button>
                            </div>
                        </div>
                        <div className=" py-2 sm:py-0 w-full h-[30%] sm:w-[40%] sm:h-full flex flex-col bg-green-500">
                            <div className=" bg-amber-400 w-full h-[5%] sm:h-[10%] flex items-center justify-center">
                                <p className=" text-lg sm:text-2xl">Empleados</p>
                            </div>
                            <div className=" w-full h-[95%] flex flex-col sm:h-[90%]">
                                {users.map((u) => (
                                    <div key={u.id} className=" px-2.5 w-full h-[10%] flex flex-row">
                                        <div className=" w-[80%] h-full">
                                            <p className=" text-sm sm:text-lg">{u.nombres} {u.apellidos}</p>
                                        </div>
                                        <div className=" w-[10%] h-full">
                                            <p className=" text-sm sm:text-lg">{u.rol === "admin" ? "ADM" : "EMP"}</p>
                                        </div>
                                        <div className=" w-[10%] h-full">
                                            <p onClick={() => ShowEmployee(u.nombres, u.apellidos, u.celular, u.correo, u.rol)} className=" cursor-pointer text-sm sm:text-lg">Edit</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {/*users.map((u) => (
                                <p key={u.id}>{u.nombres}</p>
                            ))*/}
                        </div>
                    </div>
                </div>
            </div>

        </div>

    )
}