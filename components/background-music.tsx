import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Volume2, VolumeX } from "lucide-react"

interface ExtendedAudioElement extends HTMLAudioElement {
  fadeOut: () => Promise<void>;
  fadeIn: () => Promise<void>;
  enableMusic: () => void;
}

interface BackgroundMusicProps {
  onMusicRef: (ref: ExtendedAudioElement | null) => void
}

const DEFAULT_VOLUME = 0.1 // 10% volume
const FADE_DURATION = 300 // 300ms fade

export function BackgroundMusic({ onMusicRef }: BackgroundMusicProps) {
  const [isMusicEnabled, setIsMusicEnabled] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const fadeIntervalRef = useRef<number | null>(null)

  // Cleanup function for fade interval
  const clearFadeInterval = () => {
    if (fadeIntervalRef.current !== null) {
      window.clearInterval(fadeIntervalRef.current)
      fadeIntervalRef.current = null
    }
  }

  // Enable music programmatically
  const enableMusic = () => {
    setIsMusicEnabled(true)
    setIsInitialized(true)
  }

  // Quick fade out
  const fadeOut = async () => {
    if (!audioRef.current) return
    
    return new Promise<void>((resolve) => {
      if (!audioRef.current) {
        resolve()
        return
      }

      clearFadeInterval()
      
      const audio = audioRef.current
      const startVolume = audio.volume
      const steps = 10
      const stepValue = -startVolume / steps
      const stepDuration = FADE_DURATION / steps
      let currentStep = 0

      fadeIntervalRef.current = window.setInterval(() => {
        currentStep++
        
        if (currentStep >= steps) {
          audio.volume = 0
          clearFadeInterval()
          resolve()
        } else {
          audio.volume = startVolume + (stepValue * currentStep)
        }
      }, stepDuration)
    })
  }

  // Quick fade in
  const fadeIn = async () => {
    if (!audioRef.current) return

    // Make sure music is enabled
    enableMusic()
    
    return new Promise<void>((resolve) => {
      const audio = audioRef.current!
      audio.volume = 0
      
      // Try to play the audio
      audio.play().then(() => {
        const steps = 10
        const stepValue = DEFAULT_VOLUME / steps
        const stepDuration = FADE_DURATION / steps
        let currentStep = 0

        clearFadeInterval()
        fadeIntervalRef.current = window.setInterval(() => {
          currentStep++
          
          if (currentStep >= steps) {
            audio.volume = DEFAULT_VOLUME
            clearFadeInterval()
            resolve()
          } else {
            audio.volume = stepValue * currentStep
          }
        }, stepDuration)
      }).catch(error => {
        console.error("Error playing background music:", error)
        resolve()
      })
    })
  }

  const toggleMusic = async () => {
    if (!isInitialized) {
      setIsInitialized(true)
    }
    
    if (!isMusicEnabled) {
      // Enable music
      setIsMusicEnabled(true)
      if (audioRef.current) {
        try {
          // Make sure the current track is ready to play
          audioRef.current.currentTime = 0
          await fadeIn()
        } catch (error) {
          console.error("Error playing background music:", error)
        }
      }
    } else {
      // Disable music
      setIsMusicEnabled(false)
      if (audioRef.current) {
        await fadeOut()
        audioRef.current.pause()
      }
    }
  }

  useEffect(() => {
    // Create audio element with track1
    const audio = new Audio("/background-music/track1.mp3")
    audio.volume = DEFAULT_VOLUME
    audio.loop = true // Enable looping for continuous playback
    
    audioRef.current = audio
    
    // Extend the audio element with fade methods
    onMusicRef({
      ...audio,
      fadeOut,
      fadeIn: () => fadeIn(),
      enableMusic
    } as ExtendedAudioElement)

    return () => {
      clearFadeInterval()
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ""
      }
      audioRef.current = null
      onMusicRef(null)
    }
  }, [onMusicRef])

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleMusic}
      className="h-9 w-9"
      title={!isInitialized ? "Start background music" : (isMusicEnabled ? "Mute background music" : "Unmute background music")}
    >
      {isMusicEnabled ? (
        <Volume2 className="h-4 w-4" />
      ) : (
        <VolumeX className="h-4 w-4" />
      )}
    </Button>
  )
} 