import styled from "styled-components";
import { EnvelopeParam } from "../../services/core/interfaces.ts";
import useToneStore from "../../store/store.ts";

const Box = styled.div`
  width: 100%;
  box-sizing: border-box;
  position: absolute;
  top: 100%;
  margin-top: 1px;
  padding: 5px;
  z-index: 1;
  background: var(--main-light);
  border-radius: 0px 0px 6px 6px;
`;

const Param = styled.div`
  margin: 0.5rem;
  text-align: center;
  display: flex;
  font-size: 0.8rem;

  & input {
    width: 80%;
  }

  @media (hover: none), (pointer: coarse) {
    flex-direction: column;
    margin: 0.25rem 0.5rem;

    & input {
      --thumb-size: 24px;
      width: 100%;
      height: 52px;
      margin-top: -16px;
      margin-bottom: -4px;
      touch-action: none;
    }
  }
`;

const ParamLabel = styled.div`
`;
const ParamInput = styled.div`
  flex: 1;
`;

interface ParamCfg {
  displayName: string;
  name: EnvelopeParam;
  min: number;
  max: number;
  step: number;
}
const paramConfigObj: { [key: string]: ParamCfg } = {
  // fadeIn: {displayName: 'f-in', name: EnvelopeParam.fadeIn, min: 0, max: 99, step: 1},
  fadeIn: {
    displayName: "attack",
    name: EnvelopeParam.fadeIn,
    min: 0,
    max: 99,
    step: 1,
  },
  // fadeOut: {
  //   displayName: 'release',
  //   name: EnvelopeParam.fadeOut,
  //   min: 0,
  //   max: 99,
  //   step: 1,
  // },
  // volume: {
  //   displayName: 'amplitude',
  //   name: EnvelopeParam.amplitude,
  //   min: -24,
  //   max: 24,
  //   step: 1,
  // },
  pitchShift: {
    displayName: "pitch",
    name: EnvelopeParam.pitchShift,
    min: -24,
    max: 24,
    step: 1,
  },
};
const paramConfigs: Array<ParamCfg> = Array.from(Object.values(paramConfigObj));

interface CmpProps {
  padId: number;
}

export default function PadControl({ padId }: CmpProps) {
  const [padParams, setPadParams] = useToneStore((state) => [
    state.instrumentParams[padId],
    state.setInstrumentParams,
  ]);

  function updateParams(value: string, paramName: EnvelopeParam) {
    setPadParams(padId, {
      ...padParams,
      [paramName]: parseInt(value),
      custom: true,
    });
  }

  return (
    <Box>
      {paramConfigs.map((cfg) => (
        <Param key={cfg.name}>
          <ParamLabel>{cfg.displayName}</ParamLabel>
          <ParamInput>
            <input
              type="range"
              value={padParams[cfg.name]}
              onChange={(e) => updateParams(e.target.value, cfg.name)}
              min={cfg.min}
              max={cfg.max}
              step={cfg.step}
            />
          </ParamInput>
        </Param>
      ))}
    </Box>
  );
}
