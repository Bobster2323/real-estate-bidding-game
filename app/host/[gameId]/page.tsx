"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { joinGame } from "@/lib/supabaseGame";
import { useGameSession } from "@/context/game-session-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function HostNamePage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = use(params);
  const [hostName, setHostName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { joinSession } = useGameSession();

  const handleJoinAsHost = async () => {
    if (!hostName.trim()) {
      setError("Please enter your name");
      return;
    }
    setLoading(true);
    try {
      const player = await joinGame(gameId, hostName);
      localStorage.setItem("supabasePlayerId", player.id);
      localStorage.setItem("supabaseIsHost", "1");
      await joinSession(gameId);
      router.push(`/lobby/${gameId}`);
    } catch (err) {
      setError("Failed to join as host");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-8">
      <div className="w-full max-w-md bg-card rounded-lg shadow-lg p-8 space-y-8">
        <h1 className="text-3xl font-bold text-center">Host Setup</h1>
        <div className="space-y-4">
          <Input
            placeholder="Enter your name (host)"
            value={hostName}
            onChange={e => setHostName(e.target.value)}
            disabled={loading}
          />
          {error && <p className="text-destructive text-sm">{error}</p>}
          <Button className="w-full" onClick={handleJoinAsHost} disabled={loading}>
            {loading ? "Joining..." : "Join as Host"}
          </Button>
        </div>
      </div>
    </div>
  );
} 