import styled from "styled-components";
import Pad from "./Pad.tsx";
import InstrumentsService from "../../services/core/instruments.ts";
import { SAMPLER_HEIGHT } from "../../constants.ts";

const Sampler = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 2fr);
  grid-gap: 5px;
  width: 100%;
  height: ${SAMPLER_HEIGHT}px;
  position: relative;
  z-index: 1;
`;

export default function SamplerPanel() {
  return (
    <Sampler>
      {InstrumentsService.pads.map((pad) => <Pad key={pad.name} pad={pad} />)}
    </Sampler>
  );
}
