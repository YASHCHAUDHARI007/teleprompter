export interface SaveResult {
  success: boolean;
  method: 'desktop-direct' | 'file-system-api' | 'browser-download';
  filePath?: string;
  fileName: string;
  error?: string;
  userCancelled?: boolean;
}

export function generateRecordingFileName(prefix = 'PromptStudio', scriptTitle?: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const mins = String(now.getMinutes()).padStart(2, '0');
  const secs = String(now.getSeconds()).padStart(2, '0');

  const cleanTitle = scriptTitle
    ? scriptTitle.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 24)
    : 'Take';

  return `${prefix}_${cleanTitle}_${year}-${month}-${day}_${hours}-${mins}-${secs}.webm`;
}

export async function saveRecordingVideo(
  blob: Blob,
  preferredFileName?: string,
  scriptTitle?: string
): Promise<SaveResult> {
  const fileName = preferredFileName || generateRecordingFileName('PromptStudio', scriptTitle);

  // 1. Check if running inside Electron desktop companion
  if (window.promptStudioDesktop?.isElectron) {
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuffer);
      const res = await window.promptStudioDesktop.saveVideoToDesktop({
        buffer: uint8,
        fileName,
      });

      if (res.success && res.filePath) {
        return {
          success: true,
          method: 'desktop-direct',
          filePath: res.filePath,
          fileName,
        };
      } else if (res.error?.includes('cancelled') || res.error?.includes('canceled')) {
        return {
          success: false,
          method: 'desktop-direct',
          fileName,
          userCancelled: true,
        };
      } else {
        throw new Error(res.error || 'Electron native save failed');
      }
    } catch (e: any) {
      console.warn('Desktop native save failed, falling back to browser API', e);
    }
  }

  // 2. Browser Mode: Check File System Access API (showSaveFilePicker)
  // Supported in Chromium browsers (Chrome, Edge, Opera, Brave, Vivaldi)
  if ('showSaveFilePicker' in window) {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: fileName,
        types: [
          {
            description: 'WebM Video (*.webm)',
            accept: {
              'video/webm': ['.webm'],
            },
          },
        ],
      });

      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();

      return {
        success: true,
        method: 'file-system-api',
        fileName: handle.name || fileName,
        filePath: handle.name,
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
      console.warn('File System Access API failed or rejected, falling back to download', err);
    }
  }

  // 3. Universal Fallback: Standard browser download
  try {
    const url = URL.createObjectURL(blob);
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
    };
  } catch (err: any) {
    return {
      success: false,
      method: 'browser-download',
      fileName,
      error: err.message || 'Unable to download recording file',
    };
  }
}
