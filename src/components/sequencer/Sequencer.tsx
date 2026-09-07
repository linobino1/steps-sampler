import styled from "styled-components";
import useToneStore from "../../store/store.ts";
import InstrumentsService from "../../services/core/instruments.ts";
import { Track } from "./Track.tsx";
import { InstrumentType } from "../../services/core/interfaces.ts";

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
  const compactMode = useToneStore((state) => state.compactMode);
  const instruments = InstrumentsService.instruments.slice(0, activeTracks)
    .filter((instrument) =>
      !compactMode || instrument.type !== InstrumentType.pad ||
      instrument.name === "1"
    );
  return (
    <SequencerBox>
      {instruments.map((instrument) => (
        <Track
          instrument={instrument}
          key={instrument.id}
          timeIds={timeIds}
        />
      ))}
    </SequencerBox>
  );
}
