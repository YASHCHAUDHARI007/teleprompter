import { ensureMp4Blob, type ConversionProgress } from './mp4Converter';

export interface SaveResult {
  success: boolean;
  method: 'desktop-direct' | 'file-system-api' | 'browser-download';
  filePath?: string;
  fileName: string;
  size?: number;
  error?: string;
  userCancelled?: boolean;
}

/**
 * Generate a standardized PromptStudio recording filename.
 * Example: PromptStudio_2026-10-09_22-30.mp4
 * Or: PromptStudio_IntroSpeech_2026-10-09_22-30.mp4
 */
export function generateRecordingFileName(prefix = 'PromptStudio', scriptTitle?: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const mins = String(now.getMinutes()).padStart(2, '0');

  const cleanTitle = scriptTitle
    ? scriptTitle.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_').substring(0, 24)
    : '';

  const titlePart = cleanTitle && cleanTitle !== 'Untitled_Script' ? `${cleanTitle}_` : '';
  return `${prefix}_${titlePart}${year}-${month}-${day}_${hours}-${mins}.mp4`;
}

/**
 * Saves a completed recording as a genuine MP4 video file.
 * In Electron: Uses packaged FFmpeg to guarantee H.264 video, AAC audio, and faststart metadata.
 * In Browser: Direct MP4 save via File System Access API or browser download.
 */
export async function saveRecordingVideo(
  blob: Blob,
  preferredFileName?: string,
  scriptTitle?: string,
  options?: {
    customDestinationPath?: string;
    onProgress?: (p: ConversionProgress) => void;
  }
): Promise<SaveResult> {
  const fileName = preferredFileName || generateRecordingFileName('PromptStudio', scriptTitle);

  // 1. Electron Desktop Native Pipeline
  if (typeof window !== 'undefined' && window.promptStudioDesktop?.isElectron) {
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuffer);

      if (options?.onProgress) {
        options.onProgress({ ratio: 0.3, percent: 30, stage: 'Encoding native H.264/AAC MP4...' });
      }

      // Call Electron main process FFmpeg encoding pipeline
      const res = await window.promptStudioDesktop.convertAndSaveMp4({
        buffer: uint8,
        fileName,
        targetPath: options?.customDestinationPath,
      });

      if (options?.onProgress) {
        options.onProgress({ ratio: 1.0, percent: 100, stage: 'MP4 saved to disk' });
      }

      if (res.success && res.filePath) {
        return {
          success: true,
          method: 'desktop-direct',
          filePath: res.filePath,
          fileName: res.fileName || fileName,
          size: res.size,
        };
      } else if (res.error?.includes('cancelled') || res.error?.includes('canceled')) {
        return {
          success: false,
          method: 'desktop-direct',
          fileName,
          userCancelled: true,
        };
      } else {
        throw new Error(res.error || 'Electron native MP4 export failed');
      }
    } catch (e: any) {
      console.warn('Electron native save failed, falling back to browser API:', e);
    }
  }

  // Ensure blob is ready as MP4
  const { mp4Blob } = await ensureMp4Blob(blob, options?.onProgress);

  // 2. Browser Mode: Chromium File System Access API (showSaveFilePicker)
  if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: fileName,
        types: [
          {
            description: 'MP4 Video (*.mp4)',
            accept: {
              'video/mp4': ['.mp4'],
            },
          },
        ],
      });

      const writable = await handle.createWritable();
      await writable.write(mp4Blob);
      await writable.close();

      return {
        success: true,
        method: 'file-system-api',
        fileName: handle.name || fileName,
        filePath: handle.name,
        size: mp4Blob.size,
      };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return {
          success: false,
          method: 'file-system-api',
          fileName,
          userCancelled: true,
        };
      }
      console.warn('File System Access API rejected, falling back to standard download:', err);
    }
  }

  // 3. Universal Fallback: Standard browser download
  try {
    const url = URL.createObjectURL(mp4Blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);

    return {
      success: true,
      method: 'browser-download',
      fileName,
      size: mp4Blob.size,
    };
  } catch (err: any) {
    return {
      success: false,
      method: 'browser-download',
      fileName,
      error: err.message || 'Unable to download MP4 file',
    };
  }
}
