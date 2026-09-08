export default function enablePlayAndRecordAudioSession() {
  const audioSession = (navigator as Navigator & {
    audioSession?: { type: string };
  }).audioSession;
  if (audioSession) audioSession.type = "play-and-record";
}
