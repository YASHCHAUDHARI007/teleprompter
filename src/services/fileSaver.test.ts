import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateRecordingFileName, saveRecordingVideo } from './fileSaver';

describe('fileSaver service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('generates a valid filename with prefix, sanitized title, and timestamp', () => {
    const fileName = generateRecordingFileName('PromptStudio', 'College Defense Presentation #1');
    expect(fileName).toMatch(/^PromptStudio_College_Defense_[a-zA-Z0-9_]+_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.webm$/);
  });

  it('handles default prefix and undefined title gracefully', () => {
    const fileName = generateRecordingFileName();
    expect(fileName).toMatch(/^PromptStudio_Take_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.webm$/);
  });

  it('falls back to browser download when Electron and File System API are absent', async () => {
    // Mock Blob and document.createElement
    const blob = new Blob(['dummy video content'], { type: 'video/webm' });
    const appendSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => document.createElement('div') as any);
    const removeSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => document.createElement('div') as any);

    const result = await saveRecordingVideo(blob, 'test_take.webm');
    expect(result.success).toBe(true);
    expect(result.method).toBe('browser-download');
    expect(result.fileName).toBe('test_take.webm');

    appendSpy.mockRestore();
    removeSpy.mockRestore();
  });
});
