'use client'

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Accessmodal from "./components/accessmodal";
import { cursiva, oswald } from "@/app/components/fonts"
import { loginWithEmail } from "@/lib/auth"
import { useHandleLoginRedirect } from "@/hooks/useHandleLoginRedirect"
import { supabase } from "@/lib/supabaseClient";
import { sendPasswordRecoveryEmail } from "@/lib/supabase/recoverypassword"
import { getAllServices } from "@/lib/supabase/services"; // ajusta la ruta si es necesario
import { CarouselComponent } from '@/app/components/Carousel';
import { FaFacebook } from "react-icons/fa";
import { FaInstagram } from "react-icons/fa";
import { FaTiktok } from "react-icons/fa";

type MediaItem = {
  src: string;
  position?: 'top' | 'center' | 'bottom' | string; // acepta personalizados como '50% 20%'
};

const images: MediaItem[] = [
  { src: "/C_Inicio/Uñas1.jpg", position: "50% 25%" },
  { src: "/C_Inicio/Cabello2.jpg", position: "top" },
  { src: "/C_Inicio/Laminado.mp4" },
  { src: "/C_Inicio/Cejas.jpg" },
  { src: "/C_Inicio/Cabello.mp4", position: "50% 35%" },
  { src: "/C_Inicio/Uñas2.jpg" },
];

const nosotros: MediaItem[] = [
  { src: "/Sobre_Nosotros.jpg" },
  { src: "/Un espacio para ti.mp4" },
];

const Ofertas: MediaItem[] = [
  { src: "/Ofertas/Oferta1.jpg" },
  { src: "/Ofertas/Oferta2.jpg" },
];


type ColumnData = string[][];

const MAX_COLUMNS = 3;
const MAX_PER_COLUMN = 6;

function splitServicesIntoColumns(
  services: string[],
  columns: number,
  maxPerColumn: number
) {
  const result: string[][] = Array.from({ length: columns }, () => []);
  for (let i = 0; i < services.length && i < columns * maxPerColumn; i++) {
    result[i % columns].push(services[i]);
  }
  const hasMore = services.length > columns * maxPerColumn;
  return { columns: result, hasMore };
}



const currentYear = new Date().getFullYear();
export default function Home() {
  const { redirect } = useHandleLoginRedirect();
  const [isOpen, setIsOpen] = useState(false);
  const [isOpen2, setIsOpen2] = useState(false);
  const [isOpen3, setIsOpen3] = useState(false);

  // 2. Funciones para abrir/cerrar
  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  const openModal2 = () => setIsOpen2(true);
  const closeModal2 = () => setIsOpen2(false);

  const openModal3 = () => setIsOpen3(true);
  const closeModal3 = () => setIsOpen3(false);


  const [email, setEmail] = useState("");
  const [recoveryemail, setrecoveryemail] = useState("");


  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [Servicios, setServicios] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [columns, setColumns] = useState<ColumnData>([]);
  const [hasMore, setHasMore] = useState(false);




  useEffect(() => {
    const fetchServicios = async () => {
      try {
        const servicios = await getAllServices();
        const nombres = servicios.map((s) => s.nombre);
        setServicios(nombres)
        const { columns, hasMore } = splitServicesIntoColumns(nombres, MAX_COLUMNS, MAX_PER_COLUMN);
        setColumns(columns);
        setHasMore(hasMore);
      } catch (error) {
        console.error("Error al obtener servicios:", error);
      }
    };

    fetchServicios();
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginWithEmail(email, password); // o tu lógica de login

      await waitForSession(); // ✅ esperar a que se propague la sesión

      redirect(); // ✅ redirige con seguridad

    } catch (err: unknown) {
      if (err instanceof Error) {
        setError("Credenciales no válidas");
        console.error("Error:", err.message);
      } else {
        setError("Ocurrió un error inesperado.");
        console.error("Error desconocido:", err);
      }
    } finally {
      setLoading(false);
    }
  };


  const waitForSession = async () => {
    for (let i = 0; i < 10; i++) {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) return session;
      await new Promise((res) => setTimeout(res, 100)); // espera 100 ms
    }
    throw new Error("No se pudo obtener la sesión actual");
  };




  return (
    <div className=" w-screen h-screen bg-white">
      <Accessmodal isOpen={isOpen3} onClose={closeModal3}>
        <div className="flex flex-col w-full z-40">
          <div className=' flex w-full justify-center items-center'><p className="text-3xl font-extrabold mb-4 text-black">Lista de servicios</p></div>

          {/* Contenedor de 2 columnas */}
          <div className='  hidden sm:block  '>
            <div className=" flex flex-row gap-8 sm:px-10 justify-between">
              {/* Columna 1 */}
              <div className="flex flex-col gap-2 w-1/2">
                {Servicios.slice(0, Math.ceil(Servicios.length / 2)).map((ser, index) => (
                  <div key={`col1-${index}`} className="flex items-center gap-2">
                    <button className="bg-pink-800 w-5 h-5" />
                    <p className="text-sm font-bold text-pink-600 text-center">{ser}</p>
                  </div>
                ))}
              </div>

              {/* Columna 2 */}
              <div className="flex flex-col gap-2 w-1/2">
                {Servicios.slice(Math.ceil(Servicios.length / 2)).map((ser, index) => (
                  <div key={`col2-${index}`} className="flex items-center gap-2">
                    <button className="bg-pink-800 w-5 h-5" />
                    <p className="text-sm font-bold text-pink-600 text-center">{ser}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>


          <div className=' block sm:hidden overflow-auto max-h-[300]'>
            <div className=" flex flex-row gap-8 sm:px-10 justify-between">

              <div className="flex flex-col gap-2 ">
                {Servicios.map((ser, index) => (
                  <div key={`col1-${index}`} className="flex items-center gap-2">
                    <button className="bg-pink-800 w-5 h-5" />
                    <p className="text-xs font-bold text-pink-600 text-center">{ser}</p>
                  </div>
                ))}
              </div>



            </div>
          </div>
        </div>
      </Accessmodal>

      <Accessmodal isOpen={isOpen2} onClose={closeModal2} Width='50%'>
        <div className=' flex justify-center items-center flex-col w-full z-40'>
          <p className="text-lg font-extrabold mb-4 text-black">Recuperacion de contraseña</p>
          <input type='email' value={recoveryemail} placeholder='Correo de recuperacion' onChange={(e) => setrecoveryemail(e.target.value)}
            className="placeholder-pink-400 text-black font-semibold w-[90%] border-2 border-gray-400 p-2"
          />
          <button
            disabled={recoveryemail === ""}
            className={`mt-4 px-4 py-2 ${recoveryemail === "" ? "bg-gray-400 text-black " : "bg-pink-800 text-white hover:bg-pink-700"}  rounded `}
            onClick={() => { sendPasswordRecoveryEmail(recoveryemail) }}
          >Enviar</button>
        </div>
      </Accessmodal>
      <Accessmodal isOpen={isOpen} onClose={closeModal}>
        {/* Aquí va TODO el contenido del modal */}
        <div className=' flex flex-row w-full sm:gap-10 z-30'>


          {<div className="w-full sm:w-1/2 text-center">
            <div className={`w-full text-center ${oswald.className}`}>
              <p className="text-2xl font-bold mb-4 text-black">Inicio de sesión</p>
            </div>

            <div className="w-full pt-2 flex justify-center items-center gap-3 flex-col">
              <input
                onFocus={(e) => {
                  setTimeout(() => {
                    e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }, 300);
                }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="Correo"
                className="placeholder-pink-400 text-black font-semibold w-[80%] border-2 border-gray-400 p-2"
              />
              <input
                onFocus={(e) => {
                  setTimeout(() => {
                    e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }, 300);
                }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="Contraseña"
                className="placeholder-pink-400 text-black font-semibold w-[80%] border-2 border-gray-400 p-2"
              />
            </div>

            {error && <p className="text-red-600 mt-2">{error}</p>}
            <p onClick={() => { closeModal(); openModal2() }} className="pt-2 font-bold text-pink-600 cursor-pointer">¿Ha olvidado su contraseña?</p>

            <button disabled={loading}
              onClick={handleLogin}
              className="mt-4 px-4 py-2 bg-pink-800 text-white rounded hover:bg-pink-700">
              ENTRAR
            </button>
          </div>}


          {<div className=' hidden sm:block  bg-gradient-to-r from-yellow-200 via-yellow-100 to-yellow-300 w-0 sm:w-1/2 sm:h-64  flex-col justify-center items-center'>
            <div className=' w-full h-full flex justify-center items-center flex-col'>
              <div className=" flex items-center justify-center pt-10  w-full"><Image width={80} height={80} src="/Tendencia.png" alt="Tendencia" /></div>
              <p className="  text-4xl font-extrabold text-black">TENDENCIAS</p>
              <p className="  text-2xl font-bold text-black">Peluqueria</p>
              <div className={cursiva.className}><p className=" pb-7 text-4xl font-light text-black">Belleza confianza y satisfacion</p></div>
            </div>

          </div>}








        </div>
      </Accessmodal>




      <div className="flex h-[10%] w-full">
        {/* Lado izquierdo con fondo azul */}
        <div className="bg-pink-800 h-full flex flex-row items-center justify-center px-4 gap-2">
          <div className=' w-[30%] h-full flex items-center justify-center'> <Image width={50} height={50} src="/Tendencia.png" alt="Tendencia" /></div>
          <div className=' w-[70%] h-full flex flex-col items-center justify-center'>
            <p className="  text-[100%] font-extrabold bg-gradient-to-r from-yellow-300 via-yellow-200 to-yellow-400 bg-clip-text text-transparent">TENDENCIAS</p>
            <p className="  text-[80%] font-bold bg-gradient-to-r from-yellow-300 via-yellow-200 to-yellow-400 bg-clip-text text-transparent">Peluqueria</p>
          </div>
        </div>

        {/* Centro con fondo rosa que ocupa todo el espacio restante */}
        <div className="flex-1 bg-pink-800 flex items-center justify-center">

        </div>

        {/* Lado derecho con fondo azul */}
        <div className="bg-gradient-to-r from-yellow-300 via-yellow-200 to-yellow-400 h-full flex items-center justify-center px-4">
          <p
            onClick={openModal}
            className="cursor-pointer text-center font-extrabold text-black"
          >
            Login
          </p>
        </div>
      </div>

      <div className="bg-white h-[85%] sm:h-[88%] overflow-auto">
        <div className=" text-center w-full">


          {/*Titulo con imagenes*/}
          <div className=" flex items-center justify-center pt-10  w-full"><Image width={70} height={70} src="/Tendencia.png" alt="Tendencia" /></div>
          <p className="  text-4xl font-extrabold text-black">TENDENCIAS</p>
          <p className="  text-2xl font-bold text-black">Peluqueria</p>

          <div className={cursiva.className}><p className=" pb-7 text-4xl font-light text-black">Belleza confianza y satisfacion</p></div>
          <div className="flex items-center justify-center relative  h-[400px] lg:h-[450px] w-[100%] bg-gradient-to-r from-gray-400 via-gray-300 to-gray-500   ">
            <div className=" absolute z-0 w-full h-full">
              <Image
                src="/Bg.jpg"
                alt="Fondo"
                fill
                className="object-cover blur-sm"
              />
            </div>
            <CarouselComponent media={images} />
            {/*<Image width="450" height={300} className=' h-full w-[450px]' src="/Imagen1.jpeg" alt="WhatsApp" />*/}
          </div>





          {/*Sobre nosotros*/}

          <p className=" pt-20 text-3xl font-extrabold text-pink-600">Sobre nosostros</p>
          <p className=" pb-5 pt-5 px-5 text-black font-bold">En nuestro salón de belleza creemos que cada persona merece un espacio donde pueda sentirse escuchada, cuidada y renovada.</p>

          <div className="p-2 bg-gradient-to-r from-yellow-300 via-yellow-200 to-yellow-400 sm:inline-block sm:w-[500px] rounded-lg">
            <CarouselComponent media={nosotros} autoSlide={false} />
          </div>


          {/*Servicios*/}
          <p className=" pt-20 text-3xl font-extrabold text-pink-600">Servicios</p>
          <p className=" pt-5 px-5 text-black font-bold">Ofrecemos servicios personalizados en un ambiente acogedor, combinando técnicas modernas con atención cercana para que te sientas auténticamente tú</p>
          <div className=' hidden sm:block'>
            <div className="  pt-10 px-7 flex flex-row items-center justify-center flex-wrap gap-6">
              {columns.map((col, index) => (
                <div key={index} className="flex flex-col items-center w-[25%] gap-2">
                  <div className="flex flex-col gap-1">
                    {col.map((nombre, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <button className="bg-pink-800 w-5 h-5"></button>
                        <p className="text-sm font-bold text-pink-600 text-center">{nombre}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {hasMore && (
                <div className="w-full flex justify-center mt-4">
                  <button
                    onClick={openModal3} // define `abrirModal` en el componente
                    className="text-pink-700 font-bold underline hover:text-pink-900 transition cursor-pointer"
                  >
                    Ver todos los servicios
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className=' block sm:hidden'>
            <div className="  pt-10 px-7 flex flex-col  flex-wrap gap-6">
              {Servicios.slice(0,6).map((col, index) => (
                <div key={index} className="flex  ">
                      <div className="flex  ">
                        <button className="bg-pink-800 w-5 h-5"></button>
                        <p className="text-sm font-bold text-pink-600 text-center">{col}</p>
                      </div>
                </div>
              ))}


              <div className="w-full flex justify-center mt-4">
                <button
                  onClick={openModal3} // define `abrirModal` en el componente
                  className="text-pink-700 font-bold underline hover:text-pink-900 transition cursor-pointer"
                >
                  Ver todos los servicios
                </button>
              </div>
            </div>
          </div>


          {/*Ofertas */}
          <p className=" pt-20 text-3xl font-extrabold text-pink-600">Ofertas Disponibles</p>
          <div className="p-2 ">
            <CarouselComponent media={Ofertas} height={500} width={400} resize={true} />
          </div>




          {/*Ubicacion*/}
          <p className="pt-20 text-3xl font-extrabold text-pink-600">Ubicación</p>
          <p className="text-black font-bold">Dónde encontrarnos</p>

          <div className="pt-5 px-10">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d245.26609139912165!2d-75.50236373967672!3d10.4011145500055!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8ef625be4c4bef4d%3A0x81c02332f587dff4!2sCra.%2050%20%2350%2C%20El%20Cairo%2C%20Cartagena%20de%20Indias%2C%20Provincia%20de%20Cartagena%2C%20Bol%C3%ADvar!5e0!3m2!1ses-419!2sco!4v1747458979184!5m2!1ses-419!2sco"
              width="100%"
              height="300"
              loading="lazy"
            />
          </div>

          {/* Contacto por WhatsApp */}
          <div className="pt-10 flex flex-col items-center justify-center">
            <p className="text-2xl font-extrabold text-pink-600">Contáctanos</p>
            <p className="text-black font-semibold pt-2 pb-4 text-center">
              Agenda tu cita o recibe atención personalizada por WhatsApp.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              {/* Primer número */}
              <a
                href="https://wa.me/573225821810"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-5 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition"
              >
                <Image src="/wsp.png" alt="WhatsApp" width={25} height={25} />
                +57 323 4920171
              </a>


            </div>
          </div>




          {/* Redes sociales */}
          <p className="pt-10 text-3xl font-extrabold text-pink-600">Síguenos en redes</p>
          <div className="flex justify-center items-center gap-10 pt-6 ">
            {/* Instagram */}
            <a
              href="https://www.instagram.com/tendencias.cartagena/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-pink-800 p-3 rounded-full hover:scale-105 transition-transform"
            >
              <FaInstagram className="text-white w-8 h-8" />
            </a>

            {/* Facebook */}
            <a
              href="https://www.facebook.com/profile.php?id=61576002494183"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-pink-800 p-3 rounded-full hover:scale-105 transition-transform"
            >
              <FaFacebook className="text-white w-8 h-8" />
            </a>

            {/* TikTok */}
            <a
              href="https://www.tiktok.com/@tendencias.peluqu"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-pink-800 p-3 rounded-full hover:scale-105 transition-transform"
            >
              <FaTiktok className="text-white w-8 h-8" />
            </a>
          </div>



          <footer className=" pt-14 pb-5 text-center  text-sm text-gray-500">
            © {currentYear} Tendencia. Todos los derechos reservados.
          </footer>

        </div>
      </div>
      <div className=" relative">
        <div className=" right-5 bottom-7 absolute">
          <a href="https://wa.me/573225821810" target="_blank" rel="noopener noreferrer">
            <Image width={70} height={70} src="/wsp.png" alt="WhatsApp" />
          </a>
        </div>
      </div>
      <div className="bg-pink-800 h-[5%] sm:h-[2%]"></div>
    </div>
  );
}
