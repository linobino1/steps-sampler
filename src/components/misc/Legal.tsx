import styled from "styled-components";
import { BackToApp, Copy, InfoPage, PageHeading } from "./InfoPage.tsx";

const SectionHeading = styled.h2`
  margin: 80px 0 28px;
  font-size: 2rem;
  line-height: 1.2;
`;

const Subheading = styled.h2`
  margin: 36px 0 10px;
  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1.3;
`;

const Address = styled.address`
  font-size: 0.85rem;
  font-style: normal;
`;

const Link = styled.a`
  color: inherit;
  text-underline-offset: 3px;
`;

export default function Legal() {
  return (
    <InfoPage>
      <PageHeading>Imprint</PageHeading>
      <Address>
        Simon Krickl
        <br />
        Truseweg 8
        <br />
        12059 Berlin, Germany

        <Subheading>Contact</Subheading>
        Email:{" "}
        <Link href="mailto:simon.krickl@ph-freiburg.de">
          simon.krickl@ph-freiburg.de
        </Link>
        <br />
        Phone: <Link href="tel:+49761682662">+49 (0)761 682-662</Link>
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
        The application runs entirely on the web server of our hosting provider,
        STRATO. When accessing the website, technical connection data such as
        the IP address may be processed by the hosting provider as part of
        operating the web server and ensuring the security and stability of the
        service.
      </Copy>
      <Copy>
        The application itself does not use this data for tracking, profiling,
        or analyzing user behavior. For more information about the processing of
        personal data by STRATO, please refer to STRATO&apos;s privacy
        information.
      </Copy>

      <section>
        <SectionHeading>License &amp; Use</SectionHeading>
        <Copy>
          The STePs Sampler is provided as a free, non-commercial web app and
          Open Educational Resource (OER) for young people and educational
          institutions.
        </Copy>
        <Copy>
          The software is released as open-source software under the{" "}
          <Link
            href="https://www.gnu.org/licenses/gpl-3.0.html"
            target="_blank"
            rel="noreferrer"
          >
            GNU General Public License v3.0 (GPL-3.0)
          </Link>
          .
        </Copy>
        <Copy>
          Educational resources, documentation, learning materials and other
          original content are, unless otherwise stated, licensed under the{" "}
          <Link
            href="https://creativecommons.org/licenses/by-nc/4.0/"
            target="_blank"
            rel="noreferrer"
          >
            Creative Commons Attribution-NonCommercial 4.0 International (CC
            BY-NC 4.0) license
          </Link>
          .
        </Copy>
        <Copy>
          These materials may be freely used, shared and adapted for
          non-commercial educational activities and OER resources, provided that
          appropriate attribution is given.
        </Copy>
        <Copy>
          Partner logos and trademarks are excluded from these licenses. They
          remain the property of their respective owners and may not be copied,
          modified or reused without permission from the relevant rights holder.
        </Copy>
      </section>

      <section>
        <SectionHeading>Audio</SectionHeading>
        <Copy>
          The audio files included in the STePs Sampler are Open Educational
          Resources licensed under the{" "}
          <Link
            href="https://creativecommons.org/licenses/by/4.0/"
            target="_blank"
            rel="noreferrer"
          >
            Creative Commons Attribution 4.0 International (CC BY 4.0)
          </Link>{" "}
          license.
        </Copy>
        <Copy>Creator, copyright &amp; composition: Simon Krickl</Copy>
        <Copy>
          You may copy, redistribute, remix, transform and build upon these
          files for any purpose, provided that appropriate credit is given, a
          link to the license is provided and changes are indicated.
        </Copy>
        <Copy>
          Individual components may be subject to different licenses or rights
          and are marked accordingly.
        </Copy>
      </section>
      <BackToApp />
    </InfoPage>
  );
}
