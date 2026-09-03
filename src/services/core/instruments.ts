import {
  context,
  now,
  PitchShift,
  Player,
  Recorder,
  Sampler,
  ToneAudioBuffer,
  ToneAudioNode,
  start,
  Volume,
} from "tone";
import {
  EnvelopeParam,
  Instrument,
  InstrumentDefn,
  InstrumentParams,
  InstrumentType,
  TrackParams,
} from "./interfaces.ts";

// GLOBAL NODES

const controlRoomRecorder = new Recorder();
const keyboardRecorder = new Recorder();
const masterVolume = new Volume(0).toDestination();

// SEQUENCED INST

const instDef: Array<InstrumentDefn> = [
  {
    type: InstrumentType.stock,
    name: "kick",
    source: "/sounds/kick70.mp3",
    offset: 0.053,
  },
  {
    type: InstrumentType.stock,
    name: "snare",
    source: "/sounds/snare.mp3",
    offset: 0.05,
  },
  {
    type: InstrumentType.stock,
    name: "hat",
    source: "/sounds/highhat.mp3",
    offset: 0.06,
  },
  { type: InstrumentType.pad, name: "1" },
  { type: InstrumentType.pad, name: "2" },
  { type: InstrumentType.pad, name: "3" },
  // { type: InstrumentType.pad, name: '4' },
  { type: InstrumentType.chords, name: "C" },
  // { type: InstrumentType.overdub, name: 'overdub' },
];

const instruments: Array<Instrument> = instDef.map((defn, index) => {
  let inst: Instrument = {
    ...defn,
    id: index,
    channelVolume: new Volume(0),
    effectInput: new Volume(0),
    sampleVolume: new Volume(0), // only used for pads atm
  };
  if (inst.type === InstrumentType.stock) {
    const drumDefaults = { duration: 2, fadeOut: 0.2 };
    inst = { ...inst, ...drumDefaults };
    if (inst.name === "kick") {
      inst.duration = 0.5;
    }
  }
  return inst;
});

// PLAYABLE INST

const playbacks = [
  {
    name: "C minor",
    player: new Player("sounds/playCm_70.mp3").fan(masterVolume),
    bpm: 70,
  },
  {
    name: "Tanzbär",
    player: new Player("sounds/playTanzbaer85.mp3").fan(masterVolume),
    bpm: 85,
  },
  {
    name: "BlackKeys",
    player: new Player("sounds/playBlackKeys98.mp3").fan(masterVolume),
    bpm: 98,
  },
  {
    name: "GuitarBass",
    player: new Player("sounds/playGuitarBass90.mp3").fan(masterVolume),
    bpm: 90,
  },
];

interface PadPlayback {
  id: number;
  startTime: number;
  offset: number;
  duration: number;
  bufferDuration: number;
}

const padPlaybackListeners = new Set<(playback: PadPlayback) => void>();

function subscribePadPlayback(listener: (playback: PadPlayback) => void) {
  padPlaybackListeners.add(listener);
  return () => padPlaybackListeners.delete(listener);
}

// TRIGGER

// triggers are scheduled using Transport.schedule in SequencerService
// alternatively this could be done by syncing with instrument.sync()

function triggerInstrument(
  targetInstruments: Array<Instrument>,
  id: number,
  emphasis: boolean,
  time: number,
  notify = false,
) {
  const instrument = targetInstruments[id];
  const player = emphasis ? instrument.playHigh : instrument.playLow;
  if (!instrument.source || !player?.loaded) return;
  const startTime = time >= 0 ? time : now();
  instrument.sampleVolume.mute = false;
  player.fadeIn = instrument.fadeIn ?? 0;
  player.fadeOut = instrument.fadeOut ?? 0;
  if (instrument.type === InstrumentType.pad) {
    instrument.playHigh?.stop(startTime);
    instrument.playLow?.stop(startTime);
  } else {
    player.stop(startTime);
  }
  player.start(startTime, instrument.offset, instrument.duration);
  if (
    notify && instrument.type === InstrumentType.pad && player.buffer.duration
  ) {
    const offset = instrument.offset || 0;
    const duration = instrument.duration || player.buffer.duration - offset;
    const playback = {
      id,
      startTime,
      offset,
      duration,
      bufferDuration: player.buffer.duration,
    };
    padPlaybackListeners.forEach((listener) => listener(playback));
  }
}

function getPlayInstrumentTrigger(
  id: number,
  emphasis: boolean,
): (arg0: number) => void {
  return (time) => triggerInstrument(instruments, id, emphasis, time, true);
}

// SIGNAL CHAIN

function wireSignalChain(
  instrument: Instrument,
  destinations: Array<ToneAudioNode>,
  source?: string | AudioBuffer | ToneAudioBuffer,
  enablePitchShift = false,
) {
  instrument.channelVolume.fan(...destinations);
  instrument.sampleVolume.connect(instrument.channelVolume);
  instrument.effectInput.connect(instrument.sampleVolume);
  if (enablePitchShift) insertPitchShift(instrument);

  if (instrument.type == InstrumentType.chords) {
    instrument.playSampler = new Sampler({
      urls: {
        C2: "sounds/piano_C2.wav",
        D4: "sounds/piano_D4.wav",
      },
    }).chain(new Volume(-8), instrument.effectInput);
  } else {
    instrument.playHigh = new Player(source ?? instrument.source).chain(
      new Volume(0),
      instrument.effectInput,
    );
    instrument.playLow = new Player(source ?? instrument.source).chain(
      new Volume(-8),
      instrument.effectInput,
    );
  }
}

function insertPitchShift(instrument: Instrument) {
  if (instrument.pitchShift) return;
  instrument.effectInput.disconnect(instrument.sampleVolume);
  instrument.pitchShift = new PitchShift();
  instrument.effectInput.chain(instrument.pitchShift, instrument.sampleVolume);
}

function syncInstrumentParam(
  targetInstruments: Array<Instrument>,
  params: InstrumentParams,
  id: number,
) {
  const param = params[id];
  const i = targetInstruments[id];

  // allowing changes on all types requires async loading
  if (i.type !== InstrumentType.pad) {
    return;
  }

  if (i.playHigh) {
    const unity = i.playHigh.buffer.duration / 100;
    i.offset = param[EnvelopeParam.offset] * unity;
    i.duration = param[EnvelopeParam.duration] * unity;
    i.fadeOut = param[EnvelopeParam.fadeOut] * i.duration / 100;
    i.fadeIn = param[EnvelopeParam.fadeIn] * unity;
    if (i.sampleVolume && i.pitchShift) {
      i.sampleVolume.volume.value = param[EnvelopeParam.amplitude];
      i.pitchShift.pitch = param[EnvelopeParam.pitchShift];
    }
  }
}

function syncParams(
  params: InstrumentParams,
  targetInstruments = instruments,
) {
  if (targetInstruments === instruments) currentParams = params;
  targetInstruments.forEach((i) =>
    syncInstrumentParam(targetInstruments, params, i.id)
  );
}

function syncTrackSettings(
  trackSettings: TrackParams,
  activeTracks: number,
  targetInstruments = instruments,
) {
  const soloed = Object.entries(trackSettings).filter(([, setting]) =>
    setting.solo
  ).map(([id]) => id);
  targetInstruments.forEach((instrument, index) => {
    const track = trackSettings[instrument.id];
    instrument.channelVolume.volume.value = -12 * (100 - track.volume) / 100;
    const trackMuted = track.mute && instrument.type !== InstrumentType.pad;
    instrument.channelVolume.mute = index >= activeTracks || trackMuted ||
      (soloed.length > 0 && !soloed.includes(instrument.id.toString()));
  });
}

let instrumentsConnected = false;
let currentParams: InstrumentParams | undefined;

function connectInstruments() {
  if (!instrumentsConnected) {
    instruments.forEach((instrument) =>
      wireSignalChain(instrument, [controlRoomRecorder, masterVolume])
    );
    instrumentsConnected = true;
  }
}

async function startAudio() {
  if (context.state !== "running") await start();
  connectInstruments();
  instruments.forEach(insertPitchShift);
  if (currentParams) syncParams(currentParams);
}

function createInstrumentGraph(destination: ToneAudioNode) {
  return instruments.map((template) => {
    const instrument: Instrument = {
      id: template.id,
      type: template.type,
      name: template.name,
      source: template.source,
      offset: template.offset,
      duration: template.duration,
      fadeIn: template.fadeIn,
      fadeOut: template.fadeOut,
      channelVolume: new Volume(0),
      effectInput: new Volume(0),
      sampleVolume: new Volume(0),
    };
    const source = template.playHigh?.loaded
      ? template.playHigh.buffer
      : undefined;
    wireSignalChain(instrument, [destination], source, true);
    return instrument;
  });
}

function createPlaybackPlayer(index: number, destination: ToneAudioNode) {
  const playback = playbacks[index];
  if (!playback?.player.loaded) return;
  return new Player(playback.player.buffer).connect(destination);
}

const InstrumentsService = {
  stocks: instruments.filter((i) => i.type === InstrumentType.stock),
  pads: instruments.filter((i) => i.type === InstrumentType.pad),
  overdub: instruments.filter((i) => i.type === InstrumentType.overdub)[0],
  chords: instruments.filter((i) => i.type === InstrumentType.chords)[0],
  instruments,
  playbacks,
  connectInstruments,
  startAudio,
  createInstrumentGraph,
  createPlaybackPlayer,
  getPlayInstrumentTrigger,
  triggerInstrument,
  syncParams,
  syncTrackSettings,
  subscribePadPlayback,
  // nodes
  masterVolume,
  keyboardRecorder,
  controlRoomRecorder,
};

export default InstrumentsService;
