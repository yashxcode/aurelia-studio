import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface VideoPlayerProps {
  videoFile: File;
  isPlaying: boolean;
  currentTime: number;
  onTimeUpdate?: (time: number) => void;
}

const VideoPlayer = ({ videoFile, isPlaying, currentTime, onTimeUpdate }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  
  // Create object URL for video file
  useEffect(() => {
    const url = URL.createObjectURL(videoFile);
    setVideoUrl(url);
    
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [videoFile]);
  
  // Control video playback based on isPlaying prop
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || !videoUrl) return;
    
    const playPromise = isPlaying ? videoElement.play() : Promise.resolve();
    
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.error("Error playing video:", error);
        // If autoplay was prevented, show a message to the user
        if (error.name === "NotAllowedError") {
          console.log("Autoplay prevented. User interaction required.");
        }
      });
    }
  }, [isPlaying, videoUrl]);
  
  // Sync video time with audio player
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || !videoUrl) return;
    
    // Always update the video time to match the current time from audio player
    if (Math.abs(videoElement.currentTime - currentTime) > 0.05) {
      videoElement.currentTime = currentTime;
    }
    
    // If paused but should be playing, or playing but should be paused
    if (!isPlaying && !videoElement.paused) {
      videoElement.pause();
    } else if (isPlaying && videoElement.paused) {
      videoElement.play().catch(err => console.error("Error playing video:", err));
    }
  }, [currentTime, isPlaying, videoUrl]);
  
  if (!videoUrl) return null;
  
  return (
    <Card className="mb-4">
      <CardContent className="p-4 relative">
        {(isLoading || isBuffering) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-md z-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        <video 
          ref={videoRef}
          className="w-full rounded-md"
          src={videoUrl}
          preload="metadata"
          muted
          playsInline
          onLoadedData={() => setIsLoading(false)}
          onWaiting={() => setIsBuffering(true)}
          onPlaying={() => setIsBuffering(false)}
          onTimeUpdate={() => {
            if (videoRef.current && onTimeUpdate) {
              // Add this line to make sure we're updating the parent component
              const currentVideoTime = videoRef.current.currentTime;
              onTimeUpdate(currentVideoTime);
            }
          }}
          style={{ 
            maxHeight: "400px", 
            objectFit: "contain",
            backgroundColor: "#000" // Add black background for better visual
          }}
        />
      </CardContent>
    </Card>
  );
};

export default VideoPlayer;
