import styled from "styled-components";
import InstrumentsService from "../../services/core/instruments.ts";
import useToneStore from "../../store/store.ts";
import { useCallback, useEffect, useRef, useState } from "react";
import DrawerService from "../../services/sampling/waveRender.ts";
import { getTransport } from "tone";
import useWindowResize from "../useWindowResize.ts";

const WaveTrack = styled.div<{ $activeBars: number }>`
  position: relative;
  background: var(--off-color-2);
  height: 100%;
  width: calc(100% - 3px);
  box-sizing: border-box;
  border-radius: 5px;
  padding: 2px 0px;
  overflow: hidden;
  grid-column-start: 1;
  grid-column-end: ${(props) => props.$activeBars + 1};
`;

const Wave = styled.div`
  height: 100%;
  width: 100%;
`;

const TransportPosition = styled.div<{ $duration: number }>`
  height: 100%;
  position: absolute;
  bottom: 0;
  border-left: 1px solid var(--control-bar);
  animation-direction: normal;
  animation-duration: ${(props) => `${props.$duration}ms`};
  animation-name: tracker;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
`;

function getAnimationDuration(bars: number, bpm: number) {
  const msInMinute = 60000;
  const msInBeat = msInMinute / bpm;
  return msInBeat * 4 * bars;
}

interface CursorProps {
  showCursor: boolean;
  activeBars: number;
}

function PlayCursor({ showCursor, activeBars }: CursorProps) {
  const bpm = useToneStore((state) => state.bpm);
  const [playing, setPlaying] = useState(false);
  const startCursor = useCallback(() => setPlaying(true), [setPlaying]);
  const stopCursor = useCallback(() => setPlaying(false), [setPlaying]);

  useEffect(() => {
    stopCursor();
  }, [activeBars]);

  useEffect(() => {
    const transport = getTransport();
    const start = transport.schedule(startCursor, "0:0:0");
    transport.on("stop", stopCursor);
    return () => {
      transport.clear(start);
      transport.off("stop", stopCursor);
    };
  }, []);

  return (playing && showCursor)
    ? <TransportPosition $duration={getAnimationDuration(activeBars, bpm)} />
    : null;
}

export default function DubTrack() {
  const elementRef = useRef<HTMLDivElement>(null);
  const overdubParam = useToneStore((state) =>
    state.instrumentParams[InstrumentsService.overdub.id]
  );
  const activeBars = useToneStore((state) => state.activeBars);
  const windowSize = useWindowResize();

  useEffect(() => {
    if (!elementRef.current) return;
    DrawerService.drawAudioBuffer(
      elementRef.current,
      overdubParam.audioUrl
        ? InstrumentsService.overdub.playHigh?.buffer
        : undefined,
    );
  }, [elementRef, overdubParam, windowSize]);

  return (
    <WaveTrack $activeBars={activeBars}>
      <Wave ref={elementRef}>
        <canvas className="wave" height="0px" width="0px"></canvas>
        <canvas className="edit" height="0px" width="0px"></canvas>
      </Wave>
      <PlayCursor
        showCursor={!!overdubParam.audioUrl}
        activeBars={activeBars}
      />
    </WaveTrack>
  );
}
