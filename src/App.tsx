import { useEffect, useState } from "react";
import styled from "styled-components";
import Controls from "./components/controls/Controls.tsx";
import Sequencer from "./components/sequencer/Sequencer.tsx";
import Header from "./components/controls/Header.tsx";

import About from "./components/misc/About.tsx";
import Footer from "./components/misc/Footer.tsx";
import Mask from "./components/misc/Mask.tsx";

import SamplerPanel from "./components/pads/Sampler.tsx";
import SequencerService from "./services/transport/sequencer.ts";
import useToneStore, { STORE_VERSION } from "./store/store.ts";
import {
  APP_HEADER_HEIGHT,
  CTRLS_HEADER_HEIGHT,
  SAMPLER_HEIGHT,
} from "./constants.ts";

const AppLayout = styled.div`
  display: grid;
  grid-template-rows: ${APP_HEADER_HEIGHT}px minmax(min-content, 1fr) auto;
  min-height: 100vh;
`;

const MainFrame = styled.div`
  width: 90%;
  margin: auto;
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
  grid-template-rows: ${SAMPLER_HEIGHT}px ${CTRLS_HEADER_HEIGHT}px 1fr;
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
  }, [setSequencerOn]);

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
  const isAboutPage = globalThis.location.pathname === "/about";

  return (
    <>
      <div className="app-background" aria-hidden="true" />
      {!isAboutPage && <Mask />}
      <AppLayout>
        <HeaderFrame>
          <Header showControls={!isAboutPage} />
        </HeaderFrame>
        {isAboutPage ? <About /> : <Sampler />}
        <Footer />
      </AppLayout>
    </>
  );
}
