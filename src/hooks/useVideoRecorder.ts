import { useState, useRef, useCallback, useEffect } from 'react';
import { getOptimalRecordingMimeType } from '../services/mp4Converter';

export type RecorderState = 'idle' | 'countdown' | 'recording' | 'paused' | 'stopping';

export interface RecordedVideoData {
  blob: Blob;
  blobUrl: string;
  durationSec: number;
  fileSizeBytes: number;
  mimeType: string;
  timestamp: number;
}

interface UseVideoRecorderProps {
  onRecordingComplete?: (data: RecordedVideoData) => void;
  audioFeedbackBeep?: boolean;
}

export function useVideoRecorder({
  onRecordingComplete,
  audioFeedbackBeep = true,
}: UseVideoRecorderProps = {}) {
  const [recorderState, setRecorderState] = useState<RecorderState>('idle');
  const [countdownRemaining, setCountdownRemaining] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [lastRecording, setLastRecording] = useState<RecordedVideoData | null>(null);
  const [recorderError, setRecorderError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const totalPausedDurationRef = useRef<number>(0);

  // Sound feedback beep using AudioContext oscillator
  const playBeep = useCallback((freq = 440, duration = 0.12) => {
    if (!audioFeedbackBeep) return;
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;
      const ctx = new AudioCtxClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio feedback optional
    }
  }, [audioFeedbackBeep]);

  // Determine best supported MIME type (prefers direct MP4 container if browser supports it)
  const getSupportedMimeType = useCallback((): string => {
    return getOptimalRecordingMimeType();
  }, []);

  // Prevent leaving while recording
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (recorderState === 'recording' || recorderState === 'paused') {
        e.preventDefault();
        e.returnValue = 'A recording is currently in progress. If you leave now, your video will be lost.';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [recorderState]);

  // Start internal MediaRecorder recording on the provided stream
  const startRecordingStream = useCallback(
    (streamToRecord: MediaStream) => {
      try {
        setRecorderError(null);
        recordedChunksRef.current = [];

        const mimeType = getSupportedMimeType();
        const options: MediaRecorderOptions = {};
        if (mimeType) {
          options.mimeType = mimeType;
        }

        // Higher bitrate for 1080p recording studio quality
        options.videoBitsPerSecond = 8000000; // 8 Mbps
        options.audioBitsPerSecond = 192000; // 192 kbps

        let recorder: MediaRecorder;
        try {
          recorder = new MediaRecorder(streamToRecord, options);
        } catch {
          // Fallback without bitrate hints
          recorder = new MediaRecorder(streamToRecord, mimeType ? { mimeType } : undefined);
        }

        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            recordedChunksRef.current.push(event.data);
          }
        };

        recorder.onerror = (event: any) => {
          console.error('MediaRecorder error', event);
          setRecorderError(`Recording error: ${event.error?.message || 'MediaRecorder failed'}`);
          setRecorderState('idle');
        };

        recorder.onstop = () => {
          const finalMimeType = recorder.mimeType || mimeType || 'video/mp4';
          const blob = new Blob(recordedChunksRef.current, { type: finalMimeType });
          const blobUrl = URL.createObjectURL(blob);

          const finalDuration = elapsedSeconds || 1;
          const recordingData: RecordedVideoData = {
            blob,
            blobUrl,
            durationSec: finalDuration,
            fileSizeBytes: blob.size,
            mimeType: finalMimeType,
            timestamp: Date.now(),
          };

          setLastRecording(recordingData);
          setRecorderState('idle');

          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
          }

          if (onRecordingComplete) {
            onRecordingComplete(recordingData);
          }
        };

        mediaRecorderRef.current = recorder;
        // Request data in chunks every 1000ms for safety against crash
        recorder.start(1000);

        setRecorderState('recording');
        startTimeRef.current = Date.now();
        totalPausedDurationRef.current = 0;
        setElapsedSeconds(0);

        // Play high start beep
        playBeep(880, 0.2);

        // Start elapsed timer
        timerIntervalRef.current = window.setInterval(() => {
          const now = Date.now();
          const elapsed = Math.floor(
            (now - startTimeRef.current - totalPausedDurationRef.current) / 1000
          );
          setElapsedSeconds(Math.max(0, elapsed));
        }, 250);
      } catch (err: any) {
        console.error('Failed to start MediaRecorder', err);
        setRecorderError(`Could not start recording: ${err.message || 'Unknown error'}`);
        setRecorderState('idle');
      }
    },
    [elapsedSeconds, getSupportedMimeType, onRecordingComplete, playBeep]
  );

  // Trigger recording process (with countdown if configured)
  const triggerStartRecording = useCallback(
    (stream: MediaStream, countdown: number) => {
      if (!stream) {
        setRecorderError('No active camera or microphone stream available to record.');
        return;
      }

      if (countdown <= 0) {
        startRecordingStream(stream);
        return;
      }

      setRecorderState('countdown');
      setCountdownRemaining(countdown);
      playBeep(520, 0.1);

      let count = countdown;
      countdownIntervalRef.current = window.setInterval(() => {
        count -= 1;
        setCountdownRemaining(count);

        if (count > 0) {
          playBeep(520, 0.1);
        } else if (count === 0) {
          playBeep(880, 0.25);
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          startRecordingStream(stream);
        }
      }, 1000);
    },
    [playBeep, startRecordingStream]
  );

  // Pause recording
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setRecorderState('paused');
      pausedTimeRef.current = Date.now();
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      playBeep(400, 0.1);
    }
  }, [playBeep]);

  // Resume recording
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setRecorderState('recording');
      totalPausedDurationRef.current += Date.now() - pausedTimeRef.current;

      playBeep(600, 0.1);

      timerIntervalRef.current = window.setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor(
          (now - startTimeRef.current - totalPausedDurationRef.current) / 1000
        );
        setElapsedSeconds(Math.max(0, elapsed));
      }, 250);
    }
  }, [playBeep]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (
      mediaRecorderRef.current &&
      (mediaRecorderRef.current.state === 'recording' || mediaRecorderRef.current.state === 'paused')
    ) {
      setRecorderState('stopping');
      playBeep(330, 0.18);
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.warn('Error while stopping MediaRecorder', e);
        setRecorderState('idle');
      }
    } else {
      setRecorderState('idle');
    }
  }, [playBeep]);

  // Cancel countdown before recording starts
  const cancelCountdown = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setRecorderState('idle');
  }, []);

  // Clear current take
  const clearLastRecording = useCallback(() => {
    if (lastRecording?.blobUrl) {
      URL.revokeObjectURL(lastRecording.blobUrl);
    }
    setLastRecording(null);
  }, [lastRecording]);

  return {
    recorderState,
    countdownRemaining,
    elapsedSeconds,
    lastRecording,
    recorderError,
    triggerStartRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelCountdown,
    clearLastRecording,
  };
}
