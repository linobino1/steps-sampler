import styled from "styled-components";
import Pad from "./Pad.tsx";
import InstrumentsService from "../../services/core/instruments.ts";
import useToneStore from "../../store/store.ts";

const Sampler = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 2fr);
  grid-gap: 5px;
  width: 100%;
  height: 170px;
  position: relative;
  z-index: 1;

  @media (max-width: 800px) {
    grid-template-columns: 1fr;
  }
`;

export default function SamplerPanel() {
  const compactMode = useToneStore((state) => state.compactMode);
  const pads = compactMode
    ? InstrumentsService.pads.slice(0, 1)
    : InstrumentsService.pads;
  return (
    <Sampler>
      {pads.map((pad) => <Pad key={pad.name} pad={pad} />)}
    </Sampler>
  );
}
