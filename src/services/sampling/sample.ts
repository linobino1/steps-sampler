import { Instrument } from "../core/interfaces.ts";
import useToneStore from "../../store/store.ts";
import InstrumentsService from "../core/instruments.ts";
import BlobService from "./blobStore.ts";

let savedSamplesLoaded = false;

function loadSavedSamples() {
  if (savedSamplesLoaded) return;
  savedSamplesLoaded = true;

  InstrumentsService.instruments.forEach(async (instrument) => {
    const audioURL = await BlobService.loadBlob(instrument.id);
    if (audioURL) {
      addSample(audioURL, instrument);
    }
  });
}

function addSample(audioURL: string, instrument: Instrument) {
  instrument.source = audioURL;
  instrument.playHigh?.load(instrument.source);
  instrument.playLow?.load(instrument.source);
  if (instrument.playHigh) {
    instrument.playHigh.buffer.onload = () =>
      useToneStore.getState().setInstrumentParams(instrument.id, {
        audioUrl: audioURL,
      });
  }
}

function removeSample(id: number) {
  const inst = InstrumentsService.instruments[id];
  BlobService.deleteBlob(inst.id);
  inst.source = undefined; // this should be handled by resest of instrument params
  useToneStore.getState().setInstrumentParams(inst.id);
}

async function replaceSavedSamples(
  dataUrls: Map<number, string>,
  persist = true,
) {
  const padIds = InstrumentsService.pads.map((pad) => pad.id);
  if (persist) BlobService.replaceDataUrls(dataUrls, padIds);

  for (const instrument of InstrumentsService.pads) {
    const oldUrl = instrument.source;
    if (oldUrl?.startsWith("blob:")) URL.revokeObjectURL(oldUrl);

    instrument.playHigh?.stop();
    instrument.playLow?.stop();
    instrument.source = undefined;

    const dataUrl = dataUrls.get(instrument.id);
    if (dataUrl) {
      const blob = await (await fetch(dataUrl)).blob();
      addSample(URL.createObjectURL(blob), instrument);
    }
  }
}

const SampleService = {
  loadSavedSamples,
  addSample,
  removeSample,
  replaceSavedSamples,
};

export default SampleService;
