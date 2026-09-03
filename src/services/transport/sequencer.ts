import { Emitter, getTransport, loaded, Loop } from "tone";
import ToneStore, { type GridResolutions } from "../../store/store.ts";
import InstrumentsService from "../core/instruments.ts";
import type { Instrument } from "../core/interfaces.ts";
import TriggersService, { type PlaybackPlan } from "./triggers.ts";
import GridService from "./grid.ts";
import PadService from "../sampling/sample.ts";
import { type GridSignature, signatureToToneTime } from "./time.ts";

// SETTING SYNCS

interface TransportSettings {
  bpm: number;
  signature: GridSignature;
  swing: number;
  resolution: GridResolutions;
}

export function configureTransport(
  transport: ReturnType<typeof getTransport>,
  settings: TransportSettings,
) {
  transport.bpm.value = settings.bpm;
  transport.timeSignature = signatureToToneTime(settings.signature);
  transport.swing = settings.swing / 100;
  transport.swingSubdivision = settings.resolution === "16n" ? "16n" : "8n";
}

function syncBpm(val: number): void {
  getTransport().bpm.value = val;
}

function syncTrackSettings() {
  const state = ToneStore.getState();
  InstrumentsService.syncTrackSettings(
    state.trackSettings,
    state.activeTracks,
  );
}

function syncInstrumentParams() {
  InstrumentsService.syncParams(ToneStore.getState().instrumentParams);
}

// START-STOP CONTROLS

function clearTransport() {
  getTransport().cancel();
  scheduledEventIds.clear();
  syncSwing();
}

function syncSwing() {
  getTransport().swing = ToneStore.getState().swing / 100;
}

function syncSwingSubdivision() {
  getTransport().swingSubdivision = ToneStore.getState().resolution === "16n"
    ? "16n"
    : "8n";
}

function syncSignature() {
  getTransport().timeSignature = signatureToToneTime(
    ToneStore.getState().signature,
  );
}

const scheduledEventIds = new Set<number>();

export function schedulePlaybackPlan(
  transport: ReturnType<typeof getTransport>,
  instruments: Array<Instrument>,
  plan: PlaybackPlan,
  notify = false,
) {
  const eventIds: Array<number> = [];
  plan.instrumentEvents.forEach((event) => {
    eventIds.push(transport.schedule((time) => {
      InstrumentsService.triggerInstrument(
        instruments,
        event.instrumentId,
        event.emphasis,
        time,
        notify,
      );
    }, event.time));
  });
  plan.chordEvents.forEach((event) => {
    eventIds.push(transport.schedule((time) => {
      instruments[InstrumentsService.chords.id].playSampler
        ?.triggerAttackRelease(event.notes, 0.6, time);
    }, event.time));
  });
  return eventIds;
}

function syncPlaybackPlan() {
  const transport = getTransport();
  scheduledEventIds.forEach((id) => transport.clear(id));
  scheduledEventIds.clear();
  const plan = TriggersService.createPlaybackPlan(ToneStore.getState());
  transport.setLoopPoints(0, `${plan.measures}m`);
  schedulePlaybackPlan(
    transport,
    InstrumentsService.instruments,
    plan,
    true,
  ).forEach((id) => scheduledEventIds.add(id));
}

let playbackEventId: number | undefined;

function syncPlaybackSample() {
  const transport = getTransport();
  const playback = ToneStore.getState().playbackSample;
  InstrumentsService.playbacks.forEach((pb) => pb.player.stop());
  if (playbackEventId !== undefined) {
    transport.clear(playbackEventId);
    playbackEventId = undefined;
  }
  if (playback !== -1) {
    const i = InstrumentsService.playbacks[playback];
    playbackEventId = transport.scheduleOnce(
      (time) => {
        if (i.player.loaded) i.player.start(time);
      },
      "0:0:0",
    );
  }
}

let transportStartPending = false;
let transportStartRequest = 0;

function toggleTransport(): void {
  getTransport().state === "stopped" && !transportStartPending
    ? startTransport()
    : stopTransport();
}

function stopTransport() {
  transportStartPending = false;
  transportStartRequest++;
  InstrumentsService.playbacks.forEach((pb) => pb.player.stop());
  InstrumentsService.pads.forEach((pad) => {
    pad.sampleVolume.mute = true;
    pad.playHigh?.stop();
    pad.playLow?.stop();
  });
  getTransport().stop();
}

async function startTransport() {
  const request = ++transportStartRequest;
  transportStartPending = true;
  try {
    await InstrumentsService.startAudio();
    await loaded();
    if (request !== transportStartRequest) return;

    syncPlaybackSample();
    const transport = getTransport();
    transport.loop = true;
    transport.start();
  } finally {
    if (request === transportStartRequest) transportStartPending = false;
  }
}

function handleTransportKeydown(e: KeyboardEvent) {
  if (e.code !== "Space" || e.repeat) return;

  e.preventDefault();
  toggleTransport();
}

function addKeyboardListener() {
  document.addEventListener("keydown", handleTransportKeydown);
}

// EMITTERS

const stepEmitter = new Emitter();
let stepper: Loop | null;

function syncStepEmitter() {
  if (stepper) {
    stepper.interval = ToneStore.getState().resolution;
  }
}

function linkStepEmitter() {
  stepper = new Loop((_time) => {
    stepEmitter.emit(
      "step",
      (getTransport().position as string).split(".")[0],
    );
  }, ToneStore.getState().resolution);
  stepper.start(0);

  getTransport().on("stop", emitStopStep);
}

function emitStopStep() {
  stepEmitter.emit("step", "stop");
}

// INIT

let unSubs: Array<() => void> = [];

function initSequencer() {
  unsubSequencerSubscriptions();
  clearTransport();
  linkStepEmitter();
  addKeyboardListener();
  InstrumentsService.connectInstruments();
  PadService.loadSavedSamples();
  GridService.setGridTimeIds();

  syncInstrumentParams();
  syncTrackSettings();
  configureTransport(getTransport(), ToneStore.getState());
  syncPlaybackPlan();

  unSubs = [
    ToneStore.subscribe(
      (state) => state.instrumentParams,
      syncInstrumentParams,
    ),
    ToneStore.subscribe((state) => state.activeTracks, syncTrackSettings),
    ToneStore.subscribe((state) => state.bpm, syncBpm),
    ToneStore.subscribe((state) => state.trackSettings, syncTrackSettings),
    ToneStore.subscribe((state) => state.trackSettings, syncPlaybackPlan),
    ToneStore.subscribe((state) => state.resolution, () => {
      syncSwingSubdivision();
      syncStepEmitter();
    }),
    ToneStore.subscribe((state) => state.signature, syncSignature),
    ToneStore.subscribe((state) => state.swing, syncSwing),
    ToneStore.subscribe((state) => state.playbackSample, syncPlaybackSample),
    // visual grid
    ToneStore.subscribe(
      (state) => state.activeBars,
      GridService.setGridTimeIds,
    ),
    ToneStore.subscribe(
      (state) => state.resolution,
      GridService.setGridTimeIds,
    ),
    ToneStore.subscribe((state) => state.signature, GridService.setGridTimeIds),
    // scheduled triggers
    ToneStore.subscribe(
      (state) => state.activeBars,
      syncPlaybackPlan,
    ),
    ToneStore.subscribe(
      (state) => state.resolution,
      syncPlaybackPlan,
    ),
    ToneStore.subscribe(
      (state) => state.signature,
      syncPlaybackPlan,
    ),
    ToneStore.subscribe(
      (state) => state.scheduledEvents,
      syncPlaybackPlan,
    ),

    ToneStore.subscribe(
      (state) => state.songArrangement,
      syncPlaybackPlan,
    ),
  ];
}

function unsubSequencerSubscriptions() {
  transportStartPending = false;
  transportStartRequest++;
  unSubs.forEach((unsub) => unsub());
  unSubs = [];
  stepper?.dispose();
  stepper = null;
  getTransport().off("stop", emitStopStep);
  document.removeEventListener("keydown", handleTransportKeydown);
}

const SequencerService = {
  initSequencer,
  unsubSequencerSubscriptions,
  stepEmitter,
  clearTransport,
  stopTransport,
  toggleTransport,
};

export default SequencerService;
