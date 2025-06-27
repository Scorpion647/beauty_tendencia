"use client"
import { IoMdHome } from "react-icons/io";
import { GiHamburgerMenu } from "react-icons/gi";
import { Dropdown, DropdownItem, Toast } from "flowbite-react";
import { Sales_records } from "@/app/salesrecords";
import {  useUser } from "@/lib/context/Usercontext";
import { useState } from "react";




export default function Employee() {
const { user, loading } = useUser();
const [activeSection, setActiveSection] = useState("Home");

const handleSectionChange = (sectionName: string) => {
  setActiveSection(sectionName);
};
  
  return (

    <div className="flex flex-row gap-0 bg-white h-screen overflow-hidden">
      <div className="hidden sm:flex flex-col  w-[5%] bg-pink-600 h-full">
        <div className=" w-full flex items-center justify-center h-[8%] ">
          <img  width={50} height={50} src="/Tendencia.png" alt="Tendencia" />
        </div>

        <div className=" flex flex-col justify-evenly w-full h-[92%] items-center">
          <IoMdHome  onClick={() => handleSectionChange("Home")} color="white" size={30} />
        <p onClick={() => handleSectionChange("Sales_Records")}>regis</p>
          {/*
          <FaUserFriends onClick={() => handleSectionChange("Employee")} color="white" size={30}/>
          <FaFileInvoiceDollar  onClick={() => handleSectionChange("Sales")} color="white" size={30}/>
          <p onClick={prueba}>config</p>
          */}
        </div>
      </div>



      <div className="bg-white flex flex-col gap-0 w-full sm:w-[95%] h-screen">
        <div className="bg-pink-600 h-[8%] w-full content-center text-2xl">
          <p className=" hidden sm:block">{!loading && user?.userProfile?.apellidos}</p>
          <div className=" sm:hidden px-4 py-2 flex justify-between items-center">
            <img src="/Tendencia.png" alt="Tendencia" width={50} height={50} />
            <Dropdown arrowIcon={false} inline label={<GiHamburgerMenu color="white" size={30} />}>
              <DropdownItem onClick={() => handleSectionChange("Home")}>Home</DropdownItem>
              <DropdownItem onClick={() => handleSectionChange("Sales_Records")}>Registros</DropdownItem>
              {/*
              <DropdownItem onClick={() => handleSectionChange("Employee")}>Empleados</DropdownItem>
              <DropdownItem onClick={() => handleSectionChange("Sales")}>Transacciones</DropdownItem>
              <DropdownItem>Configuracioness</DropdownItem>
              <DropdownItem>Log out</DropdownItem>
            
              */}
            </Dropdown>
          </div>

        </div>
        <div className="h-[92%] sm:h-[90%] w-full">

          
          { activeSection === "Home" && (
            <div className=" flex flex-col w-full h-full items-center justify-center content-center">
            <p className="  text-4xl font-extrabold text-black">TENDENCIA</p>
            
            <p className="   font-light text-black">Sofware administrativo</p>
          </div>
          )}
          { activeSection === "Sales_Records" && (
            <Sales_records/>
          )}

          

        </div>
        <div className=" hidden sm:block bg-pink-600 h-[2%] w-full"></div>
      </div>
    </div>


  );
}