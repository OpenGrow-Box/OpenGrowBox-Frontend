import React from "react";
import styled, { keyframes } from "styled-components";

// Lustige, leicht freche 404-Seite im Grow/Cannabis-Stil
// Single-file React-Komponente mit styled-components

const float = keyframes`
  0% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-8px) rotate(6deg); }
  100% { transform: translateY(0) rotate(0deg); }
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const Page = styled.main`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(1200px 600px at 10% 10%, #042a18 0%, transparent 15%),
              radial-gradient(1000px 500px at 90% 90%, #1b3a2a 0%, transparent 20%),
              linear-gradient(180deg, #0a1f12 0%, #06120a 100%);
  color: #e9f7ef;
  font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial;
  padding: 48px;
`;

const Card = styled.section`
  width: min(1000px, 94%);
  background: rgba(255,255,255,0.03);
  backdrop-filter: blur(6px) saturate(1.1);
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(2,6,4,0.6);
  padding: 40px;
  display: grid;
  grid-template-columns: 1fr 420px;
  gap: 32px;
  align-items: center;

  @media (max-width: 880px) {
    grid-template-columns: 1fr;
    padding: 28px;
  }
`;

const Left = styled.div`
  display:flex;
  flex-direction:column;
  gap:16px;
`;

const Title = styled.h1`
  font-size: clamp(28px, 4vw, 44px);
  margin: 0;
  line-height: 1.02;
  letter-spacing: -0.02em;
  color: #f2fff7;
`;

const Subtitle = styled.p`
  margin: 0;
  color: #cfe8d5;
  opacity: 0.95;
  font-size: 16px;
`;

const Explanation = styled.div`
  margin-top: 12px;
  color: #d7f0dc;
  font-size: 14px;
  line-height: 1.5;
`;

const Actions = styled.div`
  margin-top: 18px;
  display:flex;
  gap:12px;
  align-items:center;
`;

const Button = styled.a`
  display:inline-flex;
  align-items:center;
  gap:10px;
  padding:10px 18px;
  border-radius: 12px;
  background: linear-gradient(180deg, #2bd06a, #1f9a4b);
  color: #06210b;
  text-decoration:none;
  font-weight: 700;
  box-shadow: 0 6px 18px rgba(18,70,36,0.28);
  transition: transform .14s ease, box-shadow .14s ease;

  &:hover { transform: translateY(-4px); box-shadow: 0 12px 28px rgba(18,70,36,0.36); }
`;

const Ghost = styled.a`
  display:inline-flex;
  align-items:center;
  gap:10px;
  padding:8px 14px;
  border-radius: 12px;
  color: #cfe7d3;
  text-decoration:none;
  background: transparent;
  border: 1px solid rgba(255,255,255,0.04);
`;

const Right = styled.aside`
  display:flex;
  align-items:center;
  justify-content:center;
  position:relative;

  @media (max-width: 880px) { order: -1; }
`;

const Pot = styled.div`
  width: 340px;
  height: 340px;
  position: relative;
  display:flex;
  align-items:flex-end;
  justify-content:center;
`;

const Soil = styled.div`
  width: 84%;
  height: 34%;
  background: linear-gradient(180deg,#2b1409,#1d0b06);
  border-radius: 40% 40% 12% 12% / 60% 60% 10% 10%;
  position:absolute;
  bottom: 48px;
  box-shadow: inset 0 -12px 30px rgba(0,0,0,0.6);
`;

const PotBody = styled.div`
  width: 92%;
  height: 52%;
  background: linear-gradient(180deg,#7b3a2e,#5b2a20);
  border-radius: 18px;
  position:absolute;
  bottom: 0;
  box-shadow: 0 14px 30px rgba(0,0,0,0.6);
`;

const Leaf = styled.div`
  width: 140px;
  height: 180px;
  position:absolute;
  bottom: 140px;
  left: 28px;
  transform-origin: 50% 90%;
  animation: ${float} 3.6s ease-in-out infinite;

  &::before, &::after {
    content: "";
    position:absolute;
    left:50%;
    transform: translateX(-50%);
    background: linear-gradient(180deg,#66d07a,#1f7a3b);
    border-radius: 60% 40% 50% 50% / 65% 35% 45% 55%;
  }

  &::before {
    width: 64%;
    height: 92%;
    top:0;
    filter: drop-shadow(0 6px 12px rgba(12,50,20,0.35));
  }

  &::after {
    width: 28%;
    height: 60%;
    top: 20%;
    left: 16%;
    transform: rotate(-12deg);
    opacity:0.96;
  }
`;

const LeafSmall = styled(Leaf)`
  width: 100px;
  height: 120px;
  left: 180px;
  bottom: 150px;
  animation-duration: 4.2s;
`;

const LeafBadge = styled.div`
  position:absolute;
  top: -24px;
  right: -24px;
  width: 84px;
  height: 84px;
  border-radius: 50%;
  background: linear-gradient(180deg,#f7fff8,#d9fff0);
  display:flex;
  align-items:center;
  justify-content:center;
  box-shadow: 0 8px 24px rgba(4,12,6,0.45);
  font-weight:800;
  color: #083516;
  transform: rotate(-12deg);
  animation: ${spin} 12s linear infinite;
`;

const SmallText = styled.div`
  font-size:12px;
  color:#a9d8b9;
`;

const FooterNote = styled.div`
  margin-top:18px;
  color:#9ad6b0;
  font-size:12px;
`;

export default function NotFound404({homeUrl = "/ogb-gui/home"}){
  const room = "Greenhouse";

  return (
    <Page>
      <Card>
        <Left>
          <Title>404 — Die Pflanze ist weggelaufen 🌿</Title>
          <Subtitle>Ups — hier wächst nichts. Seite nicht gefunden.</Subtitle>

          <Explanation>
            Scheint so, als hättest du dich in ein Beet verirrt, das keiner bewässert hat. 
            Kein Problem — wir haben ein paar Samen da, oder du gehst zurück zum <strong>Home</strong>.
          </Explanation>

          <Actions>
            <Button href={homeUrl} aria-label="Zurück zur Startseite">🏠 Zur Startseite</Button>
            <Ghost href="/ogb-gui/home" aria-label="Debug Logs">🔎 Debug (nur für Grow-Meister)</Ghost>
          </Actions>

          <FooterNote>
            Tipp: Wenn du eigentlich auf eine Device-Seite wolltest, prüf die Geräte-ID —
            manchmal heißen Sensoren jetzt <em>sensor_soil_*</em> oder <em>sensor_light_*</em>.
          </FooterNote>
        </Left>

        <Right>
          <Pot>
            <Leaf />
            <LeafSmall />
            <Soil />
            <PotBody />

            <LeafBadge>🍃</LeafBadge>
          </Pot>
        </Right>
      </Card>
    </Page>
  );
}
