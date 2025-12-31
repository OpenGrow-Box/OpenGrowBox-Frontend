import styled from 'styled-components';
import { motion } from 'framer-motion';
import { MdOutlineDashboard, MdOutlineMenuBook } from 'react-icons/md';
import { FaCogs, FaHome, FaEllipsisH } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useMemo } from 'react';

// Menu configuration - core items only
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

  // Build menu items based on screen size
  const { visibleItems, overflowItems, layoutConfig } = useMemo(() => {
    const allItems = [...MENU_CONFIG.core];

    // Determine layout based on screen size
    const screenWidth = window.innerWidth;
    const itemCount = allItems.length;
    let maxVisibleItems, showLabels, iconSize, useOverflow;

    if (screenWidth < 480) {
      maxVisibleItems = 4;
      showLabels = itemCount <= 4;
      iconSize = 'small';
      useOverflow = itemCount > 4;
    } else if (screenWidth < 768) {
      maxVisibleItems = 5;
      showLabels = itemCount <= 6;
      iconSize = 'medium';
      useOverflow = itemCount > 5;
    } else {
      maxVisibleItems = itemCount;
      showLabels = true;
      iconSize = 'large';
      useOverflow = false;
    }

    const sortedItems = allItems.sort((a, b) => a.priority - b.priority);
    const visibleItems = sortedItems.slice(0, maxVisibleItems);
    const overflowItems = sortedItems.slice(maxVisibleItems);

    return {
      visibleItems,
      overflowItems,
      layoutConfig: {
        itemCount: visibleItems.length + (useOverflow ? 1 : 0),
        showLabels,
        iconSize,
        useOverflow,
        maxVisibleItems
      }
    };
  }, []);

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
    <BottomBarContainer>
      <BackgroundBlur />
      <ContentWrapper $itemCount={layoutConfig.itemCount}>
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
              $itemCount={layoutConfig.itemCount}
              $showLabels={layoutConfig.showLabels}
              $iconSize={layoutConfig.iconSize}
            >
              <IconContainer $isActive={isActive} $iconSize={layoutConfig.iconSize}>
                <IconBackground
                  $isActive={isActive}
                  animate={isActive ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                  transition={{ duration: 0.3 }}
                />
                <IconWrapper $isActive={isActive} $iconSize={layoutConfig.iconSize}>
                  <IconComponent />
                </IconWrapper>
              </IconContainer>
              {layoutConfig.showLabels && (
                <ItemText
                  $isActive={isActive}
                  animate={{
                    opacity: isActive ? 1 : 0.7,
                    y: isActive ? -2 : 0
                  }}
                  transition={{ duration: 0.2 }}
                  $itemCount={layoutConfig.itemCount}
                  $iconSize={layoutConfig.iconSize}
                >
                  {item.label}
                </ItemText>
              )}
            </MenuItem>
          );
        })}

        {/* Overflow menu button */}
        {layoutConfig.useOverflow && overflowItems.length > 0 && (
          <MenuItem
            onClick={handleOverflowToggle}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: visibleItems.length * 0.1,
              ease: "easeOut"
            }}
            $itemCount={layoutConfig.itemCount}
            $showLabels={layoutConfig.showLabels}
            $iconSize={layoutConfig.iconSize}
            $isOverflow={true}
          >
            <IconContainer $iconSize={layoutConfig.iconSize}>
              <IconWrapper $iconSize={layoutConfig.iconSize}>
                <FaEllipsisH />
              </IconWrapper>
            </IconContainer>
            {layoutConfig.showLabels && (
              <ItemText $itemCount={layoutConfig.itemCount} $iconSize={layoutConfig.iconSize}>
                More
              </ItemText>
            )}
          </MenuItem>
        )}
      </ContentWrapper>

      {/* Overflow menu panel */}
      {showOverflow && layoutConfig.useOverflow && overflowItems.length > 0 && (
        <OverflowPanel
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
        >
          {overflowItems.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <OverflowItem
                key={item.id}
                onClick={() => handleOverflowItemClick(item.path)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <IconComponent />
                <span>{item.label}</span>
              </OverflowItem>
            );
          })}
        </OverflowPanel>
      )}
    </BottomBarContainer>
  );
};

export default BottomBar;

const BottomBarContainer = styled(motion.div)`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 85px;
  background: rgba(15, 15, 20, 0.97);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 9999;
  padding-bottom: env(safe-area-inset-bottom);

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

  @media (max-width: 768px) {
    height: 83px;
    padding-bottom: max(env(safe-area-inset-bottom), 8px);
  }

  @media (max-width: 480px) {
    height: 78px;
    padding-bottom: max(env(safe-area-inset-bottom), 8px);
  }
`;

const BackgroundBlur = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 15, 20, 0.98);
`;

const ContentWrapper = styled.div`
  position: relative;
  height: 100%;
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: ${({ $itemCount }) => $itemCount > 5 ? '8px 8px' : '8px 16px'};
  max-width: ${({ $itemCount }) => $itemCount > 5 ? '100%' : '600px'};
  margin: 0 auto;
  gap: ${({ $itemCount }) => $itemCount > 5 ? '4px' : '8px'};

  @media (max-width: 768px) {
    padding: ${({ $itemCount }) => $itemCount > 5 ? '6px 4px 14px' : '6px 12px 14px'};
    gap: ${({ $itemCount }) => $itemCount > 5 ? '2px' : '6px'};
    align-items: flex-start;
    padding-top: 8px;
  }

  @media (max-width: 480px) {
    padding: ${({ $itemCount }) => $itemCount > 5 ? '4px 2px 16px' : '4px 8px 16px'};
    gap: ${({ $itemCount }) => $itemCount > 5 ? '1px' : '4px'};
    align-items: flex-start;
    padding-top: 6px;
  }
`;

const OverflowPanel = styled(motion.div)`
  position: absolute;
  bottom: 100%;
  right: 16px;
  background: var(--input-bg-color);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  min-width: 180px;
  max-width: 280px;
  z-index: 1000;
  margin-bottom: 8px;

  @media (max-width: 480px) {
    right: 8px;
    left: 8px;
    min-width: unset;
  }
`;

const OverflowItem = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  color: var(--main-text-color);
  transition: background-color 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  &:first-child {
    border-top-left-radius: 12px;
    border-top-right-radius: 12px;
  }

  &:last-child {
    border-bottom-left-radius: 12px;
    border-bottom-right-radius: 12px;
  }

  svg {
    font-size: 18px;
    color: var(--primary-accent, #007AFF);
    flex-shrink: 0;
  }

  span {
    font-size: 14px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  @media (max-width: 480px) {
    padding: 14px 16px;
    gap: 14px;

    span {
      font-size: 15px;
    }
  }
`;

const MenuItem = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  position: relative;
  padding: ${({ $itemCount, $showLabels, $iconSize }) => {
    if ($iconSize === 'small') return $showLabels ? '4px 2px' : '6px 2px';
    if ($iconSize === 'medium') return $showLabels ? '6px 4px' : '8px 4px';
    return $showLabels ? '8px 6px' : '10px 6px';
  }};
  border-radius: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex: 1;
  max-width: ${({ $itemCount, $iconSize }) => {
    if ($iconSize === 'small') return $itemCount > 5 ? '50px' : '60px';
    if ($iconSize === 'medium') return $itemCount > 5 ? '65px' : '80px';
    return $itemCount > 5 ? '80px' : '100px';
  }};
  min-width: ${({ $iconSize }) => $iconSize === 'small' ? '44px' : '48px'};

  &:hover {
    transform: translateY(-2px);
  }

  @media (max-width: 768px) {
    padding: ${({ $showLabels, $iconSize }) => {
      if ($iconSize === 'small') return $showLabels ? '3px 1px' : '5px 1px';
      return $showLabels ? '5px 3px' : '7px 3px';
    }};
    max-width: ${({ $itemCount, $iconSize }) => {
      if ($iconSize === 'small') return $itemCount > 5 ? '45px' : '55px';
      return $itemCount > 5 ? '60px' : '75px';
    }};
  }

  @media (max-width: 480px) {
    padding: ${({ $showLabels, $iconSize }) => {
      if ($iconSize === 'small') return $showLabels ? '2px 1px' : '4px 1px';
      return $showLabels ? '4px 2px' : '6px 2px';
    }};
    max-width: ${({ $itemCount, $iconSize }) => {
      if ($iconSize === 'small') return $itemCount > 5 ? '40px' : '50px';
      return $itemCount > 5 ? '55px' : '70px';
    }};
    min-width: 44px; /* iOS minimum touch target */
  }
`;

const IconContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${({ $iconSize }) => {
    switch ($iconSize) {
      case 'small': return '36px';
      case 'medium': return '40px';
      case 'large': return '44px';
      default: return '44px';
    }
  }};
  height: ${({ $iconSize }) => {
    switch ($iconSize) {
      case 'small': return '36px';
      case 'medium': return '40px';
      case 'large': return '44px';
      default: return '44px';
    }
  }};
  margin-bottom: ${({ $iconSize }) => {
    switch ($iconSize) {
      case 'small': return '2px';
      case 'medium': return '3px';
      case 'large': return '4px';
      default: return '4px';
    }
  }};

  @media (max-width: 480px) {
    width: ${({ $iconSize }) => {
      switch ($iconSize) {
        case 'small': return '32px';
        case 'medium': return '36px';
        case 'large': return '40px';
        default: return '40px';
      }
    }};
    height: ${({ $iconSize }) => {
      switch ($iconSize) {
        case 'small': return '32px';
        case 'medium': return '36px';
        case 'large': return '40px';
        default: return '40px';
      }
    }};
    margin-bottom: ${({ $iconSize }) => {
      switch ($iconSize) {
        case 'small': return '1px';
        case 'medium': return '2px';
        case 'large': return '3px';
        default: return '3px';
      }
    }};
  }
`;

const IconBackground = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 12px;
  background: ${({ $isActive }) => 
    $isActive 
      ? 'linear-gradient(135deg, var(--primary-accent, #007AFF) 0%, var(--primary-accent, #007AFF) 100%)'
      : 'transparent'
  };
  opacity: ${({ $isActive }) => $isActive ? 0.15 : 0};
  transition: all 0.3s ease;
`;

const IconWrapper = styled(motion.div)`
  font-size: ${({ $iconSize }) => {
    switch ($iconSize) {
      case 'small': return '18px';
      case 'medium': return '20px';
      case 'large': return '24px';
      default: return '24px';
    }
  }};
  color: ${({ $isActive }) =>
    $isActive
      ? 'var(--primary-accent, #007AFF)'
      : 'var(--main-text-color, #666)'
  };
  position: relative;
  z-index: 2;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  filter: ${({ $isActive }) => $isActive ? `drop-shadow(0 0 8px var(--primary-accent, #007AFF)4D)` : 'none'};

  @media (max-width: 768px) {
    font-size: ${({ $iconSize }) => {
      switch ($iconSize) {
        case 'small': return '16px';
        case 'medium': return '18px';
        case 'large': return '22px';
        default: return '22px';
      }
    }};
  }

  @media (max-width: 480px) {
    font-size: ${({ $iconSize }) => {
      switch ($iconSize) {
        case 'small': return '14px';
        case 'medium': return '16px';
        case 'large': return '20px';
        default: return '20px';
      }
    }};
  }
`;

const ItemText = styled(motion.span)`
  font-size: ${({ $itemCount, $iconSize }) => {
    if ($iconSize === 'small') return $itemCount > 5 ? '7px' : '8px';
    if ($iconSize === 'medium') return $itemCount > 5 ? '8px' : '9px';
    return $itemCount > 5 ? '9px' : '11px';
  }};
  font-weight: ${({ $isActive }) => $isActive ? '600' : '500'};
  color: ${({ $isActive }) =>
    $isActive
      ? 'var(--primary-accent, #007AFF)'
      : 'var(--main-text-color, #666)'
  };
  letter-spacing: ${({ $iconSize }) => $iconSize === 'small' ? '0.3px' : '0.5px'};
  text-align: center;
  line-height: 1.2;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;

  @media (max-width: 768px) {
    font-size: ${({ $itemCount, $iconSize }) => {
      if ($iconSize === 'small') return $itemCount > 5 ? '6px' : '7px';
      if ($iconSize === 'medium') return $itemCount > 5 ? '7px' : '8px';
      return $itemCount > 5 ? '8px' : '10px';
    }};
  }

  @media (max-width: 480px) {
    font-size: ${({ $itemCount, $iconSize }) => {
      if ($iconSize === 'small') return $itemCount > 5 ? '6px' : '7px';
      if ($iconSize === 'medium') return $itemCount > 5 ? '7px' : '8px';
      return $itemCount > 5 ? '7px' : '9px';
    }};
    letter-spacing: 0.3px;
  }
`;  