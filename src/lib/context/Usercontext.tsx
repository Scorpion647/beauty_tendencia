"use client";

import { createContext, useContext, useEffect, useState } from "react";
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
    const fetchUser = async () => {
      try {
        const currentUser = await getCurrentSession();
        if (currentUser) setUser(currentUser);
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
