// app/components/DashboardLayout.tsx
"use client";
import { useState, Fragment, JSX } from "react";
import { IoMdHome } from "react-icons/io";
import { GiHamburgerMenu } from "react-icons/gi";
import { MdManageAccounts } from 'react-icons/md';
import { Dropdown, DropdownItem, Tooltip } from "flowbite-react";
import { useUser } from "@/lib/context/Usercontext";
import { Management_employee } from "@/app/employee_management";
import { Register_sale } from "@/app/register_sale";
import { Sales_records } from "@/app/salesrecords";
import type { IconType } from "react-icons";
import { MdAttachMoney } from 'react-icons/md';
import { MdBarChart } from 'react-icons/md';
import { FaSignOutAlt } from 'react-icons/fa';
import { GiPiggyBank } from "react-icons/gi";
import { LoanOrAbono } from "@/app/loans";
import { ProductServiceManager } from "@/app/management"
import { MdInventory } from "react-icons/md";
import LogoutComponent from "@/app/components/LogoutComponent";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";









type SectionKey = "Home" | "Employee" | "Sales" | "Sales_Records" | "ProductServiceManager" | "Loans" | "Logout";

interface MenuItem {
  key: SectionKey;
  label: string;
  Icon?: IconType;
}

//gradiente para fondo:  bg-gradient-to-br from-gray-800 via-gray-700 to-pink-800

// Mapea cada sección a su componente
const SECTION_COMPONENTS: Record<SectionKey, JSX.Element> = {
  Home: (
    <div className="flex flex-col w-full h-full items-center justify-center  ">
      <img src="/Tendencia.png" width={100} height={100} alt="Tendencia" />
      <p className="text-4xl font-extrabold  bg-gradient-to-r from-yellow-300 via-yellow-200 to-yellow-400 bg-clip-text text-transparent">TENDENCIAS</p>
      <p className=" text-black font-semibold">Software administrativo</p>
    </div>
  ),
  Employee: <Management_employee />,
  Sales: <Register_sale />,
  Sales_Records: <Sales_records />,
  ProductServiceManager: <ProductServiceManager />,
  Loans: <LoanOrAbono />,
  Logout: <LogoutComponent />,
};

export default function DashboardLayout() {
  const { user} = useUser();

  const [activeSection, setActiveSection] = useState<SectionKey>("Home");



  const role = user?.userProfile?.rol; // p.ej. 'admin' o 'empleado'

  // Define los ítems del menú según rol
  // 2) Crea dos arrays distintos, con tipado explícito
  const adminItems: MenuItem[] = [
    { key: "Employee", label: "Empleados", Icon: MdManageAccounts },
    { key: "Sales", label: "Registrar Venta", Icon: MdAttachMoney },
    { key: "ProductServiceManager", label: "Productos y servicios", Icon: MdInventory },
    { key: "Sales_Records", label: "Registros", Icon: MdBarChart },
    { key: "Loans", label: "Prestamos", Icon: GiPiggyBank },
    { key: "Logout", label: "Salir", Icon: FaSignOutAlt },
  ];

  const employeeItems: MenuItem[] = [
    { key: "ProductServiceManager", label: "Productos y servicios", Icon: MdInventory },
    { key: "Sales_Records", label: "Registros", Icon: MdBarChart },
    { key: "Logout", label: "Salir", Icon: FaSignOutAlt },
  ];

  const cashierItems: MenuItem[] = [
    { key: "Sales", label: "Registrar Venta", Icon: MdAttachMoney },
    { key: "ProductServiceManager", label: "Productos y servicios", Icon: MdInventory },
    { key: "Sales_Records", label: "Registros", Icon: MdBarChart },
    { key: "Logout", label: "Salir", Icon: FaSignOutAlt },
  ];

  const guestItems: MenuItem[] = [
    { key: "Logout", label: "Salir", Icon: FaSignOutAlt },
  ];

  // 3) Monta tu menuItems usando esos arrays
  const menuItems: MenuItem[] = [
    { key: "Home", label: "Home", Icon: IoMdHome },
    ...(role === "admin" ? adminItems : (role === "employee" ? employeeItems : (role === "cashier" ? cashierItems : guestItems))),
  ];


  

  const handleSectionChange = (key: SectionKey) => setActiveSection(key);

  return (

    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden bg-white">
        {/* Sidebar para pantallas sm+ */}
        <aside className="hidden sm:flex flex-col w-[5%] bg-pink-800">
          <div className="flex items-center justify-center h-[8%]">

            <img src="/Tendencia.png" width={50} height={50} alt="Tendencia" />
          </div>
          <nav className="flex flex-col justify-evenly items-center h-[92%]">
            {menuItems.map(({ key, label, Icon }) => (
              <Fragment key={key}>
                {Icon ? (
                  <Tooltip content={label}>
                    <div
                      onClick={() => handleSectionChange(key)}
                      className=" cursor-pointer w-[40px] h-[40px] flex items-center justify-center rounded-full bg-gradient-to-r from-yellow-300 via-yellow-200 to-yellow-400 shadow-md"
                    >
                      <Icon className="text-black" size={20} />
                    </div>
                  </Tooltip>



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
          <header className="flex items-center justify-between px-4 bg-pink-800 h-[8%]">
            <div className="hidden sm:block flex-row gap-0   font-bold  bg-gradient-to-r from-yellow-300 via-yellow-200 to-yellow-400 bg-clip-text text-transparent">
              <p className="relative inline-block  font-bold bg-gradient-to-r from-yellow-300 via-yellow-200 to-yellow-400 bg-clip-text text-transparent
  after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-[3px] after:w-full after:bg-gradient-to-r after:from-yellow-300 after:via-yellow-200 after:to-yellow-400">{role === "admin" ? "Administrador" : (role === "employee" ? "Empleado" : (role === "cashier" ? "Encargado de caja" : "No verificado"))}</p>
              <p className="text-xl">{user?.userProfile?.nombres} {user?.userProfile?.apellidos}</p>
            </div>
            <div className="sm:hidden flex items-center justify-between w-full">
              <div className="flex flex-row gap-3">
                <img src="/Tendencia.png" width={50} height={50} alt="Tendencia" />

                <div className="flex flex-col justify-end gap-0 font-bold">
                  <div className="mt-auto">
                    <p
                      className="text-[85%] relative inline-block font-bold 
        bg-gradient-to-r from-yellow-300 via-yellow-200 to-yellow-400 
        bg-clip-text text-transparent 
        after:content-[''] after:absolute after:left-0 after:bottom-0 
        after:h-[3px] after:w-full after:bg-gradient-to-r 
        after:from-yellow-300 after:via-yellow-200 after:to-yellow-400"
                    >
                      {role === "admin" ? "Administrador" : (role === "employee" ? "Empleado" : (role === "cashier" ? "Encargado de caja" : "No verificado"))}
                    </p>
                    <p className="text-[85%] truncate bg-gradient-to-r from-yellow-300 via-yellow-200 to-yellow-400 bg-clip-text text-transparent">
                      {user?.userProfile?.nombres
                        ? `${user.userProfile.nombres} ${user.userProfile.apellidos}`
                        : "No Valido"}

                    </p>
                  </div>
                </div>
              </div>

              <Dropdown arrowIcon={false} inline label={

                <GiHamburgerMenu size={30} color="white" />

              }>
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
          <footer className="hidden sm:block bg-pink-800 h-[2%]" />
        </div>
      </div>
    </ProtectedRoute>
  );
}

