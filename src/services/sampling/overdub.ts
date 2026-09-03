import { getTransport } from "tone";
import useToneStore from "../../store/store.ts";
import InstrumentsService from "../core/instruments.ts";
import BlobService from "./blobStore.ts";
import PadService from "./sample.ts";

async function saveRecording() {
  getTransport().off("stop", saveRecording);
  const blob = await InstrumentsService.keyboardRecorder.stop();
  const url = BlobService.storeBlob(blob, InstrumentsService.overdub.id);
  PadService.addSample(url, InstrumentsService.overdub);
  useToneStore.getState().addTriggerEvent(
    "0:0:0",
    InstrumentsService.overdub.id,
    true,
  );
}

async function recordOverdub() {
  await InstrumentsService.startAudio();

  await InstrumentsService.keyboardRecorder.start();
  const transport = getTransport();
  transport.on("stop", saveRecording);
  transport.start().stop(`+${useToneStore.getState().activeBars}:0:0`);
}

function deleteOverdub() {
  BlobService.deleteBlob(InstrumentsService.overdub.id);
  PadService.removeSample(InstrumentsService.overdub.id); // TODO this should remove schedules?
  useToneStore.getState().removeTriggerEvent(
    "0:0:0",
    InstrumentsService.overdub.id,
  );
}

const OverdubService = {
  recordOverdub,
  deleteOverdub,
};

export default OverdubService;
