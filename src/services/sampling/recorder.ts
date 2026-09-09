import PadService from "./sample.ts";
import InstrumentsService from "../core/instruments.ts";
import BlobService from "./blobStore.ts";
import {
  beginRecordingAudioSession,
  endRecordingAudioSession,
  getAudioSessionState,
} from "../core/audioSession.ts";

// RECORDER
let mediaRecorder: MediaRecorder | undefined;
let recordingStartedAt = 0;
let hasTimesliceData = false;
let stopRequested = false;
const minimumRecordingDuration = 250;
const recordingTimeslice = 100;

async function setupRecorder(
  id: number,
  _parentEl: Element,
): Promise<MediaRecorder | undefined> {
  const mediaDeviceStream = await beginRecordingAudioSession();
  if (!mediaDeviceStream) return;
  if (stopRequested) {
    await endRecordingAudioSession(mediaDeviceStream);
    return;
  }
  if (typeof MediaRecorder === "undefined") {
    await endRecordingAudioSession(mediaDeviceStream);
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
    await endRecordingAudioSession(mediaDeviceStream);
    throw error;
  }

  let chunks: Array<Blob> = [];

  recorder.onstop = async function (_e) {
    try {
      await endRecordingAudioSession(mediaDeviceStream);
    } finally {
      if (mediaRecorder === recorder) mediaRecorder = undefined;
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
  if (getAudioSessionState() === "recording") return false;

  stopRequested = false;
  let recorder: MediaRecorder | undefined;
  try {
    recorder = await setupRecorder(id, parentEl);
    if (!recorder) return false;
    mediaRecorder = recorder;
    hasTimesliceData = false;
    mediaRecorder.start(recordingTimeslice);
    recordingStartedAt = performance.now();
    if (stopRequested) stopRecorder();
    return true;
  } catch (error) {
    if (recorder) await endRecordingAudioSession(recorder.stream);
    mediaRecorder = undefined;
    console.error("Unable to start sample recording:", error);
    return false;
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
