/// <reference lib="deno.ns" />

class TestDocument extends EventTarget {
  visibilityState: DocumentVisibilityState = "visible";
}

function nextTask() {
  return new Promise<void>((resolve) => globalThis.setTimeout(resolve, 0));
}

Deno.test("audio session follows the page lifecycle", async () => {
  const originalDocument = Object.getOwnPropertyDescriptor(
    globalThis,
    "document",
  );
  const document = new TestDocument();
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: document,
  });

  try {
    const session = await import("./audioSession.ts?lifecycle-test");
    let starts = 0;
    let suspends = 0;
    let finishSuspending: (() => void) | undefined;

    session.configureAudioSession({
      output: {
        mute: false,
        volume: { value: 0, rampTo: () => undefined },
      },
      contextState: () => "running",
      start() {
        starts++;
        return Promise.resolve();
      },
      suspend() {
        suspends++;
        return new Promise<void>((resolve) => {
          finishSuspending = resolve;
        });
      },
    });
    await nextTask();

    document.visibilityState = "hidden";
    document.dispatchEvent(new Event("visibilitychange"));
    if (suspends !== 1 || session.getAudioSessionState() !== "idle") {
      throw new Error("Backgrounding did not suspend the playback session");
    }

    document.visibilityState = "visible";
    document.dispatchEvent(new Event("visibilitychange"));
    await nextTask();
    if (starts !== 2) {
      throw new Error("Foregrounding did not restart the playback session");
    }

    finishSuspending?.();
    await nextTask();
    if (Number(starts) !== 3) {
      throw new Error("Late suspension was not reconciled in the foreground");
    }
  } finally {
    if (originalDocument) {
      Object.defineProperty(globalThis, "document", originalDocument);
    } else {
      delete (globalThis as { document?: Document }).document;
    }
  }
});
