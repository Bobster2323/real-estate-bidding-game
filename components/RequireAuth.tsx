"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Supabase session:", session);
      if (!session) {
        router.replace("/auth");
      } else {
        setLoading(false);
      }
    });
  }, [router]);

  if (loading) return null; // Or a spinner if you prefer

  return <>{children}</>;
} 