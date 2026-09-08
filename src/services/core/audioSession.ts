export default function enablePlayAndRecordAudioSession() {
  const audioSession = (navigator as Navigator & {
    audioSession?: { type: string };
  }).audioSession;
  if (audioSession) audioSession.type = "play-and-record";
}

// Configure the session before Tone creates its AudioContext, then restore the
// mode when an installed iOS app returns from the background.
enablePlayAndRecordAudioSession();
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    enablePlayAndRecordAudioSession();
  }
});
globalThis.addEventListener("pageshow", enablePlayAndRecordAudioSession);
