import { useState, useEffect } from "react"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ManualProcessingParams } from "@/utils/audioProcessing"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { RefreshCw, RotateCcw } from "lucide-react"

interface ManualControlsProps {
  onParametersChange: (params: ManualProcessingParams) => void
  onReset: () => void
  onResetToOriginal: () => void
  isProcessing: boolean
  onApply: () => void
}

const ManualControls = ({
  onParametersChange,
  onReset,
  onResetToOriginal,
  isProcessing,
  onApply,
}: ManualControlsProps) => {
  const [params, setParams] = useState<ManualProcessingParams>({
    bass: 0,
    treble: 0,
    compression: 0,
    normalize: 0,
    lowpass: 0,
    highpass: 0,
  })

  const [livePreview, setLivePreview] = useState(true)

  // Apply changes immediately when any parameter changes
  useEffect(() => {
    if (livePreview) {
      // Remove debounce for immediate updates
      onParametersChange(params)
    }
  }, [params, livePreview, onParametersChange])

  // Handle parameter changes
  const handleParamChange = (
    name: keyof ManualProcessingParams,
    value: number
  ) => {
    setParams((prev) => {
      const newParams = { ...prev, [name]: value }
      return newParams
    })
  }

  // Apply changes manually when live preview is off
  const applyChanges = () => {
    onParametersChange(params)
  }

  // Reset all controls
  const handleReset = () => {
    setParams({
      bass: 0,
      treble: 0,
      compression: 0,
      normalize: 0,
      lowpass: 0,
      highpass: 0,
    })
    onReset()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Manual Controls</h3>
        <div className="flex items-center gap-2">
          <Label htmlFor="live-preview" className="text-sm">
            Live Preview
          </Label>
          <Switch
            id="live-preview"
            checked={livePreview}
            onCheckedChange={setLivePreview}
            disabled={isProcessing}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="bass">Bass ({params.bass}dB)</Label>
            </div>
            <Slider
              id="bass"
              min={-15}
              max={15}
              step={1}
              value={[params.bass || 0]}
              onValueChange={([value]) => handleParamChange("bass", value)}
              disabled={isProcessing}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="treble">Treble ({params.treble}dB)</Label>
            </div>
            <Slider
              id="treble"
              min={-15}
              max={15}
              step={1}
              value={[params.treble || 0]}
              onValueChange={([value]) => handleParamChange("treble", value)}
              disabled={isProcessing}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="compression">
                Compression ({params.compression})
              </Label>
            </div>
            <Slider
              id="compression"
              min={0}
              max={10}
              step={1}
              value={[params.compression || 0]}
              onValueChange={([value]) =>
                handleParamChange("compression", value)
              }
              disabled={isProcessing}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="normalize">Normalize ({params.normalize})</Label>
            </div>
            <Slider
              id="normalize"
              min={0}
              max={10}
              step={1}
              value={[params.normalize || 0]}
              onValueChange={([value]) => handleParamChange("normalize", value)}
              disabled={isProcessing}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="lowpass">
                Low Pass ({params.lowpass ? params.lowpass + "Hz" : "Off"})
              </Label>
            </div>
            <Slider
              id="lowpass"
              min={0}
              max={20000}
              step={100}
              value={[params.lowpass || 0]}
              onValueChange={([value]) => handleParamChange("lowpass", value)}
              disabled={isProcessing}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="highpass">
                High Pass ({params.highpass ? params.highpass + "Hz" : "Off"})
              </Label>
            </div>
            <Slider
              id="highpass"
              min={0}
              max={20000}
              step={100}
              value={[params.highpass || 0]}
              onValueChange={([value]) => handleParamChange("highpass", value)}
              disabled={isProcessing}
            />
          </div>
        </div>
      </div>

      <Separator className="my-2" />

      <div className="flex flex-wrap gap-2 justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          disabled={isProcessing}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Reset Controls
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={onResetToOriginal}
          disabled={isProcessing}
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset to Original
        </Button>

        {!livePreview && (
          <Button size="sm" onClick={applyChanges} disabled={isProcessing}>
            Apply Changes
          </Button>
        )}

        <Button size="sm" onClick={onApply} disabled={isProcessing}>
          Save to History
        </Button>
      </div>
    </div>
  )
}

export default ManualControls
