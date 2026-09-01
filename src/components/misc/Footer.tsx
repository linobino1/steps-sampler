import styled from "styled-components";

const FooterFrame = styled.footer`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18px;
  min-height: 32px;
  padding-bottom: calc(8px + env(safe-area-inset-bottom));
  font-size: 0.7rem;
`;

const FooterLink = styled.a`
  color: rgba(0, 0, 0, 0.42);
  text-decoration: none;
  transition: color 120ms ease;

  &:hover,
  &:focus-visible {
    color: rgba(0, 0, 0, 0.75);
  }

  &:focus-visible {
    outline: 1px dotted currentColor;
    outline-offset: 3px;
  }
`;

export default function Footer() {
  return (
    <FooterFrame>
      <FooterLink href="/about">About</FooterLink>
      <FooterLink
        href="https://github.com/linobino1/steps-sampler"
        target="_blank"
        rel="noreferrer"
      >
        GitHub
      </FooterLink>
    </FooterFrame>
  );
}
