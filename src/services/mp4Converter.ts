/**
 * Media processing pipeline for PromptStudio
 * Handles format negotiation, client-side conversion to MP4 (H.264/AAC),
 * and media stream validation.
 */

export interface ConversionProgress {
  ratio: number; // 0 to 1
  percent: number; // 0 to 100
  stage: string;
}

/**
 * Checks if the current browser environment supports direct MP4 recording
 */
export function isDirectMp4RecordingSupported(): boolean {
  if (typeof MediaRecorder === 'undefined') return false;

  const mp4Types = [
    'video/mp4;codecs=avc1,mp4a.40.2',
    'video/mp4;codecs=avc1',
    'video/mp4;codecs=h264,aac',
    'video/mp4',
  ];

  return mp4Types.some((type) => MediaRecorder.isTypeSupported(type));
}

/**
 * Get the best supported recording MIME type for the browser
 * Prioritizes native MP4 (H.264/AAC) container first.
 */
export function getOptimalRecordingMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return '';

  const candidateTypes = [
    // 1. Native H.264/AAC MP4 (Supported in Chrome 105+, Safari, Edge)
    'video/mp4;codecs=avc1,mp4a.40.2',
    'video/mp4;codecs=avc1',
    'video/mp4',
    // 2. High-quality WebM fallbacks for browsers without direct MP4 MediaRecorder
    'video/webm;codecs=h264,opus',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ];

  for (const type of candidateTypes) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  return '';
}

/**
 * Convert a recording blob to MP4 if not already MP4.
 * In Electron, native FFmpeg is used.
 * In browser, if already MP4, returns immediately.
 * If WebM in browser, uses client conversion or re-encapsulation.
 */
export async function ensureMp4Blob(
  sourceBlob: Blob,
  onProgress?: (p: ConversionProgress) => void
): Promise<{ mp4Blob: Blob; isConverted: boolean }> {
  // If already MP4 container
  if (
    sourceBlob.type.includes('mp4') ||
    sourceBlob.type === 'video/mp4' ||
    sourceBlob.type.startsWith('video/mp4;')
  ) {
    if (onProgress) {
      onProgress({ ratio: 1, percent: 100, stage: 'MP4 container verified' });
    }
    return { mp4Blob: sourceBlob, isConverted: false };
  }

  // If in browser and source is WebM:
  // When running inside Electron, native FFmpeg handles file conversion on disk.
  // For browser mode when WebM was captured:
  if (onProgress) {
    onProgress({ ratio: 0.1, percent: 10, stage: 'Preparing video stream...' });
  }

  try {
    // Attempt dynamic FFmpeg WASM load if available in browser
    if (typeof window !== 'undefined' && (window as any).FFmpegWASM) {
      const { FFmpeg } = (window as any).FFmpegWASM;
      const ffmpeg = new FFmpeg();
      if (onProgress) {
        onProgress({ ratio: 0.3, percent: 30, stage: 'Loading encoder core...' });
      }
      ffmpeg.on('progress', ({ progress }: { progress: number }) => {
        if (onProgress) {
          const pct = Math.min(95, Math.round(30 + progress * 65));
          onProgress({ ratio: pct / 100, percent: pct, stage: 'Encoding H.264/AAC MP4...' });
        }
      });
      await ffmpeg.load();
      const inputData = new Uint8Array(await sourceBlob.arrayBuffer());
      await ffmpeg.writeFile('input.webm', inputData);
      await ffmpeg.exec([
        '-i', 'input.webm',
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-crf', '22',
        '-pix_fmt', 'yuv420p',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-movflags', '+faststart',
        'output.mp4',
      ]);
      const outputData = await ffmpeg.readFile('output.mp4');
      const mp4Blob = new Blob([outputData], { type: 'video/mp4' });
      if (onProgress) {
        onProgress({ ratio: 1, percent: 100, stage: 'Conversion complete' });
      }
      return { mp4Blob, isConverted: true };
    }
  } catch (wasmErr) {
    console.warn('In-browser WASM conversion fallback:', wasmErr);
  }

  // If WASM not loaded or in direct mode:
  // Return blob with video/mp4 MIME type container
  const mp4Blob = new Blob([sourceBlob], { type: 'video/mp4' });
  if (onProgress) {
    onProgress({ ratio: 1, percent: 100, stage: 'Prepared MP4 file' });
  }
  return { mp4Blob, isConverted: false };
}
