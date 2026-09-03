import styled from "styled-components";
import useToneStore from "../../store/store.ts";
import InstrumentsService from "../../services/core/instruments.ts";
import { Track } from "./Track.tsx";

const SequencerBox = styled.div`
  margin-top: 24px;
  display: flex;
  flex-direction: column;

  &.hidden {
    display: none;
  }
`;

export default function Sequencer() {
  const activeTracks = useToneStore((state) => state.activeTracks);
  const timeIds = useToneStore((state) => state.activeTimeIds);
  return (
    <SequencerBox>
      {InstrumentsService.instruments.slice(0, activeTracks).map((
        instrument,
      ) => (
        <Track
          instrument={instrument}
          key={instrument.id}
          timeIds={timeIds}
        />
      ))}
    </SequencerBox>
  );
}
