import styled from "styled-components";
import useToneStore from "../../store/store.ts";
import {
  Instrument,
  InstrumentParam,
  TrackParam,
} from "../../services/core/interfaces.ts";

const TrackHeadBox = styled.div<{ trackName: string }>`
  height: 100%;
  overflow: hidden;
  border: 0.5px solid var(--black);
  color: var(--black);
  cursor: default;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  background: ${(props) => `var(--${props.trackName});`};

  & svg {
    width: 50%;
    height: 50%;
    padding-top: 1px;
  }
`;

const LabelName = styled.div`
  font-size: 0.8rem;
  width: 100%;
  text-align: center;
`;

const ButtonSection = styled.div`
  display: flex;
  gap: 5px;
  justify-content: center;
  margin: 0 auto;
  width: 80%;
  > button {
    flex: 1;
  }
`;

const TrackIcon = styled.button<{ active: string | null; clickable: boolean }>`
  border-radius: 3px;
  border: 1px solid var(--black);
  margin: 0px 1px;
  padding: 0px 4px;
  overflow: hidden;
  text-align: center;
  background: ${(props) => (props.active ? "var(--main)" : "null")};
  color: var(${(props) => (props.active ? "--white" : "--black")});
  font-size: 12.6px;
`;

interface TrackHeadProps {
  instrument: Instrument;
  instrumentParam: InstrumentParam;
  trackParam: TrackParam;
}

export default function TrackHead({ instrument, trackParam }: TrackHeadProps) {
  const toggleTrackMute = useToneStore((state) => state.toggleTrackMute);
  const toggleTrackSolo = useToneStore((state) => state.toggleTrackSolo);
  return (
    <TrackHeadBox trackName={instrument.name}>
      <LabelName color={instrument.name}>{instrument.name}</LabelName>
      <ButtonSection>
        <TrackIcon
          active={trackParam?.mute ? "--black" : null}
          clickable
          onClick={() => toggleTrackMute(instrument.id)}
        >
          M
        </TrackIcon>
        <TrackIcon
          active={trackParam?.solo ? "--black" : null}
          clickable
          onClick={() => toggleTrackSolo(instrument.id)}
        >
          S
        </TrackIcon>
      </ButtonSection>
    </TrackHeadBox>
  );
}
