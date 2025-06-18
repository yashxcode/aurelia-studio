import React, { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipBack, Volume2, VolumeX } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { formatTime } from "@/lib/utils";

interface AudioPlayerProps {
  audioBuffer: AudioBuffer | null;
  processedAudioBuffer: AudioBuffer | null;
  onTimeUpdate: (time: number) => void;
  onPlayStateChange: (isPlaying: boolean) => void;
}

const AudioPlayer = React.forwardRef<unknown, AudioPlayerProps>(
  ({ audioBuffer, processedAudioBuffer, onTimeUpdate, onPlayStateChange }, ref) => {
    const { toast } = useToast();

    // Playback state
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [duration, setDuration] = useState(0);

    // Slider and time state
    const [sliderValue, setSliderValue] = useState(0); // What the slider shows
    const [currentTime, setCurrentTime] = useState(0); // Actual playback time
    const [userIsDragging, setUserIsDragging] = useState(false);

    // Audio context and nodes
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);

    // Playback tracking
    const playbackStartTimeRef = useRef<number>(0);
    const playbackOffsetRef = useRef<number>(0);
    const previousVolumeRef = useRef<number>(0.8);

    // Stop playback and cleanup
    const stopPlayback = useCallback(() => {
      if (sourceNodeRef.current) {
        try {
          sourceNodeRef.current.stop();
          sourceNodeRef.current.disconnect();
        } catch {}
        sourceNodeRef.current = null;
      }
    }, []);

    // --- Add refs for latest state ---
    const isPlayingRef = useRef(isPlaying);
    const userIsDraggingRef = useRef(userIsDragging);
    const durationRef = useRef(duration);

    useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
    useEffect(() => { userIsDraggingRef.current = userIsDragging; }, [userIsDragging]);
    useEffect(() => { durationRef.current = duration; }, [duration]);

    // Initialize audio context and gain node
    useEffect(() => {
      if (!audioContextRef.current) {
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          audioContextRef.current = new AudioContextClass();
          gainNodeRef.current = audioContextRef.current.createGain();
          gainNodeRef.current.connect(audioContextRef.current.destination);
          gainNodeRef.current.gain.value = 0.8;
        } catch (error) {
          toast({
            title: "Audio Error",
            description: "Could not initialize audio system",
            variant: "destructive",
          });
        }
      }
      return () => {
        if (sourceNodeRef.current) {
          try {
            sourceNodeRef.current.stop();
            sourceNodeRef.current.disconnect();
          } catch {}
        }
        if (audioContextRef.current) audioContextRef.current.close();
      };
    }, [toast]);

    // Update duration when buffer changes
    useEffect(() => {
      const buffer = processedAudioBuffer || audioBuffer;
      if (buffer) {
        setDuration(buffer.duration);
        setSliderValue(0);
        setCurrentTime(0);
        playbackOffsetRef.current = 0;
      } else {
        setDuration(0);
        setSliderValue(0);
        setCurrentTime(0);
        playbackOffsetRef.current = 0;
      }
    }, [audioBuffer, processedAudioBuffer]);

    // Handle mute/unmute
    useEffect(() => {
      if (!gainNodeRef.current) return;
      if (isMuted) {
        if (gainNodeRef.current.gain.value > 0) {
          previousVolumeRef.current = gainNodeRef.current.gain.value;
        }
        gainNodeRef.current.gain.value = 0;
      } else {
        const restoreVolume = previousVolumeRef.current > 0 ? previousVolumeRef.current : 0.8;
        if (audioContextRef.current) {
          const now = audioContextRef.current.currentTime;
          gainNodeRef.current.gain.cancelScheduledValues(now);
          gainNodeRef.current.gain.setValueAtTime(restoreVolume, now);
        } else {
          gainNodeRef.current.gain.value = restoreVolume;
        }
      }
    }, [isMuted]);

    // --- Animation loop for playback time ---
    useEffect(() => {
      if (!isPlaying) return;
      let frameId: number;

      const tick = () => {
        if (!audioContextRef.current) return;
        const elapsed = audioContextRef.current.currentTime - playbackStartTimeRef.current + playbackOffsetRef.current;
        setCurrentTime(elapsed);
        if (!userIsDraggingRef.current) setSliderValue(elapsed);
        onTimeUpdate(elapsed);

        if (elapsed >= durationRef.current) {
          // End of playback
          stopPlayback();
          setCurrentTime(0);
          setSliderValue(0);
          playbackOffsetRef.current = 0;
          setIsPlaying(false);
          onPlayStateChange(false);
          onTimeUpdate(0);
          return;
        }
        frameId = requestAnimationFrame(tick);
      };

      frameId = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(frameId);
       
    }, [isPlaying, onTimeUpdate, onPlayStateChange, stopPlayback]);

    // Start playback from a position
    const play = useCallback(
      async (startPosition = 0) => {
        if (!audioContextRef.current || !gainNodeRef.current) return;
        const buffer = processedAudioBuffer || audioBuffer;
        if (!buffer) return;
        try {
          if (audioContextRef.current.state === "suspended") {
            await audioContextRef.current.resume();
          }
          stopPlayback();
          sourceNodeRef.current = audioContextRef.current.createBufferSource();
          sourceNodeRef.current.buffer = buffer;
          sourceNodeRef.current.connect(gainNodeRef.current);
          const safePosition = Math.max(0, Math.min(startPosition, buffer.duration));
          playbackStartTimeRef.current = audioContextRef.current.currentTime;
          playbackOffsetRef.current = safePosition;
          sourceNodeRef.current.start(0, safePosition);
          sourceNodeRef.current.onended = () => {
            stopPlayback();
            setIsPlaying(false);
            setCurrentTime(0);
            setSliderValue(0);
            playbackOffsetRef.current = 0;
            onTimeUpdate(0);
            onPlayStateChange(false);
          };
          setIsPlaying(true);
          onPlayStateChange(true);
        } catch (error) {
          setIsPlaying(false);
          onPlayStateChange(false);
          toast({
            title: "Playback Error",
            description: "An error occurred during playback",
            variant: "destructive",
          });
        }
      },
      [audioBuffer, processedAudioBuffer, onPlayStateChange, onTimeUpdate, stopPlayback, toast]
    );

    // Toggle play/pause
    const togglePlayPause = useCallback(() => {
      if (!audioContextRef.current) {
        toast({
          title: "Audio Error",
          description: "Audio system not initialized",
          variant: "destructive",
        });
        return;
      }
      if (isPlaying) {
        // Pause: store current position
        const currentPosition =
          audioContextRef.current.currentTime - playbackStartTimeRef.current + playbackOffsetRef.current;
        playbackOffsetRef.current = Math.max(0, Math.min(currentPosition, duration));
        stopPlayback();
        setIsPlaying(false);
        onPlayStateChange(false);
      } else {
        // Play from current offset
        play(playbackOffsetRef.current);
      }
    }, [duration, isPlaying, onPlayStateChange, play, stopPlayback, toast]);

    // Restart playback from beginning
    const handleRestart = useCallback(() => {
      stopPlayback();
      setCurrentTime(0);
      setSliderValue(0);
      playbackOffsetRef.current = 0;
      onTimeUpdate(0);
      if (isPlaying) play(0);
    }, [isPlaying, onTimeUpdate, play, stopPlayback]);

    // Handle seek (slider commit)
    const handleSeek = useCallback(
      (position: number) => {
        playbackOffsetRef.current = position;
        setCurrentTime(position);
        setSliderValue(position);
        onTimeUpdate(position);
        if (isPlaying) {
          stopPlayback();
          play(position);
        }
      },
      [isPlaying, onTimeUpdate, play, stopPlayback]
    );

    // Toggle mute
    const toggleMute = useCallback(() => {
      setIsMuted((prev) => !prev);
    }, []);

    // Early return if no audio
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
            {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={toggleMute}
            disabled={!audioBuffer && !processedAudioBuffer}
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
        </div>
        <div className="flex gap-4 items-center">
          <span className="text-xs">{formatTime(sliderValue)}</span>
          <Slider
            value={[sliderValue]}
            min={0}
            max={duration || 1}
            step={0.01}
            onValueChange={(values) => {
              setUserIsDragging(true);
              setSliderValue(values[0]);
            }}
            onValueCommit={(values) => {
              setUserIsDragging(false);
              handleSeek(values[0]);
            }}
            disabled={!audioBuffer && !processedAudioBuffer}
            className="flex-grow"
            aria-label="Audio position"
          />
          <span className="text-xs">{formatTime(duration)}</span>
        </div>
      </div>
    );
  }
);

AudioPlayer.displayName = "AudioPlayer";
export default AudioPlayer;
