import styled from "styled-components";
import { useShallow } from "zustand/shallow";
import { EnvelopeParam } from "../../services/core/interfaces.ts";
import useToneStore from "../../store/store.ts";

const Box = styled.div`
  width: calc(100% + 3px);
  box-sizing: border-box;
  position: absolute;
  top: calc(100% + 8px);
  left: -1.5px;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  column-gap: 16px;
  row-gap: 12px;
  padding: 10px 12px;
  z-index: 3;
  background: var(--main-light);
  border: 1.5px solid var(--black);
  border-radius: 6px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.18);

  &::before,
  &::after {
    content: "";
    position: absolute;
    right: 10px;
    bottom: 100%;
    border: 8px solid transparent;
    border-bottom-color: var(--black);
  }

  &::after {
    right: 12px;
    border-width: 6px;
    border-bottom-color: var(--main-light);
  }

  @media (hover: none), (pointer: coarse) {
    display: block;
  }
`;

const Param = styled.div`
  margin: 0;
  text-align: center;
  display: contents;
  font-size: 0.8rem;

  & input {
    --thumb-size: 14px;
    width: 100%;
  }

  @media (hover: none), (pointer: coarse) {
    display: flex;
    flex-direction: column;
    gap: 8px;
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
  fromSlider?: (value: number) => number;
  toSlider?: (value: number) => number;
}

const SILENT_VOLUME_DB = Number.NEGATIVE_INFINITY;

function volumeFromSlider(value: number) {
  if (value === 0) return SILENT_VOLUME_DB;
  if (value <= 50) return 20 * Math.log10(value / 50);
  return (value - 50) * 12 / 50;
}

function volumeToSlider(value: number) {
  if (value <= SILENT_VOLUME_DB) return 0;
  if (value <= 0) return 50 * 10 ** (value / 20);
  return 50 + value * 50 / 12;
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
  pitchShift: {
    displayName: "pitch",
    name: EnvelopeParam.pitchShift,
    min: -24,
    max: 24,
    step: 0.1,
  },
  volume: {
    displayName: "volume",
    name: EnvelopeParam.amplitude,
    min: 0,
    max: 100,
    step: 0.1,
    fromSlider: volumeFromSlider,
    toSlider: volumeToSlider,
  },
};
const paramConfigs: Array<ParamCfg> = Array.from(Object.values(paramConfigObj));

interface CmpProps {
  padId: number;
}

export default function PadControl({ padId }: CmpProps) {
  const [padParams, setPadParams] = useToneStore(
    useShallow((state) => [
      state.instrumentParams[padId],
      state.setInstrumentParams,
    ]),
  );

  function updateParams(value: string, config: ParamCfg) {
    const sliderValue = parseFloat(value);
    setPadParams(padId, {
      ...padParams,
      [config.name]: config.fromSlider?.(sliderValue) ?? sliderValue,
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
              value={cfg.toSlider?.(padParams[cfg.name]) ?? padParams[cfg.name]}
              onChange={(e) => updateParams(e.target.value, cfg)}
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
