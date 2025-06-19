// app/components/DashboardLayout.tsx
"use client";
import { useState, Fragment, JSX } from "react";
import { IoMdHome } from "react-icons/io";
import { GiHamburgerMenu } from "react-icons/gi";
import { FaUserFriends, FaFileInvoiceDollar } from "react-icons/fa";
import { Dropdown, DropdownItem } from "flowbite-react";
import { useUser } from "@/lib/context/Usercontext";
import { Management_employee } from "@/app/employee_management";
import { Register_sale } from "@/app/register_sale";
import { Sales_records } from "@/app/salesrecords";
import type { IconType } from "react-icons";


type SectionKey = "Home" | "Employee" | "Sales" | "Sales_Records" | "Settings" | "Logout";

interface MenuItem {
  key: SectionKey;
  label: string;
  Icon?: IconType;
}



// Mapea cada sección a su componente
const SECTION_COMPONENTS: Record<SectionKey, JSX.Element> = {
  Home: (
    <div className="flex flex-col w-full h-full items-center justify-center">
      <p className="text-4xl font-extrabold text-black">TENDENCIA</p>
      <p className="font-light text-black">Software administrativo</p>
    </div>
  ),
  Employee: <Management_employee />,
  Sales: <Register_sale />,
  Sales_Records: <Sales_records />,
  Settings: <div>Configuraciones</div>,
  Logout: <div>– aquí iría la lógica de cierre de sesión –</div>,
};

export default function DashboardLayout() {
  const { user, loading } = useUser();
  const [activeSection, setActiveSection] = useState<SectionKey>("Home");

  if (loading) {
    return <div>Cargando...</div>;
  }

  const role = user?.userProfile?.rol; // p.ej. 'admin' o 'empleado'

  // Define los ítems del menú según rol
  // 2) Crea dos arrays distintos, con tipado explícito
const adminItems: MenuItem[] = [
  { key: "Employee",    label: "Empleados",      Icon: FaUserFriends },
  { key: "Sales",       label: "Transacciones",  Icon: FaFileInvoiceDollar },
  { key: "Sales_Records", label: "Registros" },
  { key: "Settings",    label: "Configuración" },
  { key: "Logout",      label: "Salir" },
];

const employeeItems: MenuItem[] = [
  { key: "Sales",       label: "Transacciones",  Icon: FaFileInvoiceDollar },
  { key: "Sales_Records", label: "Registros" },
  { key: "Logout",      label: "Salir" },
];

// 3) Monta tu menuItems usando esos arrays
const menuItems: MenuItem[] = [
  { key: "Home", label: "Home", Icon: IoMdHome },
  ...(role === "admin" ? adminItems : employeeItems),
];

  const handleSectionChange = (key: SectionKey) => setActiveSection(key);

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* Sidebar para pantallas sm+ */}
      <aside className="hidden sm:flex flex-col w-[5%] bg-pink-600">
        <div className="flex items-center justify-center h-[8%]">
          <img src="/Tendencia.png" width={50} height={50} alt="Tendencia" />
        </div>
        <nav className="flex flex-col justify-evenly items-center h-[92%]">
          {menuItems.map(({ key, Icon }) => (
            <Fragment key={key}>
              {Icon ? (
                <Icon
                  size={30}
                  color="white"
                  onClick={() => handleSectionChange(key)}
                  className="cursor-pointer"
                />
              ) : (
                <p
                  className="text-white cursor-pointer"
                  onClick={() => handleSectionChange(key)}
                >
                  {menuItems.find((i) => i.key === key)?.label}
                </p>
              )}
            </Fragment>
          ))}
        </nav>
      </aside>

      {/* Contenido principal */}
      <div className="flex flex-col w-full sm:w-[95%]">
        {/* Header */}
        <header className="flex items-center justify-between px-4 bg-pink-600 h-[8%]">
          <div className="hidden sm:block text-white text-2xl">
            {user?.userProfile?.apellidos}
          </div>
          <div className="sm:hidden flex items-center justify-between w-full">
            <img src="/Tendencia.png" width={50} height={50} alt="Tendencia" />
            <Dropdown arrowIcon={false} inline label={<GiHamburgerMenu size={30} color="white" />}>
              {menuItems.map(({ key, label }) => (
                <DropdownItem key={key} onClick={() => handleSectionChange(key)}>
                  {label}
                </DropdownItem>
              ))}
            </Dropdown>
          </div>
        </header>

        {/* Sección activa */}
        <main className="h-[92%] sm:h-[90%] overflow-auto">
          {SECTION_COMPONENTS[activeSection]}
        </main>

        {/* Footer (solo en sm+) */}
        <footer className="hidden sm:block bg-pink-600 h-[2%]" />
      </div>
    </div>
  );
}

