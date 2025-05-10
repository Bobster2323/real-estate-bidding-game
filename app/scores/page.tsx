"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Home, Plus, Trash2 } from "lucide-react"
import Link from "next/link"

type Player = {
  id: string
  name: string
  score: number
  bids: number[]
}

type Round = {
  id: string
  propertyName: string
  realPrice: number
  playerBids: {
    playerId: string
    bid: number
    difference: number
  }[]
}

export default function ScoresPage() {
  const [players, setPlayers] = useState<Player[]>(() => {
    const savedPlayers = localStorage.getItem("realEstatePlayers")
    return savedPlayers ? JSON.parse(savedPlayers) : []
  })

  const [rounds, setRounds] = useState<Round[]>(() => {
    const savedRounds = localStorage.getItem("realEstateRounds")
    return savedRounds ? JSON.parse(savedRounds) : []
  })

  const [newPlayerName, setNewPlayerName] = useState("")

  const [newRound, setNewRound] = useState({
    propertyName: "",
    realPrice: "",
    playerBids: {} as Record<string, string>,
  })

  // Save to localStorage when state changes
  const saveToLocalStorage = (newPlayers: Player[], newRounds: Round[]) => {
    localStorage.setItem("realEstatePlayers", JSON.stringify(newPlayers))
    localStorage.setItem("realEstateRounds", JSON.stringify(newRounds))
  }

  const addPlayer = () => {
    if (newPlayerName.trim()) {
      const newPlayer = {
        id: Date.now().toString(),
        name: newPlayerName.trim(),
        score: 0,
        bids: [],
      }
      const updatedPlayers = [...players, newPlayer]
      setPlayers(updatedPlayers)
      saveToLocalStorage(updatedPlayers, rounds)
      setNewPlayerName("")
    }
  }

  const removePlayer = (id: string) => {
    const updatedPlayers = players.filter((player) => player.id !== id)
    setPlayers(updatedPlayers)
    saveToLocalStorage(updatedPlayers, rounds)
  }

  const addRound = () => {
    if (newRound.propertyName.trim() && newRound.realPrice && Object.keys(newRound.playerBids).length > 0) {
      const realPrice = Number.parseInt(newRound.realPrice, 10)

      const playerBidsArray = Object.entries(newRound.playerBids).map(([playerId, bidStr]) => {
        const bid = Number.parseInt(bidStr, 10) || 0
        return {
          playerId,
          bid,
          difference: bid - realPrice,
        }
      })

      const round: Round = {
        id: Date.now().toString(),
        propertyName: newRound.propertyName,
        realPrice,
        playerBids: playerBidsArray,
      }

      // Update player scores
      const updatedPlayers = players.map((player) => {
        const playerBid = playerBidsArray.find((pb) => pb.playerId === player.id)
        if (playerBid) {
          // Calculate score based on how close the bid was (absolute difference)
          const difference = Math.abs(playerBid.difference)
          // Lower difference is better
          return {
            ...player,
            bids: [...player.bids, playerBid.bid],
            score: player.score - difference,
          }
        }
        return player
      })

      const updatedRounds = [...rounds, round]
      setRounds(updatedRounds)
      setPlayers(updatedPlayers)
      saveToLocalStorage(updatedPlayers, updatedRounds)

      // Reset form
      setNewRound({
        propertyName: "",
        realPrice: "",
        playerBids: {},
      })
    }
  }

  const handleBidChange = (playerId: string, value: string) => {
    setNewRound((prev) => ({
      ...prev,
      playerBids: {
        ...prev.playerBids,
        [playerId]: value,
      },
    }))
  }

  const resetScores = () => {
    const resetPlayers = players.map((player) => ({
      ...player,
      score: 0,
      bids: [],
    }))
    setPlayers(resetPlayers)
    setRounds([])
    saveToLocalStorage(resetPlayers, [])
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Score Tracker</h1>
        <Link href="/">
          <Button variant="outline" size="lg" className="flex items-center gap-2">
            <Home size={20} />
            <span>Home</span>
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Players Management */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Players</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex gap-2">
                <Input
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  placeholder="Player name"
                  className="text-lg p-6"
                />
                <Button onClick={addPlayer} className="h-14 px-6">
                  <Plus size={20} />
                </Button>
              </div>

              {players.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Name</TableHead>
                      <TableHead className="text-right">Score</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {players.map((player) => (
                      <TableRow key={player.id}>
                        <TableCell className="font-medium text-lg">{player.name}</TableCell>
                        <TableCell className="text-right text-lg">{player.score.toLocaleString()}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removePlayer(player.id)}
                            className="h-8 w-8 text-destructive"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center p-8 bg-muted rounded-lg">
                  <p className="text-xl">No players added yet.</p>
                </div>
              )}

              {players.length > 0 && (
                <Button variant="outline" onClick={resetScores} className="w-full">
                  Reset All Scores
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Add Round */}
        {players.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Add Round</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="propertyName" className="text-lg">
                    Property Name
                  </Label>
                  <Input
                    id="propertyName"
                    value={newRound.propertyName}
                    onChange={(e) => setNewRound({ ...newRound, propertyName: e.target.value })}
                    placeholder="e.g. Lauttasaarentie 12"
                    className="text-lg p-6"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="realPrice" className="text-lg">
                    Real Price (€)
                  </Label>
                  <Input
                    id="realPrice"
                    type="number"
                    value={newRound.realPrice}
                    onChange={(e) => setNewRound({ ...newRound, realPrice: e.target.value })}
                    placeholder="e.g. 350000"
                    className="text-lg p-6"
                  />
                </div>

                <div className="space-y-4">
                  <Label className="text-lg">Player Bids</Label>
                  {players.map((player) => (
                    <div key={player.id} className="flex items-center gap-4">
                      <div className="w-1/3 text-lg">{player.name}</div>
                      <Input
                        type="number"
                        value={newRound.playerBids[player.id] || ""}
                        onChange={(e) => handleBidChange(player.id, e.target.value)}
                        placeholder="Bid amount"
                        className="text-lg p-6"
                      />
                    </div>
                  ))}
                </div>

                <Button onClick={addRound} size="lg" className="w-full text-xl py-6">
                  Add Round
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Rounds History */}
      {rounds.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Rounds History</h2>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead className="text-right">Real Price</TableHead>
                  {players.map((player) => (
                    <TableHead key={player.id} className="text-right">
                      {player.name}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rounds.map((round) => (
                  <TableRow key={round.id}>
                    <TableCell className="font-medium">{round.propertyName}</TableCell>
                    <TableCell className="text-right">€{Math.floor(round.realPrice).toLocaleString()}</TableCell>
                    {players.map((player) => {
                      const playerBid = round.playerBids.find((pb) => pb.playerId === player.id)
                      return (
                        <TableCell key={player.id} className="text-right">
                          {playerBid ? (
                            <div>
                              €{Math.floor(playerBid.bid).toLocaleString()}
                              <div
                                className={`text-xs ${playerBid.difference > 0 ? "text-red-500" : playerBid.difference < 0 ? "text-amber-500" : "text-green-500"}`}
                              >
                                {playerBid.difference > 0 ? "+" : ""}{Math.floor(playerBid.difference).toLocaleString()}
                              </div>
                            </div>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
}
