"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function BiddingControls({ gameId, currentPlayerId, listingId, bids, getPlayerBid, submitBid, disabled }: {
  gameId: string,
  currentPlayerId: string,
  listingId: string,
  bids: any[],
  getPlayerBid: (playerId: string) => any,
  submitBid: (playerId: string, listingId: string, amount: number) => Promise<any>,
  disabled?: boolean,
}) {
  const currentPlayer = bids.find(p => p.player_id === currentPlayerId);
  if (!currentPlayerId) return null;
  return (
    <PlayerBiddingControl
      playerId={currentPlayerId}
      currentBid={getPlayerBid(currentPlayerId)}
      onBid={amount => submitBid(currentPlayerId, listingId, amount)}
      listingId={listingId}
      disabled={disabled}
    />
  );
}

function PlayerBiddingControl({ playerId, currentBid, onBid, listingId, disabled }: {
  playerId: string,
  currentBid: number,
  onBid: (amount: number) => void,
  listingId: string,
  disabled?: boolean,
}) {
  const [amount, setAmount] = useState(currentBid);
  useEffect(() => { setAmount(currentBid); }, [listingId]);

  return (
    <div className="bg-card rounded-xl shadow-lg border border-border/50 p-6 flex flex-col gap-4 items-center">
      <h3 className="text-xl font-bold mb-2">Your Bid</h3>
      <Input
        type="number"
        min={0}
        value={amount}
        onChange={e => setAmount(Number(e.target.value))}
        className="text-lg text-center"
        disabled={disabled}
      />
      <div className="flex gap-2 mt-2">
        <Button onClick={() => setAmount(amount + 5000)} disabled={disabled}>+€5,000</Button>
        <Button onClick={() => setAmount(amount + 10000)} disabled={disabled}>+€10,000</Button>
      </div>
      <Button onClick={() => onBid(amount)} className="w-full mt-4" disabled={amount <= 0 || disabled}>Place Bid</Button>
    </div>
  );
} 