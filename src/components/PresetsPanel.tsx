import { useState } from "react"
import { Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Volume2,
  Music,
  Radio,
  Volume1,
  Waves,
  Disc,
  Phone,
  Mic,
  BarChart,
  Maximize,
} from "lucide-react"

interface PresetsPanelProps {
  onPresetSelect: (preset: string) => void
  activePreset: string | null
  isProcessing: boolean
}

const presets = [
  {
    id: "bass-boost",
    name: "Bass Boost",
    description: "Enhances low frequencies",
    icon: Volume2,
  },
  {
    id: "studio-sound",
    name: "Studio Sound",
    description: "Professional clarity",
    icon: Music,
  },
  {
    id: "podcast-voice",
    name: "Podcast Voice",
    description: "Clear vocals",
    icon: Radio,
  },
  {
    id: "asmr",
    name: "ASMR Mode",
    description: "Enhanced detail",
    icon: Volume1,
  },
  {
    id: "noise-reduction",
    name: "Noise Reduction",
    description: "Reduces background noise",
    icon: Waves,
  },
  {
    id: "radio-voice",
    name: "Radio Voice",
    description: "Deep radio broadcasting tone",
    icon: Mic,
  },
  {
    id: "vinyl-effect",
    name: "Vintage Vinyl",
    description: "Warm analog sound",
    icon: Disc,
  },
  {
    id: "phone-call",
    name: "Phone Call",
    description: "Telephone audio quality",
    icon: Phone,
  },
  {
    id: "normalize",
    name: "Normalize",
    description: "Balanced audio levels",
    icon: BarChart,
  },
  {
    id: "compression",
    name: "Compression",
    description: "Reduce dynamic range",
    icon: Maximize,
  },
]

const PresetsPanel = ({
  onPresetSelect,
  activePreset,
  isProcessing,
}: PresetsPanelProps) => {
  const handlePresetClick = (presetId: string) => {
    if (!isProcessing) {
      onPresetSelect(presetId)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Enhancement Presets</h3>
        {isProcessing && (
          <Badge variant="outline" className="animate-pulse">
            Processing...
          </Badge>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {presets.map((preset) => (
          <button
            key={preset.id}
            className={`preset-button flex flex-col items-center justify-center p-4 rounded-lg border transition-all ${
              activePreset === preset.id
                ? "border-sonic-purple bg-sonic-purple bg-opacity-10"
                : "border-border hover:border-sonic-purple/50 hover:bg-sonic-purple/5"
            }`}
            onClick={() => handlePresetClick(preset.id)}
            disabled={isProcessing}
          >
            <div className="relative">
              <preset.icon className="h-8 w-8 mb-2 text-sonic-purple" />
              {activePreset === preset.id && (
                <div className="absolute -top-2 -right-2 bg-sonic-purple text-white rounded-full p-1">
                  <Check className="h-3 w-3" />
                </div>
              )}
            </div>
            <span className="font-medium text-sm">{preset.name}</span>
            <span className="text-xs text-muted-foreground">
              {preset.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default PresetsPanel
