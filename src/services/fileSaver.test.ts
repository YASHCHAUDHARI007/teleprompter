import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateRecordingFileName, saveRecordingVideo } from './fileSaver';

describe('fileSaver service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('generates a valid MP4 filename with prefix, sanitized title, and timestamp', () => {
    const fileName = generateRecordingFileName('PromptStudio', 'College Defense Presentation #1');
    expect(fileName).toMatch(/^PromptStudio_College_Defense_[a-zA-Z0-9_]+_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}\.mp4$/);
  });

  it('generates a clean timestamped MP4 filename when title is empty', () => {
    const fileName = generateRecordingFileName();
    expect(fileName).toMatch(/^PromptStudio_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}\.mp4$/);
  });

  it('falls back to browser download with .mp4 when Electron and File System API are absent', async () => {
    const blob = new Blob(['fake mp4 bytes'], { type: 'video/mp4' });
    const appendSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => document.createElement('div') as any);
    const removeSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => document.createElement('div') as any);

    const result = await saveRecordingVideo(blob, 'PromptStudio_2026-10-09_22-30.mp4');
    expect(result.success).toBe(true);
    expect(result.method).toBe('browser-download');
    expect(result.fileName).toBe('PromptStudio_2026-10-09_22-30.mp4');

    appendSpy.mockRestore();
    removeSpy.mockRestore();
  });
});
