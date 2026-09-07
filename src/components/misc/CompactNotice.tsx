import styled from "styled-components";

const Notice = styled.div`
  display: none;
  text-align: center;
  font-size: 0.72rem;

  @media only screen and (max-width: 800px) and (orientation: portrait) {
    display: block;
    padding: 7px 10px;
    background: var(--contrast);
    border-bottom: 2px solid var(--black);
  }
`;

export default function CompactNotice() {
  return <Notice>use this app on a bigger screen for more fun</Notice>;
}
