import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCaretDown } from "@fortawesome/free-solid-svg-icons";
import { useShallow } from "zustand/shallow";
import InstrumentsService from "../../services/core/instruments.ts";
import useToneStore from "../../store/store.ts";
import NoteIcon from "./NoteIcon.tsx";

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
    margin: 0 5px;
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

export default function PlaybackControl() {
  const [playback, setPlayback] = useToneStore(
    useShallow((state) => [state.playbackSample, state.setPlaybackSample]),
  );

  return (
    <PlaybackSelect>
      <IconBox>
        <NoteIcon />
      </IconBox>
      <select
        aria-label="Playback sample"
        onChange={(event) => setPlayback(Number.parseInt(event.target.value))}
        value={playback}
      >
        <option value={-1}>NO PLAYBACK</option>
        {InstrumentsService.playbacks.map((item, index) => (
          <option key={item.name} value={index}>{item.name}</option>
        ))}
      </select>
      <PlaybackCaret icon={faCaretDown} aria-hidden="true" />
    </PlaybackSelect>
  );
}
