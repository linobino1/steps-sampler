type AudioSessionType = "playback" | "play-and-record";

let requestedType: AudioSessionType = "playback";

function applyAudioSessionType() {
  const audioSession = (navigator as Navigator & {
    audioSession?: { type: string };
  }).audioSession;
  if (audioSession) audioSession.type = requestedType;
}

export function enablePlaybackAudioSession() {
  requestedType = "playback";
  applyAudioSessionType();
}

export function enablePlayAndRecordAudioSession() {
  requestedType = "play-and-record";
  applyAudioSessionType();
}

export default applyAudioSessionType;

export function installAudioSessionStarter(startAudio: () => Promise<void>) {
  const requestStart = () => {
    // Autoplay policy can reject the load-time attempt; the next user gesture
    // retries synchronously while its user activation is still valid.
    startAudio().catch(() => undefined);
  };

  requestStart();
  document.addEventListener("pointerdown", requestStart, true);
  document.addEventListener("keydown", requestStart, true);
  document.addEventListener("click", requestStart, true);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") requestStart();
  });
  globalThis.addEventListener("pageshow", requestStart);
}

// Configure the session before Tone creates its AudioContext.
enablePlaybackAudioSession();
