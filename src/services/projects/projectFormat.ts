import type {
  InstrumentParams,
  SongArrangement,
  TrackParams,
} from "../core/interfaces.ts";
import type { GridResolutions, GridSignature } from "../../store/store.ts";
import { GRID_SIGNATURES } from "../transport/time.ts";

export const PROJECT_FORMAT = "steps-sampler-project";
export const PROJECT_VERSION = 1;
export const MAX_PROJECT_FILE_SIZE = 50 * 1024 * 1024;

export interface ProjectData {
  activeTracks: number;
  activeBars: number;
  signature: GridSignature;
  bpm: number;
  resolution: GridResolutions;
  instrumentParams: InstrumentParams;
  trackSettings: TrackParams;
  playback: string | null;
  swing: number;
  songArrangement: SongArrangement;
  scheduledEvents: Array<string>;
}

export interface ProjectSample {
  instrumentId: number;
  dataUrl: string;
}

export interface ProjectFile {
  format: typeof PROJECT_FORMAT;
  version: typeof PROJECT_VERSION;
  project: ProjectData;
  samples: Array<ProjectSample>;
}

interface ProjectFormatOptions {
  instrumentIds: Array<number>;
  padIds: Array<number>;
  playbackNames: Array<string>;
}

export function parseProjectFile(
  value: unknown,
  options: ProjectFormatOptions,
): ProjectFile {
  if (!isRecord(value) || value.format !== PROJECT_FORMAT) {
    throw new Error("This is not a Steps project file.");
  }
  if (value.version !== PROJECT_VERSION) {
    throw new Error(
      `Project version ${String(value.version)} is not supported.`,
    );
  }
  if (!isRecord(value.project) || !Array.isArray(value.samples)) {
    throw new Error("The project file is incomplete.");
  }

  const project = parseProject(value.project, options);
  const sampleIds = new Set<number>();
  const samples = value.samples.map((sample) => {
    if (
      !isRecord(sample) || !isInteger(sample.instrumentId) ||
      !options.padIds.includes(sample.instrumentId) ||
      typeof sample.dataUrl !== "string" || !isAudioDataUrl(sample.dataUrl)
    ) {
      throw new Error("The project contains an invalid recorded sample.");
    }
    if (sampleIds.has(sample.instrumentId)) {
      throw new Error("The project contains duplicate recorded samples.");
    }
    sampleIds.add(sample.instrumentId);
    return {
      instrumentId: sample.instrumentId,
      dataUrl: sample.dataUrl,
    };
  });

  return {
    format: PROJECT_FORMAT,
    version: PROJECT_VERSION,
    project,
    samples,
  };
}

function parseProject(
  project: Record<string, unknown>,
  options: ProjectFormatOptions,
): ProjectData {
  const activeTracks = integerInRange(
    project.activeTracks,
    1,
    options.instrumentIds.length,
    "active track count",
  );
  const activeBars = integerInRange(project.activeBars, 1, 4, "bar count");
  const bpm = integerInRange(project.bpm, 24, 241, "tempo");
  const swing = integerInRange(project.swing, 0, 75, "swing");
  if (!GRID_SIGNATURES.some(({ value }) => value === project.signature)) {
    throw new Error("The project has an invalid time signature.");
  }
  if (!["8n", "16n", "8t"].includes(String(project.resolution))) {
    throw new Error("The project has an invalid grid resolution.");
  }
  if (
    project.playback !== null &&
    (typeof project.playback !== "string" ||
      !options.playbackNames.includes(project.playback))
  ) {
    throw new Error("The project references an unknown playback track.");
  }

  return {
    activeTracks,
    activeBars,
    signature: project.signature as GridSignature,
    bpm,
    resolution: project.resolution as GridResolutions,
    instrumentParams: parseInstrumentParams(
      project.instrumentParams,
      options.instrumentIds,
    ),
    trackSettings: parseTrackSettings(
      project.trackSettings,
      options.instrumentIds,
    ),
    playback: project.playback,
    swing,
    songArrangement: parseArrangement(project.songArrangement),
    scheduledEvents: parseEvents(
      project.scheduledEvents,
      options.instrumentIds,
    ),
  };
}

function parseInstrumentParams(value: unknown, ids: Array<number>) {
  if (!isRecord(value)) throw new Error("Instrument settings are missing.");
  const params: InstrumentParams = {};
  ids.forEach((id) => {
    const setting = value[id];
    if (!isRecord(setting) || typeof setting.custom !== "boolean") {
      throw new Error(`Instrument ${id} has invalid settings.`);
    }
    const parsed = [0, 1, 2, 3, 4, 5].map((key) => {
      const number = setting[key];
      if (typeof number !== "number" || !Number.isFinite(number)) {
        throw new Error(`Instrument ${id} has invalid settings.`);
      }
      return number;
    });
    params[id] = {
      0: parsed[0],
      1: parsed[1],
      2: parsed[2],
      3: parsed[3],
      4: parsed[4],
      5: parsed[5],
      custom: setting.custom,
    };
  });
  return params;
}

function parseTrackSettings(value: unknown, ids: Array<number>) {
  if (!isRecord(value)) throw new Error("Track settings are missing.");
  const settings: TrackParams = {};
  ids.forEach((id) => {
    const setting = value[id];
    if (
      !isRecord(setting) || typeof setting.mute !== "boolean" ||
      typeof setting.solo !== "boolean"
    ) {
      throw new Error(`Track ${id} has invalid settings.`);
    }
    settings[id] = {
      mute: setting.mute,
      solo: setting.solo,
      volume: numberInRange(setting.volume, 0, 100, `track ${id} volume`),
    };
  });
  return settings;
}

function parseEvents(value: unknown, instrumentIds: Array<number>) {
  if (!Array.isArray(value) || value.length > 1000) {
    throw new Error("The project has invalid sequencer steps.");
  }
  return value.map((event) => {
    if (typeof event !== "string") {
      throw new Error("The project has an invalid sequencer step.");
    }
    const match = event.match(
      /^(\d+):(\d+):(0|1|2|3|1\.33|2\.66)\|(\d+)\|([01])$/,
    );
    if (
      !match || Number(match[1]) > 3 || Number(match[2]) > 3 ||
      !instrumentIds.includes(Number(match[4]))
    ) {
      throw new Error("The project has an invalid sequencer step.");
    }
    return event;
  });
}

function parseArrangement(value: unknown): SongArrangement {
  if (!Array.isArray(value) || value.length > 99) {
    throw new Error("The project has an invalid chord arrangement.");
  }
  return value.map((cycle) => {
    if (!Array.isArray(cycle) || cycle.length > 4) {
      throw new Error("The project has an invalid chord arrangement.");
    }
    return cycle.map((bar) => {
      if (!Array.isArray(bar) || bar.length > 2) {
        throw new Error("The project has an invalid chord arrangement.");
      }
      return bar.map((chord) => {
        if (typeof chord !== "string" || chord.length > 32) {
          throw new Error("The project has an invalid chord arrangement.");
        }
        return chord;
      });
    });
  });
}

function integerInRange(
  value: unknown,
  min: number,
  max: number,
  name: string,
) {
  if (!isInteger(value)) throw new Error(`The project has an invalid ${name}.`);
  return numberInRange(value, min, max, name);
}

function numberInRange(
  value: unknown,
  min: number,
  max: number,
  name: string,
) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`The project has an invalid ${name}.`);
  }
  if (value < min || value > max) {
    throw new Error(`The project has an invalid ${name}.`);
  }
  return value;
}

function isInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isAudioDataUrl(value: string) {
  return /^data:(audio\/[\w.+-]+|application\/octet-stream)(?:;[^,]*)?;base64,[a-z\d+/=]+$/i
    .test(value);
}
