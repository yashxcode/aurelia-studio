import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipBack, Volume2, VolumeX, Trash2 } from "lucide-react";
import { formatTime } from "@/lib/utils";

interface SimpleAudioPlayerProps {
  audioBuffer: AudioBuffer | null;
  processedAudioBuffer: AudioBuffer | null;
  onTimeUpdate: (time: number) => void;
  onPlayStateChange: (isPlaying: boolean) => void;
  onDelete?: () => void;
}

const SimpleAudioPlayer = ({
  audioBuffer,
  processedAudioBuffer,
  onTimeUpdate,
  onPlayStateChange,
  onDelete,
}: SimpleAudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);

  // Initialize audio context and setup
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.connect(audioContextRef.current.destination);
    }

    if (!sourceNodeRef.current && audioRef.current) {
      sourceNodeRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
      sourceNodeRef.current.connect(gainNodeRef.current);
    }

    // Set up timeupdate event listener for more accurate updates
    const handleTimeUpdate = () => {
      if (audioRef.current && !isDragging) {
        const newTime = audioRef.current.currentTime;
        setCurrentTime(newTime);
        onTimeUpdate(newTime);
      }
    };

    // Set up ended event listener
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      onTimeUpdate(0);
      onPlayStateChange(false);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };

    audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
    audioRef.current.addEventListener('ended', handleEnded);

    // Start animation frame loop for smoother updates
    const updateProgress = () => {
      if (audioRef.current && isPlaying && !isDragging) {
        const now = performance.now();
        // Update at least every 16ms (60fps) or when significant time has passed
        if (now - lastUpdateTimeRef.current >= 16) {
          const newTime = audioRef.current.currentTime;
          setCurrentTime(newTime);
          onTimeUpdate(newTime);
          lastUpdateTimeRef.current = now;
        }
      }
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    };

    animationFrameRef.current = requestAnimationFrame(updateProgress);

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        audioRef.current.removeEventListener('ended', handleEnded);
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [onTimeUpdate, onPlayStateChange, isPlaying, isDragging]);

  // Update audio source when buffer changes
  useEffect(() => {
    const buffer = processedAudioBuffer || audioBuffer;
    if (!buffer || !audioRef.current) return;

    const blob = new Blob([buffer], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    
    // Pause current playback
    audioRef.current.pause();
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Set new source
    audioRef.current.src = url;
    setDuration(buffer.duration);
    setCurrentTime(0);
    onTimeUpdate(0);

    // If was playing, start new audio
    if (isPlaying) {
      audioRef.current.play();
    }

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [audioBuffer, processedAudioBuffer, isPlaying, onTimeUpdate]);

  // Update volume
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const togglePlayPause = async () => {
    if (!audioRef.current || !audioContextRef.current) return;

    try {
      if (audioContextRef.current.state === "suspended") {
        await audioContextRef.current.resume();
      }

      if (isPlaying) {
        audioRef.current.pause();
      } else {
        await audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
      onPlayStateChange(!isPlaying);
    } catch (error) {
      console.error("Error toggling playback:", error);
    }
  };

  const handleRestart = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    setCurrentTime(0);
    onTimeUpdate(0);
  };

  const handleSeek = (value: number[]) => {
    if (!audioRef.current) return;
    const newTime = value[0];
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    onTimeUpdate(newTime);
  };

  const handleSeekStart = () => {
    setIsDragging(true);
  };

  const handleSeekEnd = () => {
    setIsDragging(false);
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
  };

  if (!audioBuffer && !processedAudioBuffer) return null;

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={handleRestart}
          disabled={!audioBuffer && !processedAudioBuffer}
          aria-label="Restart"
        >
          <SkipBack className="h-4 w-4" />
        </Button>
        
        <Button
          variant="default"
          size="icon"
          onClick={togglePlayPause}
          disabled={!audioBuffer && !processedAudioBuffer}
          className="w-12 h-12 rounded-full bg-sonic-purple hover:bg-sonic-purple-dark"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="h-6 w-6" />
          ) : (
            <Play className="h-6 w-6 ml-1" />
          )}
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMuted(!isMuted)}
          disabled={!audioBuffer && !processedAudioBuffer}
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? (
            <VolumeX className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </Button>

        {onDelete && (
          <Button
            variant="destructive"
            size="icon"
            onClick={onDelete}
            className="ml-auto"
            aria-label="Delete audio"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <div className="flex gap-4 items-center">
        <span className="text-xs">{formatTime(currentTime)}</span>
        <Slider
          value={[currentTime]}
          min={0}
          max={duration || 1}
          step={0.01}
          onValueChange={handleSeek}
          onValueChangeStart={handleSeekStart}
          onValueChangeEnd={handleSeekEnd}
          disabled={!audioBuffer && !processedAudioBuffer}
          className="flex-grow"
        />
        <span className="text-xs">{formatTime(duration)}</span>
      </div>
      
      <div className="flex gap-4 items-center">
        <VolumeX className="h-3 w-3 text-muted-foreground" />
        <Slider
          value={[volume]}
          min={0}
          max={1}
          step={0.01}
          onValueChange={handleVolumeChange}
          disabled={!audioBuffer && !processedAudioBuffer}
          className="flex-grow"
        />
        <Volume2 className="h-3 w-3 text-muted-foreground" />
      </div>
    </div>
  );
};

export default SimpleAudioPlayer; 