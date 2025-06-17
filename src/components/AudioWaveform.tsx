import { useEffect, useRef } from "react";

interface AudioWaveformProps {
  audioBuffer: AudioBuffer | null;
  isPlaying: boolean;
  currentTime: number;
}

const AudioWaveform = ({ audioBuffer }: AudioWaveformProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Draw waveform on canvas
  useEffect(() => {
    if (!audioBuffer || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Get dimensions
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Get channel data (use left channel if stereo)
    const channelData = audioBuffer.getChannelData(0);
    
    // Calculate how many samples to skip to fit the entire audio in the canvas
    const step = Math.ceil(channelData.length / width);
    
    // Draw the waveform
    ctx.lineWidth = 2;
    
    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#9b87f5");  // Top color (our sonic-purple)
    gradient.addColorStop(1, "#6E59A5");  // Bottom color (darker purple)
    ctx.strokeStyle = gradient;
    
    ctx.beginPath();
    
    // Start at mid-height
    ctx.moveTo(0, height / 2);
    
    // Draw the waveform
    for (let i = 0; i < width; i++) {
      const index = Math.floor(i * step);
      // Get sample value (-1 to 1)
      const value = channelData[index];
      // Calculate y position (0 = mid-height, positive = up, negative = down)
      const y = (0.5 + value * 0.5) * height;
      ctx.lineTo(i, y);
    }
    
    ctx.stroke();
    // No vertical bar or progress overlay
  }, [audioBuffer]);
  
  return (
    <div className="waveform-container w-full h-40 relative">
      <canvas
        ref={canvasRef}
        width={800}
        height={160}
        className="w-full h-full"
      />
      {!audioBuffer && (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          Upload an audio file to see waveform
        </div>
      )}
    </div>
  );
};

export default AudioWaveform;
