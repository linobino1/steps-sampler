import { useRef } from "react";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCaretDown, faCaretUp } from "@fortawesome/free-solid-svg-icons";
import { useShallow } from "zustand/shallow";
import useToneStore from "../../store/store.ts";

const MIN_SWING_PERCENT = 50;
const MAX_SWING_PERCENT = 75;
const PIXELS_PER_PERCENT = 3;

const SwingScrubber = styled.button`
  align-items: stretch;
  background: transparent;
  border: 2px solid var(--black) !important;
  box-sizing: border-box;
  display: flex;
  margin: 0 !important;
  overflow: hidden;
  padding: 0 !important;
  touch-action: none;

  &:not(:disabled) {
    cursor: ns-resize;
  }

  &:disabled:hover {
    background: var(--inactive-color);
  }
`;

const SwingValue = styled.span`
  align-items: center;
  display: flex;
  font-size: 13px;
  justify-content: center;
  min-width: 75px;
  padding: 0 0 0 7px;
`;

const DragIndicator = styled.span`
  align-items: center;
  display: flex;
  flex-direction: column;
  font-size: 7px;
  justify-content: center;
  width: 14px;
`;

export default function SwingControl() {
  const [swing, setSwing] = useToneStore(
    useShallow((state) => [state.swing, state.setSwing]),
  );
  const resolution = useToneStore((state) => state.resolution);
  const swingPercent = Math.round(MIN_SWING_PERCENT + swing / 3);
  const dragStart = useRef({ y: 0, swingPercent });

  function updateSwingPercent(value: number) {
    const percent = Math.min(
      MAX_SWING_PERCENT,
      Math.max(MIN_SWING_PERCENT, value),
    );
    setSwing((percent - MIN_SWING_PERCENT) * 3);
  }

  return (
    <SwingScrubber
      type="button"
      disabled={resolution === "8t"}
      aria-label={`Swing ${swingPercent} percent. Drag up or down to adjust.`}
      onPointerDown={(event) => {
        dragStart.current = { y: event.clientY, swingPercent };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
        const difference = Math.round(
          (dragStart.current.y - event.clientY) / PIXELS_PER_PERCENT,
        );
        updateSwingPercent(dragStart.current.swingPercent + difference);
      }}
      onPointerUp={(event) => {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowUp" || event.key === "ArrowDown") {
          event.preventDefault();
          updateSwingPercent(
            swingPercent + (event.key === "ArrowUp" ? 1 : -1),
          );
        }
      }}
    >
      <SwingValue>Swing {swingPercent}%</SwingValue>
      <DragIndicator aria-hidden="true">
        <FontAwesomeIcon icon={faCaretUp} />
        <FontAwesomeIcon icon={faCaretDown} />
      </DragIndicator>
    </SwingScrubber>
  );
}
