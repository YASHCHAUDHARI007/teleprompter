import type { Script, StudioSettings, RecordingHistoryItem } from '../types';
import { SAMPLE_SCRIPTS } from './sampleScripts';
import { DEFAULT_SETTINGS } from './defaultSettings';

const DB_NAME = 'PromptStudioDB';
const DB_VERSION = 1;
const STORE_SCRIPTS = 'scripts';
const STORE_RECORDINGS = 'recordings';
const SETTINGS_KEY = 'promptstudio_settings_v1';

class StorageService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_SCRIPTS)) {
          const scriptStore = db.createObjectStore(STORE_SCRIPTS, { keyPath: 'id' });
          scriptStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORE_RECORDINGS)) {
          const recStore = db.createObjectStore(STORE_RECORDINGS, { keyPath: 'id' });
          recStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  // SCRIPTS
  async getScripts(): Promise<Script[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_SCRIPTS, 'readonly');
        const store = tx.objectStore(STORE_SCRIPTS);
        const req = store.getAll();

        req.onsuccess = () => {
          let scripts = req.result as Script[];
          if (!scripts || scripts.length === 0) {
            // Seed with sample scripts
            this.seedSampleScripts().then((seeded) => resolve(seeded));
          } else {
            // Sort by updatedAt descending
            scripts.sort((a, b) => b.updatedAt - a.updatedAt);
            resolve(scripts);
          }
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      // Fallback in case IndexedDB is restricted
      const stored = localStorage.getItem('promptstudio_scripts');
      if (stored) {
        return JSON.parse(stored);
      }
      return SAMPLE_SCRIPTS;
    }
  }

  async saveScript(script: Script): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SCRIPTS, 'readwrite');
      const store = tx.objectStore(STORE_SCRIPTS);
      const req = store.put(script);
      req.onsuccess = () => {
        // Also mirror to localStorage metadata
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  }

  async deleteScript(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SCRIPTS, 'readwrite');
      const store = tx.objectStore(STORE_SCRIPTS);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  private async seedSampleScripts(): Promise<Script[]> {
    const db = await this.getDB();
    const tx = db.transaction(STORE_SCRIPTS, 'readwrite');
    const store = tx.objectStore(STORE_SCRIPTS);
    for (const s of SAMPLE_SCRIPTS) {
      store.put(s);
    }
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve(SAMPLE_SCRIPTS);
    });
  }

  // SETTINGS
  getSettings(): StudioSettings {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Failed to load settings from localStorage', e);
    }
    return DEFAULT_SETTINGS;
  }

  saveSettings(settings: StudioSettings): void {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save settings to localStorage', e);
    }
  }

  // RECORDINGS HISTORY
  async getRecordings(): Promise<RecordingHistoryItem[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_RECORDINGS, 'readonly');
        const store = tx.objectStore(STORE_RECORDINGS);
        const req = store.getAll();

        req.onsuccess = () => {
          const recs = (req.result as RecordingHistoryItem[]) || [];
          recs.sort((a, b) => b.timestamp - a.timestamp);
          resolve(recs);
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      return [];
    }
  }

  async saveRecording(recording: RecordingHistoryItem): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_RECORDINGS, 'readwrite');
        const store = tx.objectStore(STORE_RECORDINGS);
        const req = store.put(recording);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.error('Failed to save recording to IndexedDB', e);
    }
  }

  async deleteRecording(id: string): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_RECORDINGS, 'readwrite');
        const store = tx.objectStore(STORE_RECORDINGS);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.error('Failed to delete recording', e);
    }
  }
}

export const storageService = new StorageService();
