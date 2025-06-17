import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Download, Trash2 } from "lucide-react";
import AudioPlayer from "@/components/AudioPlayer";
import AudioWaveform from "@/components/AudioWaveform";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { exportAudio } from "@/utils/audioProcessing";
import { formatDistanceToNow } from "date-fns";
import SimpleAudioPlayer from "@/components/SimpleAudioPlayer";

interface AudioItem {
  id: string;
  original_file_name: string;
  preset_used: string;
  created_at: string;
  enhanced_file_path: string;
  original_file_path: string;
  audioBuffer?: AudioBuffer;
  enhancedBuffer?: AudioBuffer;
}

const Dashboard = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [audioList, setAudioList] = useState<AudioItem[]>([]);
  const [selectedAudio, setSelectedAudio] = useState<AudioItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState("enhanced");
  
  // const playerRef = useRef<{ togglePlayPause: () => void; handleRestart: () => void } | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  const [audioFiles, setAudioFiles] = useState<Array<{
    id: string;
    name: string;
    buffer: AudioBuffer;
    processedBuffer?: AudioBuffer;
  }>>([]);
  
  // Initialize audio context
  useEffect(() => {
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || 
          (window as any).webkitAudioContext)();
      } catch (error) {
        console.error("Failed to create audio context:", error);
      }
    }
    
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(e => {
          console.log("Error closing audio context:", e);
        });
      }
    };
  }, []);
  
  // Fetch user's audio files
  useEffect(() => {
    const fetchAudioFiles = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('audio_enhancements')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        setAudioList(data || []);
      } catch (error) {
        console.error("Error fetching audio files:", error);
        toast({
          title: "Error",
          description: "Failed to load your audio files",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAudioFiles();
  }, [user, toast]);
  
  // Load audio buffer when selected audio changes
  useEffect(() => {
    const loadAudioBuffer = async () => {
      if (!selectedAudio || !audioContextRef.current) return;
      
      // Skip if already loaded
      if (selectedAudio.audioBuffer && selectedAudio.enhancedBuffer) return;
      
      try {
        // Load enhanced audio
        const { data: enhancedData, error: enhancedError } = await supabase.storage
          .from('audio')
          .download(selectedAudio.enhanced_file_path);
        
        if (enhancedError) throw enhancedError;
        
        // Load original audio
        const { data: originalData, error: originalError } = await supabase.storage
          .from('audio')
          .download(selectedAudio.original_file_path);
        
        if (originalError) throw originalError;
        
        // Decode audio data
        const enhancedArrayBuffer = await enhancedData.arrayBuffer();
        const originalArrayBuffer = await originalData.arrayBuffer();
        
        const enhancedBuffer = await audioContextRef.current.decodeAudioData(enhancedArrayBuffer);
        const originalBuffer = await audioContextRef.current.decodeAudioData(originalArrayBuffer);
        
        // Update selected audio with buffers
        setSelectedAudio(prev => {
          if (!prev) return null;
          return {
            ...prev,
            audioBuffer: originalBuffer,
            enhancedBuffer: enhancedBuffer
          };
        });
        
        toast({
          title: "Audio loaded",
          description: "Ready to play"
        });
      } catch (error) {
        console.error("Error loading audio:", error);
        toast({
          title: "Error",
          description: "Failed to load audio file",
          variant: "destructive"
        });
      }
    };
    
    loadAudioBuffer();
  }, [selectedAudio, toast]);
  
  const handleSelectAudio = (audio: AudioItem) => {
    if (isPlaying) {
      setIsPlaying(false);
    }
    setCurrentTime(0);
    setSelectedAudio(audio);
  };
  
  const handleDeleteAudio = (id: string) => {
    setAudioFiles(prev => prev.filter(file => file.id !== id));
  };
  
  const handleDownload = useCallback(async () => {
    if (!selectedAudio || !selectedAudio.enhancedBuffer) return;
    
    setIsDownloading(true);
    
    try {
      const filename = `${selectedAudio.original_file_name}-${selectedAudio.preset_used}`;
      await exportAudio(selectedAudio.enhancedBuffer, filename, 'wav');
      
      toast({
        title: "Download complete",
        description: `Saved as ${filename}.wav`
      });
    } catch (error) {
      console.error("Error downloading audio:", error);
      toast({
        title: "Download failed",
        description: "Could not download the audio file",
        variant: "destructive"
      });
    } finally {
      setIsDownloading(false);
    }
  }, [selectedAudio, toast]);
  
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (e) {
      return "Unknown date";
    }
  };
  
  const formatPresetName = (preset: string) => {
    return preset
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="container mx-auto py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-sonic-purple to-sonic-purple-light bg-clip-text text-transparent">
              Your Audio Library
            </h1>
            <p className="text-muted-foreground">
              Manage and play your enhanced audio files
            </p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <Button onClick={() => navigate('/legacy')} variant="outline">
              Go to Studio
            </Button>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto flex-1 py-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
          <div className="lg:col-span-5 space-y-6">
            <Card className="min-h-[300px]">
              <CardContent className="p-6">
                {selectedAudio ? (
                  <>
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h2 className="text-xl font-semibold">
                          {selectedAudio.original_file_name}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          Enhanced with {formatPresetName(selectedAudio.preset_used)} preset
                        </p>
                      </div>
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteAudio(selectedAudio?.id || '')}
                        className="text-destructive hover:bg-destructive/10"
                        disabled={!selectedAudio}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Audio
                      </Button>
                    </div>
                    
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                      <TabsList className="mb-4">
                        <TabsTrigger value="enhanced">Enhanced Audio</TabsTrigger>
                        <TabsTrigger value="original">Original Audio</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="enhanced" className="space-y-4">
                        <AudioWaveform 
                          audioBuffer={selectedAudio.enhancedBuffer} 
                          isPlaying={isPlaying && activeTab === "enhanced"}
                          currentTime={currentTime}
                        />
                      </TabsContent>
                      
                      <TabsContent value="original" className="space-y-4">
                        <AudioWaveform 
                          audioBuffer={selectedAudio.audioBuffer} 
                          isPlaying={isPlaying && activeTab === "original"}
                          currentTime={currentTime}
                        />
                      </TabsContent>
                    </Tabs>
                    
                    <div className="mt-6">
                      <AudioPlayer 
                        audioBuffer={selectedAudio?.audioBuffer || null}
                        processedAudioBuffer={selectedAudio?.enhancedBuffer || null}
                        onTimeUpdate={setCurrentTime}
                        onPlayStateChange={setIsPlaying}
                      />
                    </div>
                  </>
                ) : (
                  <div className="h-[300px] flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-muted-foreground">
                        {isLoading ? "Loading your audio files..." : "Select an audio file to play"}
                      </p>
                      {isLoading && <Loader2 className="h-8 w-8 animate-spin mx-auto mt-4" />}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Your Audio Files</h3>
                  {selectedAudio && (
                    <Button 
                      onClick={handleDownload} 
                      disabled={isDownloading || !selectedAudio?.enhancedBuffer}
                      size="sm"
                      variant="outline"
                    >
                      {isDownloading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Downloading...
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </>
                      )}
                    </Button>
                  )}
                </div>
                
                <Separator />
                
                {isLoading ? (
                  <div className="py-8 flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : audioList.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-muted-foreground">No audio files yet</p>
                    <Button 
                      onClick={() => navigate('/legacy')} 
                      variant="link" 
                      className="mt-2"
                    >
                      Go to Studio to create some
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                    {audioList.map((audio) => (
                      <div 
                        key={audio.id}
                        className={`p-3 rounded-md cursor-pointer transition-colors ${
                          selectedAudio?.id === audio.id 
                            ? 'bg-primary/10 border border-primary/20' 
                            : 'hover:bg-secondary'
                        }`}
                        onClick={() => handleSelectAudio(audio)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium truncate max-w-[180px]">
                              {audio.original_file_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatPresetName(audio.preset_used)}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(audio.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-semibold">About Your Library</h3>
                <p className="text-sm text-muted-foreground">
                  This is your personal audio library where all your enhanced audio files are stored.
                  You can play, compare, and download your processed audio anytime.
                </p>
                <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                  <li>Select any file to play it</li>
                  <li>Compare original and enhanced versions</li>
                  <li>Download processed files for use in other applications</li>
                  <li>Manage your audio library</li>
                </ul>
                <Separator />
                <Button 
                  onClick={() => navigate('/legacy')} 
                  variant="default" 
                  className="w-full"
                >
                  Process New Audio
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {audioFiles.map((file) => (
            <div key={file.id} className="bg-card rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold truncate">{file.name}</h3>
              </div>
              <SimpleAudioPlayer
                audioBuffer={file.buffer}
                processedAudioBuffer={file.processedBuffer}
                onTimeUpdate={(time) => {
                  // Handle time update if needed
                }}
                onPlayStateChange={(isPlaying) => {
                  // Handle play state change if needed
                }}
                onDelete={() => handleDeleteAudio(file.id)}
              />
            </div>
          ))}
        </div>
      </main>
      
      <footer className="border-t bg-card">
        <div className="container mx-auto py-4 px-6 text-center text-sm text-muted-foreground">
          <p>Aurelia - Your personal audio enhancement library</p>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
