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
  start(): Promise<void>;
  suspend(): Promise<void>;
}

const playbackFadeMs = 40;
const audioSessionTransitionMs = 60;
const silentVolumeDb = -100;
let state: AudioSessionState = "idle";
let controls: AudioSessionControls | undefined;
let playbackVolumeBeforeRecording: number | undefined;
let starterInstalled = false;
let playbackRecoveryNeeded = false;
let playbackRecovery: Promise<void> | undefined;

function wait(milliseconds: number) {
  return new Promise<void>((resolve) =>
    globalThis.setTimeout(resolve, milliseconds)
  );
}

function applyAudioSessionType(type: "playback" | "play-and-record") {
  const audioSession = (navigator as Navigator & {
    audioSession?: { type: string };
  }).audioSession;
  if (audioSession) audioSession.type = type;
}

function isRecording() {
  return state === "recording";
}

export function getAudioSessionState() {
  return state;
}

async function recoverPlaybackAudioSession() {
  if (!controls) return;

  const wasMuted = controls.output.mute;
  controls.output.mute = true;
  try {
    await controls.suspend();
    await controls.start();
    playbackRecoveryNeeded = false;
  } finally {
    controls.output.mute = wasMuted;
  }
}

export async function startPlaybackAudioSession() {
  if (isRecording()) return;
  if (!controls) throw new Error("Audio session is not configured.");

  applyAudioSessionType("playback");
  if (playbackRecoveryNeeded) {
    playbackRecovery ??= recoverPlaybackAudioSession().finally(() => {
      playbackRecovery = undefined;
    });
    await playbackRecovery;
  } else {
    await controls.start();
  }
  if (!isRecording()) state = "playback";
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
      playbackRecoveryNeeded = true;
    } else {
      requestStart();
    }
  });
  globalThis.addEventListener("pagehide", () => {
    playbackRecoveryNeeded = true;
  });
  globalThis.addEventListener("pageshow", requestStart);
}

// Configure the session before Tone creates its AudioContext.
applyAudioSessionType("playback");
