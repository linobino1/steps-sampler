import { context, Emitter, loaded, Loop, start, Transport } from "tone";
import ToneStore from "../../store/store.ts";
import InstrumentsService from "../core/instruments.ts";
import type { Instrument } from "../core/interfaces.ts";
import TriggersService, { type PlaybackPlan } from "./triggers.ts";
import GridService from "./grid.ts";
import PadService from "../sampling/sample.ts";

// SETTING SYNCS

interface TransportSettings {
  bpm: number;
  signature: string;
  swing: number;
}

export function configureTransport(
  transport: typeof Transport,
  settings: TransportSettings,
) {
  transport.bpm.value = settings.bpm;
  transport.timeSignature = parseInt(settings.signature);
  transport.swing = settings.swing / 100;
}

function syncBpm(val: number): void {
  Transport.bpm.value = val;
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
  Transport.cancel();
  scheduledEventIds.clear();
  syncSwing();
}

function syncSwing() {
  Transport.swing = ToneStore.getState().swing / 100;
}

function syncSignature() {
  Transport.timeSignature = parseInt(ToneStore.getState().signature);
}

const scheduledEventIds = new Set<number>();

export function schedulePlaybackPlan(
  transport: typeof Transport,
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
  scheduledEventIds.forEach((id) => Transport.clear(id));
  scheduledEventIds.clear();
  const plan = TriggersService.createPlaybackPlan(ToneStore.getState());
  Transport.setLoopPoints(0, `${plan.measures}m`);
  schedulePlaybackPlan(
    Transport,
    InstrumentsService.instruments,
    plan,
    true,
  ).forEach((id) => scheduledEventIds.add(id));
}

let playbackEventId: number | undefined;

function syncPlaybackSample() {
  const playback = ToneStore.getState().playbackSample;
  InstrumentsService.playbacks.forEach((pb) => pb.player.stop());
  if (playbackEventId !== undefined) {
    Transport.clear(playbackEventId);
    playbackEventId = undefined;
  }
  if (playback !== -1) {
    const i = InstrumentsService.playbacks[playback];
    playbackEventId = Transport.scheduleOnce(
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
  Transport.state === "stopped" && !transportStartPending
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
  Transport.stop();
}

async function startTransport() {
  const request = ++transportStartRequest;
  transportStartPending = true;
  try {
    if (context.state !== "running") {
      await start();
    }
    await loaded();
    if (request !== transportStartRequest) return;

    syncPlaybackSample();
    Transport.loop = true;
    Transport.start();
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
    stepEmitter.emit("step", (Transport.position as string).split(".")[0]);
  }, ToneStore.getState().resolution);
  stepper.start(0);

  Transport.on("stop", emitStopStep);
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
  configureTransport(Transport, ToneStore.getState());
  syncPlaybackPlan();

  unSubs = [
    ToneStore.subscribe(
      (state) => state.instrumentParams,
      syncInstrumentParams,
    ),
    ToneStore.subscribe((state) => state.activeTracks, syncTrackSettings),
    ToneStore.subscribe((state) => state.bpm, syncBpm),
    ToneStore.subscribe((state) => state.trackSettings, syncTrackSettings),
    ToneStore.subscribe((state) => state.resolution, syncStepEmitter),
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
  Transport.off("stop", emitStopStep);
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
