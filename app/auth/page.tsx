"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    let result;
    if (mode === "signup") {
      if (!username.trim()) {
        setError("Please enter a username");
        setLoading(false);
        return;
      }
      result = await supabase.auth.signUp({ email, password });
      if (result.error) {
        setError(result.error.message);
        setLoading(false);
        return;
      }
      // Insert player profile
      const user = result.data.user;
      if (user) {
        const { error: playerError } = await supabase.from("players").insert({
          name: username,
          user_id: user.id,
        });
        if (playerError) {
          setError(playerError.message);
          setLoading(false);
          return;
        }
      }
      router.push("/bank");
    } else {
      result = await supabase.auth.signInWithPassword({ email, password });
      if (result.error) {
        setError(result.error.message);
        setLoading(false);
        return;
      }
      router.push("/bank");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-xl p-8">
        <h2 className="text-2xl font-bold text-center mb-6">{mode === "signup" ? "Sign Up" : "Sign In"}</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {mode === "signup" && (
            <div>
              <label className="block font-medium mb-1">Username</label>
              <Input value={username} onChange={e => setUsername(e.target.value)} required={mode === "signup"} autoComplete="username" />
            </div>
          )}
          <div>
            <label className="block font-medium mb-1">Email</label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <div>
            <label className="block font-medium mb-1">Password</label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>{loading ? (mode === "signup" ? "Signing Up..." : "Signing In...") : (mode === "signup" ? "Sign Up" : "Sign In")}</Button>
          {error && <div className="text-red-600 text-center">{error}</div>}
        </form>
        <div className="mt-6 text-center">
          {mode === "signup" ? (
            <span>Already have an account? <button className="text-primary underline" onClick={() => setMode("signin")}>Sign In</button></span>
          ) : (
            <span>Don&apos;t have an account? <button className="text-primary underline" onClick={() => setMode("signup")}>Sign Up</button></span>
          )}
        </div>
      </div>
    </div>
  );
} 