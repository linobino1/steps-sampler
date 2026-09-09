import PadService from "./sample.ts";
import InstrumentsService from "../core/instruments.ts";
import BlobService from "./blobStore.ts";
import { getContext } from "tone";
import {
  enablePlaybackAudioSession,
  enablePlayAndRecordAudioSession,
} from "../core/audioSession.ts";

// RECORDER
let mediaRecorder: MediaRecorder | undefined;
let recordingInProgress = false;
let recordingStartedAt = 0;
let hasTimesliceData = false;
let stopRequested = false;
const minimumRecordingDuration = 250;
const recordingTimeslice = 100;
const playbackFadeMs = 40;
const audioSessionTransitionMs = 60;
const silentVolumeDb = -100;
let playbackVolumeBeforeRecording: number | undefined;

function wait(milliseconds: number) {
  return new Promise<void>((resolve) =>
    globalThis.setTimeout(resolve, milliseconds)
  );
}

async function mutePlaybackForRecording() {
  const masterVolume = InstrumentsService.masterVolume;
  playbackVolumeBeforeRecording ??= masterVolume.volume.value;
  masterVolume.volume.rampTo(silentVolumeDb, playbackFadeMs / 1000);
  await wait(playbackFadeMs);
  masterVolume.mute = true;
  console.debug("Playback muted for recording");
}

async function restorePlayback() {
  const previousVolume = playbackVolumeBeforeRecording;
  if (previousVolume === undefined) return;

  await wait(audioSessionTransitionMs);
  await InstrumentsService.startAudio().catch(() => undefined);
  const masterVolume = InstrumentsService.masterVolume;
  masterVolume.volume.value = silentVolumeDb;
  masterVolume.mute = false;
  masterVolume.volume.rampTo(previousVolume, playbackFadeMs / 1000);
  playbackVolumeBeforeRecording = undefined;
  console.debug("Playback unmuted after recording");
}

async function endCapture(stream?: MediaStream) {
  enablePlaybackAudioSession();
  stream?.getTracks().forEach((track) => {
    track.stop();
  });
  await restorePlayback();
}

async function setStream(): Promise<MediaStream | undefined> {
  if (!navigator.mediaDevices?.getUserMedia) {
    const reason = globalThis.isSecureContext
      ? "This browser does not support microphone recording."
      : "Microphone recording requires HTTPS.";
    throw new Error(reason);
  }

  await InstrumentsService.startAudio();
  await mutePlaybackForRecording();
  try {
    const rawContext = getContext().rawContext;
    if ("suspend" in rawContext) await (rawContext as AudioContext).suspend();
    if (stopRequested) {
      await endCapture();
      return;
    }

    enablePlayAndRecordAudioSession();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    if (stopRequested) {
      await endCapture(stream);
      return;
    }
    return stream;
  } catch (error) {
    await endCapture();
    throw error;
  }
}

async function disposeRecorderStream(stream: MediaStream) {
  await endCapture(stream);
}

async function setupRecorder(
  id: number,
  _parentEl: Element,
): Promise<MediaRecorder | undefined> {
  const mediaDeviceStream = await setStream();
  if (!mediaDeviceStream) return;
  if (typeof MediaRecorder === "undefined") {
    await disposeRecorderStream(mediaDeviceStream);
    throw new Error("This browser does not support audio recording.");
  }

  const mimeType = [
    "audio/webm;codecs=opus",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ].find((type) => MediaRecorder.isTypeSupported(type));
  let recorder: MediaRecorder;
  try {
    recorder = new MediaRecorder(
      mediaDeviceStream,
      mimeType ? { mimeType } : undefined,
    );
  } catch (error) {
    await disposeRecorderStream(mediaDeviceStream);
    throw error;
  }

  let chunks: Array<Blob> = [];

  recorder.onstop = async function (_e) {
    try {
      await disposeRecorderStream(mediaDeviceStream);
    } finally {
      if (mediaRecorder === recorder) mediaRecorder = undefined;
      recordingInProgress = false;
    }
    const blob = new Blob(chunks, { type: recorder.mimeType });
    const url = BlobService.storeBlob(blob, id);
    PadService.addSample(url, InstrumentsService.instruments[id]);

    // reset buffer
    chunks = [];
  };

  recorder.ondataavailable = function (e) {
    chunks.push(e.data);
    if (recorder.state === "recording" && e.data.size > 0) {
      hasTimesliceData = true;
      if (stopRequested) stopRecorder();
    }
  };

  return recorder;
}

// EXPORTS

async function startRecorder(id: number, parentEl: Element): Promise<boolean> {
  if (recordingInProgress) return false;

  recordingInProgress = true;
  stopRequested = false;
  let recorder: MediaRecorder | undefined;
  let started = false;
  try {
    recorder = await setupRecorder(id, parentEl);
    if (!recorder) return false;
    mediaRecorder = recorder;
    hasTimesliceData = false;
    mediaRecorder.start(recordingTimeslice);
    recordingStartedAt = performance.now();
    started = true;
    if (stopRequested) stopRecorder();
    return true;
  } catch (error) {
    if (recorder) await disposeRecorderStream(recorder.stream);
    mediaRecorder = undefined;
    console.error("Unable to start sample recording:", error);
    return false;
  } finally {
    if (!started) recordingInProgress = false;
  }
}

function stopRecorder() {
  stopRequested = true;
  if (!mediaRecorder || mediaRecorder.state !== "recording") return;

  const recorder = mediaRecorder;
  const remaining = minimumRecordingDuration -
    (performance.now() - recordingStartedAt);
  if (remaining > 0) {
    globalThis.setTimeout(() => {
      if (recorder.state === "recording") stopRecorder();
    }, remaining);
  } else if (hasTimesliceData) {
    recorder.stop();
  }
}

const api = {
  startRecorder,
  stopRecorder,
};

export default api;
