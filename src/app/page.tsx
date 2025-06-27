'use client'

import React, { useState } from 'react';
import Image from 'next/image';
import Accessmodal from "./components/accessmodal";
import { cursiva, oswald } from "@/app/components/fonts"
import { loginWithEmail } from "@/lib/auth"
import { useHandleLoginRedirect} from "@/app/access/route"




const currentYear = new Date().getFullYear();
export default function Home() {
  const { redirect } = useHandleLoginRedirect();
  const [isOpen, setIsOpen] = useState(false);

  // 2. Funciones para abrir/cerrar
  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);


  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await loginWithEmail(email, password);
      console.log(user)
      redirect();
      setLoading(false);
    } catch (err: unknown) {
  setLoading(false);

  if (err instanceof Error) {
    setError("Credenciales no válidas");
    console.error("Error:", err.message);
  } else {
    setError("Ocurrió un error inesperado.");
    console.error("Error desconocido:", err);
  }
}
  };


  return (
    <div className=" w-screen h-screen bg-white">

      <Accessmodal isOpen={isOpen} onClose={closeModal}>
        {/* Aquí va TODO el contenido del modal */}
        <div className=' flex flex-row w-full sm:gap-10'>


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
            <p className="pt-2 font-bold text-pink-600">¿Ha olvidado su contraseña?</p>

            <button disabled={loading}
              onClick={handleLogin}
              className="mt-4 px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700">
              ENTRAR
            </button>
          </div>}


          {<div className='  bg-black w-0 sm:w-1/2 sm:h-64'></div>}








        </div>
      </Accessmodal>




      <div className="bg-pink-600 flex flex-row items-center gap-0 h-[10%]">
        <div className="bg-blue-800 w-[20%] h-[100%]"></div>
        <div className=" w-[60%] "></div>
        <div className=" align-middle w-[20%] flex items-center justify-center">
          <p onClick={openModal} className=" cursor-pointer text-center font-extrabold text-white">Login</p>
        </div>
      </div>
      <div className="bg-white h-[85%] overflow-auto">
        <div className=" text-center w-full">


          {/*Titulo con imagenes*/}
          <div className=" flex items-center justify-center pt-10  w-full"><Image width={70} height={70} src="/Tendencia.png" alt="Tendencia"/></div>
          <p className="  text-4xl font-extrabold text-black">TENDENCIA</p>
          <p className="  text-2xl font-bold text-black">Peluqueria</p>

          <div className={cursiva.className}><p className=" pb-7 text-4xl font-light text-black">Belleza confianza y satisfacion</p></div>
          <div className="flex items-center justify-center  h-[400px] lg:h-[450px] w-[100%] bg-black   ">
            <Image width="450" height={300}  className=' h-full w-[450px]' src="/Imagen1.jpeg" alt="WhatsApp" />
          </div>




          {/*Sobre nosotros*/}

          <p className=" pt-20 text-3xl font-extrabold text-pink-600">Sobre nosostros</p>
          <p className=" pt-5 px-5 text-black">En nuestro salón de belleza creemos que cada persona merece un espacio donde pueda sentirse escuchada, cuidada y renovada.</p>


          {/*Servicios*/}
          <p className=" pt-20 text-3xl font-extrabold text-pink-600">Servicios</p>
          <p className=" pt-5 px-5 text-black">Ofrecemos servicios personalizados en un ambiente acogedor, combinando técnicas modernas con atención cercana para que te sientas auténticamente tú</p>
          <div className=" pt-10  px-7 flex flex-row items-center gap-0">


            <div className="w-[50%] flex items-center justify-center gap-4">
              <div className="flex flex-col gap-1">
                <button className="bg-pink-600 w-5 h-5"></button>
                <button className="bg-pink-600 w-5 h-5"></button>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-center font-bold text-pink-600">Peinado</p>
                <p className="text-center font-bold text-pink-600">Tinte</p>
              </div>
            </div>


            <div className="w-[50%] flex items-center justify-center gap-4">
              <div className="flex flex-col gap-1">
                <button className="bg-pink-600 w-5 h-5"></button>
                <button className="bg-pink-600 w-5 h-5"></button>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-center font-bold text-pink-600">Manicura</p>
                <p className="text-center font-bold text-pink-600">Pedicura</p>
              </div>
            </div>


          </div>

          {/*Ubicacion*/}
          <p className=" pt-20 text-3xl font-extrabold text-pink-600">Ubicacion</p>
          <p className=" text-black">Donde encontrarnos</p>
          <div className=" pt-5  px-10">
            <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d245.26609139912165!2d-75.50236373967672!3d10.4011145500055!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8ef625be4c4bef4d%3A0x81c02332f587dff4!2sCra.%2050%20%2350%2C%20El%20Cairo%2C%20Cartagena%20de%20Indias%2C%20Provincia%20de%20Cartagena%2C%20Bol%C3%ADvar!5e0!3m2!1ses-419!2sco!4v1747458979184!5m2!1ses-419!2sco" width="100%" height="300" loading="lazy">
            </iframe>
          </div>

          <footer className=" pt-14 pb-5 text-center  text-sm text-gray-500">
            © {currentYear} Tendencia. Todos los derechos reservados.
          </footer>

        </div>
      </div>
      <div className=" relative">
        <div className=" right-5 bottom-7 absolute">
          <a href="https://wa.me/573225821810" target="_blank" rel="noopener noreferrer">
          <Image width={70} height={70} src="/wsp.png" alt="WhatsApp"/>
          </a>
        </div>
      </div>
      <div className="bg-pink-600 h-[5%]"></div>
    </div>
  );
}
