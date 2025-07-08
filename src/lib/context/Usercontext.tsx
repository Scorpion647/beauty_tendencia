"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient"; // Asegúrate de importar tu cliente supabase
import { CurrentSession, getCurrentSession } from "@/lib/getsession";

interface UserContextType {
  user: CurrentSession | null;
  loading: boolean;
}

const UserContext = createContext<UserContextType>({
  user: null,
  loading: true,
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<CurrentSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const storedUser = localStorage.getItem("user");
  if (storedUser) {
    setUser(JSON.parse(storedUser));
    setLoading(false);
  }

  const fetchUser = async () => {
    try {
      const currentUser = await getCurrentSession();
      setUser(currentUser);
      localStorage.setItem("user", JSON.stringify(currentUser));
    } catch (error) {
      console.error("Error fetching user:", error);
      setUser(null);
      localStorage.removeItem("user");
    } finally {
      setLoading(false);
    }
  };

  fetchUser();

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(() => {
    fetchUser(); // Actualiza si hay cambios de sesión
  });

  return () => subscription.unsubscribe();
}, []);


  return (
    <UserContext.Provider value={{ user, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);

