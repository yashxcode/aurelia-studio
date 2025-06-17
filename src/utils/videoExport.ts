// Using Web APIs instead of FFmpeg for video export
// This approach uses the browser's built-in MediaRecorder API

export const exportVideoWithAudio = async (
  videoFile: File,
  audioBuffer: AudioBuffer,
  fileName: string
): Promise<string> => {
  try {
    console.log("Beginning video export process...");
    
    // Step 1: Create an audio element from the audio buffer
    const audioUrl = await createAudioFromAudioBuffer(audioBuffer);
    const audioElement = new Audio(audioUrl);
    audioElement.crossOrigin = "anonymous"; // Help with CORS issues
    audioElement.preload = "auto"; // Make sure audio is fully loaded
    
    // Ensure the browser allows audio playback
    try {
      // Create and start a temporary audio context to unblock audio
      const tempContext = new AudioContext();
      await tempContext.resume();
      const source = tempContext.createOscillator();
      source.connect(tempContext.destination);
      source.start(0);
      source.stop(0.001);
    } catch (e) {
      console.warn("Could not pre-initialize audio context:", e);
    }
    
    // Step 2: Create a video element from the video file
    const videoUrl = URL.createObjectURL(videoFile);
    const videoElement = document.createElement('video');
    videoElement.src = videoUrl;
    videoElement.controls = false; // No need for controls
    videoElement.crossOrigin = "anonymous"; // Helps with CORS issues
    videoElement.muted = true; // Ensure video is initially muted (we'll use our processed audio)
    
    // Step 3: Wait for the video to be loaded to get its dimensions
    await new Promise<void>((resolve) => {
      videoElement.onloadedmetadata = () => resolve();
      videoElement.load();
    });
    
    // Create an offscreen canvas
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error("Could not create canvas context");
    }
    
    // Step 4: Set up MediaRecorder and canvas to record the combined output
    const stream = canvas.captureStream(30); // 30fps
    
    // Create a new audio context and connect the audio element
    const audioContext = new AudioContext();
    const audioSource = audioContext.createMediaElementSource(audioElement);
    
    // Connect the audio to the stream
    const audioDestination = audioContext.createMediaStreamDestination();
    audioSource.connect(audioContext.destination); // Connect to speakers so we can monitor during recording
    audioSource.connect(audioDestination);
    
    // Add audio tracks to the stream
    audioDestination.stream.getAudioTracks().forEach(track => {
      stream.addTrack(track);
    });
    
    // Configure MediaRecorder with high-quality settings
    const options = { 
      mimeType: 'video/webm;codecs=vp9,opus',
      videoBitsPerSecond: 5000000 // 5 Mbps for good quality
    };
    
    // Fall back to other codecs if vp9 is not supported
    let mediaRecorder: MediaRecorder;
    if (MediaRecorder.isTypeSupported(options.mimeType)) {
      mediaRecorder = new MediaRecorder(stream, options);
    } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
      mediaRecorder = new MediaRecorder(stream, { 
        mimeType: 'video/webm;codecs=vp8,opus',
        videoBitsPerSecond: 5000000
      });
    } else if (MediaRecorder.isTypeSupported('video/webm')) {
      mediaRecorder = new MediaRecorder(stream, { 
        mimeType: 'video/webm',
        videoBitsPerSecond: 5000000
      });
    } else {
      mediaRecorder = new MediaRecorder(stream);
    }
    
    // Collect chunks of recorded data
    const chunks: Blob[] = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };
    
    // Create promise to wait for recording to finish
    const recordingPromise = new Promise<Blob>((resolve) => {
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: mediaRecorder.mimeType });
        resolve(blob);
      };
    });
    
    // Step 5: Start recording and playing both video and audio
    mediaRecorder.start(100); // Request data every 100ms for smaller chunks
    
    // Make sure audio is actually audible
    audioElement.volume = 1.0;
    videoElement.volume = 0; // Mute original video audio
    videoElement.muted = true; // Ensure video is muted (we'll use our processed audio)
    
    videoElement.currentTime = 0;
    audioElement.currentTime = 0;
    
    const startTime = Date.now();
    let animationFrame: number;
    
    await new Promise<void>((resolve) => {
      // Function to draw video frames to canvas and check recording progress
      const drawFrame = () => {
        if (ctx && videoElement.readyState >= 2) {
          ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        }
        
        if (videoElement.ended || videoElement.paused) {
          cancelAnimationFrame(animationFrame);
          mediaRecorder.stop();
          resolve();
          return;
        }
        
        animationFrame = requestAnimationFrame(drawFrame);
      };
      
      // Start drawing frames and playing media
      Promise.all([
        videoElement.play(),
        audioElement.play()
      ]).then(() => {
        console.log("Video and audio playback started");
        // Check that audio is actually playing
        if (audioElement.paused) {
          console.warn("Audio element is paused - trying to play again");
          audioElement.play().catch(e => console.error("Could not play audio:", e));
        }
        drawFrame();
      }).catch(error => {
        console.error("Error starting playback:", error);
        // Try one more time with user interaction simulation
        const userGesture = () => {
          audioElement.play().catch(e => console.error("Still could not play audio:", e));
          videoElement.play().catch(e => console.error("Still could not play video:", e));
          document.removeEventListener('click', userGesture);
        };
        document.addEventListener('click', userGesture, { once: true });
        console.log("Please click anywhere on the page to enable audio playback");
        
        // Continue with drawing frames even if audio fails
        drawFrame();
      });
    });
    
    // Step 6: When recording is done, create a download
    const recordedBlob = await recordingPromise;
    console.log("Recording complete. File size:", recordedBlob.size);
    
    // Create and trigger download
    const url = URL.createObjectURL(recordedBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.webm`;
    link.click();
    
    // Cleanup
    URL.revokeObjectURL(videoUrl);
    URL.revokeObjectURL(audioUrl);
    setTimeout(() => URL.revokeObjectURL(url), 100);
    
    return url;
  } catch (error) {
    console.error("Error in video export:", error);
    throw error;
  }
};

// Convert AudioBuffer to WAV Blob
const audioBufferToWav = (audioBuffer: AudioBuffer): Promise<Blob> => {
  return new Promise((resolve) => {
    const numOfChannels = audioBuffer.numberOfChannels;
    const length = audioBuffer.length * numOfChannels * 2;
    const buffer = new ArrayBuffer(44 + length);
    const view = new DataView(buffer);
    const sampleRate = audioBuffer.sampleRate;
    
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + length, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 4, true);
    view.setUint16(32, numOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, length, true);
    
    const offset = 44;
    let pos = offset;
    for (let i = 0; i < audioBuffer.length; i++) {
      for (let ch = 0; ch < numOfChannels; ch++) {
        const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(ch)[i]));
        const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(pos, int16, true);
        pos += 2;
      }
    }
    
    resolve(new Blob([buffer], { type: 'audio/wav' }));
  });
};

// Helper to convert AudioBuffer to a playable audio URL
const createAudioFromAudioBuffer = async (audioBuffer: AudioBuffer): Promise<string> => {
  const blob = await audioBufferToWav(audioBuffer);
  return URL.createObjectURL(blob);
};

const writeString = (view: DataView, offset: number, string: string): void => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};
