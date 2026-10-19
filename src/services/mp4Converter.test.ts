import { describe, it, expect } from 'vitest';
import {
  isDirectMp4RecordingSupported,
  getOptimalRecordingMimeType,
  ensureMp4Blob,
} from './mp4Converter';

describe('mp4Converter service', () => {
  it('detects recording support without throwing', () => {
    const isSupported = isDirectMp4RecordingSupported();
    expect(typeof isSupported).toBe('boolean');
  });

  it('provides optimal recording MIME type string or fallback', () => {
    const mime = getOptimalRecordingMimeType();
    expect(typeof mime).toBe('string');
  });

  it('preserves existing mp4 blobs directly without conversion overhead', async () => {
    const sourceBlob = new Blob(['video payload'], { type: 'video/mp4;codecs=avc1' });
    const { mp4Blob, isConverted } = await ensureMp4Blob(sourceBlob);

    expect(isConverted).toBe(false);
    expect(mp4Blob.type).toContain('mp4');
  });

  it('wraps webm blobs into mp4 container when invoked in browser mode', async () => {
    const sourceBlob = new Blob(['webm payload'], { type: 'video/webm' });
    let progressReached = false;

    const { mp4Blob } = await ensureMp4Blob(sourceBlob, (p) => {
      if (p.percent > 0) progressReached = true;
    });

    expect(mp4Blob.type).toBe('video/mp4');
    expect(progressReached).toBe(true);
  });
});
