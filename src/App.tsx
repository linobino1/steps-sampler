import { useEffect, useState } from "react";
import styled from "styled-components";
import Controls from "./components/controls/Controls.tsx";
import Sequencer from "./components/sequencer/Sequencer.tsx";
import Header from "./components/controls/Header.tsx";

import About from "./components/misc/About.tsx";
import Footer from "./components/misc/Footer.tsx";
import Legal from "./components/misc/Legal.tsx";
import Mask from "./components/misc/Mask.tsx";

import SamplerPanel from "./components/pads/Sampler.tsx";
import SequencerService from "./services/transport/sequencer.ts";
import useToneStore, { STORE_VERSION } from "./store/store.ts";
import { APP_HEADER_HEIGHT, SAMPLER_HEIGHT } from "./constants.ts";

const AppLayout = styled.div`
  display: grid;
  grid-template-rows: ${APP_HEADER_HEIGHT}px minmax(min-content, 1fr) auto;
  min-height: 100vh;
`;

const MainFrame = styled.div`
  width: 90%;
  margin: auto;

  @media (max-width: 989px) {
    width: calc(100% - 20px);
  }
`;

const HeaderFrame = styled.div`
  height: ${APP_HEADER_HEIGHT}px;
  background: rgba(255, 255, 255, 0.01);
  box-shadow: 0px 4px 4px 0px rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(25px);
  position: relative;
`;
const SequencerFrame = styled.div`
  display: grid;
  grid-template-rows: ${SAMPLER_HEIGHT}px auto 1fr;
  grid-gap: 5px;
`;

function Sampler() {
  const [sequencerOn, setSequencerOn] = useState(false);
  useEffect(() => {
    if (useToneStore.getState().storeVersion !== STORE_VERSION) {
      useToneStore.getState().resetStore();
    }
    SequencerService.initSequencer();
    setSequencerOn(true);
    return SequencerService.unsubSequencerSubscriptions;
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
      <AppLayout>
        <HeaderFrame>
          <Header showControls={!isInfoPage} />
        </HeaderFrame>
        {path === "/about"
          ? <About />
          : path === "/legal"
          ? <Legal />
          : <Sampler />}
        <Footer />
      </AppLayout>
    </>
  );
}
