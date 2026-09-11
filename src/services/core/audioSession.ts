export type AudioSessionState = "idle" | "playback" | "recording";

interface PlaybackOutput {
  mute: boolean;
  volume: {
    value: number;
    rampTo(value: number, rampTime: number): unknown;
  };
}

interface AudioSessionControls {
  output: PlaybackOutput;
  contextState(): string;
  start(): Promise<void>;
  suspend(): Promise<void>;
}

const playbackFadeMs = 40;
const audioSessionTransitionMs = 60;
const playbackStartTimeoutMs = 1500;
const playbackRetryMs = 500;
const silentVolumeDb = -100;
let state: AudioSessionState = "idle";
let controls: AudioSessionControls | undefined;
let playbackVolumeBeforeRecording: number | undefined;
let starterInstalled = false;
let foreground = document.visibilityState !== "hidden";
let playbackRetry: ReturnType<typeof globalThis.setTimeout> | undefined;

function wait(milliseconds: number) {
  return new Promise<void>((resolve) =>
    globalThis.setTimeout(resolve, milliseconds)
  );
}

function getNativeAudioSession() {
  return (navigator as Navigator & {
    audioSession?: { state?: string; type: string };
  }).audioSession;
}

function applyAudioSessionType(type: "playback" | "play-and-record") {
  const audioSession = getNativeAudioSession();
  if (audioSession) audioSession.type = type;
}

function isRecording() {
  return state === "recording";
}

export function getAudioSessionState() {
  return state;
}

export function getAudioSessionDebugState() {
  const audioSession = getNativeAudioSession();
  return {
    appState: state,
    contextState: controls?.contextState(),
    foreground,
    nativeState: audioSession?.state,
    nativeType: audioSession?.type,
    retryScheduled: playbackRetry !== undefined,
    visibility: document.visibilityState,
  };
}

function clearPlaybackRetry() {
  if (playbackRetry === undefined) return;
  globalThis.clearTimeout(playbackRetry);
  playbackRetry = undefined;
}

function schedulePlaybackRetry() {
  if (!foreground || isRecording() || playbackRetry !== undefined) return;
  playbackRetry = globalThis.setTimeout(() => {
    playbackRetry = undefined;
    void startPlaybackAudioSession();
  }, playbackRetryMs);
}

export async function startPlaybackAudioSession(): Promise<boolean> {
  if (isRecording()) return false;
  if (!controls) throw new Error("Audio session is not configured.");

  clearPlaybackRetry();
  applyAudioSessionType("playback");
  const startAttempt = controls.start();
  let timeout: ReturnType<typeof globalThis.setTimeout> | undefined;
  const timedOut = new Promise<"timeout">((resolve) => {
    timeout = globalThis.setTimeout(
      () => resolve("timeout"),
      playbackStartTimeoutMs,
    );
  });
  const outcome = await Promise.race([
    startAttempt.then(
      () => "started" as const,
      () => "rejected" as const,
    ),
    timedOut,
  ]);
  if (timeout !== undefined) globalThis.clearTimeout(timeout);

  if (outcome === "timeout") {
    startAttempt.then(() => {
      if (!foreground || isRecording()) return;
      state = "playback";
      clearPlaybackRetry();
    }).catch(() => undefined);
    schedulePlaybackRetry();
    return false;
  }
  if (outcome === "rejected") return false;
  if (!isRecording()) state = "playback";
  return true;
}

async function restorePlaybackAudioSession() {
  if (!controls) return;

  try {
    applyAudioSessionType("playback");
    await wait(audioSessionTransitionMs);
    await controls.start().catch(() => undefined);

    const previousVolume = playbackVolumeBeforeRecording;
    if (previousVolume !== undefined) {
      controls.output.volume.value = silentVolumeDb;
      controls.output.mute = false;
      controls.output.volume.rampTo(previousVolume, playbackFadeMs / 1000);
      playbackVolumeBeforeRecording = undefined;
    }
  } finally {
    state = "playback";
  }
}

export async function beginRecordingAudioSession() {
  if (isRecording()) return;
  if (!controls) throw new Error("Audio session is not configured.");
  if (!navigator.mediaDevices?.getUserMedia) {
    const reason = globalThis.isSecureContext
      ? "This browser does not support microphone recording."
      : "Microphone recording requires HTTPS.";
    throw new Error(reason);
  }

  state = "recording";
  try {
    await controls.start();
    playbackVolumeBeforeRecording = controls.output.volume.value;
    controls.output.volume.rampTo(silentVolumeDb, playbackFadeMs / 1000);
    await wait(playbackFadeMs);
    controls.output.mute = true;
    await controls.suspend();
    applyAudioSessionType("play-and-record");
    return await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (error) {
    await restorePlaybackAudioSession();
    throw error;
  }
}

export async function endRecordingAudioSession(stream?: MediaStream) {
  stream?.getTracks().forEach((track) => {
    track.stop();
  });
  await restorePlaybackAudioSession();
}

export function configureAudioSession(nextControls: AudioSessionControls) {
  controls = nextControls;
  if (starterInstalled) return;
  starterInstalled = true;

  const requestStart = () => {
    // Autoplay policy can reject the load-time attempt; the next user gesture
    // retries synchronously while its user activation is still valid.
    startPlaybackAudioSession().catch(() => undefined);
  };

  requestStart();
  document.addEventListener("pointerdown", requestStart, true);
  document.addEventListener("keydown", requestStart, true);
  document.addEventListener("click", requestStart, true);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      enterBackground();
    } else {
      foreground = true;
      requestStart();
    }
  });
  globalThis.addEventListener("pagehide", enterBackground);
  globalThis.addEventListener("pageshow", () => {
    foreground = true;
    requestStart();
  });
}

function enterBackground() {
  if (!foreground) return;
  foreground = false;
  clearPlaybackRetry();
  if (isRecording() || !controls) return;

  state = "idle";
  // Start suspension before WebKit freezes the page. If it settles after the
  // app returns, immediately reconcile the context back to playback.
  controls.suspend().then(() => {
    if (foreground) void startPlaybackAudioSession();
  }).catch(() => undefined);
}

// Configure the session before Tone creates its AudioContext.
applyAudioSessionType("playback");
Object.defineProperty(globalThis, "stepsAudioDebug", {
  configurable: true,
  value: getAudioSessionDebugState,
});
