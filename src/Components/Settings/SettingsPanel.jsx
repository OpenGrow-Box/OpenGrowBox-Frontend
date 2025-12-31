import styled from 'styled-components';
import { Shield } from 'lucide-react';
import { useGlobalState } from '../Context/GlobalContext';
import SettingsFooter from './SettingsFooter';
import ControlMode from './ControlMode';

// Definiere deine Themes mit den entsprechenden CSS-Variablen


const SettingsPanel = () => {
  const { state, setDeep } = useGlobalState();
  const currentTheme = state.Design.theme;
  const availableThemes = state.Design.availableThemes;
  const safeModeEnabled = state.Settings?.safeModeEnabled ?? true;

  // Funktion, um das Theme anzuwenden, indem CSS-Variablen gesetzt werden

  const ChangeTheme = (themeName) => {
    setDeep('Design.theme', themeName)
    window.location.reload();
  }

  const toggleSafeMode = () => {
    setDeep('Settings.safeModeEnabled', !safeModeEnabled);
  }
  
  return (
    <MainContainer>
      <Title>Color Theme 🎨</Title>
      <ThemeList>
        {availableThemes.map((themeName) => (
          <ThemeButton
            key={themeName}
            onClick={() => ChangeTheme(themeName)}
            selected={currentTheme === themeName}
          >
            {themeName}
          </ThemeButton>
        ))}
      </ThemeList>

      <SafeModeSection>
        <SafeModeHeader>
          <SafeModeIcon><Shield size={16} /></SafeModeIcon>
          <SafeModeTitle>Safe Mode</SafeModeTitle>
        </SafeModeHeader>
        <SafeModeDescription>
          Prevents accidental changes to controls by requiring confirmation before applying changes. 
          Recommended for mobile devices to avoid unintended taps.
        </SafeModeDescription>
        <SafeModeToggle onClick={toggleSafeMode} $enabled={safeModeEnabled}>
          <SafeModeToggleSlider $enabled={safeModeEnabled}>
            <SafeModeToggleCircle $enabled={safeModeEnabled} />
          </SafeModeToggleSlider>
          <SafeModeToggleLabel>
            {safeModeEnabled ? 'Enabled (Recommended)' : 'Disabled'}
          </SafeModeToggleLabel>
        </SafeModeToggle>
      </SafeModeSection>

      <MenuControl>
        <ControlMode/>

        <MenuFooter>
            <SettingsFooter/>
        </MenuFooter>
      </MenuControl>
    </MainContainer>
  );
};

export default SettingsPanel;

const MainContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  min-height: 75vh;
  padding: 1rem;
  border-radius: 25px;
  background: var(--main-bg-card-color);
  box-shadow: var(--main-shadow-art);
`;

const Title = styled.h4`
  color: var(--main-text-color);
`;

const ThemeList = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const ThemeButton = styled.button`
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 25px;
  background: ${({ selected }) =>
    selected ? 'var(--primary-accent)' : 'var(--main-bg-card-color)'};
  color: var(--main-text-color);
  cursor: pointer;
  box-shadow: var(--main-shadow-art);
  transition: background 0.3s;

  &:hover {
    opacity: 0.8;
    background:var(--primary-accent);
  }
`;

const MenuControl = styled.div`
  display: flex;
  flex-direction: column;
  gap:1rem;
  flex-grow: 1;
  margin-top: 1rem;
`;

const MenuFooter = styled.div`
  margin-top: auto; /* Drückt den Footer nach unten */
  padding-top: 1rem;
  text-align: center;
  color: var(--main-text-color);
  border-top: 1px solid grey;
`;

const SafeModeSection = styled.div`
  margin-top: 2rem;
  padding: 1.5rem;
  background: rgba(59, 130, 246, 0.05);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 12px;
`;

const SafeModeHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
`;

const SafeModeIcon = styled.div`
  font-size: 24px;
  filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.5));
`;

const SafeModeTitle = styled.h4`
  margin: 0;
  color: var(--main-text-color);
  font-size: 1.1rem;
  font-weight: 600;
`;

const SafeModeDescription = styled.p`
  margin: 0 0 1rem 0;
  color: var(--placeholder-text-color);
  font-size: 0.85rem;
  line-height: 1.5;
`;

const SafeModeToggle = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 12px;
  background: ${props => props.$enabled ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.03)'};
  border-radius: 8px;
  transition: background 0.3s ease;

  &:hover {
    background: ${props => props.$enabled ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.08)'};
  }
`;

const SafeModeToggleSlider = styled.div`
  position: relative;
  width: 56px;
  height: 28px;
  background: ${props => props.$enabled ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'var(--disabled-text-color)'};
  border-radius: 14px;
  transition: background 0.3s ease;
  box-shadow: ${props => props.$enabled ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none'};
`;

const SafeModeToggleCircle = styled.div`
  position: absolute;
  top: 3px;
  left: ${props => props.$enabled ? '31px' : '3px'};
  width: 22px;
  height: 22px;
  background: white;
  border-radius: 50%;
  transition: left 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
`;

const SafeModeToggleLabel = styled.span`
  color: var(--main-text-color);
  font-size: 0.9rem;
  font-weight: 500;
  flex: 1;
`;

