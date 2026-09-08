import { useEffect, useState } from "react";
import styled from "styled-components";
import Controls from "./components/controls/Controls.tsx";
import Sequencer from "./components/sequencer/Sequencer.tsx";
import Header from "./components/controls/Header.tsx";

import About from "./components/misc/About.tsx";
import Footer from "./components/misc/Footer.tsx";
import Legal from "./components/misc/Legal.tsx";
import Mask from "./components/misc/Mask.tsx";
import CompactNotice from "./components/misc/CompactNotice.tsx";

import SamplerPanel from "./components/pads/Sampler.tsx";
import SequencerService from "./services/transport/sequencer.ts";
import useToneStore, { STORE_VERSION } from "./store/store.ts";

const AppLayout = styled.div<{ $disableSelection: boolean }>`
  display: grid;
  grid-template-rows: auto minmax(min-content, 1fr);
  min-height: 100vh;
  min-height: 100dvh;

  ${({ $disableSelection }) => $disableSelection && `
    &, & * {
      -webkit-user-select: none;
      -webkit-touch-callout: none;
      -webkit-tap-highlight-color: transparent;
      user-select: none;
    }
  `}
`;

const ContentFrame = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const MainFrame = styled.div`
  width: 90%;
  margin: 0 auto;
  padding-top: 10px;

  @media (max-width: 989px) {
    width: calc(100% - 20px);
  }
`;

const HeaderFrame = styled.div`
  height: 35px;
  background: rgba(255, 255, 255, 0.01);
  box-shadow: 0px 4px 4px 0px rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(25px);
  position: relative;
`;
const SequencerFrame = styled.div`
  display: grid;
  grid-template-rows: auto auto 1fr;
  grid-gap: 5px;
`;

function Sampler() {
  const [sequencerOn, setSequencerOn] = useState(false);
  useEffect(() => {
    const compactQuery = globalThis.matchMedia("(max-width: 800px)");
    const handleCompactChange = (event: MediaQueryListEvent) =>
      useToneStore.getState().setCompactMode(event.matches);

    useToneStore.getState().setCompactMode(compactQuery.matches);
    compactQuery.addEventListener("change", handleCompactChange);
    if (useToneStore.getState().storeVersion !== STORE_VERSION) {
      useToneStore.getState().resetStore();
    }
    SequencerService.initSequencer();
    setSequencerOn(true);
    return () => {
      compactQuery.removeEventListener("change", handleCompactChange);
      SequencerService.unsubSequencerSubscriptions();
    };
  }, []);

  return (
    <MainFrame>
      {sequencerOn && (
        <SequencerFrame>
          <SamplerPanel />
          <Controls />
          <Sequencer />
        </SequencerFrame>
      )}
    </MainFrame>
  );
}

export default function App() {
  const path = globalThis.location.pathname;
  const isInfoPage = path === "/about" || path === "/legal";

  return (
    <>
      {!isInfoPage && <Mask />}
      {!isInfoPage && <CompactNotice />}
      <AppLayout $disableSelection={!isInfoPage}>
        <HeaderFrame>
          <Header showControls={!isInfoPage} />
        </HeaderFrame>
        <ContentFrame>
          {path === "/about"
            ? <About />
            : path === "/legal"
            ? <Legal />
            : <Sampler />}
          <Footer />
        </ContentFrame>
      </AppLayout>
    </>
  );
}
