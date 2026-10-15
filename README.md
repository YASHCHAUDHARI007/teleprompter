# PromptStudio — Professional Teleprompter & Camera Recording Studio

**PromptStudio** is a high-performance, studio-grade teleprompter and camera recording application built for college presentations, YouTube videos, executive talking-head updates, pitches, and educational content.

It places your script directly over your live camera preview adjacent to your webcam lens, allowing you to maintain natural, uninterrupted eye contact with your audience while reading your script.

---

## Key Features

1. **Camera Eye-Line Teleprompter Overlay (Mode A)**:
   - High-contrast script text transparently rendered directly over your live webcam preview.
   - Positioned at lens level (customizable 15%–55% from top) so your gaze stays locked on the camera.
   - Smooth, frame-rate independent scrolling powered by `requestAnimationFrame`.
   - Visual reading guide markers: Glowing Band, Neon Laser Line with arrows, Minimal Arrows, or Clean.
   - Reading Focus Mode: smoothly dims non-active text lines outside the active eye-line band.
   - Optical Mirroring toggle (`scaleX(-1)`) for physical glass beam-splitter teleprompter setups.

2. **Always-On-Top Floating Transparent Prompter (Mode B)**:
   - Electron companion mode provides an OS-level transparent, frameless window floating over Zoom, Google Meet, PowerPoint, or Keynote.
   - Optional click-through mode allowing you to interact with windows behind the script.
   - Fallback browser popout window mode via `?mode=floating`.

3. **High-Fidelity Audio & Video Recording Engine**:
   - Captures high-definition 1080p/720p webcam video synchronized with microphone audio.
   - Live Web Audio API VU volume meter (RMS level tracking).
   - Pre-recording countdown timer (0, 3, 5, or 10 seconds) with optional audio beeps.
   - Start, Pause, Resume, and Stop controls with live elapsed timer.
   - Accidental tab-close protection (`beforeunload`) while recording is active.

4. **Direct Desktop Saving & File System Access**:
   - **Desktop App (Electron)**: Saves completed video files directly to `~/Desktop/PromptStudio_Recordings/` with auto-generated unique timestamps and a "Show in Finder / Folder" button.
   - **Web Browser**: Uses the Chromium File System Access API (`showSaveFilePicker`) for direct folder export, with universal fallback to browser downloads.

5. **Script Management & Editor**:
   - Create, edit, rename, duplicate, and delete scripts with instant local IndexedDB autosave.
   - Live word count and dynamic speaking time estimation (based on standard 135 WPM rate).
   - One-click insertion of stage cues (`[Smile]`, `[Pause 2s]`, `[Look at camera]`, `[Emphasize]`), rendered as stylized chips inside the prompter.
   - Import and export `.txt` and `.md` files.
   - 4 built-in realistic starter scripts (College Presentation, YouTube Intro, Executive Update, Startup Pitch).

6. **Takes History & Review**:
   - Instant video review modal with player, duration, file size, and export options after each take.
   - Persistent Takes History drawer storing previous recordings locally for re-export or playback.

---

## Technology Stack

- **Frontend**: React 19, TypeScript, Vite 8
- **Styling**: Tailwind CSS v4, Lucide React Icons
- **Media**: Browser MediaDevices API & Web Audio API
- **Recording**: MediaRecorder API with VP9/VP8/H.264 auto-negotiation
- **Persistence**: IndexedDB (`PromptStudioDB`) + LocalStorage
- **Desktop Runtime**: Electron 44 with secure context isolation, sandboxed preload bridge, and IPC handlers

---

## Quick Start & Installation

### Prerequisites
- Node.js 18+ (tested on Node v20/v22/v26)
- npm 9+

### Installation
```bash
git clone <repo-url>
cd teleprompter
npm install
```

---

## Running the Application

### 1. Web Browser Mode (Fast Development)
Runs the application in any modern web browser:
```bash
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser (Google Chrome, Edge, Brave, Safari, or Firefox).

### 2. Desktop Mode (Electron Companion)
Runs the desktop application with native direct Desktop saving and transparent floating window:
```bash
npm run electron:dev
```

### 3. Production Build & Verification
```bash
npm run build
npm test
```

---

## Operating System Terminal Commands

### macOS
```bash
# Start Web Studio
npm run dev

# Start Native Desktop Studio
npm run electron:dev

# Run unit tests
npm test
```

### Windows (PowerShell / Command Prompt)
```powershell
# Start Web Studio
npm run dev

# Start Native Desktop Studio
npm run electron:dev

# Run unit tests
npm test
```

---

## Granting Camera & Microphone Permissions

1. **Browser**:
   - When PromptStudio launches, the browser will request permission to access your camera and microphone.
   - Click **Allow**.
   - If prompted or blocked, click the camera icon in your browser URL address bar and ensure both Camera and Microphone are set to **Allow**, then click **Grant / Retry Permissions** in PromptStudio.
2. **macOS System Permissions**:
   - Go to **System Settings > Privacy & Security > Camera** and verify your browser (or Electron) is checked.
   - Go to **System Settings > Privacy & Security > Microphone** and verify your browser (or Electron) is checked.

---

## Recording Studio Workflow

1. **Prepare**: Select a script from the sidebar or click **New Script** / **Script Editor** to write or paste your speech.
2. **Position**: In **Studio** mode, ensure your eyes align with the glowing Eye-Line guide near the top of the camera frame.
3. **Rehearse**: Press **Space** or click **Scroll** to practice speaking at your desired speed without recording. Adjust speed using the slider or `[` and `]`.
4. **Record Take**: Click the red **Record Take** button. The countdown (e.g. 3s) will chime, the teleprompter will automatically start scrolling, and your camera + mic will record.
5. **Review**: Click **Finish & Review**. Preview the take, verify audio, and see file size and duration.
6. **Save**: Click **Save Directly to Desktop** (or **Save Recording to Folder**). The video will be saved as `PromptStudio_<ScriptTitle>_<Timestamp>.webm`.
7. **Take Another Take**: Click **Record Another Take** to record another iteration without leaving the studio.

---

## Keyboard Shortcuts Reference

| Shortcut | Action |
| :--- | :--- |
| **Space** | Play / Pause Teleprompter scrolling |
| **R** | Restart teleprompter back to top |
| **[ / ]** | Decrease / Increase scroll speed |
| **Alt + Wheel** | Fine-tune scroll speed with mouse wheel |
| **F** | Toggle Reading Focus Mode (dims background text) |
| **M** | Toggle optical prompter horizontal mirroring |
| **Esc** | Close modals / Exit fullscreen |

*Note: Keyboard shortcuts are automatically paused while actively typing inside the script editor.*

---

## Supported Browsers & Limitations

| Platform / Browser | Camera & Mic | Teleprompter | Direct Desktop Save | Always-On-Top Floating Window |
| :--- | :--- | :--- | :--- | :--- |
| **Desktop App (Electron)** | Full 1080p | Full | **Native Direct Save** (`~/Desktop`) | **Genuine OS Transparent Window** |
| **Google Chrome / Edge / Brave** | Full 1080p | Full | File System Access API picker | In-app overlay / Browser popup |
| **Safari (macOS/iOS)** | Full | Full | Standard Download fallback | In-app overlay |
| **Firefox** | Full | Full | Standard Download fallback | In-app overlay |
