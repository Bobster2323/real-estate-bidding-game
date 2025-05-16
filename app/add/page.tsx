"use client"

import type React from "react"

import { useState } from "react"
import { useListings } from "@/context/listings-context"
import { usePlayers } from "@/context/players-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, Home, Plus, X } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { addListingToSupabase, uploadListingImage } from "@/lib/supabaseGame"
import { RequireAuth } from "@/components/RequireAuth"

export default function AddListingsPage() {
  const { listings, addListing, removeListing, refetchListings } = useListings()
  const { players } = usePlayers()
  const [title, setTitle] = useState("")
  const [imageUrls, setImageUrls] = useState<string[]>([""])
  const [area, setArea] = useState("")
  const [size, setSize] = useState("")
  const [rooms, setRooms] = useState("")
  const [realPrice, setRealPrice] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)

  const handleAddListing = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    // Filter out empty image URLs
    const filteredImages = imageUrls.filter((url) => url.trim() !== "")
    try {
      await addListingToSupabase({
        title,
        images: filteredImages,
        area,
        size,
        rooms,
        realPrice: Number.parseInt(realPrice, 10) || 0,
      })
      refetchListings()
      setTitle("")
      setImageUrls([""])
      setArea("")
      setSize("")
      setRooms("")
      setRealPrice("")
      setSuccess("Listing added successfully!")
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message || "Failed to add listing.")
    }
  }

  const addImageField = () => {
    setImageUrls([...imageUrls, ""])
  }

  const updateImageUrl = (index: number, value: string) => {
    const newUrls = [...imageUrls]
    newUrls[index] = value
    setImageUrls(newUrls)
  }

  const removeImageField = (index: number) => {
    if (imageUrls.length > 1) {
      const newUrls = [...imageUrls]
      newUrls.splice(index, 1)
      setImageUrls(newUrls)
    } else {
      setImageUrls([""])
    }
  }

  // Upload handler for image file
  const handleImageUpload = async (index: number, file: File) => {
    setUploadingIndex(index)
    try {
      const url = await uploadListingImage(file)
      updateImageUrl(index, url)
    } catch (err: any) {
      setError("Failed to upload image: " + (err.message || err.toString()))
    } finally {
      setUploadingIndex(null)
    }
  }

  return (
    <RequireAuth>
      <div className="container mx-auto p-4 md:p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Manage Listings</h1>
          <Link href="/">
            <Button variant="outline" size="lg" className="flex items-center gap-2">
              <Home size={20} />
              <span>Home</span>
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Add Listing Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Add New Listing</CardTitle>
              <CardDescription>Enter the details of the real estate listing</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddListing} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-lg">
                    Title
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Lauttasaarentie 12"
                    required
                    className="text-lg p-6"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-lg">Images</Label>
                  <p className="text-sm text-muted-foreground mb-2">Add multiple images to showcase the property</p>
                  {imageUrls.map((url, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Input
                        value={url}
                        onChange={(e) => updateImageUrl(index, e.target.value)}
                        placeholder="Image URL"
                        className="text-lg p-6"
                      />
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        id={`file-upload-${index}`}
                        onChange={e => {
                          if (e.target.files && e.target.files[0]) {
                            handleImageUpload(index, e.target.files[0])
                          }
                        }}
                      />
                      <label htmlFor={`file-upload-${index}`} className="cursor-pointer">
                        <Button type="button" variant="outline" size="icon" className="h-14 w-14 flex-shrink-0">
                          {uploadingIndex === index ? (
                            <span className="animate-spin">⏳</span>
                          ) : (
                            <span role="img" aria-label="Upload">⬆️</span>
                          )}
                        </Button>
                      </label>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeImageField(index)}
                        className="h-14 w-14 flex-shrink-0"
                      >
                        <X size={20} />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={addImageField} className="w-full mt-2">
                    <Plus size={20} className="mr-2" />
                    Add Another Image
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="area" className="text-lg">
                      Area
                    </Label>
                    <Input
                      id="area"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      placeholder="e.g. Helsinki"
                      required
                      className="text-lg p-6"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="size" className="text-lg">
                      Size
                    </Label>
                    <Input
                      id="size"
                      value={size}
                      onChange={(e) => setSize(e.target.value)}
                      placeholder="e.g. 57 m²"
                      required
                      className="text-lg p-6"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rooms" className="text-lg">
                      Rooms
                    </Label>
                    <Input
                      id="rooms"
                      value={rooms}
                      onChange={(e) => setRooms(e.target.value)}
                      placeholder="e.g. 2h + k"
                      required
                      className="text-lg p-6"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="realPrice" className="text-lg">
                    Real Price (€)
                  </Label>
                  <Input
                    id="realPrice"
                    type="number"
                    value={realPrice}
                    onChange={(e) => setRealPrice(e.target.value)}
                    placeholder="e.g. 350000"
                    required
                    className="text-lg p-6"
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800">
                    <AlertTitle>Success</AlertTitle>
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" size="lg" className="w-full text-xl py-6">
                  Add Listing
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Existing Listings */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Existing Listings ({listings.length})</h2>

            {listings.length === 0 ? (
              <div className="text-center p-8 bg-muted rounded-lg">
                <p className="text-xl">No listings added yet.</p>
                <p className="text-muted-foreground mt-2">Add your first listing using the form.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 relative">
                {listings.map((listing, index) => (
                  <Card key={listing.id} className="relative">
                    <CardContent className="pt-6">
                      {/* Blurred placeholder content */}
                      <div className="flex gap-4">
                        <div className="w-24 h-24 bg-muted rounded" />
                        <div className="flex-grow space-y-4">
                          <div className="h-6 bg-muted rounded w-3/4" />
                          <div className="flex gap-2">
                            <div className="h-4 bg-muted rounded w-20" />
                            <div className="h-4 bg-muted rounded w-20" />
                            <div className="h-4 bg-muted rounded w-20" />
                          </div>
                          <div className="h-6 bg-muted rounded w-1/3" />
                        </div>
                      </div>

                      {/* Delete button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm(`Are you sure you want to remove listing ${index + 1}?`)) {
                            removeListing(listing.id)
                          }
                        }}
                        className="h-10 w-10 text-destructive absolute top-4 right-4"
                      >
                        <Trash2 size={20} />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {listings.length > 0 && (
              <div className="flex gap-4">
                <Link href="/game" className="flex-grow">
                  <Button size="lg" className="w-full text-xl py-6">
                    Start Game
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </RequireAuth>
  )
}
