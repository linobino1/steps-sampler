import PadService from "./sample.ts";
import InstrumentsService from "../core/instruments.ts";
import BlobService from "./blobStore.ts";

// RECORDER
let mediaRecorder: MediaRecorder | undefined;
let recordingStartedAt = 0;
let hasTimesliceData = false;
let stopRequested = false;
const minimumRecordingDuration = 250;
const recordingTimeslice = 100;

async function setStream(): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    const reason = globalThis.isSecureContext
      ? "This browser does not support microphone recording."
      : "Microphone recording requires HTTPS.";
    throw new Error(reason);
  }

  return await navigator.mediaDevices.getUserMedia({ audio: true });
}

async function setupRecorder(
  id: number,
  _parentEl: Element,
): Promise<MediaRecorder> {
  const mediaDeviceStream = await setStream();
  if (typeof MediaRecorder === "undefined") {
    mediaDeviceStream.getTracks().forEach((track) => track.stop());
    throw new Error("This browser does not support audio recording.");
  }

  const mimeType = [
    "audio/webm;codecs=opus",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ].find((type) => MediaRecorder.isTypeSupported(type));
  const mediaRecorder = new MediaRecorder(
    mediaDeviceStream,
    mimeType ? { mimeType } : undefined,
  );

  let chunks: Array<Blob> = [];

  mediaRecorder.onstop = function (_e) {
    const blob = new Blob(chunks, { type: mediaRecorder.mimeType });
    console.debug({ size: blob.size, mimeType: blob.type });
    mediaDeviceStream.getTracks().forEach((track) => track.stop());
    const url = BlobService.storeBlob(blob, id);
    PadService.addSample(url, InstrumentsService.instruments[id]);

    // reset buffer
    chunks = [];
  };

  mediaRecorder.ondataavailable = function (e) {
    chunks.push(e.data);
    if (mediaRecorder.state === "recording" && e.data.size > 0) {
      hasTimesliceData = true;
      if (stopRequested) stopRecorder();
    }
  };

  return mediaRecorder;
}

// EXPORTS

async function startRecorder(id: number, parentEl: Element): Promise<boolean> {
  stopRequested = false;
  try {
    mediaRecorder = await setupRecorder(id, parentEl);
    hasTimesliceData = false;
    mediaRecorder.start(recordingTimeslice);
    recordingStartedAt = performance.now();
    if (stopRequested) stopRecorder();
    return true;
  } catch (error) {
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
