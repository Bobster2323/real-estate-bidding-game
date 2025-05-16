"use client";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/auth");
  };

  return (
    <Button variant="outline" onClick={handleSignOut} className="ml-4">
      Sign Out
    </Button>
  );
} 