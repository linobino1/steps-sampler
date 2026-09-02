import styled from "styled-components";
import { saveFile } from "../../services/exports/midi.ts";
import { recordAudio } from "../../services/exports/audioExport.ts";

const HeaderDiv = styled.div`
  box-sizing: border-box;
  padding: 5px 10px;
  display: flex;
  width: 100%;
  height: 100%;
`;

const HeaderButton = styled.button`
  background: var(--black);
  color: var(--white);
`;

const Title = styled.a`
  color: inherit;
  font-size: 26px;
  font-weight: 600;
  line-height: 26px;
  text-decoration: none;
`;

const Stretch = styled.div`
  flex: 1;
`;

export default function Header(
  { showControls = true }: { showControls?: boolean },
) {
  return (
    <HeaderDiv>
      <Title href="/">STEPS</Title>
      {showControls && (
        <>
          <Stretch />
          <HeaderButton onClick={saveFile}>Save Midi</HeaderButton>
          <HeaderButton onClick={() => recordAudio()}>Save Audio</HeaderButton>
        </>
      )}
    </HeaderDiv>
  );
}
