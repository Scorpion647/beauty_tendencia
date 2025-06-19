import { listSalesSummary } from '@/lib/sales_records';
import { Button } from 'flowbite-react';
import React, { useEffect, useRef, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, TooltipProps } from 'recharts';

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
};


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

const CustomTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const total = payload[0].value;
    const serviceCount = data?.sales_records?.length ?? 0;

    return (
      <div className="bg-gray-800 p-2 rounded text-white border border-gray-300">
        <p className="font-bold mb-1">Empleado: {label}</p>
        <p>Total: {(total ? formatCurrency(total) : 0)} Pesos</p>
        <p>Cantidad de servicios: {serviceCount}</p>
      </div>
    );
  }

  return null;
};


export const Sales_records = () => {
  const [data, setData] = useState<UserSalesData[]>([]);
  const [loading, setLoading] = useState(true);

  // 👉 Estos hooks deben declararse siempre, independientemente del estado.
  const containerRef = useRef<HTMLDivElement>(null);
  const [barSize, setBarSize] = useState(20);

  const [selectedEmployee, setSelectedEmployee] = useState<{
    name: string;
    total: number;
    Ganado: number;
    sales_records: any[];
  } | null>(null);

  const handleBarClick = (data: any, index: number) => {
    console.log(`Empleado: ${data.name} | Total: ${data.total} | Ganado: ${data.Ganado}`);
    console.log('Ventas:', data.sales_records);

    setSelectedEmployee({
      name: data.name,
      total: data.total,
      Ganado: data.Ganado,
      sales_records: data.sales_records,
    });
  };



  const calculateBarSize = () => {
    if (containerRef.current) {
      const width = containerRef.current.offsetWidth;
      const totalBars = data.length;

      const newBarSize = Math.max(Math.min((width / totalBars) * 0.6, 80), 10);
      setBarSize(newBarSize);
    }
  };

  useEffect(() => {
    calculateBarSize();
    window.addEventListener('resize', calculateBarSize);
    return () => window.removeEventListener('resize', calculateBarSize);
  }, [data]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await listSalesSummary("current_month", {});
        console.log("Respuesta real de la RPC:", response);
        setData(response)
      } catch (error) {
        console.error("Error al obtener resumen de ventas:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  const [activeButton, setActiveButton] = useState<string>("Empleados");

  const buttons = ["Empleados", "Prestamos", "Servicios"];

  if (loading) return <p>Cargando datos...</p>;





  return (
    <div className="w-full h-full flex flex-row" ref={containerRef}>
      <div className="flex flex-col w-[100%] h-full items-center justify-center">
        <div className="w-full h-full sm:w-[98%] sm:h-[98%] flex flex-col sm:rounded-2xl sm:border-2 bg-pink-200 sm:border-black items-center justify-center">
          <div className='w-full h-1/2'>
            {data.length !== 0 && (

              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data}
                  margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
                  barSize={barSize}
                >
                  <XAxis
                    dataKey="name"
                    scale="auto"
                    tick={false}
                    axisLine={true}
                  //padding={{ left: 20 + extraMargin, right: 20 }}
                  />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />



                  <CartesianGrid strokeDasharray="3 3" />
                  <Bar
                    dataKey="total"
                    fill="#8884d8"
                    background={{ fill: '#eee' }}
                    onClick={handleBarClick}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
            {data.length === 0 && (
              <div className=' border-b-2 border-black w-full h-full flex justify-center items-center'>
                <p className=' text-black'>No hay datos que mostrar</p>
              </div>
            )}
          </div>
          <div className='w-full h-1/2 flex flex-col'>
            <div className='h-[10%] w-full flex flex-row gap-0.5'>
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
              <Button color="pink" className=' w-[20%] max-w-[120px] min-w-[90px] h-[95%] rounded-none '>Filt</Button>
            </div>
            <div className=' border-t-2 border-black h-[90%] w-full flex flex-col '>
              {activeButton === "Empleados" && selectedEmployee && (
                <div className="mt-4 w-full">
                  {selectedEmployee.sales_records.length === 0 ? (
                    <p className="text-black">No hay información</p>
                  ) : (
                    <ul className="space-y-2 w-full">
                      {selectedEmployee.sales_records.map((record, index) => {
                        const saleDate = new Date(record.sale_date);

                        const formattedDate = saleDate.toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        });

                        const formattedTime = saleDate.toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true,
                        });

                        return (
                          <li
                            key={index}
                            className="flex justify-between items-center p-3 border rounded w-full bg-gray-100"
                          >
                            <span className="font-semibold w-[25%] truncate text-black text-[50%] sm:text-[90%]">Código: {record.sale_code}</span>
                            <span className="w-[25%] truncate text-black text-[50%] sm:text-[90%]">Método: {record.payment_method}</span>
                            <span className="w-[20%] truncate text-black text-[50%] sm:text-[90%]">Total: {formatCurrency(record.total_amount)}</span>
                            <span className="w-[30%] truncate text-black text-[50%] sm:text-[90%]">
                              Fecha: {formattedDate} | {formattedTime}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

