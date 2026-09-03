import { useCallback, useEffect, useRef, useState } from "react";
import styled, { keyframes } from "styled-components";
import { useShallow } from "zustand/shallow";
import RecorderService from "../../services/sampling/recorder.ts";
import SampleService from "../../services/sampling/sample.ts";
import { EnvelopeParam } from "../../services/core/interfaces.ts";
import type { Instrument } from "../../services/core/interfaces.ts";
import useToneStore, { selectPadAudioUrl } from "../../store/store.ts";
import DrawerService from "../../services/sampling/waveRender.ts";
import InstrumentsService from "../../services/core/instruments.ts";
import useWindowResize from "../useWindowResize.ts";
import TrashIcon from "./trashIcon.tsx";
import WavesIcon from "./wavesIcon.tsx";
import PadControl from "./PadControl.tsx";
import SliderIcon from "./sliderlcon.tsx";
import { SAMPLER_PAD_HEIGHT } from "../../constants.ts";
import { getTransport, now } from "tone";
import SampleSlice, { normalizeSlice } from "./SampleSlice.tsx";

const padPulse = keyframes`
  0%, 100% { filter: opacity(0.07); }
  50% { filter: opacity(0.15); }
`;

const PadBox = styled.div`
  position: relative;
  border-radius: 5px;
  display: flex;
  flex-direction: column;
  height: 165px;
  border: 1.5px solid var(--black);
  background: var(--main);
  border-radius: 3px;
  isolation: isolate;

  &::before {
    content: "";
    position: absolute;
    z-index: -1;
    inset: 0;
    border-radius: inherit;
    background: white;
    opacity: 0;
    pointer-events: none;
    animation: ${padPulse} 1000ms ease-in-out infinite;
    transition: opacity 500ms ease-out;
  }

  &.playing::before {
    opacity: 1;
    transition-duration: 100ms;
  }

  @media (prefers-reduced-motion: reduce) {
    &::before {
      animation: none;
      filter: opacity(0.25);
    }
  }
`;

const RecordingBox = styled.div`
  cursor: pointer;
  touch-action: none;
`;

const Blur = styled.div`
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 5px;
  backdrop-filter: blur(4px);
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 2;
  pointer-events: none;
  & div {
    text-align: center;
    font-style: italic;
  }
`;

const RecordingNotice = styled.div`
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-style: italic;
  pointer-events: none;

  & .touch-instruction {
    display: none;
  }

  @media (hover: none), (pointer: coarse) {
    & .desktop-instruction {
      display: none;
    }

    & .touch-instruction {
      display: inline;
    }
  }
`;

const WaveViewPort = styled.div`
  position: relative;
  padding: 5px;
  height: ${SAMPLER_PAD_HEIGHT}px;
  canvas {
    position: absolute;
  }
  & .edit {
    fill-opacity: 0;
  }
`;

const Wave = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`;

const Playhead = styled.div`
  position: absolute;
  z-index: 1;
  top: 0;
  bottom: 0;
  left: 0;
  width: 1.3px;
  background: rgb(194, 109, 109);
  pointer-events: none;
  display: none;
`;

const TopBar = styled.div`
  position: absolute;
  z-index: 2;
  top: 10px;
  left: 0;
  right: 0;
  text-align: center;
  font-weight: 600;
  font-size: 1.5rem;
  cursor: default;
  & button {
    position: absolute;
    right: 0px;
    background: none;
    font-weight: 600;
    border: 0px;
  }
`;

const BottomBar = styled.div`
  position: absolute;
  z-index: 2;
  bottom: 2px;
  width: 100%;
  box-sizing: border-box;
  color: var(--contrast);
  padding-left: 10px;
  display: flex;
  & button {
    background: var(--main-light);
    display: flex;
    width: 30px;
    height: 30px;
    padding: 5px;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    border-radius: 3.846px;
    background: var(--Mittel-Grau, #b9abeb);
  }
`;

const ButtonBox = styled.div`
  margin: 5px;
  position: absolute;
  right: 0;
  bottom: 0;
`;

const PadTitle = styled.div`
  margin-left: 8px;
`;

export default function Pad(props: { pad: Instrument }) {
  const padBoxRef = useRef<HTMLDivElement>(null);
  const elementRef = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null);
  const audioUrl = useToneStore(
    useCallback((state) => selectPadAudioUrl(state, props.pad.id), [
      props.pad.id,
    ]),
  );
  const [padParams, setPadParams] = useToneStore(
    useShallow((state) => [
      state.instrumentParams[props.pad.id],
      state.setInstrumentParams,
    ]),
  );
  const [recording, setRecording] = useState(false);
  const [showPadCtrl, setShowPadCtrl] = useState(false);
  const windowSize = useWindowResize();
  const slice = normalizeSlice(
    padParams[EnvelopeParam.offset],
    padParams[EnvelopeParam.duration],
  );
  const sampleVolume = padParams[EnvelopeParam.amplitude];

  const startRecording = useCallback(async () => {
    if (!elementRef.current) return;
    setRecording(true);
    const started = await RecorderService.startRecorder(
      props.pad.id,
      elementRef.current,
    );
    if (!started || !elementRef.current) {
      setRecording(false);
      return;
    }
    DrawerService.clearAllCanvas(elementRef.current);
    setPadParams(props.pad.id);
  }, [props.pad.id, setPadParams]);

  useEffect(() => {
    if (!elementRef.current) return;
    DrawerService.drawAudioBuffer(
      elementRef.current,
      audioUrl ? props.pad.playHigh?.buffer : undefined,
      sampleVolume,
    );
  }, [audioUrl, props.pad.playHigh, sampleVolume, windowSize]);

  useEffect(() => {
    if (!elementRef.current) return;
    DrawerService.updateEditLayer(padParams, elementRef.current);
  }, [elementRef, padParams, windowSize]);

  useEffect(() => {
    const duration = slice.end - slice.start;
    if (
      slice.start === padParams[EnvelopeParam.offset] &&
      duration === padParams[EnvelopeParam.duration]
    ) return;
    setPadParams(props.pad.id, {
      [EnvelopeParam.offset]: slice.start,
      [EnvelopeParam.duration]: duration,
      custom: true,
    });
  }, [
    padParams,
    props.pad.id,
    setPadParams,
    slice.end,
    slice.start,
  ]);

  useEffect(() => {
    const transport = getTransport();
    let animationFrame = 0;
    const stopPlayback = () => {
      cancelAnimationFrame(animationFrame);
      playheadRef.current?.style.setProperty("display", "none");
      padBoxRef.current?.classList.remove("playing");
    };
    const unsubscribe = InstrumentsService.subscribePadPlayback((playback) => {
      if (playback.id !== props.pad.id) return;
      cancelAnimationFrame(animationFrame);

      const drawPlayhead = () => {
        const playhead = playheadRef.current;
        if (!playhead) return;

        const elapsed = now() - playback.startTime;
        if (elapsed < 0) {
          animationFrame = requestAnimationFrame(drawPlayhead);
          return;
        }
        if (elapsed >= playback.duration) {
          playhead.style.display = "none";
          padBoxRef.current?.classList.remove("playing");
          return;
        }

        const position = (playback.offset + elapsed) /
          playback.bufferDuration * 100;
        padBoxRef.current?.classList.add("playing");
        playhead.style.display = "block";
        playhead.style.left = `${Math.min(position, 100)}%`;
        animationFrame = requestAnimationFrame(drawPlayhead);
      };

      drawPlayhead();
    });
    transport.on("stop", stopPlayback);

    return () => {
      stopPlayback();
      transport.off("stop", stopPlayback);
      unsubscribe();
    };
  }, [props.pad.id]);

  async function recordOrPlay() {
    await InstrumentsService.startAudio();
    const trigger = InstrumentsService.getPlayInstrumentTrigger(
      props.pad.id,
      true,
    );
    if (audioUrl) {
      trigger(now());
    } else if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  }

  function stopRecording() {
    RecorderService.stopRecorder();
    setRecording(false);
  }

  function clearPad() {
    setShowPadCtrl(false);
    SampleService.removeSample(props.pad.id);
  }

  return (
    <PadBox ref={padBoxRef} onTouchEnd={() => stopRecording()}>
      <TopBar>
        {audioUrl && (
          <button type="button" onClick={clearPad}>
            <TrashIcon />
          </button>
        )}
      </TopBar>

      {!recording
        ? (
          ""
        )
        : (
          <Blur>
            {" "}
            <div>recording...</div>
            {" "}
          </Blur>
        )}

      <RecordingBox
        onPointerDown={(e) => {
          e.preventDefault();
          void recordOrPlay();
        }}
      >
        {!audioUrl && !recording && (
          <RecordingNotice>
            <span className="desktop-instruction">
              Click to start recording
            </span>
            <span className="touch-instruction">
              Touch and hold to record
            </span>
          </RecordingNotice>
        )}
        <WaveViewPort>
          <Wave ref={elementRef}>
            <canvas className="wave" height="0px" width="0px"></canvas>
            <canvas className="edit" height="0px" width="0px"></canvas>
            <Playhead ref={playheadRef} aria-hidden="true" />
            {showPadCtrl && audioUrl && (
              <SampleSlice
                offset={slice.start}
                duration={slice.end - slice.start}
                onChange={(offset, duration) =>
                  setPadParams(props.pad.id, {
                    [EnvelopeParam.offset]: offset,
                    [EnvelopeParam.duration]: duration,
                    custom: true,
                  })}
              />
            )}
          </Wave>
        </WaveViewPort>
      </RecordingBox>

      <BottomBar>
        <div>
          <WavesIcon />
        </div>
        <PadTitle>{props.pad.name}</PadTitle>
        <ButtonBox>
          {audioUrl && (
            <button
              type="button"
              onClick={() => setShowPadCtrl(!showPadCtrl)}
            >
              <SliderIcon />
            </button>
          )}
        </ButtonBox>
      </BottomBar>

      {showPadCtrl && audioUrl && <PadControl padId={props.pad.id} />}
    </PadBox>
  );
}
