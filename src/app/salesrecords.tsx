import { listSalesSummary } from '@/lib/sales_records';
import { Button, Dropdown, DropdownItem, Radio } from 'flowbite-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, TooltipProps, AreaChart, Area } from 'recharts';
import { FaFilter } from "react-icons/fa";
import { MdListAlt } from 'react-icons/md';
import Accessmodal from './components/accessmodal';
import { listUsers } from "@/lib/userservice";
import { useUser } from "@/lib/context/Usercontext";
import Select from 'react-dropdown-select';
import { getLoanRecords } from '@/lib/supabase/loans';
import { toZonedTime, format } from 'date-fns-tz';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';


const timeZone = 'America/Bogota';

export type SalesItem = {
  service_name: string;
  service_cost: number;
  service_quantity: number;
};

export type SalesRecord = {
  sale_code: string;
  total_amount: number;
  earnings_amount: number;
  payment_method: string;  // Añadir esto
  sale_date: string;       // Añadir esto
  sales_items: SalesItem[];
  user_id: string;
};

interface LoanRecord {
  id: string;
  user_id: string;
  monto: number;
  tipo_operacion: "prestamo" | "abono";
  creado_en: string;
}


export type UserSalesData = {
  name: string;
  total: number;
  Ganado: number;
  sales_records: SalesRecord[];
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

function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

export function prepareHourlyData(
  records: SalesRecord[] | LoanRecord[],
  useEarnings = false
): { hour: string; value: number }[] {
  // Inicializamos cada hora a cero
  const buckets: Record<string, number> = {};
  for (let h = 0; h < 24; h++) {
    buckets[h.toString()] = 0;
  }



  // Función auxiliar que unifica fecha y valor
  function extract(rec: SalesRecord | LoanRecord) {
    if ('sale_date' in rec) {
      // SalesRecord
      return {
        date: new Date(rec.sale_date),
        value: useEarnings ? rec.earnings_amount : rec.total_amount,
      };
    } else {
      // LoanRecord
      return {
        date: new Date(rec.creado_en),
        // Ajusta según tu campo de monto de préstamo
        value: rec.monto,
      };
    }
  }

  // Agrupamos según la hora
  for (const rec of records) {
    const { date, value } = extract(rec);
    const hour = date.getHours().toString();
    buckets[hour] += value;
  }

  // Convertimos a array ordenado
  return Object.entries(buckets)
    .map(([hour, value]) => ({ hour, value }))
    .sort((a, b) => Number(a.hour) - Number(b.hour));
}




/**
 * Agrupa y suma total_amount (o earnings_amount) por día.
 * Para 'Semana' usaremos día de la semana (Lun, Mar…),
 * para 'Mes' usaremos día del mes (1,2,…).
 */
export function prepareDailyData(
  records: SalesRecord[] | LoanRecord[],
  selectedOption: "Semana" | "Mes",
  selectedDate: string,
  useEarnings = false
): { day: string; value: number }[] {
  const isLoanData = records.length > 0 && "tipo_operacion" in records[0];

  const buckets: Record<
    string,
    number | { prestamo: number; abono: number }
  > = {};

  function extract(
    rec: SalesRecord | LoanRecord
  ): {
    date: Date;
    value: number;
    tipo?: "prestamo" | "abono";
  } {
    if ("sale_date" in rec) {
      return {
        date: new Date(rec.sale_date),
        value: useEarnings ? rec.earnings_amount : rec.total_amount,
      };
    } else {
      return {
        date: new Date(rec.creado_en),
        value: rec.monto,
        tipo: rec.tipo_operacion,
      };
    }
  }

  if (selectedOption === "Semana") {
    const refDate = new Date(selectedDate);
    const refWeek = getWeekNumber(refDate);
    const refYear = refDate.getFullYear();
    const weekDays = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

    for (const day of weekDays) {
      buckets[day] = isLoanData ? { prestamo: 0, abono: 0 } : 0;
    }

    for (const rec of records) {
      const { date, value, tipo } = extract(rec);
      if (getWeekNumber(date) === refWeek && date.getFullYear() === refYear) {
        const wd = weekDays[date.getDay()];
        if (isLoanData && tipo) {
          const entry = buckets[wd] as { prestamo: number; abono: number };
          if (tipo === "prestamo") entry.prestamo += value;
          else if (tipo === "abono") entry.abono += value;
        } else {
          buckets[wd] = (buckets[wd] as number) + value;
        }
      }
    }

    return weekDays.map((wd) => {
      const entry = buckets[wd];
      return {
        day: wd,
        value: isLoanData
          ? (entry as { prestamo: number; abono: number }).prestamo -
          (entry as { prestamo: number; abono: number }).abono
          : (entry as number),
      };
    });
  }

  // Mes
  const refDate = new Date(selectedDate);
  const refMonth = refDate.getMonth();
  const refYear = refDate.getFullYear();
  const daysInMonth = new Date(refYear, refMonth + 1, 0).getDate();

  for (let d = 1; d <= daysInMonth; d++) {
    const key = d.toString();
    buckets[key] = isLoanData ? { prestamo: 0, abono: 0 } : 0;
  }

  for (const rec of records) {
    const { date, value, tipo } = extract(rec);
    if (date.getMonth() === refMonth && date.getFullYear() === refYear) {
      const dayStr = date.getDate().toString();
      if (isLoanData && tipo) {
        const entry = buckets[dayStr] as { prestamo: number; abono: number };
        if (tipo === "prestamo") entry.prestamo += value;
        else if (tipo === "abono") entry.abono += value;
      } else {
        buckets[dayStr] = (buckets[dayStr] as number) + value;
      }
    }
  }

  return Object.entries(buckets)
    .map(([day, val]) => ({
      day,
      value: isLoanData
        ? (val as { prestamo: number; abono: number }).prestamo -
        (val as { prestamo: number; abono: number }).abono
        : (val as number),
    }))
    .sort((a, b) => Number(a.day) - Number(b.day));
}




function calcularBalancePrestamos(
  data: LoanRecord[],
  user: { userProfile?: { rol?: string; id?: string } } | null,
  selectedEmployee: UserSalesData | null,
  filtroUserId: string
): number {
  const esAdminSinEmpleado = !selectedEmployee && user?.userProfile?.rol === "admin";

  const registrosFiltrados = esAdminSinEmpleado
    ? data
    : data.filter((r) => r.user_id === filtroUserId);

  let totalPrestamos = 0;
  let totalAbonos = 0;

  for (const rec of registrosFiltrados) {
    if (rec.tipo_operacion === "prestamo") {
      totalPrestamos += rec.monto;
    } else if (rec.tipo_operacion === "abono") {
      totalAbonos += rec.monto;
    }
  }

  return totalPrestamos - totalAbonos;
}




type EmpleadoOption = { label: string; value: string; id: string; };

interface CustomTooltipProps extends TooltipProps<ValueType, NameType> {
  activeButton: string;
}


const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label, activeButton }) => {
  if (!active || !payload || !payload.length) return null;

  const dataPoint = payload[0].payload;
  const value = payload[0].value;
  const parsedValue = typeof value === 'number' ? value : Number(value) || 0;

  return (
    <div className="bg-gray-800 p-2 rounded text-white border border-gray-300">
      {activeButton === "Empleados" ? (
        <>
          <p className="font-bold mb-1">Empleado: {label}</p>
          <p>Total: {formatCurrency(parsedValue)} Pesos</p>
          <p>Cantidad de servicios: {dataPoint.sales_records?.length ?? 0}</p>
        </>
      ) : (
        <>
          <p className="font-bold mb-1">Empleado: {label}</p>
          <p>Monto prestado: {formatCurrency(parsedValue)} Pesos</p>
          {dataPoint.date && <p>Fecha: {new Date(dataPoint.date).toLocaleDateString()}</p>}
          {dataPoint.status && <p>Estado: {dataPoint.status}</p>}
        </>
      )}
    </div>
  );
};



type FilterOption = "Dia" | "Semana" | "Mes";
export const Sales_records = () => {
  type FilterType = 'today' | 'specific_day' | 'specific_week' | 'specific_month';
  type FilterOptions = { day?: string; week?: number; year?: number; month?: number };

  const { user, loading: loadingUser } = useUser();

  const [data, setData] = useState<UserSalesData[]>([]);
  const [loanRecords, setLoanRecords] = useState<LoanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isOpen2, setIsOpen2] = useState(false);
  const [s_items, sets_items] = useState<SalesRecord>();
  const [empleados, setEmpleados] = useState<EmpleadoOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<FilterOption>('Dia');
  const todayBogota = format(toZonedTime(new Date(), timeZone), 'yyyy-MM-dd');
  const [selectedDate, setSelectedDate] = useState(todayBogota);
  const [deudaTotal, setDeudaTotal] = useState(0);
  const [IDusersave, setIDusersave] = useState<string>('');
  const [processedLoans, setProcessedLoans] = useState<{ user_id: string | number; monto: number }[]>([]);
  const [barSize, setBarSize] = useState(20);
  const [selectedEmployee, setSelectedEmployee] = useState<UserSalesData | null>(null);
  const [values2, setValues2] = useState<EmpleadoOption[]>([]);
  const [activeButton, setActiveButton] = useState<string>('Empleados');
  const containerRef = useRef<HTMLDivElement>(null);

  const openModal = () => setIsOpen(true);
  const openModal2 = () => setIsOpen2(true);
  const closeModal = () => setIsOpen(false);
  const closeModal2 = () => setIsOpen2(false);

  const handleFilter = useCallback(async (id?: string) => {
    if (!selectedDate || !selectedOption) return;

    let filterType: FilterType = 'today';
    let options: FilterOptions = {};

    if (selectedOption === 'Dia') {
      filterType = 'specific_day';
      options.day = selectedDate;
    } else if (selectedOption === 'Semana') {
      const dateObj = new Date(selectedDate);
      filterType = 'specific_week';
      options = { week: getWeekNumber(dateObj), year: dateObj.getFullYear() };
    } else if (selectedOption === 'Mes') {
      const dateObj = new Date(selectedDate);
      filterType = 'specific_month';
      options = { month: dateObj.getMonth() + 1, year: dateObj.getFullYear() };
    }

    try {
      const uid = user?.userProfile?.rol !== 'admin' ? user?.userProfile?.id : id || IDusersave || undefined;
      const summary = await listSalesSummary(filterType, options, uid);
      setData(summary);
      closeModal2();
    } catch (error) {
      console.error('Error al filtrar:', error);
    }
  }, [selectedDate, selectedOption, IDusersave, user]);

  const handleFilterLoans = useCallback(async () => {
    const adaptedUser = user?.userProfile
      ? { userProfile: { rol: user.userProfile.rol, id: user.userProfile.id } }
      : null;
    try {
      const uid = values2.length > 0 ? values2[0].id : undefined;
      const date = selectedDate;
      const filtro = selectedOption;
      const loanData = await getLoanRecords(uid, date, filtro);
      setLoanRecords(loanData);
      setDeudaTotal(calcularBalancePrestamos(loanData, adaptedUser, selectedEmployee, user?.userProfile?.id || ''));
    } catch (error) {
      console.error('Error al aplicar el filtro:', error);
    }
  }, [values2, selectedDate, selectedOption, selectedEmployee, user]);

  useEffect(() => {
    const fetchInitial = async () => {
      await handleFilter();
      await handleFilterLoans();
      setLoading(false);
    };
    fetchInitial();
  }, [handleFilter, handleFilterLoans]);

  useEffect(() => {
    const fetchEmpleados = async () => {
      try {
        const users = await listUsers(1, 100);
        const empleadosFormateados = users.map((user) => {
          const nombre = user.nombres.charAt(0).toUpperCase() + user.nombres.slice(1).toLowerCase();
          const inicialesApellidos = user.apellidos
            .split(' ')
            .filter((p: string) => p.trim() !== '')
            .map((p: string) => p.charAt(0).toUpperCase())
            .join('.') + '.';
          return { label: `${nombre} ${inicialesApellidos}`, value: `${nombre} ${user.apellidos}`, id: user.id };
        });
        setEmpleados(empleadosFormateados);
      } catch (err) {
        console.error('Error al cargar empleados:', err);
      }
    };

    fetchEmpleados();
  }, []);


  useEffect(() => {
    const map = new Map<string | number, { totalPrestamos: number; totalAbonos: number }>();
    loanRecords.forEach(({ user_id, monto, tipo_operacion }) => {
      const entry = map.get(user_id) ?? { totalPrestamos: 0, totalAbonos: 0 };
      if (tipo_operacion === 'prestamo') {
        entry.totalPrestamos += monto;
      } else {
        entry.totalAbonos += monto;
      }

      map.set(user_id, entry);
    });

    const result = Array.from(map.entries()).map(([user_id, { totalPrestamos, totalAbonos }]) => {
      const match = empleados.find(e => e.id === String(user_id));
      return { user_id: match ? match.value : user_id, monto: totalPrestamos - totalAbonos };
    });

    setProcessedLoans(result);
  }, [loanRecords, empleados]);

  useEffect(() => {
    const width = containerRef.current?.offsetWidth ?? 0;
    const totalBars = data.length;
    const newBarSize = Math.max(Math.min((width / totalBars) * 0.6, 80), 10);
    setBarSize(newBarSize);
  }, [data]);

  const handleBarClick = (d: UserSalesData) => {
    setSelectedEmployee(d);
  };

  if (loading || loadingUser) return <div>Cargando...</div>;

  const records = data[0]?.sales_records ?? [];
  const recordss = loanRecords ?? [];

  const data2 = selectedOption === 'Dia'
    ? prepareHourlyData(records, user?.userProfile?.rol !== 'admin')
    : prepareDailyData(records, selectedOption, selectedDate, user?.userProfile?.rol !== 'admin');

  const data3 = selectedOption === 'Dia'
    ? prepareHourlyData(recordss)
    : prepareDailyData(recordss, selectedOption, selectedDate);

  const buttons = ['Empleados', 'Prestamos', 'Servicios'];









  return (
    <div className="w-full h-full flex flex-row" ref={containerRef}>
      <div className="flex flex-col w-[100%] h-full items-center justify-center">
        <div className="w-full h-full sm:w-[98%] sm:h-[98%] flex flex-col sm:rounded-2xl sm:border-2 bg-pink-200 sm:border-black items-center justify-center">
          <div className='w-full h-[37%] sm:h-[40%]'>
            {((data.length !== 0 && data.some(item => item.total !== 0))) && (

              ((user?.userProfile?.rol === "admin" && IDusersave === "") ? (
                // Si data tiene elementos, muestro el BarChart filtrando totales != 0
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={(activeButton === "Empleados" ? data.filter(item => item.total !== 0) : processedLoans.filter(item => item.monto !== 0))}
                    margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
                    barSize={barSize}
                  >
                    <XAxis
                      dataKey={activeButton === "Empleados" ? "name" : "user_id"}
                      scale="auto"
                      tick={false}
                      axisLine={true}
                    />
                    <YAxis
                      tickFormatter={(value) => value.toLocaleString('es-ES')}
                    />
                    <Tooltip content={(props) => <CustomTooltip {...props} activeButton={activeButton} />} />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Bar
                      dataKey={activeButton === "Empleados" ? "total" : "monto"}
                      fill="#8884d8"
                      background={{ fill: '#eee' }}
                      onClick={handleBarClick}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                // Si data está vacío, muestro el LineChart de ejemplo

                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={(activeButton === "Empleados" ? data2 : data3)}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey={selectedOption === "Dia" ? "hour" : "day"} />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#8884d8"
                      fill="#8884d8"
                    />
                  </AreaChart>
                </ResponsiveContainer>

              ))

            )}
            {(data.length === 0 || data.every(item => item.total === 0)) && (
              <div className=' sm:border-b-2 sm:border-black w-full h-full flex justify-center items-center'>
                <p className=' text-black'>No hay datos que mostrar</p>
              </div>
            )}
          </div>
          <div className=' w-full h-[3%] sm:hidden text-[90%] block border-b-2 border-b-black'>
            {activeButton === "Prestamos" && (
                <p className=' font-bold  text-black'>{(user?.userProfile?.rol === "admin" && !selectedEmployee) ? "Deuda Total de Empleados" : "Deuda Total"}: {formatCurrency(deudaTotal)}</p>
              )}
          </div>
          <div className='w-full h-[60%] flex flex-col'>
            <div className='h-[12%] w-full flex flex-row gap-0.5'>
              <div className=' w-[350px] max-w-[50%] sm:max-w-[20%] h-[100%]'>
                <Select

                  className=" h-[50px] sm:h-[100%] border text-black border-black  rounded bg-white"
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
                  disabled={user?.userProfile?.rol !== "admin"}
                  onChange={(selected) => {
                    setValues2(selected);

                    if (selected.length > 0) {
                      const selectedValue = selected[0].id;

                      const empleadoConVenta = data.find((empleado) =>
                        empleado.sales_records.some((record) => record.user_id === selectedValue)
                      );

                      if (empleadoConVenta) {
                        setSelectedEmployee(empleadoConVenta);
                        setIDusersave(selectedValue);
                        handleFilter(selectedValue);
                      } else {
                        setSelectedEmployee(null);
                      }
                    } else {
                      // Este es el caso que reemplaza a onDeselect cuando se borra todo
                      console.log("Deseleccionado desde onChange");
                      setSelectedEmployee(null);
                      setValues2([]);
                      setIDusersave("");
                      handleFilter(); // Puedes pasar undefined si lo necesitas así
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
              <div className=' sm:hidden block'>
                <Dropdown
                  label={activeButton || "Seleccionar"}
                  color="pink"
                  className="w-full"
                  renderTrigger={() => (
                    <Button color="pink" className="w-full h-[95%] rounded-none bg-pink-800 font-semibold">
                      {activeButton || "Seleccionar"}
                    </Button>
                  )}
                >
                  {buttons.map((button) => (
                    <DropdownItem
                      key={button}
                      onClick={() => setActiveButton(button)}
                      className={`text-xs md:text-sm lg:text-base ${activeButton === button ? "text-pink-700 font-semibold" : ""
                        }`}
                    >
                      {button}
                    </DropdownItem>
                  ))}
                </Dropdown>
              </div>
              <div className=' hidden sm:flex w-[60%] max-w-[275px] min-w-[270px] h-[95%]  items-cente gap-0.5   '>
                {buttons.map((button) => (
                  <Button
                    key={button}
                    color={activeButton === button ? "pink" : "gray"}
                    className="w-[20%] max-w-[120px] min-w-[90px] h-[95%] rounded-none"
                    onClick={() => setActiveButton(button)}
                  >
                    {button}
                  </Button>
                ))}
              </div>

              <Button onClick={() => { openModal2(); }} color="pink" className=' w-[10%] max-w-[20px] min-w-[60px] h-[95%] rounded-none '><FaFilter color="white" width={10} height={10} /></Button>
              {activeButton === "Prestamos" && (
                <p className=' hidden sm:block text-black'>{(user?.userProfile?.rol === "admin" && !selectedEmployee) ? "Deuda Total de Empleados" : "Deuda Total"}: {formatCurrency(deudaTotal)}</p>
              )}
            </div>
            <div className=' border-t-2 border-t-black h-[88%] overflow-auto w-full flex flex-col '>
              {activeButton === "Empleados" && (

                <div className=" w-full">
                  <ul className="space-y-1 w-full">
                  
                    {(selectedEmployee && selectedEmployee.sales_records.length > 0) && (

                      selectedEmployee.sales_records.map((record: SalesRecord) => {





                        const saleDate = new Date(record.sale_date);
                        // formateo de fecha/hora…
                        return (
                          <li
                            key={record.sale_code}
                            className="flex justify-between items-center p-3 border rounded w-full bg-gray-100"
                          >
                            <span className="w-[8%] sm:w-[5%] truncate text-black text-[120%]]">{record.sales_items.length > 1 ? <MdListAlt onClick={() => { sets_items(record); openModal(); }} className=' cursor-pointer' /> : " "} </span>
                            <span className="font-semibold w-[40%] sm:w-[25%] truncate text-black text-[50%] sm:text-[90%]">Código: {record.sale_code}</span>
                            <span className="w-[17%] sm:w-[15%] sm:truncate text-black text-[50%] sm:text-[90%]">Método: {(record.payment_method === "cash" ? "Efectivo" : (record.payment_method === "card" ? "Bold" : "Transferencia"))}</span>
                            <span className=" w-[20%] sm:w-[10%] font-semibold truncate text-black text-[50%] sm:text-[90%]">Total: {formatCurrency(record.total_amount)}</span>
                            <span className="w-[15%] sm:w-[30%] break-words sm:truncate text-black text-[50%] sm:text-[90%]">
                              Fecha: {saleDate.toLocaleDateString('es-ES')} | {saleDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true })}
                            </span>
                          </li>
                        );

                      })

                    )}

                    {(!selectedEmployee || selectedEmployee.sales_records.length === 0) && (

                      data.map((outerRecord, outerIdx) => (




                        outerRecord.sales_records.map((record: SalesRecord, innerIdx: number) => {
                          const saleDate = new Date(record.sale_date);
                          // formateo de fecha/hora…
                          return (
                            <li
                              key={`${outerIdx}-${innerIdx}`}
                              className="flex justify-between items-center p-3 border rounded w-full bg-gray-100"
                            >
                              <span className="w-[8%] sm:w-[5%] truncate text-black text-[120%]"> <MdListAlt onClick={() => { sets_items(record); openModal(); }} className=' cursor-pointer' />  </span>
                              <span className="font-semibold w-[40%] sm:w-[25%] truncate text-black text-[50%] sm:text-[90%]">Código: {record.sale_code}</span>
                              <span className="w-[17%] sm:w-[15%] sm:truncate text-black text-[50%] sm:text-[90%]">Método: {(record.payment_method === "cash" ? "Efectivo" : (record.payment_method === "card" ? "Bold" : "Transferencia"))}</span>
                              <span className=" w-[20%] sm:w-[10%] font-semibold truncate text-black text-[50%] sm:text-[90%]">Total: {formatCurrency(record.total_amount)}</span>
                              <span className="w-[15%] sm:w-[30%] break-words sm:truncate text-black text-[50%] sm:text-[90%]">
                                Fecha: {saleDate.toLocaleDateString('es-ES')} | {saleDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true })}
                              </span>
                            </li>
                          );
                        })
                      ))

                    )}





                  </ul>
                </div>


              )}
              {activeButton === "Prestamos" && (
                <div className="w-full">
                  <ul className="space-y-1 w-full">

                    
                    {loanRecords.length > 0 ? (
                      loanRecords.map((record, index) => {
                        console.log((empleados.find(emp => emp.label === selectedEmployee?.name))?.id)
                        console.log(values2[0]?.id)
                        console.log(record.user_id)
                        if (values2[0]?.id === record.user_id || user?.userProfile?.id === record.user_id || (user?.userProfile?.rol === "admin" && !values2[0])) {
                          const date = new Date(record.creado_en);
                          const hora = date.toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true,
                          });
                          const dia = date.toLocaleDateString('es-ES');

                          return (
                            <li
                              key={index}
                              className="flex justify-between items-center p-3 border rounded w-full bg-gray-100"
                            >
                              <span className="w-[30%] text-[50%] sm:text-[100%] truncate text-black text-sm sm:text-base">
                                Empleado: {
                                  empleados.find(e => e.id === record.user_id)?.value ?? record.user_id
                                }
                              </span>

                              <span className="w-[20%] text-[50%] sm:text-[100%] text-black text-sm sm:text-base">Tipo: {record.tipo_operacion}</span>
                              <span className="w-[20%] font-semibold text-[50%] sm:text-[100%] text-black text-sm sm:text-base">
                                Cantidad: {formatCurrency(record.monto)}
                              </span>
                              <span className="w-[20%] text-[50%] sm:text-[100%] text-black text-sm sm:text-base">Fecha: {dia} | {hora}</span>

                                

                            </li>
                            
                          );
                        }
                      })


                    ) : (
                      <div className="w-full text-center py-4">
                        <p className="text-black">No hay préstamos o abonos para mostrar</p>
                      </div>
                    )}
                  </ul>
                </div>
              )}


            </div>
          </div>
          <Accessmodal isOpen={isOpen} onClose={closeModal} Bg='bg-pink-800'>
            <div className="hidden sm:block flex-row gap-0   font-bold  bg-gradient-to-r from-yellow-300 via-yellow-200 to-yellow-400 bg-clip-text text-transparent">
              <p className=" text-3xl relative inline-block  font-bold bg-gradient-to-r from-yellow-300 via-yellow-200 to-yellow-400 bg-clip-text text-transparent
  after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-[3px] after:w-full after:bg-gradient-to-r after:from-yellow-300 after:via-yellow-200 after:to-yellow-400">Desgloce de servicios</p>
            </div>
            <div className=' flex flex-row gap-0.5'>
              <p className=' text-white text-1xl'>Atendido por: </p>
              <p className=' text-white text-1xl font-bold'>{empleados.find(e => e.id === s_items?.user_id)?.value ?? s_items?.user_id}</p>
            </div>
            {s_items?.sales_items.map((sale, index) => (
              <div key={index} className=' py-0.5'>
                <li
                  className="flex items-center space-x-4 p-2 border rounded w-full bg-gradient-to-r from-yellow-300 via-yellow-200 to-yellow-400"
                >
                  <span className="font-semibold w-[40%] truncate text-black text-[50%] sm:text-[90%]">Servicio: {sale.service_name}</span>
                  <span className="w-[30%] truncate text-black text-[50%] sm:text-[90%]">Cantidad: {sale.service_quantity}</span>
                  <span className="w-[30%] truncate text-black text-[90%]">Total: {formatCurrency(sale.service_cost)}</span>
                  {user?.userProfile?.rol !== "admin" && (
                    <span className="w-[30%] truncate text-black text-[90%]">Total: {formatCurrency(sale.service_cost)}</span>
                  )}
                </li>
              </div>
            ))}

          </Accessmodal>

          <Accessmodal isOpen={isOpen2} onClose={closeModal2} Width='700px' >

            <div className='w-full text-center'><p className=' text-black font-bold text-2xl'>Filtro</p></div>

            <input className=' text-black border-2 border-black rounded-sm' type="date" max={todayBogota} value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}></input>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Radio
                  id="Dia"
                  name="options"
                  value="Dia"
                  checked={selectedOption === "Dia"}
                  onChange={() => setSelectedOption("Dia")}
                />
                <label htmlFor="Dia" className="text-sm font-medium text-gray-900">
                  Dia
                </label>
              </div>

              <div className="flex items-center gap-2">
                <Radio
                  id="Semana"
                  name="options"
                  value="Semana"
                  checked={selectedOption === "Semana"}
                  onChange={() => setSelectedOption("Semana")}
                />
                <label htmlFor="Semana" className="text-sm font-medium text-gray-900">
                  Semana
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Radio
                  id="Mes"
                  name="options"
                  value="Mes"
                  checked={selectedOption === "Mes"}
                  onChange={() => setSelectedOption("Mes")}
                />
                <label htmlFor="Mes" className="text-sm font-medium text-gray-900">
                  Mes
                </label>
              </div>

              <button
                className="bg-pink-600 active:bg-pink-700 cursor-pointer text-white p-2 rounded mt-4"
                onClick={() => { handleFilter(); handleFilterLoans() }}
              >
                Filtrar
              </button>
            </div>

          </Accessmodal>

        </div>
      </div>
    </div>
  );
};

