// Define types for the slideshow configuration

export interface Resolution {
    width: number;
    height: number;
  }
  
  export interface EffectConfig {
    fade?: boolean;
    fadeInDuration?: number;
    fadeOutDuration?: number;
    zoomDirection?: 'in' | 'out' | 'none';
    zoomAmount?: number;
    panDirection?: 'left' | 'right' | 'up' | 'down' | 'none';
    panAmount?: number;
  }
  
  export interface SubtitleEntry {
    startTime: string;
    endTime: string;
    text: string;
  }
  
  export interface ImageConfig {
    path: string;
    duration?: number;
    speed?: number;
    audioPath?: string;
    audioVolume?: number;
    title?: string;
    subtitle?: string;
    subtitles?: string[];
    effects?: EffectConfig;
  }
  
  export interface SlideshowConfig {
    images: ImageConfig[];
    videoDuration?: number;
    resolution?: Resolution;
    frameRate?: number;
    videoBitrate?: string;
    audioPath?: string;
    audioVolume?: number;
    audioBitrate?: string;
    defaultEffects?: EffectConfig;
    addHardSubtitles?: boolean;
    subtitles?: SubtitleEntry[];
    useBackgroundMusic?: boolean;
  }
  
  export interface SlideshowResult {
    success: boolean;
    outputPath?: string;
    hardSubsPath?: string | null;
    totalDuration?: number;
    error?: any;
  }