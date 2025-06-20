import React from "react"
import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"
import { Copy, RefreshCw } from "lucide-react"

interface TranscriptViewerProps {
  transcript: string
  isLoading: boolean
  onCopy: () => void
  onGenerate: () => void
}

const TranscriptViewer: React.FC<TranscriptViewerProps> = ({
  transcript,
  isLoading,
  onCopy,
  onGenerate,
}) => {
  return (
    <Card className="w-full">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Transcription</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={onGenerate}
            disabled={isLoading}
            className="flex items-center gap-1"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
            {transcript ? "Regenerate Transcript" : "Generate Transcript"}
          </Button>
        </div>
        <div className="relative min-h-[120px] bg-muted rounded p-3 text-sm overflow-y-auto whitespace-pre-wrap">
          {isLoading ? (
            <span className="text-muted-foreground">Transcribing...</span>
          ) : transcript ? (
            <>
              <span>{transcript}</span>
              <button
                className="absolute top-2 right-2 p-1 rounded hover:bg-accent transition"
                onClick={onCopy}
                title="Copy transcript"
                style={{ background: "none", border: "none" }}
              >
                <Copy className="w-4 h-4 text-muted-foreground hover:text-foreground" />
              </button>
            </>
          ) : (
            <span className="text-muted-foreground">
              No transcript available.
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default TranscriptViewer
