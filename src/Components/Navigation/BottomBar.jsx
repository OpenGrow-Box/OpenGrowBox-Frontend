import styled from 'styled-components';
import { motion } from 'framer-motion';
import { MdOutlineDashboard, MdOutlineMenuBook } from 'react-icons/md';
import { FaCogs, FaHome } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useMemo, useEffect, useRef } from 'react';

const MENU_CONFIG = {
  core: [
    { id: 'home', path: '/home', icon: FaHome, label: 'Home', priority: 1 },
    { id: 'dashboard', path: '/dashboard', icon: MdOutlineDashboard, label: 'Dashboard', priority: 1 },
    { id: 'growbook', path: '/growbook', icon: MdOutlineMenuBook, label: 'GrowBook', priority: 1 },
    { id: 'settings', path: '/settings', icon: FaCogs, label: 'Settings', priority: 1 }
  ]
};

const BottomBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showOverflow, setShowOverflow] = useState(false);
  const [barWidth, setBarWidth] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth || 375;
    }
    return 375;
  });
  const barRef = useRef(null);

  useEffect(() => {
    const updateWidth = () => {
      if (barRef.current) {
        const rect = barRef.current.getBoundingClientRect();
        setBarWidth(rect.width);
      } else {
        setBarWidth(window.innerWidth);
      }
    };

    updateWidth();

    window.addEventListener('resize', updateWidth);
    window.addEventListener('orientationchange', () => setTimeout(updateWidth, 100));

    const resizeObserver = new ResizeObserver(() => {
      updateWidth();
    });

    if (barRef.current) {
      resizeObserver.observe(barRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateWidth);
      window.removeEventListener('orientationchange', updateWidth);
      resizeObserver.disconnect();
    };
  }, []);

  const { visibleItems, overflowItems, layoutConfig } = useMemo(() => {
    const allItems = [...MENU_CONFIG.core];
    const sortedItems = allItems.sort((a, b) => a.priority - b.priority);

    let mode, showLabels, useOverflow;

    if (barWidth < 380) {
      mode = 'compact';
      showLabels = false;
      useOverflow = false;
    } else if (barWidth < 500) {
      mode = 'comfortable';
      showLabels = false;
      useOverflow = false;
    } else if (barWidth < 700) {
      mode = 'full';
      showLabels = true;
      useOverflow = false;
    } else {
      mode = 'wide';
      showLabels = true;
      useOverflow = false;
    }

    const visibleItems = sortedItems;
    const overflowItems = [];

    return {
      visibleItems,
      overflowItems,
      layoutConfig: {
        mode,
        showLabels,
        useOverflow,
        itemCount: visibleItems.length
      }
    };
  }, [barWidth]);

  const handleOverflowToggle = () => {
    setShowOverflow(!showOverflow);
  };

  const handleOverflowItemClick = (path) => {
    navigate(path);
    setShowOverflow(false);
  };

  const handleMenuClick = (path) => {
    navigate(path);
    setShowOverflow(false);
  };

  return (
    <BottomBarContainer ref={barRef}>
      <BackgroundBlur />
      <ContentWrapper $mode={layoutConfig.mode}>
        {visibleItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          const IconComponent = item.icon;

          return (
            <MenuItem
              key={item.id}
              onClick={() => handleMenuClick(item.path)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                delay: index * 0.1,
                ease: "easeOut"
              }}
              $mode={layoutConfig.mode}
              $isActive={isActive}
            >
              <IconContainer $mode={layoutConfig.mode} $isActive={isActive}>
                <IconBackground
                  $isActive={isActive}
                  animate={isActive ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                  transition={{ duration: 0.3 }}
                />
                <IconWrapper $mode={layoutConfig.mode} $isActive={isActive}>
                  <IconComponent />
                </IconWrapper>
              </IconContainer>
              {layoutConfig.showLabels && (
                <ItemText
                  $isActive={isActive}
                  $mode={layoutConfig.mode}
                >
                  {item.label}
                </ItemText>
              )}
            </MenuItem>
          );
        })}
      </ContentWrapper>
    </BottomBarContainer>
  );
};

export default BottomBar;

const BottomBarContainer = styled(motion.div)`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 6rem;
  min-height: 5rem;
  background: var(--main-bg-nav-color, rgba(15, 15, 20, 0.97));
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
  z-index: 9999;
  padding-bottom: max(env(safe-area-inset-bottom), 8px);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(
      90deg, 
      transparent, 
      var(--primary-accent, #007AFF) 20%, 
      var(--primary-accent, #007AFF) 80%, 
      transparent
    );
    opacity: 0.6;
  }

  @media (max-width: 380px) {
    height: 60px;
  }
`;

const BackgroundBlur = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--main-bg-nav-color, rgba(15, 15, 20, 0.98));
`;

const ContentWrapper = styled.div`
  position: relative;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  width: min(100%, 26rem);
  margin: 0 auto;
  padding: 0 6px;
  gap: 0.35rem;

  @media (min-width: 500px) {
    width: min(100%, 30rem);
    padding: 0 10px;
    gap: 0.5rem;
  }

  @media (min-width: 700px) {
    width: min(100%, 34rem);
    gap: 0.65rem;
  }
`;

const MenuItem = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  padding: 6px 6px;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex: 0 1 5.8rem;
  max-width: 5.8rem;
  min-width: 4.2rem;
  height: 100%;

  &:hover {
    transform: translateY(-2px);
  }

  @media (max-width: 380px) {
    padding: 4px 4px;
    max-width: 4.8rem;
    min-width: 3.7rem;
  }

  @media (min-width: 700px) {
    padding: 8px 8px;
    flex-basis: 6.3rem;
    max-width: 6.3rem;
  }
`;

const IconContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${({ $mode }) => $mode === 'compact' ? '32px' : $mode === 'comfortable' ? '36px' : '40px'};
  height: ${({ $mode }) => $mode === 'compact' ? '32px' : $mode === 'comfortable' ? '36px' : '40px'};
  margin-bottom: ${({ $mode }) => $mode === 'compact' ? '2px' : '4px'};
`;

const IconBackground = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 10px;
  background: ${({ $isActive }) => 
    $isActive 
      ? 'linear-gradient(135deg, var(--primary-accent, #007AFF) 0%, var(--primary-accent, #007AFF) 100%)'
      : 'transparent'
  };
  opacity: ${({ $isActive }) => $isActive ? 0.15 : 0};
  transition: all 0.3s ease;
`;

const IconWrapper = styled(motion.div)`
  font-size: ${({ $mode }) => $mode === 'compact' ? '20px' : $mode === 'comfortable' ? '22px' : '24px'};
  color: ${({ $isActive }) =>
    $isActive
      ? 'var(--primary-accent, #007AFF)'
      : 'var(--second-text-color, #888)'
  };
  position: relative;
  z-index: 2;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  filter: ${({ $isActive }) => $isActive ? `drop-shadow(0 0 8px var(--primary-accent, #007AFF)4D)` : 'none'};

  @media (min-width: 700px) {
    font-size: 26px;
  }
`;

const ItemText = styled(motion.span)`
  font-size: ${({ $mode }) => $mode === 'compact' ? '0' : $mode === 'comfortable' ? '0' : '11px'};
  font-weight: ${({ $isActive }) => $isActive ? '600' : '500'};
  color: ${({ $isActive }) =>
    $isActive
      ? 'var(--primary-accent, #007AFF)'
      : 'var(--second-text-color, #888)'
  };
  letter-spacing: 0.3px;
  text-align: center;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  opacity: ${({ $mode }) => $mode === 'compact' || $mode === 'comfortable' ? 0 : 1};
  height: ${({ $mode }) => $mode === 'compact' || $mode === 'comfortable' ? '0' : 'auto'};
  transition: all 0.3s ease;

  @media (min-width: 700px) {
    font-size: 12px;
  }
`;  
