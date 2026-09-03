/// <reference lib="deno.ns" />

import {
  parseProjectFile,
  PROJECT_FORMAT,
  PROJECT_VERSION,
} from "./projectFormat.ts";

const options = {
  instrumentIds: [0, 1],
  padIds: [1],
  playbackNames: ["Loop"],
};

function validProject() {
  const instrument = {
    0: 99,
    1: 20,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    custom: false,
  };
  return {
    format: PROJECT_FORMAT,
    version: PROJECT_VERSION,
    project: {
      activeTracks: 2,
      activeBars: 1,
      signature: "4",
      bpm: 124,
      resolution: "8n",
      instrumentParams: { 0: instrument, 1: instrument },
      trackSettings: {
        0: { mute: false, volume: 100, solo: false },
        1: { mute: false, volume: 100, solo: false },
      },
      playback: null,
      swing: 0,
      songArrangement: [],
      scheduledEvents: ["0:0:0|0|1"],
    },
    samples: [],
  };
}

Deno.test("parseProjectFile accepts a valid project", () => {
  const project = parseProjectFile(validProject(), options);
  if (project.project.bpm !== 124) throw new Error("Project was not parsed");
});

Deno.test("parseProjectFile accepts every supported time signature", () => {
  const signatures = ["2", "3", "4", "5", "5/8", "6/8", "7/8"];
  for (const signature of signatures) {
    const source = validProject();
    source.project.signature = signature;
    parseProjectFile(source, options);
  }
});

Deno.test("parseProjectFile rejects invalid state before import", () => {
  const source = validProject();
  source.project.bpm = 999;
  let rejected = false;
  try {
    parseProjectFile(source, options);
  } catch {
    rejected = true;
  }
  if (!rejected) throw new Error("Invalid project was accepted");
});
