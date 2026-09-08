export default function enablePlayAndRecordAudioSession() {
  const audioSession = (navigator as Navigator & {
    audioSession?: { type: string };
  }).audioSession;
  if (audioSession) audioSession.type = "play-and-record";
}

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
enablePlayAndRecordAudioSession();
