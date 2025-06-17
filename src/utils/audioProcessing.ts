
// Audio Processing Utility Functions

// Get Audio Context
export const getAudioContext = (): AudioContext => {
  return new (window.AudioContext || (window as any).webkitAudioContext)();
};

// Clone an AudioBuffer
export const cloneAudioBuffer = (audioBuffer: AudioBuffer): AudioBuffer => {
  const context = getAudioContext();
  const newBuffer = context.createBuffer(
    audioBuffer.numberOfChannels,
    audioBuffer.length,
    audioBuffer.sampleRate
  );

  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const channelData = audioBuffer.getChannelData(channel);
    newBuffer.copyToChannel(channelData, channel);
  }

  return newBuffer;
};

// Apply Bass Boost preset
export const applyBassBoost = async (audioBuffer: AudioBuffer): Promise<AudioBuffer> => {
  const offlineContext = new OfflineAudioContext(
    audioBuffer.numberOfChannels, 
    audioBuffer.length, 
    audioBuffer.sampleRate
  );
  
  // Create source from input buffer
  const source = offlineContext.createBufferSource();
  source.buffer = audioBuffer;
  
  // Create filters
  const bassFilter = offlineContext.createBiquadFilter();
  bassFilter.type = 'lowshelf';
  bassFilter.frequency.value = 100;
  bassFilter.gain.value = 10;
  
  const midFilter = offlineContext.createBiquadFilter();
  midFilter.type = 'peaking';
  midFilter.frequency.value = 1000;
  midFilter.Q.value = 1;
  midFilter.gain.value = 2;
  
  // Connect nodes
  source.connect(bassFilter);
  bassFilter.connect(midFilter);
  midFilter.connect(offlineContext.destination);
  
  // Start source and render
  source.start(0);
  return await offlineContext.startRendering();
};

// Apply Studio Sound preset
export const applyStudioSound = async (audioBuffer: AudioBuffer): Promise<AudioBuffer> => {
  const offlineContext = new OfflineAudioContext(
    audioBuffer.numberOfChannels, 
    audioBuffer.length, 
    audioBuffer.sampleRate
  );
  
  const source = offlineContext.createBufferSource();
  source.buffer = audioBuffer;
  
  // Create compressor
  const compressor = offlineContext.createDynamicsCompressor();
  compressor.threshold.value = -24;
  compressor.knee.value = 30;
  compressor.ratio.value = 3;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.25;
  
  // Create EQ filters
  const lowFilter = offlineContext.createBiquadFilter();
  lowFilter.type = 'lowshelf';
  lowFilter.frequency.value = 200;
  lowFilter.gain.value = 3;
  
  const highFilter = offlineContext.createBiquadFilter();
  highFilter.type = 'highshelf';
  highFilter.frequency.value = 6000;
  highFilter.gain.value = 3;
  
  // Create stereo enhancement (a simple way to simulate)
  const stereoPanner = offlineContext.createStereoPanner();
  stereoPanner.pan.value = 0; // Center
  
  // Connect nodes
  source.connect(lowFilter);
  lowFilter.connect(highFilter);
  highFilter.connect(compressor);
  compressor.connect(stereoPanner);
  stereoPanner.connect(offlineContext.destination);
  
  source.start(0);
  return await offlineContext.startRendering();
};

// Apply Podcast Voice preset
export const applyPodcastVoice = async (audioBuffer: AudioBuffer): Promise<AudioBuffer> => {
  const offlineContext = new OfflineAudioContext(
    audioBuffer.numberOfChannels, 
    audioBuffer.length, 
    audioBuffer.sampleRate
  );
  
  const source = offlineContext.createBufferSource();
  source.buffer = audioBuffer;
  
  // Create highpass filter to cut rumble
  const highpassFilter = offlineContext.createBiquadFilter();
  highpassFilter.type = 'highpass';
  highpassFilter.frequency.value = 120;
  
  // Create presence boost
  const presenceFilter = offlineContext.createBiquadFilter();
  presenceFilter.type = 'peaking';
  presenceFilter.frequency.value = 3000;
  presenceFilter.Q.value = 1;
  presenceFilter.gain.value = 5;
  
  // Create compressor for dynamics
  const compressor = offlineContext.createDynamicsCompressor();
  compressor.threshold.value = -20;
  compressor.knee.value = 6;
  compressor.ratio.value = 4;
  compressor.attack.value = 0.002;
  compressor.release.value = 0.1;
  
  // Gain to boost overall volume
  const gainNode = offlineContext.createGain();
  gainNode.gain.value = 1.5; // Increase volume
  
  // Connect nodes
  source.connect(highpassFilter);
  highpassFilter.connect(presenceFilter);
  presenceFilter.connect(compressor);
  compressor.connect(gainNode);
  gainNode.connect(offlineContext.destination);
  
  source.start(0);
  return await offlineContext.startRendering();
};

// Apply ASMR preset
export const applyAsmr = async (audioBuffer: AudioBuffer): Promise<AudioBuffer> => {
  const offlineContext = new OfflineAudioContext(
    audioBuffer.numberOfChannels, 
    audioBuffer.length, 
    audioBuffer.sampleRate
  );
  
  const source = offlineContext.createBufferSource();
  source.buffer = audioBuffer;
  
  // Create highpass filter
  const highpassFilter = offlineContext.createBiquadFilter();
  highpassFilter.type = 'highpass';
  highpassFilter.frequency.value = 80;
  
  // Create presence/detail boost
  const detailFilter = offlineContext.createBiquadFilter();
  detailFilter.type = 'peaking';
  detailFilter.frequency.value = 8000;
  detailFilter.Q.value = 1;
  detailFilter.gain.value = 6;
  
  // Create stereo enhancement
  const stereoPanner = offlineContext.createStereoPanner();
  stereoPanner.pan.value = 0; // Center
  
  // Gain to boost overall volume
  const gainNode = offlineContext.createGain();
  gainNode.gain.value = 1.2; // Slight volume boost
  
  // Connect nodes
  source.connect(highpassFilter);
  highpassFilter.connect(detailFilter);
  detailFilter.connect(stereoPanner);
  stereoPanner.connect(gainNode);
  gainNode.connect(offlineContext.destination);
  
  source.start(0);
  return await offlineContext.startRendering();
};

// Apply Noise Reduction preset
export const applyNoiseReduction = async (audioBuffer: AudioBuffer): Promise<AudioBuffer> => {
  const offlineContext = new OfflineAudioContext(
    audioBuffer.numberOfChannels, 
    audioBuffer.length, 
    audioBuffer.sampleRate
  );
  
  const source = offlineContext.createBufferSource();
  source.buffer = audioBuffer;
  
  // Create highpass filter to remove low-frequency noise
  const highpassFilter = offlineContext.createBiquadFilter();
  highpassFilter.type = 'highpass';
  highpassFilter.frequency.value = 150;
  highpassFilter.Q.value = 0.7;
  
  // Create lowpass filter to remove high-frequency hiss
  const lowpassFilter = offlineContext.createBiquadFilter();
  lowpassFilter.type = 'lowpass';
  lowpassFilter.frequency.value = 7500;
  
  // Create bandpass filter to isolate voice range
  const bandpassFilter = offlineContext.createBiquadFilter();
  bandpassFilter.type = 'bandpass';
  bandpassFilter.frequency.value = 1000; 
  bandpassFilter.Q.value = 0.5; // Wider bandwidth
  
  // Create compressor to help with dynamics
  const compressor = offlineContext.createDynamicsCompressor();
  compressor.threshold.value = -30;
  compressor.knee.value = 10;
  compressor.ratio.value = 3;
  compressor.attack.value = 0.02;
  compressor.release.value = 0.3;
  
  // Connect nodes
  source.connect(highpassFilter);
  highpassFilter.connect(lowpassFilter);
  lowpassFilter.connect(bandpassFilter);
  bandpassFilter.connect(compressor);
  compressor.connect(offlineContext.destination);
  
  source.start(0);
  return await offlineContext.startRendering();
};

// Deep Radio Voice preset
export const applyRadioVoice = async (audioBuffer: AudioBuffer): Promise<AudioBuffer> => {
  const offlineContext = new OfflineAudioContext(
    audioBuffer.numberOfChannels, 
    audioBuffer.length, 
    audioBuffer.sampleRate
  );
  
  const source = offlineContext.createBufferSource();
  source.buffer = audioBuffer;
  
  // Create bandpass filter for radio-like effect
  const bandpassFilter = offlineContext.createBiquadFilter();
  bandpassFilter.type = 'bandpass';
  bandpassFilter.frequency.value = 1800;
  bandpassFilter.Q.value = 0.8;
  
  // Create distortion for that classic radio sound
  const distortion = offlineContext.createWaveShaper();
  function makeDistortionCurve(amount = 50) {
    const k = typeof amount === 'number' ? amount : 50;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }
  distortion.curve = makeDistortionCurve(20);
  distortion.oversample = '4x';
  
  // Create compressor for that punchy radio sound
  const compressor = offlineContext.createDynamicsCompressor();
  compressor.threshold.value = -18;
  compressor.knee.value = 5;
  compressor.ratio.value = 12;
  compressor.attack.value = 0.002;
  compressor.release.value = 0.25;
  
  // Gain to boost overall volume
  const gainNode = offlineContext.createGain();
  gainNode.gain.value = 1.2;
  
  // Connect nodes
  source.connect(bandpassFilter);
  bandpassFilter.connect(distortion);
  distortion.connect(compressor);
  compressor.connect(gainNode);
  gainNode.connect(offlineContext.destination);
  
  source.start(0);
  return await offlineContext.startRendering();
};

// Vintage Vinyl preset
export const applyVinylEffect = async (audioBuffer: AudioBuffer): Promise<AudioBuffer> => {
  const offlineContext = new OfflineAudioContext(
    audioBuffer.numberOfChannels, 
    audioBuffer.length, 
    audioBuffer.sampleRate
  );
  
  const source = offlineContext.createBufferSource();
  source.buffer = audioBuffer;
  
  // Create lowpass filter to simulate vinyl warmth
  const lowpassFilter = offlineContext.createBiquadFilter();
  lowpassFilter.type = 'lowpass';
  lowpassFilter.frequency.value = 5000;
  
  // Create highpass filter to cut out very low rumble
  const highpassFilter = offlineContext.createBiquadFilter();
  highpassFilter.type = 'highpass';
  highpassFilter.frequency.value = 40;
  
  // Add subtle resonance
  const peakingFilter = offlineContext.createBiquadFilter();
  peakingFilter.type = 'peaking';
  peakingFilter.frequency.value = 3000;
  peakingFilter.Q.value = 1.5;
  peakingFilter.gain.value = -2;
  
  // Create slight distortion for vinyl crackle feel
  const distortion = offlineContext.createWaveShaper();
  function makeDistortionCurve(amount = 5) {
    const k = typeof amount === 'number' ? amount : 5;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }
  distortion.curve = makeDistortionCurve(2);
  distortion.oversample = '4x';
  
  // Connect nodes
  source.connect(highpassFilter);
  highpassFilter.connect(lowpassFilter);
  lowpassFilter.connect(peakingFilter);
  peakingFilter.connect(distortion);
  distortion.connect(offlineContext.destination);
  
  source.start(0);
  return await offlineContext.startRendering();
};

// Phone Call preset
export const applyPhoneCall = async (audioBuffer: AudioBuffer): Promise<AudioBuffer> => {
  const offlineContext = new OfflineAudioContext(
    audioBuffer.numberOfChannels, 
    audioBuffer.length, 
    audioBuffer.sampleRate
  );
  
  const source = offlineContext.createBufferSource();
  source.buffer = audioBuffer;
  
  // Create bandpass filter to simulate phone bandwidth limitation (300-3400 Hz)
  const bandpassFilter = offlineContext.createBiquadFilter();
  bandpassFilter.type = 'bandpass';
  bandpassFilter.frequency.value = 1700; // Center of telephone bandwidth
  bandpassFilter.Q.value = 0.5;
  
  // Additional lowpass to shape the high end
  const lowpassFilter = offlineContext.createBiquadFilter();
  lowpassFilter.type = 'lowpass';
  lowpassFilter.frequency.value = 3400; // Telephone upper limit
  
  // Additional highpass to shape the low end
  const highpassFilter = offlineContext.createBiquadFilter();
  highpassFilter.type = 'highpass';
  highpassFilter.frequency.value = 300; // Telephone lower limit
  
  // Light compression
  const compressor = offlineContext.createDynamicsCompressor();
  compressor.threshold.value = -15;
  compressor.knee.value = 5;
  compressor.ratio.value = 5;
  compressor.attack.value = 0.05;
  compressor.release.value = 0.1;
  
  // Gain boost
  const gainNode = offlineContext.createGain();
  gainNode.gain.value = 1.3;
  
  // Connect nodes
  source.connect(bandpassFilter);
  bandpassFilter.connect(lowpassFilter);
  lowpassFilter.connect(highpassFilter);
  highpassFilter.connect(compressor);
  compressor.connect(gainNode);
  gainNode.connect(offlineContext.destination);
  
  source.start(0);
  return await offlineContext.startRendering();
};

// Normalize preset
export const applyNormalize = async (audioBuffer: AudioBuffer): Promise<AudioBuffer> => {
  const offlineContext = new OfflineAudioContext(
    audioBuffer.numberOfChannels, 
    audioBuffer.length, 
    audioBuffer.sampleRate
  );
  
  const source = offlineContext.createBufferSource();
  source.buffer = audioBuffer;
  
  // Find the peak amplitude
  let peak = 0;
  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const data = audioBuffer.getChannelData(channel);
    for (let i = 0; i < data.length; i++) {
      const amplitude = Math.abs(data[i]);
      if (amplitude > peak) {
        peak = amplitude;
      }
    }
  }
  
  // Calculate gain factor (target -3dB)
  const targetPeak = 0.7079; // -3dB relative to full scale
  const gainFactor = peak > 0 ? targetPeak / peak : 1;
  
  // Apply gain
  const gainNode = offlineContext.createGain();
  gainNode.gain.value = gainFactor;
  
  // Connect nodes
  source.connect(gainNode);
  gainNode.connect(offlineContext.destination);
  
  // Start source and render
  source.start(0);
  return await offlineContext.startRendering();
};

// Compression preset
export const applyCompression = async (audioBuffer: AudioBuffer): Promise<AudioBuffer> => {
  const offlineContext = new OfflineAudioContext(
    audioBuffer.numberOfChannels, 
    audioBuffer.length, 
    audioBuffer.sampleRate
  );
  
  const source = offlineContext.createBufferSource();
  source.buffer = audioBuffer;
  
  // Create compressor
  const compressor = offlineContext.createDynamicsCompressor();
  compressor.threshold.value = -24;
  compressor.knee.value = 12;
  compressor.ratio.value = 4;
  compressor.attack.value = 0.005;
  compressor.release.value = 0.1;
  
  // Add makeup gain
  const gainNode = offlineContext.createGain();
  gainNode.gain.value = 1.5;
  
  // Connect nodes
  source.connect(compressor);
  compressor.connect(gainNode);
  gainNode.connect(offlineContext.destination);
  
  // Start source and render
  source.start(0);
  return await offlineContext.startRendering();
};

// Define preset configurations - this needs to come AFTER all the function definitions
const presets = {
  'bass-boost': applyBassBoost,
  'studio-sound': applyStudioSound,
  'podcast-voice': applyPodcastVoice,
  'asmr': applyAsmr,
  'noise-reduction': applyNoiseReduction,
  'radio-voice': applyRadioVoice,
  'vinyl-effect': applyVinylEffect,
  'phone-call': applyPhoneCall,
  'normalize': applyNormalize,
  'compression': applyCompression
};

// Manual processing interface
export interface ManualProcessingParams {
  bass?: number;
  treble?: number;
  compression?: number;
  normalize?: number;
  lowpass?: number;
  highpass?: number;
}

// Process audio locally for preview with manual parameters
export const previewManualProcessing = async (
  audioBuffer: AudioBuffer,
  params: ManualProcessingParams
): Promise<AudioBuffer> => {
  const offlineContext = new OfflineAudioContext(
    audioBuffer.numberOfChannels, 
    audioBuffer.length, 
    audioBuffer.sampleRate
  );
  
  const source = offlineContext.createBufferSource();
  source.buffer = audioBuffer;
  
  let lastNode: AudioNode = source;
  
  // Apply bass
  if (params.bass !== undefined && params.bass !== 0) {
    const bassFilter = offlineContext.createBiquadFilter();
    bassFilter.type = 'lowshelf';
    bassFilter.frequency.value = 100;
    bassFilter.gain.value = params.bass;
    
    lastNode.connect(bassFilter);
    lastNode = bassFilter;
  }
  
  // Apply treble
  if (params.treble !== undefined && params.treble !== 0) {
    const trebleFilter = offlineContext.createBiquadFilter();
    trebleFilter.type = 'highshelf';
    trebleFilter.frequency.value = 3000;
    trebleFilter.gain.value = params.treble;
    
    lastNode.connect(trebleFilter);
    lastNode = trebleFilter;
  }
  
  // Apply high pass
  if (params.highpass !== undefined && params.highpass > 0) {
    const highpassFilter = offlineContext.createBiquadFilter();
    highpassFilter.type = 'highpass';
    highpassFilter.frequency.value = params.highpass;
    
    lastNode.connect(highpassFilter);
    lastNode = highpassFilter;
  }
  
  // Apply low pass
  if (params.lowpass !== undefined && params.lowpass > 0) {
    const lowpassFilter = offlineContext.createBiquadFilter();
    lowpassFilter.type = 'lowpass';
    lowpassFilter.frequency.value = params.lowpass;
    
    lastNode.connect(lowpassFilter);
    lastNode = lowpassFilter;
  }
  
  // Apply compression
  if (params.compression !== undefined && params.compression !== 0) {
    const compressor = offlineContext.createDynamicsCompressor();
    compressor.threshold.value = -24;
    compressor.knee.value = 30;
    compressor.ratio.value = 3 + Math.abs(params.compression);
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;
    
    lastNode.connect(compressor);
    lastNode = compressor;
  }
  
  // Apply normalization (simulated with gain)
  if (params.normalize !== undefined && params.normalize > 0) {
    const gainNode = offlineContext.createGain();
    gainNode.gain.value = 1 + (params.normalize / 10);
    
    lastNode.connect(gainNode);
    lastNode = gainNode;
  }
  
  // Connect final node to destination
  lastNode.connect(offlineContext.destination);
  
  // Start source and render
  source.start(0);
  return await offlineContext.startRendering();
};

// Process audio based on preset or manual parameters
export const processAudio = async (
  audioBuffer: AudioBuffer, 
  preset?: string,
  manualParams?: ManualProcessingParams
): Promise<AudioBuffer> => {
  try {
    console.log("Processing audio with preset:", preset || "manual parameters");

    // Use local processing methods instead of edge function
    if (preset && preset in presets) {
      return await presets[preset as keyof typeof presets](audioBuffer);
    } else if (manualParams) {
      return await previewManualProcessing(audioBuffer, manualParams);
    } else {
      throw new Error("Invalid preset or parameters");
    }
  } catch (error) {
    console.error('Error in processAudio:', error);
    throw error;
  }
};

// Export processed audio as file
export const exportAudio = async (
  audioBuffer: AudioBuffer, 
  filename: string,
  format: 'mp3' | 'wav' = 'wav'
): Promise<void> => {
  try {
    const wavBuffer = audioBufferToWav(audioBuffer);
    const blob = new Blob([wavBuffer], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Export error:", error);
    // Fallback to MediaRecorder if direct conversion fails
    try {
      const dataUrl = await exportAudioWithMediaRecorder(audioBuffer);
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${filename}.${format}`;
      a.click();
    } catch (fallbackError) {
      console.error("Fallback export error:", fallbackError);
      throw fallbackError;
    }
  }
};

// Helper function to export AudioBuffer to base64 WAV
export const exportAudioWithMediaRecorder = (audioBuffer: AudioBuffer): Promise<string> => {
  return new Promise((resolve, reject) => {
    const context = new AudioContext();
    const source = context.createBufferSource();
    source.buffer = audioBuffer;
    
    const streamDest = context.createMediaStreamDestination();
    source.connect(streamDest);
    
    const mediaRecorder = new MediaRecorder(streamDest.stream);
    const chunks: BlobPart[] = [];
    
    mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/wav' });
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    };
    
    mediaRecorder.start();
    source.start(0);
    setTimeout(() => mediaRecorder.stop(), (audioBuffer.duration * 1000));
  });
};

// Convert audio buffer to WAV file
const audioBufferToWav = (audioBuffer: AudioBuffer): ArrayBuffer => {
  const numOfChannels = audioBuffer.numberOfChannels;
  const length = audioBuffer.length * numOfChannels * 2;
  const buffer = new ArrayBuffer(44 + length);
  const view = new DataView(buffer);
  const sampleRate = audioBuffer.sampleRate;
  const channels = audioBuffer.numberOfChannels;
  
  // RIFF identifier
  writeString(view, 0, 'RIFF');
  // RIFF chunk length
  view.setUint32(4, 36 + length, true);
  // RIFF type
  writeString(view, 8, 'WAVE');
  // format chunk identifier
  writeString(view, 12, 'fmt ');
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (raw)
  view.setUint16(20, 1, true);
  // channel count
  view.setUint16(22, channels, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sample rate * block align)
  view.setUint32(28, sampleRate * 4, true);
  // block align (channel count * bytes per sample)
  view.setUint16(32, channels * 2, true);
  // bits per sample
  view.setUint16(34, 16, true);
  // data chunk identifier
  writeString(view, 36, 'data');
  // data chunk length
  view.setUint32(40, length, true);
  
  // Write the PCM samples
  const offset = 44;
  let pos = offset;
  for (let i = 0; i < audioBuffer.length; i++) {
    for (let ch = 0; ch < numOfChannels; ch++) {
      // Interleave channels
      const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(ch)[i]));
      // Scale to 16-bit signed integer
      const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(pos, int16, true);
      pos += 2;
    }
  }
  
  return buffer;
};

// Helper function to write strings to DataView
const writeString = (view: DataView, offset: number, string: string): void => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};
