import PadService from "./sample.ts";
import InstrumentsService from "../core/instruments.ts";
import BlobService from "./blobStore.ts";

// RECORDER
let mediaRecorder: MediaRecorder | undefined;

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

  const mediaRecorder = new MediaRecorder(mediaDeviceStream);

  let chunks: Array<Blob> = [];

  mediaRecorder.onstop = function (_e) {
    const blob = new Blob(chunks, { type: "audio/ogg; codecs=opus" });
    const url = BlobService.storeBlob(blob, id);
    PadService.addSample(url, InstrumentsService.instruments[id]);
    mediaDeviceStream.getTracks().forEach((track) => track.stop());

    // reset buffer
    chunks = [];
  };

  mediaRecorder.ondataavailable = function (e) {
    chunks.push(e.data);
  };

  return mediaRecorder;
}

// EXPORTS

async function startRecorder(id: number, parentEl: Element): Promise<boolean> {
  try {
    mediaRecorder = await setupRecorder(id, parentEl);
    mediaRecorder.start();
    return true;
  } catch (error) {
    mediaRecorder = undefined;
    console.error("Unable to start sample recording:", error);
    return false;
  }
}

function stopRecorder() {
  if (mediaRecorder) {
    mediaRecorder.stop();
  }
}

const api = {
  startRecorder,
  stopRecorder,
};

export default api;
