import React from "react";
import styled, { keyframes } from "styled-components";
import { useHomeAssistant } from "../Components/Context/HomeAssistantContext";

const float = keyframes`
  0% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-12px) rotate(8deg); }
  100% { transform: translateY(0) rotate(0deg); }
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const shimmer = keyframes`
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Page = styled.main`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(1400px 700px at 15% 15%, #0a3d24 0%, transparent 18%),
              radial-gradient(1200px 600px at 85% 85%, #1f5438 0%, transparent 22%),
              linear-gradient(165deg, #0d2817 0%, #040d08 100%);
  color: #e9f7ef;
  font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial;
  padding: 48px;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 50% 50%, rgba(43, 208, 106, 0.03) 0%, transparent 50%);
    pointer-events: none;
  }
`;

const Card = styled.section`
  width: min(1100px, 94%);
  background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%);
  backdrop-filter: blur(12px) saturate(1.2);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 28px;
  box-shadow: 0 20px 60px rgba(2,6,4,0.7), 
              inset 0 1px 0 rgba(255,255,255,0.1);
  padding: 56px;
  display: grid;
  grid-template-columns: 1fr 440px;
  gap: 48px;
  align-items: center;
  animation: ${fadeIn} 0.6s ease-out;
  position: relative;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 28px;
    padding: 1px;
    background: linear-gradient(135deg, rgba(43, 208, 106, 0.2), rgba(31, 154, 75, 0.1));
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    opacity: 0.6;
  }

  @media (max-width: 920px) {
    grid-template-columns: 1fr;
    padding: 36px;
    gap: 32px;
  }
`;

const Left = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  animation: ${fadeIn} 0.8s ease-out 0.2s both;
`;

const Title = styled.h1`
  font-size: clamp(32px, 4.5vw, 52px);
  margin: 0;
  line-height: 1.1;
  letter-spacing: -0.03em;
  background: linear-gradient(135deg, #f2fff7 0%, #8ef0a8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 800;
`;

const Subtitle = styled.p`
  margin: 0;
  color: #b8e8c6;
  opacity: 0.95;
  font-size: 18px;
  font-weight: 500;
`;

const Explanation = styled.div`
  margin-top: 8px;
  color: #d7f0dc;
  font-size: 15px;
  line-height: 1.65;
  opacity: 0.9;

  strong {
    color: #a8f5c0;
    font-weight: 600;
  }
`;

const Actions = styled.div`
  margin-top: 24px;
  display: flex;
  gap: 14px;
  align-items: center;
  flex-wrap: wrap;
`;

const Button = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 14px 24px;
  border-radius: 14px;
  background: linear-gradient(135deg, #2bd06a 0%, #1f9a4b 100%);
  color: #041f0b;
  text-decoration: none;
  font-weight: 700;
  font-size: 15px;
  box-shadow: 0 8px 24px rgba(27, 122, 60, 0.35),
              inset 0 1px 0 rgba(255, 255, 255, 0.2);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border: none;
  cursor: pointer;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 100%);
    opacity: 0;
    transition: opacity 0.2s;
  }

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 14px 36px rgba(27, 122, 60, 0.45),
                inset 0 1px 0 rgba(255, 255, 255, 0.3);
    
    &::before {
      opacity: 1;
    }
  }

  &:active {
    transform: translateY(-1px);
  }
`;

const Ghost = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  border-radius: 14px;
  color: #cfe7d3;
  text-decoration: none;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const Right = styled.aside`
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  animation: ${fadeIn} 1s ease-out 0.4s both;

  @media (max-width: 920px) { 
    order: -1; 
  }
`;

const Pot = styled.div`
  width: 380px;
  height: 380px;
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  filter: drop-shadow(0 20px 40px rgba(0, 0, 0, 0.4));
`;

const Soil = styled.div`
  width: 86%;
  height: 36%;
  background: linear-gradient(180deg, #3d1f0f 0%, #261108 100%);
  border-radius: 45% 45% 15% 15% / 65% 65% 12% 12%;
  position: absolute;
  bottom: 56px;
  box-shadow: inset 0 -16px 36px rgba(0, 0, 0, 0.7),
              0 4px 8px rgba(0, 0, 0, 0.3);
`;

const PotBody = styled.div`
  width: 94%;
  height: 54%;
  background: linear-gradient(165deg, #9b5645 0%, #6b3628 50%, #4d2318 100%);
  border-radius: 22px;
  position: absolute;
  bottom: 0;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.7),
              inset 0 2px 4px rgba(255, 255, 255, 0.1),
              inset 0 -8px 16px rgba(0, 0, 0, 0.4);
  border: 2px solid rgba(0, 0, 0, 0.2);
`;

const Leaf = styled.div`
  width: 160px;
  height: 200px;
  position: absolute;
  bottom: 155px;
  left: 20px;
  transform-origin: 50% 95%;
  animation: ${float} 4s ease-in-out infinite;
  filter: drop-shadow(0 8px 16px rgba(12, 50, 20, 0.4));

  &::before, &::after {
    content: "";
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(165deg, #76e88c 0%, #3bd060 40%, #1f7a3b 100%);
    border-radius: 60% 40% 50% 50% / 68% 32% 48% 52%;
    box-shadow: inset 0 2px 8px rgba(255, 255, 255, 0.3),
                inset 0 -4px 12px rgba(0, 0, 0, 0.3);
  }

  &::before {
    width: 68%;
    height: 94%;
    top: 0;
  }

  &::after {
    width: 32%;
    height: 64%;
    top: 18%;
    left: 14%;
    transform: rotate(-14deg);
    opacity: 0.94;
  }
`;

const LeafSmall = styled(Leaf)`
  width: 115px;
  height: 140px;
  left: 210px;
  bottom: 165px;
  animation-duration: 4.8s;
  animation-delay: 0.5s;
`;

const LeafBadge = styled.div`
  position: absolute;
  top: -28px;
  right: -28px;
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ffffff 0%, #e3ffe8 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 12px 32px rgba(4, 12, 6, 0.5),
              inset 0 2px 4px rgba(255, 255, 255, 0.6);
  font-weight: 800;
  font-size: 42px;
  color: #083516;
  transform: rotate(-15deg);
  animation: ${spin} 15s linear infinite;
  border: 3px solid rgba(43, 208, 106, 0.3);
`;

const FooterNote = styled.div`
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  color: #9ad6b0;
  font-size: 13px;
  line-height: 1.6;
  opacity: 0.85;

  em {
    color: #b8e8c6;
    font-style: normal;
    font-weight: 600;
    font-family: 'Courier New', monospace;
    font-size: 12px;
    background: rgba(43, 208, 106, 0.1);
    padding: 2px 6px;
    border-radius: 4px;
  }
`;

export default function NotFound404({homeUrl = "/ogb-gui/home"}){
  const {currentRoom} = useHomeAssistant();
  
  const handleHomeClick = () => {
    window.location.href = homeUrl;
  };

  const handleDebugClick = () => {
    window.location.href = "/ogb-gui/home";
  };

  return (
    <Page>
      <Card>
        <Left>
          <Title>404 — Plant Escaped 🌿</Title>
          <Subtitle>Oops — nothing growing here. Page not found.</Subtitle>

          <Explanation>
            Looks like you've wandered into a bed that nobody's been watering. 
            No worries — we've got some seeds to plant, or you can head back to <strong>Home</strong>.
          </Explanation>

          <Actions>
            <Button onClick={handleHomeClick} aria-label="Back to home page">
              🏠 Back to Home
            </Button>
            <Ghost onClick={handleDebugClick} aria-label="Debug logs">
              🔎 Debug (Growers Only)
            </Ghost>
          </Actions>

          <FooterNote>
            Tip: If you were looking for a device page, check the device ID —
            sensors are now named <em>sensor_soil_*</em> or <em>sensor_light_*</em>.
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