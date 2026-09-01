import styled from "styled-components";
import { BackToApp, Copy, InfoPage, PageHeading } from "./InfoPage.tsx";

const Team = styled.dl`
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 6px 24px;
  margin: 40px 0 0;
  font-size: 0.8rem;

  dt {
    color: rgba(0, 0, 0, 0.48);
  }

  dd {
    margin: 0;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 2px;

    dd {
      margin-bottom: 12px;
    }
  }
`;

const Logos = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: center;
  justify-items: start;
  gap: 48px 56px;
  margin-top: 64px;

  img {
    display: block;
    max-width: 100%;
    height: auto;
  }

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
    gap: 32px;
  }
`;

const PhfrLogo = styled.img`
  grid-column: 1 / -1;
  width: 392px;
`;

const IdeeBwLogo = styled.img`
  grid-column: 1 / -1;
  width: 306px;
`;

const DigellLogo = styled.img`
  width: 203px;
`;

const FaceLogo = styled.img`
  width: 231px;
`;

export default function About() {
  return (
    <InfoPage>
      <PageHeading>About the STePs Sampler</PageHeading>
      <Copy>
        The STePs Sampler is a free, non-commercial web app for young people and
        educational institutions, designed for experimenting, exploring and
        creating with sound and rhythm through sampling and sequencing.
      </Copy>
      <Copy>
        The STePs Sampler was developed and implemented as part of the Di-ge-LL
        Music Project at the University of Education Freiburg, working with a
        multidisciplinary team and as an Open Educational Resource (OER). The
        project was supported and funded by IDEE BW through the
        &ldquo;Idee-BW&rdquo; innovation competition.
      </Copy>
      <Team>
        <dt>Project Lead</dt>
        <dd>Simon Krickl</dd>
        <dt>Concept</dt>
        <dd>Simon Krickl &amp; Andres Arguello</dd>
        <dt>Coding</dt>
        <dd>Andres Arguello &amp; Leo Hilsheimer</dd>
        <dt>Design</dt>
        <dd>Simon Bork, Panorama Studio</dd>
      </Team>
      <Logos aria-label="Project partners">
        <IdeeBwLogo src="/img/IdeeBW_Logo_4C.svg" alt="IDEE BW" />
        <PhfrLogo
          src="/img/PHFR-Logo_3Sprachen_rgb.svg"
          alt="University of Education Freiburg"
        />
        <DigellLogo src="/img/digell_logo.png" alt="Di-ge-LL" />
        <FaceLogo src="/img/face_logo.png" alt="FACE School of Education" />
      </Logos>
      <BackToApp />
    </InfoPage>
  );
}
