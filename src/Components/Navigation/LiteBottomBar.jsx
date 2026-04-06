import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { Home, BarChart3, Settings, BookOpen } from 'lucide-react';

const LiteBottomBar = () => {
  const location = useLocation();

  const menuItems = [
    { path: '/home', icon: <Home size={24} />, label: 'Home' },
    { path: '/dashboard', icon: <BarChart3 size={24} />, label: 'Dashboard' },
    { path: '/growbook', icon: <BookOpen size={24} />, label: 'GrowBook' },
    { path: '/settings', icon: <Settings size={24} />, label: 'Settings' },
  ];

  return (
    <BarContainer>
      {menuItems.map((item) => (
        <NavItem
          key={item.path}
          to={item.path}
          $active={location.pathname === item.path}
        >
          <NavIcon>{item.icon}</NavIcon>
          <NavLabel>{item.label}</NavLabel>
        </NavItem>
      ))}
    </BarContainer>
  );
};

export default LiteBottomBar;

const BarContainer = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 0.8rem 1rem;
  background: var(--main-bg-card-color);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
  z-index: 1000;
`;

const NavItem = styled(Link)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 12px;
  transition: all 0.3s ease;
  background: ${props => props.$active ? 'var(--active-bg-color)' : 'transparent'};
  color: ${props => props.$active ? 'var(--primary-accent)' : 'var(--main-text-color)'};

  &:hover {
    background: var(--active-bg-color);
    color: var(--primary-accent);
  }
`;

const NavIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s ease;

  ${NavItem}:hover & {
    transform: scale(1.1);
  }
`;

const NavLabel = styled.span`
  font-size: 0.75rem;
  color: var(--main-text-color);
  font-weight: 500;
`;
