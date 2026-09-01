import { KeyboardEvent, PointerEvent, useRef } from "react";
import styled from "styled-components";

const MIN_DURATION = 1;

const Overlay = styled.div`
  position: absolute;
  z-index: 2;
  inset: 0;
  pointer-events: none;
`;

const Selection = styled.div<{ $start: number; $duration: number }>`
  position: absolute;
  top: 20%;
  bottom: 20%;
  left: ${({ $start }) => $start}%;
  width: ${({ $duration }) => $duration}%;
  box-sizing: border-box;
  border-inline: 1px solid var(--main-light);
  background: rgba(146, 213, 251, 0.25);
`;

const Handle = styled.div`
  position: absolute;
  top: 50%;
  width: 40px;
  height: 100%;
  box-sizing: border-box;
  cursor: grab;
  pointer-events: auto;
  touch-action: none;
  transform: translate(-50%, -50%);

  &[data-side="start"] {
    left: 0;
  }

  &[data-side="end"] {
    left: 100%;
  }

  &::after {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    width: 14px;
    height: 14px;
    border: 1px solid var(--black);
    border-radius: 50%;
    background: var(--contrast);
    box-sizing: border-box;
    transform: translate(-50%, -50%);
  }

  &:focus-visible {
    outline: none;
  }

  &:focus-visible::after {
    box-shadow: 0 0 0 3px var(--white);
  }

  &:active {
    cursor: grabbing;
  }

  @media (hover: none), (pointer: coarse) {
    width: 52px;

    &::after {
      width: 24px;
      height: 24px;
      border-width: 1px;
    }
  }
`;

interface SliceRange {
  start: number;
  end: number;
}

interface SampleSliceProps {
  offset: number;
  duration: number;
  onChange: (offset: number, duration: number) => void;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function normalizeSlice(offset: number, duration: number): SliceRange {
  const safeOffset = Number.isFinite(offset) ? offset : 0;
  const safeDuration = Number.isFinite(duration) ? duration : MIN_DURATION;
  const start = clamp(Math.round(safeOffset), 0, 100 - MIN_DURATION);
  const end = clamp(
    Math.round(safeOffset + safeDuration),
    start + MIN_DURATION,
    100,
  );
  return { start, end };
}

export default function SampleSlice({
  offset,
  duration,
  onChange,
}: SampleSliceProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const dragOffsetRef = useRef(0);
  const { start, end } = normalizeSlice(offset, duration);

  function setBoundary(side: "start" | "end", value: number) {
    const nextStart = side === "start"
      ? clamp(value, 0, end - MIN_DURATION)
      : start;
    const nextEnd = side === "end"
      ? clamp(value, start + MIN_DURATION, 100)
      : end;
    onChange(nextStart, nextEnd - nextStart);
  }

  function handlePointerDown(
    event: PointerEvent<HTMLDivElement>,
    value: number,
  ) {
    event.preventDefault();
    event.stopPropagation();
    const bounds = overlayRef.current?.getBoundingClientRect();
    if (!bounds) return;
    dragOffsetRef.current = event.clientX -
      (bounds.left + (value / 100) * bounds.width);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(
    event: PointerEvent<HTMLDivElement>,
    side: "start" | "end",
  ) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    event.preventDefault();
    event.stopPropagation();
    const bounds = overlayRef.current?.getBoundingClientRect();
    if (!bounds?.width) return;
    const value = Math.round(
      ((event.clientX - dragOffsetRef.current - bounds.left) / bounds.width) *
        100,
    );
    setBoundary(side, value);
  }

  function handleKeyDown(
    event: KeyboardEvent<HTMLDivElement>,
    side: "start" | "end",
  ) {
    const value = side === "start" ? start : end;
    const min = side === "start" ? 0 : start + MIN_DURATION;
    const max = side === "start" ? end - MIN_DURATION : 100;
    let nextValue: number | undefined;

    if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      nextValue = value - 1;
    } else if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      nextValue = value + 1;
    } else if (event.key === "Home") {
      nextValue = min;
    } else if (event.key === "End") {
      nextValue = max;
    }

    if (nextValue === undefined) return;
    event.preventDefault();
    event.stopPropagation();
    setBoundary(side, nextValue);
  }

  function renderHandle(side: "start" | "end", value: number) {
    const min = side === "start" ? 0 : start + MIN_DURATION;
    const max = side === "start" ? end - MIN_DURATION : 100;
    return (
      <Handle
        data-side={side}
        role="slider"
        tabIndex={0}
        aria-label={`Sample ${side}`}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={`${value}%`}
        onPointerDown={(event) => handlePointerDown(event, value)}
        onPointerMove={(event) => handlePointerMove(event, side)}
        onKeyDown={(event) => handleKeyDown(event, side)}
        onClick={(event) => event.stopPropagation()}
        onTouchStart={(event) => event.stopPropagation()}
        onTouchEnd={(event) => event.stopPropagation()}
      />
    );
  }

  return (
    <Overlay ref={overlayRef}>
      <Selection $start={start} $duration={end - start}>
        {renderHandle("start", start)}
        {renderHandle("end", end)}
      </Selection>
    </Overlay>
  );
}
