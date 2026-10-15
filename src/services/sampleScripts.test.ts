import { describe, it, expect } from 'vitest';
import { SAMPLE_SCRIPTS } from './sampleScripts';
import { DEFAULT_SETTINGS } from './defaultSettings';

describe('Sample Scripts & Default Settings', () => {
  it('contains expected starter scripts covering all major use cases', () => {
    expect(SAMPLE_SCRIPTS.length).toBeGreaterThanOrEqual(4);
    
    const categories = SAMPLE_SCRIPTS.map((s) => s.category);
    expect(categories).toContain('presentation');
    expect(categories).toContain('youtube');
    expect(categories).toContain('talking-head');
    expect(categories).toContain('pitch');
  });

  it('each sample script contains valid word count and stage directions', () => {
    for (const script of SAMPLE_SCRIPTS) {
      expect(script.title.length).toBeGreaterThan(5);
      expect(script.wordCount).toBeGreaterThan(50);
      expect(script.estimatedDurationSec).toBeGreaterThan(30);
      // Verify stage directions format e.g. [Pause ...]
      expect(script.content).toMatch(/\[.*\]/);
    }
  });

  it('default studio settings have proper production baseline values', () => {
    expect(DEFAULT_SETTINGS.fontSize).toBe(34);
    expect(DEFAULT_SETTINGS.scrollSpeed).toBeGreaterThan(1);
    expect(DEFAULT_SETTINGS.countdownSec).toBe(3);
    expect(DEFAULT_SETTINGS.readingGuideStyle).toBe('band');
    expect(DEFAULT_SETTINGS.readingGuidePosition).toBe(28);
    expect(DEFAULT_SETTINGS.wordsPerMinute).toBe(135);
  });
});
