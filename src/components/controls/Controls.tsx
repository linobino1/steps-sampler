import styled from "styled-components";
import { useEffect, useState } from "react";
import { Transport } from "tone";
import SequencerService from "../../services/transport/sequencer.ts";
import useToneStore from "../../store/store.ts";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAdd,
  faMinus,
  faPlay,
  faStop,
} from "@fortawesome/free-solid-svg-icons";
import InstrumentsService from "../../services/core/instruments.ts";
import SampleService from "../../services/sampling/sample.ts";

import { shallow } from "zustand/shallow";
import NoteIcon from "./NoteIcon.tsx";

const ControlBox = styled.div`
  border: solid black 2px;
  border-radius: 3px;
  display: flex;
  position: relative;
  display: flex;
  flex-direction: horizontal;
  button {
    height: 100%;
    border: 2px solid black;
  }
`;

const ControlSection = styled.div<{ disabled?: boolean }>`
  border-right: solid black 2px;
  padding: 10px;
  display: flex;
  justify-content: space-around;
  &:first-child {
    flex: 1;
  }
  &:last-child {
    border-right: 0px;
  }
`;

const BarLengthControl = styled(ControlSection)`
  align-items: center;
  justify-content: center;
`;

const BarLengthStepper = styled.div`
  align-items: stretch;
  border: 2px solid black;
  border-radius: 6px;
  display: flex;
  height: 27px;
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
    flex: 0 0 30px;
    height: 100%;
    justify-content: center;
    margin: 0;
    padding: 0;
    width: 30px;

    &:first-child {
      border-right: 2px solid black;
    }

    &:last-child {
      border-left: 2px solid black;
    }

    &:disabled {
      background: transparent;
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

const MultiSelectBtn = styled.button`
  margin-left: 5px;
  position: relative;
  height: 100%;

  & div {
    flex: 1;
    border-right: 1px solid black;
    background: var(--white);
    text-align: center;
  }
  &.active {
    background: var(--main);
    color: var(--white);
  }
`;

const TransportButton = styled.button<{ $playing: boolean }>`
  background: ${(props) => props.$playing ? "var(--main)" : "initial"};
  color: ${(props) => props.$playing ? "var(--white)" : "initial"};
`;

const PlaybackSelect = styled.label`
  color: black;
  font-weight: bold;
  margin: 2px 0px;
  position: relative;
  select {
    margin: 0px 5px;
    width: calc(100% - 10px);
    height: 100%;
    background: none;
    border: 2px solid var(--off-color-2);
    border-radius: 5px;
    font-size: 12px;
    cursor: pointer;
    padding-left: 33px;
    font-family: "RoobertMono";
  }
`;

const IconBox = styled.div`
  position: absolute;
  left: 13px;
  top: 2px;
  > svg {
    height: 14px;
  }
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

export default function Controls() {
  const [isPlaying, setIsPlaying] = useState(Transport.state === "started");
  const activeBars = useToneStore((state) => state.activeBars);
  const changeBars = useToneStore((state) => state.changeBars);
  const [res, toggleRes] = useToneStore(
    (state) => [state.resolution, state.toggleResolution],
    shallow,
  );
  const [sig, toggleSig] = useToneStore(
    (state) => [state.signature, state.setGridSignature],
    shallow,
  );
  const dupeBar = useToneStore((state) => state.duplicateBarEvents);
  const resetSequencer = useToneStore((state) => state.resetSequencer);
  const clearSchedule = useToneStore((state) => state.clearSchedule);
  const [playback, setPlayback] = useToneStore(
    (state) => [state.playbackSample, state.setPlaybackSample],
    shallow,
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

  function toggleTransporter() {
    SequencerService.toggleTransport();
    const e = document.activeElement as HTMLInputElement;
    if ("blur" in e) {
      e.blur(); // to avoid cross-canceling with spacebar listener
    }
  }

  function _clearAll() {
    resetSequencer();
    InstrumentsService.pads.forEach((i) => {
      SampleService.removeSample(i.id);
    });
  }

  return (
    <ControlBox>
      <ControlSection>
        <TransportButton
          type="button"
          $playing={isPlaying}
          aria-pressed={isPlaying}
          onClick={toggleTransporter}
        >
          <FontAwesomeIcon icon={faPlay} /> <span></span>
          <FontAwesomeIcon icon={faStop} />
        </TransportButton>
        <button type="button" onClick={clearSchedule}>Clear Steps</button>
      </ControlSection>
      <BarLengthControl>
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
      </BarLengthControl>

      {/* <Stretch /> */}

      <ControlSection className="playback">
        <PlaybackSelect>
          <IconBox>
            <NoteIcon />
          </IconBox>

          <select
            onChange={(e) => setPlayback(parseInt(e.target.value))}
            defaultValue={playback}
          >
            <option value={-1}>NO PLAYBACK</option>
            {InstrumentsService.playbacks.map((pb, index) => (
              <option key={pb.name} value={index}>
                {pb.name}
              </option>
            ))}
          </select>
        </PlaybackSelect>
      </ControlSection>

      <ControlSection disabled={playback !== -1}>
        {/* {playback !== -1 && <DisableMask />} */}
        <MultiSelectBtn
          className={sig === "3" ? "active" : ""}
          onClick={() => toggleSig("3")}
        >
          3/4
        </MultiSelectBtn>
        <MultiSelectBtn
          className={sig === "4" ? "active" : ""}
          onClick={() => toggleSig("4")}
        >
          4/4
        </MultiSelectBtn>
      </ControlSection>

      <ControlSection>
        <MultiSelectBtn
          className={res === "8n" ? "active" : ""}
          onClick={() => toggleRes("8n")}
        >
          8THS
        </MultiSelectBtn>
        <MultiSelectBtn
          className={res === "8t" ? "active" : ""}
          onClick={() => toggleRes("8t")}
        >
          TRIPLETS
        </MultiSelectBtn>
        <MultiSelectBtn
          className={res === "16n" ? "active" : ""}
          onClick={() => toggleRes("16n")}
        >
          16THS
        </MultiSelectBtn>
      </ControlSection>
    </ControlBox>
  );
}
