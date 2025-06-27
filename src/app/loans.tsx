import { useState, useEffect } from "react";
import Select from "react-dropdown-select";
import { listUsers } from "@/lib/userservice";
import { useUser } from "@/lib/context/Usercontext";
import { createLoanRecord, getEmployeeDebt } from "@/lib/supabase/loans";

interface EmpleadoOption {
  label: string;
  value: string;
  id: string;
}

export const LoanOrAbono = () => {
  const [empleados, setEmpleados] = useState<EmpleadoOption[]>([]);
  const [selectedEmpleado, setSelectedEmpleado] = useState<EmpleadoOption[]>([]);
  const [monto, setMonto] = useState("");
  const [tipoOperacion, setTipoOperacion] = useState<"prestamo" | "abono">("prestamo");
  const [deudaActual, setDeudaActual] = useState<number | null>(null);
  const { user } = useUser();

  useEffect(() => {
    listUsers(1, 100).then((data) => {
      const empleadosFormateados = data.map((u) => {
        const nombre = u.nombres.charAt(0).toUpperCase() + u.nombres.slice(1).toLowerCase();
        const iniciales = u.apellidos.split(" ").map((p: string) => p.charAt(0).toUpperCase()).join(".") + ".";
        return {
          label: `${nombre} ${iniciales}`,
          value: `${nombre} ${iniciales}`,
          id: u.id,
        };
      });
      setEmpleados(empleadosFormateados);
    });
  }, []);

  useEffect(() => {
    if (selectedEmpleado.length > 0) {
      getEmployeeDebt(selectedEmpleado[0].id).then(setDeudaActual);
    } else {
      setDeudaActual(null);
    }
  }, [selectedEmpleado]);

  const handleSubmit = async () => {
    if (!selectedEmpleado.length || !monto) return;
    await createLoanRecord(selectedEmpleado[0].id, tipoOperacion, parseFloat(monto));
    setMonto("");
    const deuda = await getEmployeeDebt(selectedEmpleado[0].id);
    setDeudaActual(deuda);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-pink-200">
      <div className="w-[90%] sm:w-[60%] bg-white border-2 border-gray-700 rounded-xl shadow-md p-5">
        <div className=" bg-pink-800">
          <p className="text-3xl text-center font-bold bg-gradient-to-r from-yellow-300 via-yellow-200 to-yellow-400 bg-clip-text text-transparent mb-6">
          Prestamos
        </p>
        </div>
        

        <div className="mb-4">
          <Select
                      options={empleados}
                      values={selectedEmpleado}
                      onChange={(selected) => setSelectedEmpleado(selected)}
                      placeholder="Selecciona un empleado"
                      className="text-black border border-gray-700 rounded"
                      dropdownHandle={false}
                      searchable
                      clearable onSelect={function (value: EmpleadoOption[]): void {
                          throw new Error("Function not implemented.");
                      } } onDeselect={function (value: EmpleadoOption[]): void {
                          throw new Error("Function not implemented.");
                      } }          />
        </div>

        <div className="flex justify-between mb-4">
          <button
            onClick={() => setTipoOperacion("prestamo")}
            className={`w-[48%] py-2 rounded font-semibold transition-all duration-200 ${
              tipoOperacion === "prestamo"
                ? "bg-gradient-to-r from-yellow-300 via-yellow-200 to-yellow-400 text-black"
                : "bg-pink-800 text-yellow-300"
            }`}
          >
            Préstamo
          </button>

          <button
            onClick={() => setTipoOperacion("abono")}
            className={`w-[48%] py-2 rounded font-semibold transition-all duration-200 ${
              tipoOperacion === "abono"
                ? "bg-gradient-to-r from-yellow-300 via-yellow-200 to-yellow-400 text-black"
                : "bg-pink-800 text-yellow-300"
            }`}
          >
            Abono
          </button>
        </div>

        <div className="mb-4">
          <label className="text-sm font-semibold text-black">Monto</label>
          <input
            type="number"
            className="w-full mt-1 rounded bg-white text-black border border-gray-700 h-10 px-2"
            placeholder="$ 0"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <p className="text-black text-sm font-semibold">
            Deuda actual: {deudaActual !== null ? `$ ${deudaActual.toLocaleString("es-CO")}` : "—"}
          </p>
        </div>

        <button
          className="w-full py-2 rounded bg-pink-800 text-yellow-300 font-bold hover:opacity-90 transition"
          onClick={handleSubmit}
          disabled={selectedEmpleado.length === 0 || !monto}
        >
          {tipoOperacion === "prestamo" ? "Registrar Préstamo" : "Registrar Abono"}
        </button>
      </div>
    </div>
  );
};

