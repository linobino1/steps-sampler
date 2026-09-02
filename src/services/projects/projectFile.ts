import useToneStore from "../../store/store.ts";
import InstrumentsService from "../core/instruments.ts";
import BlobService from "../sampling/blobStore.ts";
import SampleService from "../sampling/sample.ts";
import SequencerService from "../transport/sequencer.ts";
import GridService from "../transport/grid.ts";
import {
  MAX_PROJECT_FILE_SIZE,
  parseProjectFile,
  PROJECT_FORMAT,
  PROJECT_VERSION,
  type ProjectFile,
} from "./projectFormat.ts";

const formatOptions = {
  instrumentIds: InstrumentsService.instruments.map(({ id }) => id),
  padIds: InstrumentsService.pads.map(({ id }) => id),
  playbackNames: InstrumentsService.playbacks.map(({ name }) => name),
};

interface SaveFilePickerWindow {
  showSaveFilePicker?: (options: {
    suggestedName: string;
    startIn: "downloads";
    types: Array<{
      description: string;
      accept: Record<string, Array<string>>;
    }>;
  }) => Promise<{
    createWritable: () => Promise<{
      write: (data: Blob) => Promise<void>;
      close: () => Promise<void>;
    }>;
  }>;
}

export async function saveProjectFile() {
  const projectFile = createProjectFile();
  const blob = new Blob([JSON.stringify(projectFile)], {
    type: "application/octet-stream",
  });
  const filename = "my-project.steps";
  const pickerWindow = globalThis as unknown as SaveFilePickerWindow;

  if (pickerWindow.showSaveFilePicker) {
    const handle = await pickerWindow.showSaveFilePicker({
      suggestedName: filename,
      startIn: "downloads",
      types: [{
        description: "Steps project",
        accept: { "application/octet-stream": [".steps"] },
      }],
    });
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
    return;
  }

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.download = filename;
  anchor.href = url;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export async function loadProjectFile(file: File) {
  if (file.size > MAX_PROJECT_FILE_SIZE) {
    throw new Error("The project file is too large.");
  }

  let source: unknown;
  try {
    source = JSON.parse(await file.text());
  } catch {
    throw new Error("The project file is not valid JSON.");
  }
  const imported = parseProjectFile(source, formatOptions);
  const playbackSample = imported.project.playback === null
    ? -1
    : formatOptions.playbackNames.indexOf(imported.project.playback);
  const instrumentParams = Object.fromEntries(
    Object.entries(imported.project.instrumentParams).map(([id, params]) => [
      id,
      { ...params, audioUrl: undefined },
    ]),
  );
  const samples = new Map(
    imported.samples.map((
      { instrumentId, dataUrl },
    ) => [instrumentId, dataUrl]),
  );

  SequencerService.stopTransport();
  BlobService.replaceDataUrls(samples, formatOptions.padIds);
  useToneStore.setState({
    activeTracks: imported.project.activeTracks,
    activeBars: imported.project.activeBars,
    signature: imported.project.signature,
    bpm: imported.project.bpm,
    resolution: imported.project.resolution,
    instrumentParams,
    trackSettings: imported.project.trackSettings,
    playbackSample,
    swing: imported.project.swing,
    songArrangement: imported.project.songArrangement,
    scheduledEvents: imported.project.scheduledEvents,
  });
  GridService.setGridTimeIds();
  await SampleService.replaceSavedSamples(samples, false);
}

function createProjectFile(): ProjectFile {
  const state = useToneStore.getState();
  return {
    format: PROJECT_FORMAT,
    version: PROJECT_VERSION,
    project: {
      activeTracks: state.activeTracks,
      activeBars: state.activeBars,
      signature: state.signature,
      bpm: state.bpm,
      resolution: state.resolution,
      instrumentParams: Object.fromEntries(
        Object.entries(state.instrumentParams).map(([id, params]) => [
          id,
          { ...params, audioUrl: undefined },
        ]),
      ),
      trackSettings: state.trackSettings,
      playback: state.playbackSample < 0
        ? null
        : InstrumentsService.playbacks[state.playbackSample]?.name ?? null,
      swing: state.swing,
      songArrangement: state.songArrangement,
      scheduledEvents: state.scheduledEvents,
    },
    samples: InstrumentsService.pads.flatMap(({ id }) => {
      const dataUrl = BlobService.loadDataUrl(id);
      return dataUrl ? [{ instrumentId: id, dataUrl }] : [];
    }),
  };
}
