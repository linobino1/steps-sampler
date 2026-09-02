import { useCallback, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import useToneStore, { GridSignature } from "../../store/store.ts";
import styled from "styled-components";
import { Instrument, InstrumentType } from "../../services/core/interfaces.ts";
import GridService from "../../services/transport/grid.ts";
import Chords from "../chords/Chords.tsx";
import Toggle from "./Toggle.tsx";
import TrackHead from "./TrackHead.tsx";
import { TRACK_HEIGHT } from "../../constants.ts";

const TrackDiv = styled.div`
  display: flex;
  position: relative;
  height: ${TRACK_HEIGHT}px;
  isolation: isolate;
`;

const Head = styled.div`
  width: 65px;
`;

const Bar = styled.div<{ togglesPerBeat: number }>`
  position: relative;
  display: grid;
  grid-template-columns: repeat(${(props) => props.togglesPerBeat}, 1fr);
  border-radius: 2px;
`;

type GestureMode = "idle" | "paint" | "erase" | "velocity";

const Grid = styled.div<{
  signature: GridSignature;
  $gestureMode: GestureMode;
}>`
  flex: 1;
  display: grid;
  grid-template-columns: repeat(${(props) =>
    barsForSignature[props.signature]}, 1fr);
  cursor: ${(props) =>
    props.$gestureMode === "velocity"
      ? "ns-resize"
      : props.$gestureMode === "erase"
      ? "not-allowed"
      : props.$gestureMode === "paint"
      ? "crosshair"
      : "pointer"};
  touch-action: none;
`;

const Mask = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  opacity: 0.5;
  background: white;
  z-index: 1;
`;

interface TrackProps {
  instrument: Instrument;
  togglesPerBeat: number;
  timeIds: Array<string>;
  gridSignature: GridSignature;
}

const barsForSignature = {
  4: 4,
  3: 4,
};

const DRAG_THRESHOLD = 6;

interface Gesture {
  pointerId: number;
  startX: number;
  startY: number;
  originTimeId: string;
  originScheduled: boolean;
  mode: GestureMode;
  visited: Set<string>;
  lastIndex: number;
  lastEmphasis?: boolean;
}

export function Track({
  instrument,
  togglesPerBeat,
  timeIds,
  gridSignature,
}: TrackProps) {
  // we trigger rerenders on all trackSetting due to solo settings
  const _trackSettings = useToneStore((state) => state.trackSettings);
  const instrumentParam = useToneStore(
    useCallback((state) => state.instrumentParams[instrument.id], [instrument]),
  );
  const trackParam = useToneStore(
    useCallback((state) => state.trackSettings[instrument.id], [instrument.id]),
  );
  const _activeBars = useToneStore((state) => state.activeBars);
  const gesture = useRef<Gesture | null>(null);
  const [gestureMode, setGestureMode] = useState<GestureMode>("idle");
  const hasSound = instrumentParam.audioUrl ||
    instrument.id < 3 ||
    instrument.type === InstrumentType.chords;
  function getTimeId(target: EventTarget | null) {
    if (!(target instanceof Element)) return null;
    return target.closest<HTMLElement>("[data-time-id]")?.dataset.timeId ??
      null;
  }

  function isScheduled(timeId: string) {
    const prefix = `${timeId}|${instrument.id}|`;
    return useToneStore.getState().scheduledEvents.some((scheduledEvent) =>
      scheduledEvent.startsWith(prefix)
    );
  }

  function paint(timeIdsToPaint: Array<string>, currentGesture: Gesture) {
    const { addTriggerEvent, removeTriggerEvent } = useToneStore.getState();
    timeIdsToPaint.forEach((timeId) => {
      if (currentGesture.visited.has(timeId)) return;
      currentGesture.visited.add(timeId);
      if (currentGesture.originScheduled) {
        removeTriggerEvent(timeId, instrument.id);
      } else {
        addTriggerEvent(timeId, instrument.id, false);
      }
    });
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || gesture.current) return;
    const timeId = getTimeId(event.target);
    if (!timeId) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    gesture.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originTimeId: timeId,
      originScheduled: isScheduled(timeId),
      mode: "idle",
      visited: new Set(),
      lastIndex: timeIds.indexOf(timeId),
    };
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const currentGesture = gesture.current;
    if (!currentGesture || currentGesture.pointerId !== event.pointerId) return;
    if (event.pointerType === "mouse" && event.buttons === 0) {
      finishGesture(event);
      return;
    }

    const deltaX = event.clientX - currentGesture.startX;
    const deltaY = event.clientY - currentGesture.startY;
    if (currentGesture.mode === "idle") {
      if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < DRAG_THRESHOLD) {
        return;
      }
      currentGesture.mode = Math.abs(deltaY) > Math.abs(deltaX)
        ? "velocity"
        : currentGesture.originScheduled
        ? "erase"
        : "paint";
      setGestureMode(currentGesture.mode);
      if (currentGesture.mode !== "velocity") {
        paint([currentGesture.originTimeId], currentGesture);
      }
    }

    if (currentGesture.mode === "velocity") {
      const emphasized = deltaY < 0;
      if (currentGesture.lastEmphasis !== emphasized) {
        currentGesture.lastEmphasis = emphasized;
        useToneStore.getState().addTriggerEvent(
          currentGesture.originTimeId,
          instrument.id,
          emphasized,
        );
      }
      return;
    }

    const pointedElement = document.elementFromPoint(
      event.clientX,
      event.clientY,
    );
    if (!pointedElement || !event.currentTarget.contains(pointedElement)) {
      return;
    }
    const timeId = getTimeId(pointedElement);
    const currentIndex = timeId ? timeIds.indexOf(timeId) : -1;
    if (currentIndex < 0) return;
    const rangeStart = Math.min(currentGesture.lastIndex, currentIndex);
    const rangeEnd = Math.max(currentGesture.lastIndex, currentIndex) + 1;
    paint(timeIds.slice(rangeStart, rangeEnd), currentGesture);
    currentGesture.lastIndex = currentIndex;
  }

  function finishGesture(event: ReactPointerEvent<HTMLDivElement>) {
    const currentGesture = gesture.current;
    if (!currentGesture || currentGesture.pointerId !== event.pointerId) return;
    if (currentGesture.mode === "idle") {
      paint([currentGesture.originTimeId], currentGesture);
    }
    gesture.current = null;
    setGestureMode("idle");
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function cancelGesture(event: ReactPointerEvent<HTMLDivElement>) {
    if (gesture.current?.pointerId !== event.pointerId) return;
    gesture.current = null;
    setGestureMode("idle");
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  return (
    <TrackDiv key={instrument.id}>
      {!hasSound && <Mask />}
      <Head>
        <TrackHead
          instrument={instrument}
          trackParam={trackParam}
          instrumentParam={instrumentParam}
        />
      </Head>
      {instrument.type === InstrumentType.chords ? <Chords /> : (
        <Grid
          signature={gridSignature}
          $gestureMode={gestureMode}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishGesture}
          onPointerCancel={cancelGesture}
          onLostPointerCapture={cancelGesture}
        >
          {GridService.timeIdsByBar(timeIds).map((barInfo, _index, _arr) => (
            <Bar key={barInfo.bar} togglesPerBeat={togglesPerBeat}>
              {barInfo.timeIds.map((timeId) => (
                <Toggle
                  key={`${timeId}|${instrument.id}`}
                  timeId={timeId}
                  instrumentId={instrument.id}
                  trackName={instrument.name}
                  muted={instrument.channelVolume.mute ||
                    (instrument.id > 2 && !instrumentParam.audioUrl)}
                />
              ))}
            </Bar>
          ))}
        </Grid>
      )}
    </TrackDiv>
  );
}
