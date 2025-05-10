import type { Metadata } from "next"
import "./globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { ListingsProvider } from "@/context/listings-context"
import { PlayersProvider } from "@/context/players-context"
import { ModeToggle } from "@/components/mode-toggle"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Real Estate Bidding Game",
  description: "A local multiplayer real estate speculation game",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ListingsProvider>
            <PlayersProvider>
              <div className="min-h-screen bg-background">
                <div className="absolute top-4 right-4 z-10">
                  <ModeToggle />
                </div>
                {children}
              </div>
            </PlayersProvider>
          </ListingsProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
