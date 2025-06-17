
import { useEffect } from "react";

interface KeyboardShortcutsProps {
  onPlayPause: () => void;
  onRestart: () => void;
  onDownload: () => void;
  isAudioLoaded: boolean;
}

const KeyboardShortcuts = ({ 
  onPlayPause, 
  onRestart, 
  onDownload, 
  isAudioLoaded 
}: KeyboardShortcutsProps) => {
  useEffect(() => {
    if (!isAudioLoaded) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore keystrokes if user is typing in an input
      if (e.target instanceof HTMLInputElement || 
          e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      switch(e.key) {
        case " ": // Space
          e.preventDefault();
          onPlayPause();
          break;
        case "r":
          e.preventDefault();
          onRestart();
          break;
        case "d":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            onDownload();
          }
          break;
        default:
          break;
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAudioLoaded, onPlayPause, onRestart, onDownload]);
  
  // This component doesn't render anything
  return null;
};

export default KeyboardShortcuts;
