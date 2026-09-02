import { useRef } from "react";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCaretDown, faCaretUp } from "@fortawesome/free-solid-svg-icons";
import useToneStore from "../../store/store.ts";
import { useShallow } from "zustand/shallow";

const MIN_BPM = 24;
const MAX_BPM = 241;
const PIXELS_PER_BPM = 3;

const BpmScrubber = styled.button`
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

const BpmValue = styled.span`
  align-items: center;
  display: flex;
  font-size: 13px;
  justify-content: center;
  min-width: 60px;
  padding: 0px 0 0 7px;
`;

const DragIndicator = styled.span`
  align-items: center;
  display: flex;
  flex-direction: column;
  font-size: 7px;
  justify-content: center;
  width: 14px;
`;

export default function BpmControl() {
  const [bpm, setBpm] = useToneStore(
    useShallow((state) => [state.bpm, state.setBpm]),
  );
  const playback = useToneStore((state) => state.playbackSample);
  const dragStart = useRef({ y: 0, bpm });
  function updateBpm(value: number) {
    setBpm(String(Math.min(MAX_BPM, Math.max(MIN_BPM, value))));
  }

  return (
    <BpmScrubber
      type="button"
      disabled={playback > -1}
      aria-label={`BPM ${bpm}. Drag up or down to adjust.`}
      onPointerDown={(event) => {
        dragStart.current = { y: event.clientY, bpm };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
        const difference = Math.round(
          (dragStart.current.y - event.clientY) / PIXELS_PER_BPM,
        );
        updateBpm(dragStart.current.bpm + difference);
      }}
      onPointerUp={(event) => {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowUp" || event.key === "ArrowDown") {
          event.preventDefault();
          updateBpm(bpm + (event.key === "ArrowUp" ? 1 : -1));
        }
      }}
    >
      <BpmValue>BPM {bpm}</BpmValue>
      <DragIndicator aria-hidden="true">
        <FontAwesomeIcon icon={faCaretUp} />
        <FontAwesomeIcon icon={faCaretDown} />
      </DragIndicator>
    </BpmScrubber>
  );
}
