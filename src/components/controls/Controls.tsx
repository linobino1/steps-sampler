import styled from "styled-components";
import { useEffect, useRef, useState } from "react";
import { Transport } from "tone";
import SequencerService from "../../services/transport/sequencer.ts";
import useToneStore, { type GridResolutions } from "../../store/store.ts";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAdd,
  faCaretDown,
  faMinus,
  faPlay,
  faStop,
} from "@fortawesome/free-solid-svg-icons";
import InstrumentsService from "../../services/core/instruments.ts";

import { useShallow } from "zustand/shallow";
import NoteIcon from "./NoteIcon.tsx";
import BpmControl from "./BpmControl.tsx";
import SwingControl from "./SwingControl.tsx";
import {
  GRID_SIGNATURES,
  type GridSignature,
} from "../../services/transport/time.ts";

const ControlBox = styled.div`
  border: solid black 2px;
  border-radius: 3px;
  display: flex;
  justify-content: space-between;
  position: relative;
  flex-direction: horizontal;
  button {
    box-sizing: border-box;
    height: 26px;
    border: 2px solid black;
  }

  @media (max-width: 1200px) {
    justify-content: flex-start;
  }
`;

const ControlSection = styled.div`
  align-items: center;
  border-right: solid black 2px;
  padding: 6px;
  display: flex;
  gap: 8px;
  justify-content: space-evenly;
`;

const ControlGroup = styled.div`
  display: flex;

  &:last-child > ${ControlSection}:first-child {
    border-left: solid black 2px;
  }

  &:last-child > ${ControlSection}:last-child {
    border-right: 0;
  }

  @media (max-width: 1200px) {
    &:first-child {
      flex: 1;
    }

    &:last-child > ${ControlSection}:first-child {
      border-left: 0;
    }
  }
`;

const BarControls = styled(ControlSection)`
  align-items: center;
`;

const PlaybackSection = styled(ControlSection)`
  @media (max-width: 1200px) {
    flex: 1;
    min-width: 0;
  }
`;

const BarLengthStepper = styled.div`
  align-items: stretch;
  border: 2px solid black;
  border-radius: 6px;
  box-sizing: border-box;
  display: flex;
  height: 26px;
  overflow: hidden;

  && > button {
    appearance: none;
    align-items: center;
    background: transparent;
    border: 0;
    border-radius: 0;
    box-sizing: border-box;
    color: var(--black);
    display: inline-flex;
    flex: 0 0 26px;
    height: 100%;
    justify-content: center;
    margin: 0;
    padding: 0;
    width: 26px;

    > svg {
      font-size: 10px;
    }

    &:first-child {
      border-right: 2px solid black;
    }

    &:last-child {
      border-left: 2px solid black;
    }

    &:disabled {
      background: var(--inactive-background);
      color: var(--inactive-color);
    }

    &:not(:disabled):hover {
      background: var(--main-light);
    }
  }

  > span {
    align-items: center;
    display: flex;
    font-size: 12px;
    font-weight: bold;
    justify-content: center;
    line-height: 1;
    min-width: 58px;
    text-align: center;
  }
`;

const ResolutionRadioGroup = styled.fieldset`
  border: 0;
  display: flex;
  gap: 8px;
  margin: 0;
  padding: 0;

  legend {
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    height: 1px;
    overflow: hidden;
    position: absolute;
    white-space: nowrap;
    width: 1px;
  }

  input {
    opacity: 0;
    position: absolute;
  }

  label {
    align-items: center;
    border: 2px solid var(--black);
    border-radius: 6px;
    box-sizing: border-box;
    cursor: pointer;
    display: flex;
    font-size: 0.8rem;
    height: 26px;
    padding: 0 5px;
  }

  input:checked + label {
    background: var(--main);
    color: var(--white);
  }

  input:focus-visible + label {
    outline: 2px solid var(--black);
    outline-offset: 2px;
  }

  label:hover {
    background: var(--main-light);
  }

  @media (max-width: 990px) {
    display: none;
  }
`;

const ResolutionSelect = styled.select`
  background: none;
  border: 2px solid var(--black);
  border-radius: 6px;
  box-sizing: border-box;
  color: var(--black);
  cursor: pointer;
  display: none;
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: bold;
  height: 26px;
  padding-left: 5px;

  &:hover {
    background: var(--main-light);
  }

  @media (max-width: 990px) {
    display: block;
  }
`;

const SignatureControl = styled.div`
  align-items: center;
  display: grid;
  position: relative;

  select {
    appearance: none;
    background: none;
    border: 2px solid var(--black);
    border-radius: 6px;
    box-sizing: border-box;
    color: var(--black);
    cursor: pointer;
    font-family: inherit;
    font-size: 0.8rem;
    font-weight: bold;
    height: 26px;
    padding: 0 14px 0 5px;
    grid-area: 1 / 1;

    &:hover {
      background: var(--main-light);
    }
  }
`;

const TransportButton = styled.button<{ $playing: boolean }>`
  background: ${(props) => props.$playing ? "var(--main)" : "initial"};
  color: ${(props) => props.$playing ? "var(--white)" : "initial"};

  && {
    box-sizing: content-box;
    height: 27px;
  }
`;

const PlaybackSelect = styled.label`
  color: black;
  font-weight: bold;
  margin: 0;
  position: relative;

  @media (max-width: 1200px) {
    flex: 1;
    min-width: 0;
  }

  select {
    appearance: none;
    margin: 0px 5px;
    width: calc(100% - 10px);
    height: 26px;
    background: none;
    border: 2px solid var(--off-color-2);
    border-radius: 5px;
    box-sizing: border-box;
    font-size: 12px;
    cursor: pointer;
    padding: 0 16px 0 33px;
    font-family: "RoobertMono";

    &:hover {
      background: var(--main-light);
    }
  }
`;

const IconBox = styled.div`
  align-items: center;
  display: flex;
  position: absolute;
  left: 13px;
  top: 50%;
  transform: translateY(-50%);
  > svg {
    height: 14px;
  }
`;

const PlaybackCaret = styled(FontAwesomeIcon)`
  font-size: 10px;
  pointer-events: none;
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
`;

const SignatureCaret = styled(FontAwesomeIcon)`
  align-self: center;
  font-size: 10px;
  grid-area: 1 / 1;
  justify-self: end;
  margin-right: 5px;
  pointer-events: none;
`;

const _DisableMask = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  opacity: 0.4;
  background: var(--off-color-1);
`;

const GRID_RESOLUTIONS: ReadonlyArray<{
  value: GridResolutions;
  label: string;
}> = [
  { value: "8n", label: "8THS" },
  { value: "8t", label: "TRIPLETS" },
  { value: "16n", label: "16THS" },
];

export default function Controls() {
  const [isPlaying, setIsPlaying] = useState(Transport.state === "started");
  const activeBars = useToneStore((state) => state.activeBars);
  const changeBars = useToneStore((state) => state.changeBars);
  const [res, toggleRes] = useToneStore(
    useShallow((state) => [state.resolution, state.toggleResolution]),
  );
  const straightSwing = useRef(useToneStore.getState().swing);
  const [sig, toggleSig] = useToneStore(
    useShallow((state) => [state.signature, state.setGridSignature]),
  );
  const dupeBar = useToneStore((state) => state.duplicateBarEvents);
  const clearSchedule = useToneStore((state) => state.clearSchedule);
  const isGridEmpty = useToneStore((state) =>
    state.scheduledEvents.length === 0
  );
  const [playback, setPlayback] = useToneStore(
    useShallow((state) => [state.playbackSample, state.setPlaybackSample]),
  );

  useEffect(() => {
    const showPlaying = () => setIsPlaying(true);
    const showStopped = () => setIsPlaying(false);

    Transport.on("start", showPlaying);
    Transport.on("stop", showStopped);
    Transport.on("pause", showStopped);

    return () => {
      Transport.off("start", showPlaying);
      Transport.off("stop", showStopped);
      Transport.off("pause", showStopped);
    };
  }, []);

  useEffect(() => {
    if (res !== "8t") return;

    const { setSwing, swing } = useToneStore.getState();
    if (swing !== 0) {
      straightSwing.current = swing;
      setSwing(0);
    }
  }, [res]);

  function toggleTransporter() {
    SequencerService.toggleTransport();
    const e = document.activeElement as HTMLInputElement;
    if ("blur" in e) {
      e.blur(); // to avoid cross-canceling with spacebar listener
    }
  }

  function setGridResolution(resolution: GridResolutions) {
    const { setSwing, swing } = useToneStore.getState();

    if (resolution === "8t") {
      if (res !== "8t") straightSwing.current = swing;
      setSwing(0);
    } else if (res === "8t") {
      setSwing(straightSwing.current);
    }

    toggleRes(resolution);
  }

  return (
    <ControlBox>
      <ControlGroup>
        <ControlSection>
          <TransportButton
            type="button"
            $playing={isPlaying}
            aria-pressed={isPlaying}
            onClick={toggleTransporter}
          >
            <FontAwesomeIcon icon={faPlay} /> <span />
            <FontAwesomeIcon icon={faStop} />
          </TransportButton>
        </ControlSection>

        <PlaybackSection>
          <PlaybackSelect>
            <IconBox>
              <NoteIcon />
            </IconBox>

            <select
              onChange={(e) => setPlayback(Number.parseInt(e.target.value))}
              defaultValue={playback}
            >
              <option value={-1}>NO PLAYBACK</option>
              {InstrumentsService.playbacks.map((pb, index) => (
                <option key={pb.name} value={index}>
                  {pb.name}
                </option>
              ))}
            </select>
            <PlaybackCaret icon={faCaretDown} aria-hidden="true" />
          </PlaybackSelect>
        </PlaybackSection>

        <ControlSection>
          <BpmControl />
          <SignatureControl>
            <select
              aria-label="Time signature"
              value={sig}
              onChange={(event) =>
                toggleSig(event.target.value as GridSignature)}
            >
              {GRID_SIGNATURES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <SignatureCaret icon={faCaretDown} aria-hidden="true" />
          </SignatureControl>
          <SwingControl />
        </ControlSection>
      </ControlGroup>

      <ControlGroup>
        <BarControls>
          <BarLengthStepper>
            <button
              type="button"
              aria-label="Remove bar"
              disabled={activeBars <= 1}
              onClick={() => changeBars(-1)}
            >
              <FontAwesomeIcon icon={faMinus} />
            </button>
            <span>{activeBars} {activeBars === 1 ? "BAR" : "BARS"}</span>
            <button
              type="button"
              aria-label="Add bar"
              disabled={activeBars >= 4}
              onClick={dupeBar}
            >
              <FontAwesomeIcon icon={faAdd} />
            </button>
          </BarLengthStepper>
          <button
            type="button"
            disabled={isGridEmpty}
            onClick={() => {
              if (globalThis.confirm("Are you sure?")) clearSchedule();
            }}
          >
            Clear Steps
          </button>
        </BarControls>

        <ControlSection>
          <ResolutionRadioGroup>
            <legend>Grid granularity</legend>
            {GRID_RESOLUTIONS.map(({ value, label }) => (
              <div key={value}>
                <input
                  id={`grid-resolution-${value}`}
                  name="grid-resolution"
                  type="radio"
                  value={value}
                  checked={res === value}
                  onChange={() => setGridResolution(value)}
                />
                <label htmlFor={`grid-resolution-${value}`}>{label}</label>
              </div>
            ))}
          </ResolutionRadioGroup>
          <ResolutionSelect
            aria-label="Grid granularity"
            value={res}
            onChange={(event) =>
              setGridResolution(event.target.value as GridResolutions)}
          >
            {GRID_RESOLUTIONS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </ResolutionSelect>
        </ControlSection>
      </ControlGroup>
    </ControlBox>
  );
}
