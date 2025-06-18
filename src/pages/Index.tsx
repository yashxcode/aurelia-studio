import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Download, Film, Loader2 } from "lucide-react"
import AudioUploader from "@/components/AudioUploader"
import AudioWaveform from "@/components/AudioWaveform"
import AudioPlayer from "@/components/AudioPlayer"
import VideoPlayer from "@/components/VideoPlayer"
import PresetsPanel from "@/components/PresetsPanel"
import ManualControls from "@/components/ManualControls"
import {
  processAudio,
  exportAudio,
  ManualProcessingParams,
} from "@/utils/audioProcessing"
import { exportVideoWithAudio } from "@/utils/videoExport"
import KeyboardShortcuts from "@/components/KeyboardShortcuts"
import UserPanel from "@/components/UserPanel"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const Index = () => {
  const { toast } = useToast()
  const { user } = useAuth()
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null)
  const [processedAudioBuffer, setProcessedAudioBuffer] =
    useState<AudioBuffer | null>(null)
  const [originalFileName, setOriginalFileName] = useState<string>("")
  const [originalFile, setOriginalFile] = useState<File | null>(null)
  const [isVideoFile, setIsVideoFile] = useState<boolean>(false)
  const [activePreset, setActivePreset] = useState<string | null>(null)
  const [manualParams, setManualParams] =
    useState<ManualProcessingParams | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDownloading, setIsDownloading] = useState<{
    [format: string]: boolean
  }>({
    wav: false,
    mp3: false,
    mp4: false,
  })
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("presets")

  // Removed ref for AudioPlayer, as it is not needed and causes warning
  // const playerRef = useRef<{ togglePlayPause: () => void; handleRestart: () => void } | null>(null);

  const handleAudioLoad = useCallback(
    (buffer: AudioBuffer, file: File) => {
      setAudioBuffer(buffer)
      setProcessedAudioBuffer(null)
      setActivePreset(null)
      setManualParams(null)
      setOriginalFileName(file.name.split(".")[0])
      setOriginalFile(file)
      setIsVideoFile(file.type.startsWith("video/"))

      setIsPlaying(false)
      setCurrentTime(0)

      toast({
        title: "File loaded successfully",
        description: `${file.name} (${Math.round(buffer.duration * 10) / 10}s)`,
      })
    },
    [toast]
  )

  const handlePresetSelect = useCallback(
    async (preset: string) => {
      if (!audioBuffer || !user) return

      setManualParams(null)
      setActiveTab("presets")
      setIsProcessing(true)

      try {
        console.log("Starting processing with preset:", preset)
        const processed = await processAudio(audioBuffer, preset)
        console.log("Processing complete")
        setProcessedAudioBuffer(processed)
        setActivePreset(preset)

        toast({
          title: "Audio processed",
          description: `Applied ${preset.replace("-", " ")} preset`,
        })

        await saveProcessedAudio(processed, preset)

        // Automatically start playback after processing
        setCurrentTime(0)
        setIsPlaying(false)
      } catch (error) {
        console.error("Error processing audio:", error)
        toast({
          title: "Processing error",
          description: "Failed to process audio",
          variant: "destructive",
        })
      } finally {
        setIsProcessing(false)
      }
    },
    [audioBuffer, toast, user]
  )

  const handleManualParametersChange = useCallback(
    async (params: ManualProcessingParams) => {
      if (!audioBuffer) return

      setManualParams(params)
      setIsProcessing(true)

      try {
        const processed = await processAudio(audioBuffer, undefined, params)
        setProcessedAudioBuffer(processed)
      } catch (error) {
        console.error("Error applying manual parameters:", error)
        toast({
          title: "Processing error",
          description: "Failed to apply parameters",
          variant: "destructive",
        })
      } finally {
        setIsProcessing(false)
      }
    },
    [audioBuffer, toast]
  )

  const handleResetManualControls = useCallback(() => {
    setManualParams(null)
    setProcessedAudioBuffer(null)
  }, [])

  const handleResetToOriginal = useCallback(() => {
    setProcessedAudioBuffer(null)
    setActivePreset(null)
    setManualParams(null)
    setCurrentTime(0)

    toast({
      title: "Reset to original",
      description: "All effects have been removed",
    })
  }, [toast])

  const handleSaveManualProcessing = useCallback(async () => {
    if (!audioBuffer || !manualParams || !user) return

    setIsProcessing(true)

    try {
      console.log("Processing with manual parameters for saving")

      const processed = await processAudio(audioBuffer, undefined, manualParams)
      setProcessedAudioBuffer(processed)

      const presetName = "custom-manual"

      await saveProcessedAudio(processed, presetName)

      toast({
        title: "Custom settings saved",
        description: "Your manual adjustments have been saved to your library",
      })
    } catch (error) {
      console.error("Error saving manual processing:", error)
      toast({
        title: "Saving error",
        description: "Failed to save custom settings",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }, [audioBuffer, manualParams, toast, user])

  const saveProcessedAudio = async (audio: AudioBuffer, preset: string) => {
    if (!user || !originalFile) return

    setIsSaving(true)

    try {
      const wavData = await audioBufferToWav(audio)
      const blob = new Blob([wavData], { type: "audio/wav" })

      const originalFilePath = `${
        user.id
      }/${Date.now()}_original_${originalFileName}.wav`

      await supabase.storage
        .from("audio")
        .upload(originalFilePath, originalFile)

      const enhancedFileName = `${originalFileName}_${preset}`
      const enhancedFilePath = `${
        user.id
      }/${Date.now()}_enhanced_${enhancedFileName}.wav`

      await supabase.storage.from("audio").upload(enhancedFilePath, blob)

      const { error } = await supabase.from("audio_enhancements").insert({
        user_id: user.id,
        preset_used: preset,
        original_file_path: originalFilePath,
        original_file_name: originalFileName,
        enhanced_file_path: enhancedFilePath,
      })

      if (error) throw error

      toast({
        title: "Saved to library",
        description: "Your enhanced audio is now in your library",
      })
    } catch (error) {
      console.error("Error saving to Supabase:", error)
      toast({
        title: "Save error",
        description: "Could not save to your library",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const audioBufferToWav = (audioBuffer: AudioBuffer): Promise<ArrayBuffer> => {
    return new Promise((resolve) => {
      const numOfChannels = audioBuffer.numberOfChannels
      const length = audioBuffer.length * numOfChannels * 2
      const buffer = new ArrayBuffer(44 + length)
      const view = new DataView(buffer)
      const sampleRate = audioBuffer.sampleRate

      writeString(view, 0, "RIFF")
      view.setUint32(4, 36 + length, true)
      writeString(view, 8, "WAVE")
      writeString(view, 12, "fmt ")
      view.setUint32(16, 16, true)
      view.setUint16(20, 1, true)
      view.setUint16(22, numOfChannels, true)
      view.setUint32(24, sampleRate, true)
      view.setUint32(28, sampleRate * 4, true)
      view.setUint16(32, numOfChannels * 2, true)
      view.setUint16(34, 16, true)
      writeString(view, 36, "data")
      view.setUint32(40, length, true)

      const offset = 44
      let pos = offset
      for (let i = 0; i < audioBuffer.length; i++) {
        for (let ch = 0; ch < numOfChannels; ch++) {
          const sample = Math.max(
            -1,
            Math.min(1, audioBuffer.getChannelData(ch)[i])
          )
          const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff
          view.setInt16(pos, int16, true)
          pos += 2
        }
      }

      resolve(buffer)
    })
  }

  const writeString = (
    view: DataView,
    offset: number,
    string: string
  ): void => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i))
    }
  }

  const handleDownload = useCallback(
    async (format: "mp3" | "wav" | "mp4" = "wav") => {
      if (!processedAudioBuffer && !audioBuffer) return

      const bufferToExport = processedAudioBuffer || audioBuffer
      if (!bufferToExport) return

      setIsDownloading((prev) => ({ ...prev, [format]: true }))

      const presetSuffix = activePreset
        ? `-${activePreset}`
        : manualParams
        ? "-custom"
        : ""
      const filename = `${originalFileName}${presetSuffix}`

      try {
        if (format === "mp4") {
          if (!originalFile || !originalFile.type.startsWith("video/")) {
            throw new Error("No video file available")
          }
          await exportVideoWithAudio(originalFile, bufferToExport, filename)
        } else {
          await exportAudio(bufferToExport, filename, format)
        }

        toast({
          title: "Export successful",
          description: `Saved as ${filename}.${format}`,
        })
      } catch (error) {
        console.error("Export error:", error)
        toast({
          title: "Export failed",
          description: "Could not export file",
          variant: "destructive",
        })
      } finally {
        setIsDownloading((prev) => ({ ...prev, [format]: false }))
      }
    },
    [
      processedAudioBuffer,
      audioBuffer,
      originalFileName,
      originalFile,
      activePreset,
      manualParams,
      toast,
    ]
  )

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="container mx-auto py-3 pt-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-sonic-purple to-sonic-purple-light bg-clip-text text-transparent">
              Aurelia Studio
            </h1>
            <p className="text-muted-foreground">
              Professional audio enhancement made simple
            </p>
          </div>

          <div className="mt-4 md:mt-0 flex items-center gap-4">
            <p className="text-sm text-muted-foreground hidden md:block">
              Upload audio files and enhance them with professional presets
            </p>
            <UserPanel />
          </div>
        </div>
      </header>

      <main className="container mx-auto flex-1 py-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
          <div className="lg:col-span-5 space-y-6">
            {isVideoFile && originalFile && (
              <VideoPlayer
                videoFile={originalFile}
                isPlaying={isPlaying}
                currentTime={currentTime}
                onTimeUpdate={setCurrentTime}
              />
            )}

            <Card>
              <CardContent className="p-6">
                <AudioWaveform
                  audioBuffer={processedAudioBuffer || audioBuffer}
                  isPlaying={isPlaying}
                  currentTime={currentTime}
                />

                <div className="mt-6">
                  <AudioPlayer
                    audioBuffer={audioBuffer}
                    processedAudioBuffer={processedAudioBuffer}
                    onTimeUpdate={setCurrentTime}
                    onPlayStateChange={setIsPlaying}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <Tabs
                  defaultValue="presets"
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="space-y-4"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="presets">Presets</TabsTrigger>
                    <TabsTrigger value="manual">Manual Control</TabsTrigger>
                  </TabsList>

                  <TabsContent value="presets" className="space-y-4">
                    <PresetsPanel
                      onPresetSelect={handlePresetSelect}
                      activePreset={activePreset}
                      isProcessing={isProcessing}
                    />
                  </TabsContent>

                  <TabsContent value="manual">
                    <ManualControls
                      onParametersChange={handleManualParametersChange}
                      onReset={handleResetManualControls}
                      onResetToOriginal={handleResetToOriginal}
                      isProcessing={isProcessing}
                      onApply={handleSaveManualProcessing}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-semibold">Audio File</h3>
                <AudioUploader onAudioLoad={handleAudioLoad} />

                <Separator className="my-4" />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Export</h3>
                  <div className="space-y-2">
                    <Button
                      onClick={() => handleDownload()}
                      disabled={
                        (!processedAudioBuffer && !audioBuffer) ||
                        isDownloading.wav ||
                        isProcessing ||
                        isSaving
                      }
                      className="w-full"
                    >
                      {isDownloading.wav ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Downloading...
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Download WAV
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => handleDownload("mp3")}
                      disabled={
                        (!processedAudioBuffer && !audioBuffer) ||
                        isDownloading.mp3 ||
                        isProcessing ||
                        isSaving
                      }
                      variant="outline"
                      className="w-full"
                    >
                      {isDownloading.mp3 ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Downloading...
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Download MP3
                        </>
                      )}
                    </Button>

                    {isVideoFile && (
                      <Button
                        onClick={() => handleDownload("mp4")}
                        disabled={
                          (!processedAudioBuffer && !audioBuffer) ||
                          !isVideoFile ||
                          isDownloading.mp4 ||
                          isProcessing ||
                          isSaving
                        }
                        variant="outline"
                        className="w-full"
                      >
                        {isDownloading.mp4 ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Downloading Video...
                          </>
                        ) : (
                          <>
                            <Film className="mr-2 h-4 w-4" />
                            Download Video with Audio
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isProcessing
                      ? "Processing audio..."
                      : isSaving
                      ? "Saving to your library..."
                      : "Download with applied effects"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-semibold">About Aurelia Studio</h3>
                <p className="text-sm text-muted-foreground">
                  Enhance your audio files with professional-grade processing
                  tools. Select from our range of presets designed for different
                  audio types.
                </p>
                <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                  <li>Enhance podcasts and vocal recordings</li>
                  <li>Boost bass for music production</li>
                  <li>Apply studio-quality enhancements</li>
                  <li>Reduce background noise</li>
                  <li>Apply unique audio effects</li>
                  <li>Custom controls for precise adjustments</li>
                  <li>Process video audio and export combined files</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <footer className="border-t bg-card">
        <div className="container mx-auto py-4 px-6 text-center text-sm text-muted-foreground">
          <p>Aurelia - Browser-based audio enhancement</p>
          <p className="mt-2 text-xs">
            Keyboard shortcuts:{" "}
            <span className="font-mono bg-secondary px-1 rounded">Space</span>{" "}
            Play/Pause,
            <span className="font-mono bg-secondary px-1 rounded ml-1">
              R
            </span>{" "}
            Restart,
            <span className="font-mono bg-secondary px-1 rounded ml-1">
              Ctrl+D
            </span>{" "}
            Download
          </p>
        </div>
      </footer>

      <KeyboardShortcuts
        isAudioLoaded={Boolean(audioBuffer || processedAudioBuffer)}
        onPlayPause={() => setIsPlaying((prev) => !prev)}
        onRestart={() => setCurrentTime(0)}
        onDownload={() => handleDownload("wav")}
      />
    </div>
  )
}

export default Index
