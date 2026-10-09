import { useState, useEffect, useRef, useCallback } from 'react';
import type { MediaDeviceInfoSimple, AspectRatio, VideoResolution } from '../types';

interface UseCameraAndAudioOptions {
  videoDeviceId?: string;
  audioDeviceId?: string;
  resolution?: VideoResolution;
  aspectRatio?: AspectRatio;
}

export interface CameraAudioState {
  stream: MediaStream | null;
  videoDevices: MediaDeviceInfoSimple[];
  audioDevices: MediaDeviceInfoSimple[];
  currentVideoDevice: string;
  currentAudioDevice: string;
  audioLevel: number; // 0 to 100
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  hasPermissions: boolean;
  permissionError: string | null;
  isInitializing: boolean;
}

export function useCameraAndAudio(options: UseCameraAndAudioOptions = {}) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfoSimple[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfoSimple[]>([]);
  const [currentVideoDevice, setCurrentVideoDevice] = useState<string>(options.videoDeviceId || '');
  const [currentAudioDevice, setCurrentAudioDevice] = useState<string>(options.audioDeviceId || '');
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [isVideoMuted, setIsVideoMuted] = useState<boolean>(false);
  const [hasPermissions, setHasPermissions] = useState<boolean>(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isStoppingRef = useRef<boolean>(false);

  // Stop active stream tracks safely
  const stopCurrentStream = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (e) {
        console.warn('AudioContext close error', e);
      }
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Track stop error', e);
        }
      });
      streamRef.current = null;
    }
    setStream(null);
  }, []);

  // Set up Web Audio Analyser for live mic level meter
  const setupAudioMeter = useCallback((mediaStream: MediaStream) => {
    const audioTrack = mediaStream.getAudioTracks()[0];
    if (!audioTrack) return;

    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;

      const audioCtx = new AudioCtxClass();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(mediaStream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateMeter = () => {
        if (!analyserRef.current || isStoppingRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        // Normalize to roughly 0 - 100 with dynamic curve
        const level = Math.min(100, Math.round((average / 128) * 100 * 1.5));
        setAudioLevel(level);

        animationFrameRef.current = requestAnimationFrame(updateMeter);
      };

      updateMeter();
    } catch (e) {
      console.warn('Failed to start Web Audio analyser', e);
    }
  }, []);

  // Enumerate connected video and audio devices
  const updateDeviceList = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();

      const videoList: MediaDeviceInfoSimple[] = [];
      const audioList: MediaDeviceInfoSimple[] = [];

      devices.forEach((d) => {
        if (d.kind === 'videoinput') {
          videoList.push({
            deviceId: d.deviceId,
            label: d.label || `Camera ${videoList.length + 1}`,
            kind: d.kind,
          });
        } else if (d.kind === 'audioinput') {
          audioList.push({
            deviceId: d.deviceId,
            label: d.label || `Microphone ${audioList.length + 1}`,
            kind: d.kind,
          });
        }
      });

      setVideoDevices(videoList);
      setAudioDevices(audioList);
    } catch (e) {
      console.warn('Failed to enumerate media devices', e);
    }
  }, []);

  // Initialize or re-acquire media stream
  const startStream = useCallback(
    async (videoId?: string, audioId?: string) => {
      setIsInitializing(true);
      setPermissionError(null);
      isStoppingRef.current = false;
      stopCurrentStream();

      // Check if MediaDevices API is supported in this browser
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setPermissionError(
          'MediaDevices API is not supported in this browser environment. Please use Chrome, Edge, Safari, or Firefox.'
        );
        setIsInitializing(false);
        return;
      }

      // Constraints
      const videoConstraints: MediaTrackConstraints = {
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        frameRate: { ideal: 30 },
      };
      if (videoId) {
        videoConstraints.deviceId = { exact: videoId };
      }

      const audioConstraints: MediaTrackConstraints = {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      };
      if (audioId) {
        audioConstraints.deviceId = { exact: audioId };
      }

      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: audioConstraints,
        });

        streamRef.current = newStream;
        setStream(newStream);
        setHasPermissions(true);
        setPermissionError(null);

        // Update active device IDs from obtained tracks
        const vTrack = newStream.getVideoTracks()[0];
        const aTrack = newStream.getAudioTracks()[0];
        if (vTrack && vTrack.getSettings().deviceId) {
          setCurrentVideoDevice(vTrack.getSettings().deviceId!);
        }
        if (aTrack && aTrack.getSettings().deviceId) {
          setCurrentAudioDevice(aTrack.getSettings().deviceId!);
        }

        // Setup audio visualizer
        setupAudioMeter(newStream);

        // Update list of device names now that permission is granted
        await updateDeviceList();
      } catch (err: any) {
        console.error('getUserMedia error:', err);
        setHasPermissions(false);

        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setPermissionError(
            'Camera and microphone permission denied. Please allow camera and microphone access in your browser or OS settings to use the studio.'
          );
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setPermissionError(
            'No camera or microphone device found. Please connect a webcam or external microphone.'
          );
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          setPermissionError(
            'Camera or microphone is already in use by another application (e.g. Zoom, Teams, FaceTime). Please close other video apps and retry.'
          );
        } else if (err.name === 'OverconstrainedError') {
          // Retry with loose constraints
          try {
            const fallbackStream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: true,
            });
            streamRef.current = fallbackStream;
            setStream(fallbackStream);
            setHasPermissions(true);
            setPermissionError(null);
            setupAudioMeter(fallbackStream);
            await updateDeviceList();
          } catch (fallbackErr: any) {
            setPermissionError(`Failed to acquire media devices: ${fallbackErr.message}`);
          }
        } else {
          setPermissionError(`Media device error: ${err.message || 'Unknown error'}`);
        }
      } finally {
        setIsInitializing(false);
      }
    },
    [stopCurrentStream, setupAudioMeter, updateDeviceList]
  );

  // Switch video device
  const switchVideoDevice = useCallback(
    async (deviceId: string) => {
      setCurrentVideoDevice(deviceId);
      await startStream(deviceId, currentAudioDevice);
    },
    [currentAudioDevice, startStream]
  );

  // Switch audio device
  const switchAudioDevice = useCallback(
    async (deviceId: string) => {
      setCurrentAudioDevice(deviceId);
      await startStream(currentVideoDevice, deviceId);
    },
    [currentVideoDevice, startStream]
  );

  // Toggle video mute/pause track
  const toggleVideoMute = useCallback(() => {
    if (streamRef.current) {
      const vTrack = streamRef.current.getVideoTracks()[0];
      if (vTrack) {
        vTrack.enabled = !vTrack.enabled;
        setIsVideoMuted(!vTrack.enabled);
      }
    }
  }, []);

  // Toggle audio mute track
  const toggleAudioMute = useCallback(() => {
    if (streamRef.current) {
      const aTrack = streamRef.current.getAudioTracks()[0];
      if (aTrack) {
        aTrack.enabled = !aTrack.enabled;
        setIsAudioMuted(!aTrack.enabled);
      }
    }
  }, []);

  // Listen for device change events (plugging/unplugging webcams)
  useEffect(() => {
    const handleDeviceChange = async () => {
      await updateDeviceList();
    };

    if (navigator.mediaDevices?.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    }

    return () => {
      if (navigator.mediaDevices?.removeEventListener) {
        navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      }
    };
  }, [updateDeviceList]);

  // Initial stream start
  useEffect(() => {
    startStream(options.videoDeviceId, options.audioDeviceId);

    return () => {
      isStoppingRef.current = true;
      stopCurrentStream();
    };
  }, []); // Run on mount

  return {
    stream,
    videoDevices,
    audioDevices,
    currentVideoDevice,
    currentAudioDevice,
    audioLevel,
    isAudioMuted,
    isVideoMuted,
    hasPermissions,
    permissionError,
    isInitializing,
    startStream,
    switchVideoDevice,
    switchAudioDevice,
    toggleVideoMute,
    toggleAudioMute,
    retryPermissions: () => startStream(currentVideoDevice, currentAudioDevice),
  };
}
