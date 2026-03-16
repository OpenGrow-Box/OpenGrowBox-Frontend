/* eslint-disable no-unused-vars */
import styled, { keyframes } from 'styled-components';
import { useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useHomeAssistant } from '../Components/Context/HomeAssistantContext';
import { FaArrowLeft, FaHome, FaLeaf } from 'react-icons/fa';
import OGBIcon from '../misc/OGBIcon';

const fadeUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const drift = keyframes`
  0%, 100% {
    transform: translateY(0px) rotate(-1deg);
  }
  50% {
    transform: translateY(-10px) rotate(1deg);
  }
`;

const sway = keyframes`
  0%, 100% {
    transform: rotate(-6deg);
  }
  50% {
    transform: rotate(2deg);
  }
`;

const glow = keyframes`
  0%, 100% {
    opacity: 0.45;
    transform: scale(0.96);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.02);
  }
`;

const orbit = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const Page = styled.main`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: var(--main-text-color);
  background:
    radial-gradient(circle at top left, var(--main-gradient-1, rgba(16, 185, 129, 0.18)), transparent 28%),
    radial-gradient(circle at bottom right, var(--main-gradient-2, rgba(59, 130, 246, 0.18)), transparent 32%),
    var(--page-background, linear-gradient(145deg, #08111f 0%, #0f172a 48%, #1e293b 100%));
`;

const Card = styled.section`
  width: min(1120px, 100%);
  display: grid;
  grid-template-columns: minmax(0, 1fr) 420px;
  gap: 2.5rem;
  align-items: center;
  padding: 3rem;
  border-radius: 28px;
  background: linear-gradient(180deg, var(--glass-bg-primary, rgba(255, 255, 255, 0.05)), var(--glass-bg-secondary, rgba(255, 255, 255, 0.025)));
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.1));
  box-shadow: var(--main-shadow-art, 0 24px 60px rgba(0, 0, 0, 0.35));
  position: relative;
  overflow: hidden;
  animation: ${fadeUp} 0.6s ease-out;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 28px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.08), transparent 45%);
    pointer-events: none;
  }

  @media (max-width: 920px) {
    grid-template-columns: 1fr;
    padding: 2rem;
    gap: 2rem;
  }

  @media (max-width: 520px) {
    padding: 1.4rem;
    border-radius: 22px;
  }
`;

const Copy = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Eyebrow = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  width: fit-content;
  padding: 0.45rem 0.8rem;
  border-radius: 999px;
  background: rgba(16, 185, 129, 0.14);
  border: 1px solid rgba(16, 185, 129, 0.28);
  color: var(--primary-accent, #10b981);
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const Title = styled.h1`
  margin: 0;
  font-size: clamp(2.2rem, 5vw, 4.5rem);
  line-height: 0.98;
  letter-spacing: -0.05em;

  span {
    display: block;
    color: var(--second-text-color);
    font-size: clamp(1rem, 2vw, 1.25rem);
    font-weight: 600;
    letter-spacing: 0;
    margin-top: 0.9rem;
  }
`;

const Description = styled.p`
  margin: 0;
  max-width: 58ch;
  color: var(--second-text-color);
  line-height: 1.7;
  font-size: 1rem;
`;

const RoutePill = styled.div`
  width: fit-content;
  max-width: 100%;
  padding: 0.8rem 1rem;
  border-radius: 16px;
  background: rgba(15, 23, 42, 0.55);
  border: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
  color: var(--main-text-color);
  font-size: 0.92rem;
  overflow-wrap: anywhere;

  strong {
    color: var(--primary-accent, #10b981);
  }
`;

const Actions = styled.div`
  display: flex;
  gap: 0.9rem;
  flex-wrap: wrap;
  margin-top: 0.4rem;
`;

const PrimaryButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.95rem 1.25rem;
  border: none;
  border-radius: 16px;
  background: linear-gradient(135deg, var(--primary-accent, #10b981), var(--secondary-accent, #3b82f6));
  color: white;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 12px 28px rgba(16, 185, 129, 0.25);

  &:hover {
    transform: translateY(-2px);
  }
`;

const SecondaryButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.95rem 1.15rem;
  border-radius: 16px;
  background: transparent;
  border: 1px solid var(--border-color, rgba(255, 255, 255, 0.12));
  color: var(--main-text-color);
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    background: rgba(15, 23, 42, 0.72);
    border-color: rgba(16, 185, 129, 0.35);
  }
`;

const Helper = styled.div`
  margin-top: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
  color: var(--second-text-color);
  font-size: 0.92rem;
  line-height: 1.6;

  strong {
    color: var(--main-text-color);
  }
`;

const IllustrationWrap = styled.aside`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 420px;
  animation: ${fadeUp} 0.85s ease-out 0.12s both;

  @media (max-width: 920px) {
    order: -1;
    min-height: 320px;
  }
`;

const Scene = styled.div`
  position: relative;
  width: min(100%, 390px);
  aspect-ratio: 1 / 1;
  animation: ${drift} 6s ease-in-out infinite;
`;

const OGBIllustration = styled(OGBIcon)`
  position: absolute;
  left: 50%;
  top: 50%;
  width: 58%;
  height: 58%;
  transform: translate(-50%, -58%);
  color: var(--primary-accent, #10b981);
  filter:
    drop-shadow(0 10px 22px rgba(0, 0, 0, 0.28))
    drop-shadow(0 0 18px rgba(16, 185, 129, 0.22));
  z-index: 3;

  path {
    stroke: rgba(3, 10, 6, 0.14);
  }
`;

const IconBackGlow = styled.div`
  position: absolute;
  left: 50%;
  top: 45%;
  width: 48%;
  height: 48%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(16, 185, 129, 0.38) 0%, rgba(59, 130, 246, 0.18) 42%, transparent 72%);
  filter: blur(26px);
  animation: ${glow} 5s ease-in-out infinite;
  z-index: 1;
`;

const IconStage = styled.div`
  position: absolute;
  left: 50%;
  bottom: 20%;
  width: 58%;
  height: 18%;
  transform: translateX(-50%);
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0.03));
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow:
    0 18px 30px rgba(0, 0, 0, 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 0.12);
  z-index: 2;
`;

const IconShadow = styled.div`
  position: absolute;
  left: 50%;
  bottom: 16%;
  width: 44%;
  height: 7%;
  transform: translateX(-50%);
  border-radius: 999px;
  background: radial-gradient(circle, rgba(0, 0, 0, 0.34) 0%, rgba(0, 0, 0, 0.02) 74%);
  filter: blur(10px);
  z-index: 1;
`;

const IllustrationCaption = styled.div`
  position: absolute;
  left: 50%;
  bottom: 12%;
  transform: translateX(-50%);
  padding: 0.5rem 0.85rem;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.64);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: var(--second-text-color);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  z-index: 4;
`;

const ScenePanel = styled.div`
  position: absolute;
  inset: 7% 5% 6%;
  border-radius: 32px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.015));
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
`;

const Aura = styled.div`
  position: absolute;
  inset: 10% 8% 16%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, transparent 70%);
  filter: blur(28px);
  animation: ${glow} 5s ease-in-out infinite;
`;

const Dome = styled.div`
  position: absolute;
  inset: 8% 10% 20%;
  border-radius: 42% 42% 24% 24% / 50% 50% 18% 18%;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.02)),
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.14), transparent 32%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.18),
    0 26px 50px rgba(0, 0, 0, 0.24);
  backdrop-filter: blur(14px);
  overflow: hidden;
`;

const DomeGrid = styled.div`
  position: absolute;
  inset: 0;
  background:
    linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
  background-size: 26px 26px;
  mask-image: linear-gradient(180deg, rgba(255, 255, 255, 0.55), transparent 85%);
  opacity: 0.45;
`;

const DomeHighlight = styled.div`
  position: absolute;
  top: 10%;
  left: 12%;
  width: 20%;
  height: 58%;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.22), transparent);
  filter: blur(1px);
  opacity: 0.7;
`;

const Ring = styled.div`
  position: absolute;
  left: 16%;
  right: 16%;
  bottom: 12%;
  height: 14%;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(0, 0, 0, 0.2));
  border: 1px solid rgba(255, 255, 255, 0.08);
`;

const BaseShadow = styled.div`
  position: absolute;
  left: 20%;
  right: 20%;
  bottom: 8%;
  height: 8%;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(0, 0, 0, 0.34) 0%, rgba(0, 0, 0, 0.02) 72%);
  filter: blur(10px);
`;

const Soil = styled.div`
  position: absolute;
  left: 16%;
  right: 16%;
  bottom: 16%;
  height: 22%;
  border-radius: 50% 50% 28% 28% / 56% 56% 18% 18%;
  background: linear-gradient(180deg, #52311f 0%, #2d190f 100%);
  box-shadow: inset 0 -16px 24px rgba(0, 0, 0, 0.35);
`;

const SoilLine = styled.div`
  position: absolute;
  left: 21%;
  right: 21%;
  bottom: 28%;
  height: 3px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
`;

const Stem = styled.div`
  position: absolute;
  left: calc(50% - 6px);
  bottom: 29%;
  width: 12px;
  height: 28%;
  border-radius: 999px;
  background: linear-gradient(180deg, #7be495 0%, #2f9e5e 100%);
  transform-origin: bottom center;
  animation: ${sway} 5.5s ease-in-out infinite;
`;

const StemNode = styled.div`
  position: absolute;
  left: calc(50% - 10px);
  bottom: 43%;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: radial-gradient(circle, #94f0ab 0%, #39a867 65%, #217144 100%);
  box-shadow: 0 0 0 5px rgba(57, 168, 103, 0.16);
`;

const Leaf = styled.div`
  position: absolute;
  background: linear-gradient(160deg, #9cf7b2 0%, #3fcf73 48%, #1a7d42 100%);
  border-radius: 58% 42% 60% 40% / 66% 34% 58% 42%;
  box-shadow: inset 0 2px 8px rgba(255, 255, 255, 0.26), inset 0 -5px 10px rgba(0, 0, 0, 0.22);

  &::after {
    content: '';
    position: absolute;
    top: 8%;
    bottom: 10%;
    left: 48%;
    width: 2px;
    background: rgba(255, 255, 255, 0.28);
    border-radius: 999px;
  }
`;

const LeafLeft = styled(Leaf)`
  width: 108px;
  height: 142px;
  left: 22%;
  bottom: 34%;
  transform: rotate(-34deg);
  transform-origin: bottom right;
`;

const LeafRight = styled(Leaf)`
  width: 94px;
  height: 126px;
  right: 24%;
  bottom: 40%;
  transform: rotate(34deg);
  transform-origin: bottom left;
`;

const LeafBud = styled(Leaf)`
  width: 58px;
  height: 78px;
  left: calc(50% - 10px);
  bottom: 54%;
  transform: rotate(12deg);
  border-radius: 54% 46% 58% 42% / 62% 38% 56% 44%;
`;

const Core = styled.div`
  position: absolute;
  left: calc(50% - 42px);
  top: 16%;
  width: 84px;
  height: 84px;
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.06));
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: var(--primary-accent, #10b981);
  font-size: 2rem;
  box-shadow: 0 18px 30px rgba(0, 0, 0, 0.2);
`;

const CoreText = styled.div`
  position: absolute;
  top: calc(16% + 94px);
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.72rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--second-text-color);
  font-weight: 700;
`;

const Tag404 = styled.div`
  position: absolute;
  top: 12%;
  right: 4%;
  padding: 0.65rem 0.9rem;
  border-radius: 999px;
  background: linear-gradient(135deg, var(--primary-accent, #10b981), var(--secondary-accent, #3b82f6));
  color: white;
  font-size: 0.95rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.2);
`;

const Orbit = styled.div`
  position: absolute;
  inset: 4%;
  border-radius: 50%;
  border: 1px dashed rgba(255, 255, 255, 0.14);
  animation: ${orbit} 24s linear infinite;
`;

const OrbitDot = styled.div`
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  top: 17%;
  left: 78%;
  background: var(--secondary-accent, #3b82f6);
  box-shadow: 0 0 18px rgba(59, 130, 246, 0.45);
`;

const Satellite = styled.div`
  position: absolute;
  width: 42px;
  height: 42px;
  top: 24%;
  left: 10%;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: var(--secondary-accent, #3b82f6);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.18);
`;

const StatusCard = styled.div`
  position: absolute;
  right: 6%;
  bottom: 22%;
  min-width: 126px;
  padding: 0.8rem 0.9rem;
  border-radius: 18px;
  background: rgba(15, 23, 42, 0.62);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  box-shadow: 0 14px 24px rgba(0, 0, 0, 0.2);
`;

const StatusLabel = styled.div`
  font-size: 0.68rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--second-text-color);
  margin-bottom: 0.35rem;
`;

const StatusValue = styled.div`
  font-size: 1rem;
  font-weight: 800;
  color: var(--main-text-color);
`;

const StatusMeta = styled.div`
  margin-top: 0.35rem;
  font-size: 0.8rem;
  color: var(--primary-accent, #10b981);
`;

export default function NotFound404({ homeUrl = '/ogb-gui/home' }) {
  const { currentRoom } = useHomeAssistant();
  const location = useLocation();

  const handleHomeClick = () => {
    window.location.href = homeUrl;
  };

  const handleBackClick = () => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    window.location.href = homeUrl;
  };
  
  return (
    <Page>
      <Card>
        <Copy>
          <Eyebrow>
            <FaLeaf /> Route Lost
          </Eyebrow>

          <Title>
            404 - This grow path does not exist.
            <span>The page opened a dead-end instead of a live room.</span>
          </Title>

          <Description>
            The app is running, but this route does not map to a page we can grow from. Head back to a known view and continue from there.
          </Description>

          <RoutePill>
            <strong>Missing route:</strong> {location.pathname}
          </RoutePill>

          <Actions>
            <PrimaryButton onClick={handleHomeClick} aria-label="Go to home page">
              <FaHome /> Go Home
            </PrimaryButton>
            <SecondaryButton onClick={handleBackClick} aria-label="Go back">
              <FaArrowLeft /> Go Back
            </SecondaryButton>
          </Actions>

          <Helper>
            {currentRoom ? (
              <span>
                Last active room: <strong>{currentRoom}</strong>
              </span>
            ) : (
              <span>
                Try returning to <strong>Home</strong> and opening the room again from there.
              </span>
            )}
          </Helper>
        </Copy>

        <IllustrationWrap>
          <Scene>
            <ScenePanel />
            <Aura />
            <Orbit />
            <OrbitDot />
            <IconBackGlow />
            <OGBIllustration aria-hidden="true" />
            <IconStage />
            <IconShadow />
            <Tag404>404</Tag404>
            <IllustrationCaption>ogb grow core</IllustrationCaption>
          </Scene>
        </IllustrationWrap>
      </Card>
    </Page>
  );
}

NotFound404.propTypes = {
  homeUrl: PropTypes.string,
};
