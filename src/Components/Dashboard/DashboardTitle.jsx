import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';
import { MdArrowBack } from 'react-icons/md';
import OGBIcon from '../../misc/OGBIcon'

const DashboardTitle = ({firstText,secondText,thirdText}) => {
  
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
    <TitleContainer>
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
          style={{ marginLeft: 0.4,marginTop:0.5 }}
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
            <CannabisIcon/>
          </motion.div>
        </AnimatePresence>
      </TitleContent>
    </TitleContainer>
  );
};

const CannabisIcon = () => (
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

export default DashboardTitle;
