"use client"

import type React from "react"

import { useState } from "react"
import { useListings } from "@/context/listings-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, Home, Plus, X, LinkIcon, Loader2, AlertTriangle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { fetchOikotieListing } from "../actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"

export default function AddListingsPage() {
  const { listings, addListing, removeListing } = useListings()
  const [title, setTitle] = useState("")
  const [imageUrls, setImageUrls] = useState<string[]>([""])
  const [area, setArea] = useState("")
  const [size, setSize] = useState("")
  const [rooms, setRooms] = useState("")
  const [realPrice, setRealPrice] = useState("")
  const [oikotieUrl, setOikotieUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [autoAddAfterImport, setAutoAddAfterImport] = useState(true)
  const [previewImages, setPreviewImages] = useState<string[]>([])

  const handleAddListing = (e: React.FormEvent) => {
    e.preventDefault()

    // Filter out empty image URLs
    const filteredImages = imageUrls.filter((url) => url.trim() !== "")

    addListing({
      title,
      images: filteredImages,
      area,
      size,
      rooms,
      realPrice: Number.parseInt(realPrice, 10) || 0,
    })

    // Reset form
    setTitle("")
    setImageUrls([""])
    setArea("")
    setSize("")
    setRooms("")
    setRealPrice("")
    setPreviewImages([])
    setSuccess("Listing added successfully!")

    // Clear success message after 3 seconds
    setTimeout(() => {
      setSuccess(null)
    }, 3000)
  }

  const fetchFromOikotie = async () => {
    if (!oikotieUrl.trim()) {
      setError("Please enter an Oikotie URL")
      return
    }

    setIsLoading(true)
    setError(null)
    setWarning(null)
    setPreviewImages([])

    try {
      const data = await fetchOikotieListing(oikotieUrl)

      // If there's an error message but we still have data, show it as a warning
      if (data.error) {
        setWarning(data.error)
      }

      // Populate form with fetched data
      setTitle(data.title || "")
      setImageUrls(data.images.length > 0 ? data.images : [""])
      setPreviewImages(data.images)
      setArea(data.area || "")
      setSize(data.size || "")
      setRooms(data.rooms || "")
      setRealPrice(data.realPrice ? data.realPrice.toString() : "")

      // If auto-add is enabled, add the listing immediately
      if (autoAddAfterImport && data.title && data.realPrice) {
        // Add the listing to the context
        addListing({
          title: data.title,
          images: data.images,
          area: data.area || "",
          size: data.size || "",
          rooms: data.rooms || "",
          realPrice: data.realPrice || 0,
        })

        // Reset form after adding
        setTitle("")
        setImageUrls([""])
        setArea("")
        setSize("")
        setRooms("")
        setRealPrice("")
        setPreviewImages([])

        setSuccess("Listing imported and added successfully!")
      } else {
        setSuccess("Successfully retrieved listing information! Click 'Add Listing' to save it.")
      }

      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccess(null)
      }, 5000)
    } catch (err) {
      console.error("Error in component:", err)
      setError("Failed to fetch listing information. Please try again.")
    } finally {
      setIsLoading(false)
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

  return (
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

      {/* Oikotie URL Import */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">Import from Oikotie</CardTitle>
          <CardDescription>Paste an Oikotie listing URL to automatically import property details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <div className="flex-grow">
              <Input
                value={oikotieUrl}
                onChange={(e) => setOikotieUrl(e.target.value)}
                placeholder="https://asunnot.oikotie.fi/myytavat-asunnot/..."
                className="text-lg p-6"
              />
            </div>
            <Button onClick={fetchFromOikotie} disabled={isLoading} className="h-14 px-6">
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <LinkIcon className="h-5 w-5 mr-2" />}
              Import
            </Button>
          </div>

          <div className="flex items-center space-x-2 mb-4">
            <Checkbox
              id="auto-add"
              checked={autoAddAfterImport}
              onCheckedChange={(checked) => setAutoAddAfterImport(checked === true)}
              className="h-5 w-5"
            />
            <Label htmlFor="auto-add" className="text-base cursor-pointer">
              Automatically add listing after successful import
            </Label>
          </div>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {warning && (
            <Alert className="mt-4 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800">
              <AlertTriangle className="h-4 w-4 mr-2" />
              <AlertTitle>Notice</AlertTitle>
              <AlertDescription>{warning}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mt-4 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800">
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Image Preview */}
          {previewImages.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">Image Preview</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {previewImages.map((img, index) => (
                  <div key={index} className="relative aspect-[4/3] rounded-md overflow-hidden bg-muted">
                    <Image src={img || "/placeholder.svg"} alt={`Preview ${index + 1}`} fill className="object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
                  <div key={index} className="flex gap-2">
                    <Input
                      value={url}
                      onChange={(e) => updateImageUrl(index, e.target.value)}
                      placeholder="Image URL"
                      className="text-lg p-6"
                    />
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
            <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2">
              {listings.map((listing) => (
                <Card key={listing.id} className="relative">
                  <CardContent className="pt-6">
                    <div className="flex gap-4">
                      <div className="w-24 h-24 relative rounded overflow-hidden flex-shrink-0 bg-muted">
                        {listing.images.length > 0 ? (
                          <Image
                            src={listing.images[0] || "/placeholder.svg"}
                            alt={listing.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-muted-foreground">No image</div>
                        )}
                      </div>
                      <div className="flex-grow">
                        <h3 className="text-xl font-medium line-clamp-1">{listing.title}</h3>
                        <div className="flex flex-wrap gap-x-4 mt-1 text-muted-foreground">
                          <span>{listing.area}</span>
                          <span>{listing.size}</span>
                          <span>{listing.rooms}</span>
                        </div>
                        <div className="mt-2 font-medium">€{listing.realPrice.toLocaleString()}</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeListing(listing.id)}
                        className="h-10 w-10 text-destructive absolute top-4 right-4"
                      >
                        <Trash2 size={20} />
                      </Button>
                    </div>
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
  )
}
