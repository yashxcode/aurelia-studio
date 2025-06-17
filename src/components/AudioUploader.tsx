
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

interface AudioUploaderProps {
  onAudioLoad: (audioBuffer: AudioBuffer, audioFile: File) => void;
}

const AudioUploader = ({ onAudioLoad }: AudioUploaderProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleClick = () => {
    inputRef.current?.click();
  };

  const extractAudioFromVideo = async (videoFile: File): Promise<AudioBuffer> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      video.src = URL.createObjectURL(videoFile);
      video.load();
      
      video.onloadedmetadata = () => {
        const duration = video.duration;
        const offlineContext = new OfflineAudioContext(2, duration * 48000, 48000);
        
        // We need to use the regular AudioContext first to connect the media element
        const source = audioContext.createMediaElementSource(video);
        const streamDestination = audioContext.createMediaStreamDestination();
        source.connect(streamDestination);
        
        // Then use the MediaStream to create an audio context and record it
        const mediaRecorder = new MediaRecorder(streamDestination.stream);
        const chunks: BlobPart[] = [];
        
        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
        mediaRecorder.onstop = async () => {
          const blob = new Blob(chunks, { type: 'audio/webm' });
          const arrayBuffer = await blob.arrayBuffer();
          
          try {
            const renderedBuffer = await audioContext.decodeAudioData(arrayBuffer);
            URL.revokeObjectURL(video.src);
            resolve(renderedBuffer);
          } catch (error) {
            reject(error);
          }
        };
        
        mediaRecorder.start();
        video.play();
        
        // Stop recording at the end of the video
        video.onended = () => {
          mediaRecorder.stop();
          video.pause();
        };
      };
      
      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        reject(new Error("Error loading video file"));
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      // Check if file is an audio or video file
      if (!file.type.startsWith("audio/") && !file.type.startsWith("video/")) {
        throw new Error("Please upload an audio or video file");
      }

      let audioBuffer: AudioBuffer;

      if (file.type.startsWith("video/")) {
        // Handle video file
        audioBuffer = await extractAudioFromVideo(file);
      } else {
        // Handle audio file
        const arrayBuffer = await file.arrayBuffer();
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      }
      
      // Call the callback with the decoded audio data
      onAudioLoad(audioBuffer, file);
    } catch (err) {
      console.error("Error loading file:", err);
      setError(err instanceof Error ? err.message : "Failed to load file");
    } finally {
      setIsLoading(false);
      // Reset the input value to allow the same file to be uploaded again
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  return (
    <div className="w-full">
      <input
        type="file"
        ref={inputRef}
        onChange={handleFileChange}
        accept="audio/*,video/*"
        className="hidden"
      />
      <Button 
        onClick={handleClick} 
        variant="outline" 
        className="w-full flex gap-2 items-center h-24 border-dashed"
        disabled={isLoading}
      >
        <Upload className="w-5 h-5 mr-1" />
        {isLoading ? "Loading..." : "Upload Audio or Video File"}
      </Button>
      {error && <p className="text-destructive text-sm mt-2">{error}</p>}
    </div>
  );
};

export default AudioUploader;
