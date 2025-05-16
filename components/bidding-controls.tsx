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
  // Find the highest bid for this listing
  const highestBid = bids.filter(b => b.listing_id === listingId).reduce((max, b) => Math.max(max, b.amount), 0);
  if (!currentPlayerId) return null;
  return (
    <PlayerBiddingControl
      playerId={currentPlayerId}
      currentBid={getPlayerBid(currentPlayerId)}
      highestBid={highestBid}
      onBid={amount => submitBid(currentPlayerId, listingId, amount)}
      listingId={listingId}
      disabled={disabled}
    />
  );
}

function PlayerBiddingControl({ playerId, currentBid, highestBid, onBid, listingId, disabled }: {
  playerId: string,
  currentBid: number,
  highestBid: number,
  onBid: (amount: number) => void,
  listingId: string,
  disabled?: boolean,
}) {
  const [amount, setAmount] = useState(currentBid);
  useEffect(() => { setAmount(currentBid); }, [listingId]);

  return (
    <div className="bg-card/80 rounded-2xl shadow-2xl border border-border/40 p-5 flex flex-col items-center gap-4 backdrop-blur-md max-w-xs w-full mx-auto">
      <h3 className="text-2xl font-extrabold mb-1 text-center">Your Bid</h3>
      <div className="relative w-full flex justify-center">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base text-muted-foreground">€</span>
        <Input
          type="number"
          min={0}
          value={amount}
          onChange={e => setAmount(Number(e.target.value))}
          onKeyDown={e => {
            if (e.key === 'Enter' && amount > 0 && !disabled) onBid(amount);
          }}
          className="text-base text-center pl-8 pr-2 py-2 rounded-lg border border-border/60 bg-background/70 shadow-inner focus:ring-2 focus:ring-primary/40 transition-all w-full"
          disabled={disabled}
        />
      </div>
      <span className="text-xs text-muted-foreground mb-1 text-center">Enter your custom bid or use quick buttons</span>
      <div className="flex flex-col w-full max-w-xs gap-2">
        <div className="flex flex-row gap-2 w-full">
          <Button className="rounded-full px-2 py-1 font-semibold shadow-sm w-1/2 text-sm" onClick={() => {
            const newAmount = highestBid + 1000;
            setAmount(newAmount);
            onBid(newAmount);
          }} disabled={disabled}>+€1,000</Button>
          <Button className="rounded-full px-2 py-1 font-semibold shadow-sm w-1/2 text-sm" onClick={() => {
            const newAmount = highestBid + 5000;
            setAmount(newAmount);
            onBid(newAmount);
          }} disabled={disabled}>+€5,000</Button>
        </div>
        <div className="flex flex-row gap-2 w-full">
          <Button className="rounded-full px-2 py-1 font-semibold shadow-sm w-1/2 text-sm" onClick={() => {
            const newAmount = highestBid + 10000;
            setAmount(newAmount);
            onBid(newAmount);
          }} disabled={disabled}>+€10,000</Button>
          <Button className="rounded-full px-2 py-1 font-semibold shadow-sm w-1/2 text-sm" onClick={() => {
            const newAmount = highestBid + 50000;
            setAmount(newAmount);
            onBid(newAmount);
          }} disabled={disabled}>+€50,000</Button>
        </div>
        <Button className="rounded-full px-2 py-1 font-semibold shadow-sm w-full text-sm" onClick={() => {
          const newAmount = highestBid + 100000;
          setAmount(newAmount);
          onBid(newAmount);
        }} disabled={disabled}>+€100,000</Button>
      </div>
    </div>
  );
} 