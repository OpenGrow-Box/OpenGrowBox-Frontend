import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';
import { MdArrowBack, MdAutoAwesome } from 'react-icons/md';
import { createPortal } from 'react-dom';
import OGBIcon from '../../misc/OGBIcon'
import Wizzard from '../Wizard/Wizzard';
import { useMemo, useRef, useState } from 'react';

const getWizardPortalTarget = (anchorElement) => {
  const rootNode = anchorElement?.getRootNode?.();

  if (rootNode && typeof rootNode.getElementById === 'function') {
    const shadowOverlayRoot = rootNode.getElementById('overlay-root');
    if (shadowOverlayRoot) {
      return shadowOverlayRoot;
    }

    const reactContainer = rootNode.getElementById('react-container');
    if (reactContainer) {
      return reactContainer;
    }
  }

  const reactContainer = document.getElementById('react-container');
  return reactContainer || document.body;
};

const DashboardTitle = ({firstText,secondText,thirdText}) => {
  const [showWizzard, setShowWizzard] = useState(false);
  const titleContainerRef = useRef(null);
  const wizardPortalTarget = useMemo(() => {
    if (typeof document === 'undefined') {
      return null;
    }

    return getWizardPortalTarget(titleContainerRef.current);
  }, [showWizzard]);

  const wizardModal = showWizzard && wizardPortalTarget
    ? createPortal(
        <WizardOverlay>
          <WizardBackdrop onClick={() => setShowWizzard(false)} />
          <WizardContent>
            <WizardCloseButton
              onClick={() => setShowWizzard(false)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              ×
            </WizardCloseButton>
            <Wizzard onComplete={() => setShowWizzard(false)} />
          </WizardContent>
        </WizardOverlay>,
        wizardPortalTarget
      )
    : null;
  
  const handleBackToHA = () => {
    // Try to navigate back to Home Assistant main interface
    try {
      // Method 1: Try to navigate parent window to HA main dashboard
      if (window.parent && window.parent.location) {
        window.parent.location.href = '/';
      } else {
        // Method 2: Try to navigate current window to HA root
        window.location.href = '/';
      }
    } catch (e) {
      // Method 3: Try to navigate to HA lovelace default dashboard
      try {
        window.location.href = '/lovelace/default_view';
      } catch (e2) {
        // Method 4: Last resort - show alert with instructions
        alert('To return to Home Assistant, close this panel or navigate back in your browser.');
      }
    }
  };

  return (
    <>
      <TitleContainer ref={titleContainerRef}>
        <BackButton
          onClick={handleBackToHA}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title="Back to Home Assistant"
        >
          <MdArrowBack />
        </BackButton>

        <TitleContent>
          <motion.span
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            {firstText}
          </motion.span>

          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            {secondText}
          </motion.span>

          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            style={{ marginLeft: 0.4, marginTop: 0.5 }}
          >
            {thirdText}
          </motion.span>

          <AnimatePresence>
            <motion.div
              key="cannabis"
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 90 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              style={{ display: 'inline-block', margin: '0 8px' }}
            >
              <OgbIcon />
            </motion.div>
          </AnimatePresence>
        </TitleContent>

        <WizardButton
          onClick={() => setShowWizzard(true)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title="Open Wizard - Quick setup guide"
        >
          <MdAutoAwesome />
        </WizardButton>
      </TitleContainer>
      {wizardModal}
    </>
  );
};

const OgbIcon = () => (
  <motion.span

    initial={{ color: "#4CAF50" }}
    animate={{ color: ["#4CAF50", "#FF9800"] }}
    transition={{
      duration: 3,
      repeat: Infinity,
      repeatType: "mirror",
    }}
    style={{ display: 'inline-block' }}
  >
    <OGBIcon style={{ width: '1.2em', height: '1.2em' }} />
  </motion.span>
);


const TitleContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  position: relative;
`;

const BackButton = styled(motion.button)`
  display: none;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 10px;
  background: var(--glass-bg-secondary, rgba(255, 255, 255, 0.08));
  color: var(--main-text-color, #fff);
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.2s ease;

  svg {
    font-size: 1.25rem;
  }

  &:hover {
    background: var(--glass-bg-primary, rgba(255, 255, 255, 0.12));
  }

  @media (max-width: 768px) {
    display: flex;
  }
`;

const TitleContent = styled.div`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;
  font-size: 1.5rem;
  color: #fff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  white-space: nowrap;

  span {
    transition: all 0.3s ease;
  }

  &:hover {
    span:first-child {
      color: rgb(23, 219, 32);
      transform: translateY(-2px);
    }
    span:nth-child(3) {
      color: rgb(163, 225, 30);
      transform: translateY(2px);
    }
    span:last-child {
      color: rgb(227, 168, 20);
    }
    svg {
      width: 1.2rem;
      height: 1.2rem;
      transform: scale(1.1) rotate(15deg);
    }
  }

  @media (max-width: 768px) {
    font-size: 1.0rem;
    svg {
      width: 1.2rem;
      height: 1.2rem;
    }
  }
`;

const WizardButton = styled(motion.button)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.3rem;
  border: none;
  border-radius: 8px;
  background: var(--glass-bg-secondary, rgba(58, 217, 234, 0.12));
  color: var(--primary-accent, #c26b0f);
  cursor: pointer;
  transition: all 0.3s ease;
  position: fixed;
  right: 1rem;
  top: 0.5rem;
  z-index: 100;

  svg {
    font-size: 1.5rem;
    animation: gentle-shine 4s ease-in-out infinite;
  }

  &:hover {
    background: var(--glass-bg-primary, rgba(255, 255, 255, 0.15));
    transform: scale(1.1);
    
    svg {
      animation: none;
    }
  }

  &:active {
    transform: scale(0.95);
  }

  @keyframes gentle-shine {
    0%, 100% {
      filter: drop-shadow(0 0 2px rgba(58, 217, 234, 0.3));
    }
    50% {
      filter: drop-shadow(0 0 6px rgba(58, 217, 234, 0.6));
    }
  }

  @media (max-width: 768px) {
    right: 0.75rem;
    top: 0.45rem;
  }
`;

const WizardOverlay = styled.div`
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20000;
  padding: 1.5rem;
  background: rgba(2, 6, 23, 0.72);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  overflow: auto;
  pointer-events: auto;

  @media (max-width: 768px) {
    padding: 0.75rem;
  }
`;

const WizardBackdrop = styled.div`
  position: absolute;
  inset: 0;
`;

const WizardContent = styled.div`
  position: relative;
  background: var(--main-bg-card-color, rgba(53, 50, 50, 0.29));
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.1));
  border-radius: 16px;
  width: min(1120px, 100%);
  max-width: calc(100vw - 2rem);
  height: min(820px, calc(100vh - 3rem));
  max-height: calc(100vh - 3rem);
  overflow: hidden;
  box-shadow: var(--main-shadow-art);
  z-index: 20001;
  isolation: isolate;
  margin: auto;

  @media (max-width: 768px) {
    width: 100%;
    max-width: 100%;
    height: min(100%, calc(100vh - 1.5rem));
    max-height: calc(100vh - 1.5rem);
    border-radius: 14px;
  }
`;

const WizardCloseButton = styled(motion.button)`
  position: absolute;
  top: 10px;
  right: 10px;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: var(--glass-bg-secondary, rgba(255, 255, 255, 0.08));
  color: var(--main-text-color, #fff);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  line-height: 1;
  z-index: 2;

  &:hover {
    background: var(--glass-bg-primary, rgba(255, 255, 255, 0.12));
  }
`;

export default DashboardTitle;
