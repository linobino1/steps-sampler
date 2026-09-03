import styled from "styled-components";
import BarControls from "./BarControls.tsx";
import BpmControl from "./BpmControl.tsx";
import GridResolutionControl from "./GridResolutionControl.tsx";
import PlaybackControl from "./PlaybackControl.tsx";
import SwingControl from "./SwingControl.tsx";
import TimeSignatureControl from "./TimeSignatureControl.tsx";
import TransportControl from "./TransportControl.tsx";

const ControlToolBar = styled.div`
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

const PlaybackSection = styled(ControlSection)`
  @media (max-width: 1200px) {
    flex: 1;
    min-width: 0;
  }
`;

export default function Controls() {
  return (
    <ControlToolBar>
      <ControlGroup>
        <ControlSection>
          <TransportControl />
        </ControlSection>
        <PlaybackSection>
          <PlaybackControl />
        </PlaybackSection>
        <ControlSection>
          <BpmControl />
          <TimeSignatureControl />
          <SwingControl />
        </ControlSection>
      </ControlGroup>

      <ControlGroup>
        <ControlSection>
          <BarControls />
        </ControlSection>
        <ControlSection>
          <GridResolutionControl />
        </ControlSection>
      </ControlGroup>
    </ControlToolBar>
  );
}
