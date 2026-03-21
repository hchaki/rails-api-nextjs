import { useAuth } from "@/contexts/AuthContext";
import { fetchWithAuth } from "@/lib/auth";
import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003";

export function useLoadContent<T>(url: string): [T | null, boolean] {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<T | null>(null);
  const { user, loading: userLoading } = useAuth();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await fetchWithAuth(`${API_URL}/${url}`);
        if (!res.ok) {
          throw new Error(`status: ${res.status}`);
        }
        const fetchedData = await res.json();
        setData(fetchedData);
      } catch (error) {
        console.error("Failed to fetch:", error);
        setData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, url]);

  return [data, loading || userLoading];
}
