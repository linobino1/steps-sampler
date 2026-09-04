import { Emitter, getDraw, getTransport, Loop, Synth } from "tone";
import ToneStore from "../../store/store.ts";
import InstrumentsService from "../core/instruments.ts";
import { parseGridSignature } from "./time.ts";

const METRONOME_DELAY_SECONDS = 0.01;
const emitter = new Emitter();
const synth = new Synth({
  oscillator: { type: "triangle" },
  envelope: { attack: 0.001, decay: 0.03, sustain: 0, release: 0.01 },
}).toDestination();
synth.volume.value = -10;

let enabled = false;
let loop: Loop | null = null;
let beaterDirection = -1;

function getInterval() {
  const [, denominator] = parseGridSignature(ToneStore.getState().signature);
  return denominator === 8 ? "8n" : "4n";
}

function syncInterval() {
  if (loop) loop.interval = getInterval();
}

function init() {
  loop = new Loop((time) => {
    if (!enabled) return;

    const transport = getTransport();
    const [numerator, denominator] = parseGridSignature(
      ToneStore.getState().signature,
    );
    const ticksPerBeat = transport.PPQ * 4 / denominator;
    const beat = Math.round(transport.getTicksAtTime(time) / ticksPerBeat) %
      numerator;
    const accent = beat === 0;

    synth.triggerAttackRelease(
      accent ? "C6" : "C5",
      "32n",
      time + METRONOME_DELAY_SECONDS,
      accent ? 0.9 : 0.55,
    );
    getDraw().schedule(() => {
      if (!enabled || getTransport().state !== "started") return;
      emitter.emit("beat", beaterDirection);
      beaterDirection *= -1;
    }, time);
  }, getInterval()).start(0);
  getTransport().on("stop", resetBeater);
}

function dispose() {
  loop?.dispose();
  loop = null;
  getTransport().off("stop", resetBeater);
}

function setEnabled(nextEnabled: boolean) {
  enabled = nextEnabled;
  if (enabled) void InstrumentsService.startAudio();
  if (!enabled) emitter.emit("stop");
}

function isEnabled() {
  return enabled;
}

function resetBeater() {
  beaterDirection = -1;
  emitter.emit("stop");
}

const MetronomeService = {
  init,
  dispose,
  emitter,
  isEnabled,
  setEnabled,
  syncInterval,
};

export default MetronomeService;
