import styled from "styled-components";

const AboutFrame = styled.main`
  box-sizing: border-box;
  width: min(90%, 760px);
  margin: 0 auto;
  padding: clamp(48px, 8vw, 96px) 0;
  line-height: 1.65;
`;

const Heading = styled.h1`
  margin: 0 0 32px;
  font-size: clamp(1.8rem, 6vw, 3.5rem);
  line-height: 1;
`;

const Copy = styled.p`
  max-width: 68ch;
  margin: 0 0 20px;
  font-size: 0.9rem;
`;

const SectionHeading = styled.h2`
  margin: 80px 0 28px;
  font-size: 2rem;
  line-height: 1.2;
`;

const Subheading = styled.h3`
  margin: 36px 0 10px;
  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1.3;
  text-underline-offset: 4px;
`;

const Address = styled.address`
  font-size: 0.85rem;
  font-style: normal;
`;

const ContactLink = styled.a`
  color: inherit;
  text-underline-offset: 3px;
`;

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

const HomeLink = styled.a`
  display: inline-block;
  margin-top: 32px;
  color: rgba(0, 0, 0, 0.55);
  font-size: 0.75rem;
  text-underline-offset: 3px;

  &:hover,
  &:focus-visible {
    color: var(--black);
  }
`;

export default function About() {
  return (
    <AboutFrame>
      <Heading>About the STePs Sampler</Heading>
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
      <section>
        <SectionHeading>Imprint</SectionHeading>
        <Address>
          Simon Krickl
          <br />
          Music Department (KG 6)
          <br />
          University of Education Freiburg (Pädagogische Hochschule Freiburg)
          <br />
          Public-law corporation
          <br />
          Kunzenweg 21
          <br />
          79117 Freiburg, Germany

          <Subheading>Contact</Subheading>
          Email:{"  "}
          <ContactLink href="mailto:simon.krickl@ph-freiburg.de">
            simon.krickl@ph-freiburg.de
          </ContactLink>
          <br />
          Phone:{" "}
          <ContactLink href="tel:+49761682662">+49 (0)761 682-662</ContactLink>

          <Subheading>Competent supervisory authority</Subheading>
          Ministry of Science, Research and the Arts Baden-Württemberg
          <br />
          Königstraße 46
          <br />
          70173 Stuttgart, Germany
        </Address>

        <Subheading>Purpose and content</Subheading>
        <Copy>
          This web application was developed for use in school education and is
          provided by the University of Education Freiburg. The application is
          provided free of charge and is intended solely for educational and
          teaching purposes.
        </Copy>

        <Subheading>Privacy</Subheading>
        <Copy>
          This application does not use cookies, analytics, tracking tools, or
          third-party services. It does not intentionally collect or store
          personal data about its users.
        </Copy>
        <Copy>
          The application runs entirely on the web server of our hosting
          provider, STRATO. When accessing the website, technical connection
          data such as the IP address may be processed by the hosting provider
          as part of operating the web server and ensuring the security and
          stability of the service.
        </Copy>
        <Copy>
          The application itself does not use this data for tracking, profiling,
          or analyzing user behavior. For more information about the processing
          of personal data by STRATO, please refer to STRATO&apos;s privacy
          information.
        </Copy>
      </section>
      <HomeLink href="/">Back to STEPS</HomeLink>
    </AboutFrame>
  );
}
