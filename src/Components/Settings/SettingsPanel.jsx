import styled from 'styled-components';
import { Shield, ChevronDown, ChevronUp, Palette, Zap, Crown, ArrowRight, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useGlobalState } from '../Context/GlobalContext';
import SettingsFooter from './SettingsFooter';
import ControlMode from './ControlMode';

const MainContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 75vh;
  padding: 1.5rem;
  border-radius: 25px;
  background: var(--main-bg-card-color);
  box-shadow: var(--main-shadow-art);
`;

const TopRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const Title = styled.h4`
  color: var(--main-text-color);
  margin-bottom: 1rem;
`;

const ThemeSection = styled.div`
  margin-bottom: 0;
`;

const ThemeSectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.85rem 1.1rem;
  background: var(--glass-bg-primary);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 0.5rem;

  &:hover {
    background: var(--active-bg-color);
    border-color: var(--primary-accent);
  }
`;

const ThemeSectionHeaderContent = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const ThemeSectionTitle = styled.span`
  color: var(--main-text-color);
  font-size: 1rem;
  font-weight: 600;
`;

const ThemeList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.75rem;
  padding: 0.25rem;
  max-height: ${props => props.$expanded ? '1500px' : '0'};
  overflow: hidden;
  transition: max-height 0.4s ease-in-out, opacity 0.3s ease;
  opacity: ${props => props.$expanded ? '1' : '0'};
`;

const ThemeCard = styled.div`
  position: relative;
  padding: 1rem 0.75rem 0.75rem;
  background: ${({ selected }) =>
    selected ? 'var(--active-bg-color)' : 'var(--main-bg-card-color)'};
  border: 2px solid ${({ selected }) =>
    selected ? 'var(--primary-accent)' : 'var(--border-color)'};
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    transform: translateY(-4px);
    border-color: var(--primary-accent);
    box-shadow: var(--main-shadow-art);
  }
`;

const ThemePreview = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
`;

const ColorDot = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: ${props => props.color};
  box-shadow: 0 2px 8px ${props => props.color}40;
`;

const ThemeName = styled.span`
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--main-text-color);
  text-align: center;
  line-height: 1.2;
  margin-bottom: 0.25rem;
`;

const ThemeMeta = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  width: 100%;
`;

const ThemeType = styled.span`
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.15rem 0.5rem;
  border-radius: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  
  ${({ $type }) => $type === 'light' ? `
    background: rgba(251, 191, 36, 0.15);
    color: #fbbf24;
    border: 1px solid rgba(251, 191, 36, 0.3);
  ` : `
    background: rgba(99, 102, 241, 0.15);
    color: #818cf8;
    border: 1px solid rgba(99, 102, 241, 0.3);
  `}
`;

const ThemeColorPreview = styled.div`
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: ${props => props.$color};
  margin-top: 0.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
`;

const SelectedIcon = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  background: var(--primary-accent);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: white;
  font-weight: bold;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
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
  margin-top: 0;
  padding: 1rem;
  background: var(--glass-bg-primary);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
`;

const SafeModeHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
`;

const SafeModeIcon = styled.div`
  font-size: 20px;
  color: var(--primary-accent);
  filter: drop-shadow(0 0 8px var(--primary-accent));
`;

const SafeModeTitle = styled.h4`
  margin: 0;
  color: var(--main-text-color);
  font-size: 1.1rem;
  font-weight: 600;
`;

const SafeModeDescription = styled.p`
  margin: 0 0 0.75rem 0;
  color: var(--placeholder-text-color);
  font-size: 0.8rem;
  line-height: 1.4;
  flex: 1;
`;

const SafeModeToggle = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: ${props => props.$enabled ? 'rgba(34, 197, 94, 0.1)' : 'var(--glass-bg-secondary)'};
  border: 2px solid ${props => props.$enabled ? 'rgba(34, 197, 94, 0.5)' : 'var(--glass-border)'};
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 72px;

  &:hover {
    background: ${props => props.$enabled ? 'rgba(34, 197, 94, 0.2)' : 'var(--active-bg-color)'};
    border-color: ${props => props.$enabled ? 'rgba(34, 197, 94, 0.8)' : 'var(--primary-accent)'};
    transform: translateY(-2px);
    box-shadow: var(--main-shadow-art);
  }
`;

const SafeModeToggleContent = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const SafeModeIconBox = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: ${props => props.$enabled 
    ? 'linear-gradient(135deg, #22c55e, #16a34a)' 
    : 'linear-gradient(135deg, #6b7280, #4b5563)'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  box-shadow: 0 4px 12px ${props => props.$enabled ? 'rgba(34, 197, 94, 0.3)' : 'rgba(107, 114, 128, 0.3)'};
  transition: all 0.3s ease;
`;

const SafeModeToggleText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const SafeModeToggleLabel = styled.span`
  color: var(--main-text-color);
  font-size: 1.05rem;
  font-weight: 600;
`;

const SafeModeToggleSublabel = styled.span`
  color: var(--placeholder-text-color);
  font-size: 0.8rem;
`;

const SafeModeToggleSlider = styled.div`
  position: relative;
  width: 48px;
  height: 24px;
  background: ${props => props.$enabled ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'var(--disabled-text-color)'};
  border-radius: 12px;
  transition: background 0.3s ease;
  box-shadow: ${props => props.$enabled ? '0 4px 12px rgba(34, 197, 94, 0.4)' : 'none'};
`;

const SafeModeToggleCircle = styled.div`
  position: absolute;
  top: 2px;
  left: ${props => props.$enabled ? '26px' : '2px'};
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: left 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
`;

const InterfaceModeSection = styled.div`
  margin-bottom: 0;
  padding: 1rem;
  background: var(--glass-bg-primary);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
`;

const InterfaceModeHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
`;

const InterfaceModeIcon = styled.div`
  font-size: 24px;
  filter: drop-shadow(0 0 8px var(--primary-accent));
`;

const InterfaceModeTitle = styled.h4`
  margin: 0;
  color: var(--main-text-color);
  font-size: 1.1rem;
  font-weight: 600;
`;

const InterfaceModeDescription = styled.p`
  margin: 0 0 0.75rem 0;
  color: var(--placeholder-text-color);
  font-size: 0.8rem;
  line-height: 1.4;
  flex: 1;
`;

const InterfaceModeCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: var(--glass-bg-secondary);
  border: 2px solid ${props => props.$isPro ? 'var(--primary-accent)' : 'var(--glass-border)'};
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: var(--primary-accent);
    background: var(--active-bg-color);
    transform: translateY(-2px);
    box-shadow: var(--main-shadow-art);
  }
`;

const InterfaceModeContent = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const InterfaceModeIconBox = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: ${props => props.$isPro 
    ? 'linear-gradient(135deg, #f59e0b, #f97316)' 
    : 'linear-gradient(135deg, #4ade80, #22c55e)'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  box-shadow: 0 4px 12px ${props => props.$isPro ? 'rgba(245, 158, 11, 0.3)' : 'rgba(74, 222, 128, 0.3)'};
`;

const InterfaceModeText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const InterfaceModeLabel = styled.span`
  color: var(--main-text-color);
  font-size: 1.05rem;
  font-weight: 600;
`;

const InterfaceModeSublabel = styled.span`
  color: var(--placeholder-text-color);
  font-size: 0.8rem;
`;

const InterfaceModeArrow = styled.div`
  color: var(--primary-accent);
  font-size: 1.25rem;
  font-weight: bold;
`;


const SettingsPanel = () => {
  const { state, setDeep } = useGlobalState();
  const navigate = useNavigate();
  const [themesExpanded, setThemesExpanded] = useState(false);
  const currentTheme = state.Design.theme;
  const availableThemes = state.Design.availableThemes;
  const availableThemesPro = state.Design.availableThemesPro || [];
  const safeModeEnabled = state.Settings?.safeModeEnabled ?? true;
  const siteView = state.Settings?.siteView === 'pro' ? 'pro' : 'lite';

  // Funktion, um das Theme anzuwenden, indem CSS-Variablen gesetzt werden

  const ChangeTheme = (themeName) => {
    setDeep('Design.theme', themeName)
    setTimeout(() => window.location.reload(), 100);
  }

  const toggleSafeMode = () => {
    setDeep('Settings.safeModeEnabled', !safeModeEnabled);
  }

  const toggleSiteView = () => {
    const newView = siteView === 'lite' ? 'pro' : 'lite';
    
    // Theme bleibt gleich - keine Änderung beim Wechsel zwischen LITE und PRO
    setDeep('Settings.siteView', newView);
    setTimeout(() => navigate('/home'), 100);
  }

  const getThemePreviewColor = (themeName) => {
    const themeColors = {
      'Main': '#14b8a6',
      'Hacky': '#39ff14',
      'BookWorm': '#8f6b3f',
      'BlueOcean': '#60a5fa',
      'CyberPunk': '#ff2d95',
      'Unicorn': '#fb6dbb',
      'Darkness': '#475569',
      'Aurora': '#5eead4',
      'Sunshine': '#fb923c',
      'Crystal': '#3b82f6',
      'Lumina': '#f59e0b',
      'Radiance': '#22c55e',
      'NeonNights': '#ec4899',
      'MysticPurple': '#a78bfa',
      'SunsetGlow': '#facc15',
      'ForestDream': '#22c55e',
      'OceanBreeze': '#0ea5e9',
      'MidnightRose': '#f472b6',
      'ArcticFrost': '#7dd3fc',
      'CherryBlossom': '#f9a8d4',
      'Volcanic': '#f97316'
    };
    return themeColors[themeName] || '#6b7280';
  }

  const getThemeInfo = (themeName) => {
    const lightThemes = ['BookWorm', 'Crystal', 'Lumina', 'Radiance', 'OceanBreeze', 'ArcticFrost', 'CherryBlossom'];
    const themeColors = {
      'Main': { color: '#14b8a6', bg: '#07101c' },
      'Hacky': { color: '#39ff14', bg: '#030504' },
      'BookWorm': { color: '#8f6b3f', bg: '#fffaf1' },
      'BlueOcean': { color: '#60a5fa', bg: '#02131d' },
      'CyberPunk': { color: '#ff2d95', bg: '#04040a' },
      'Unicorn': { color: '#fb6dbb', bg: '#140f1f' },
      'Darkness': { color: '#475569', bg: '#06070b' },
      'Aurora': { color: '#5eead4', bg: '#09111f' },
      'Sunshine': { color: '#fb923c', bg: '#160804' },
      'Crystal': { color: '#3b82f6', bg: '#ffffff' },
      'Lumina': { color: '#f59e0b', bg: '#fafbfc' },
      'Radiance': { color: '#22c55e', bg: '#fafafa' },
      'NeonNights': { color: '#ec4899', bg: '#0a0a0f' },
      'MysticPurple': { color: '#a78bfa', bg: '#0f0a1e' },
      'SunsetGlow': { color: '#facc15', bg: '#1a1508' },
      'ForestDream': { color: '#22c55e', bg: '#0a1a0a' },
      'OceanBreeze': { color: '#0ea5e9', bg: '#e0f7fa' },
      'MidnightRose': { color: '#f472b6', bg: '#0f0a14' },
      'ArcticFrost': { color: '#7dd3fc', bg: '#f0f9ff' },
      'CherryBlossom': { color: '#f9a8d4', bg: '#fdf2f8' },
      'Volcanic': { color: '#f97316', bg: '#1c0a05' }
    };

    const isLight = lightThemes.includes(themeName);
    const themeData = themeColors[themeName] || { color: '#6b7280', bg: '#1f2937' };

    return {
      type: isLight ? 'light' : 'dark',
      typeLabel: isLight ? 'LIGHT' : 'DARK',
      mainColor: themeData.color,
      bgColor: themeData.bg
    };
  }
  
  return (
    <MainContainer>
      <TopRow>
        <InterfaceModeSection>
          <InterfaceModeHeader>
            <InterfaceModeIcon>
              <Zap size={20} />
            </InterfaceModeIcon>
            <InterfaceModeTitle>Interface Mode</InterfaceModeTitle>
          </InterfaceModeHeader>
          <InterfaceModeDescription>
            Switch between LITE (simple) and PRO (full-featured) interface modes.
          </InterfaceModeDescription>
          <InterfaceModeCard onClick={toggleSiteView} $isPro={siteView === 'pro'}>
            <InterfaceModeContent>
              <InterfaceModeIconBox $isPro={siteView === 'pro'}>
                {siteView === 'pro' ? <Crown size={24} /> : <Zap size={24} />}
              </InterfaceModeIconBox>
              <InterfaceModeText>
                <InterfaceModeLabel>
                  {siteView === 'pro' ? 'PRO Mode' : 'LITE Mode'}
                </InterfaceModeLabel>
                <InterfaceModeSublabel>
                  {siteView === 'pro' ? 'Full featured' : 'Simple interface'}
                </InterfaceModeSublabel>
              </InterfaceModeText>
            </InterfaceModeContent>
            <InterfaceModeArrow>
              <ArrowRight size={20} />
            </InterfaceModeArrow>
          </InterfaceModeCard>
        </InterfaceModeSection>

        <SafeModeSection>
          <SafeModeHeader>
            <SafeModeIcon><Shield size={20} /></SafeModeIcon>
            <SafeModeTitle>Safe Mode</SafeModeTitle>
          </SafeModeHeader>
          <SafeModeDescription>
            Prevents accidental changes by requiring confirmation before applying changes.
          </SafeModeDescription>
          <SafeModeToggle onClick={toggleSafeMode} $enabled={safeModeEnabled}>
            <SafeModeToggleContent>
              <SafeModeIconBox $enabled={safeModeEnabled}>
                <Lock size={24} />
              </SafeModeIconBox>
              <SafeModeToggleText>
                <SafeModeToggleLabel>
                  {safeModeEnabled ? 'Enabled' : 'Disabled'}
                </SafeModeToggleLabel>
                <SafeModeToggleSublabel>
                  {safeModeEnabled ? 'Changes require confirmation' : 'Direct changes allowed'}
                </SafeModeToggleSublabel>
              </SafeModeToggleText>
            </SafeModeToggleContent>
            <SafeModeToggleSlider $enabled={safeModeEnabled}>
              <SafeModeToggleCircle $enabled={safeModeEnabled} />
            </SafeModeToggleSlider>
          </SafeModeToggle>
        </SafeModeSection>
      </TopRow>

      <ThemeSection>
        <ThemeSectionHeader onClick={() => setThemesExpanded(!themesExpanded)}>
          <ThemeSectionHeaderContent>
            <Palette size={20} style={{ color: 'var(--primary-accent)' }} />
            <ThemeSectionTitle>Available Themes ({availableThemesPro.length})</ThemeSectionTitle>
          </ThemeSectionHeaderContent>
          {themesExpanded ? <ChevronUp size={22} /> : <ChevronDown size={22} />}
        </ThemeSectionHeader>
        <ThemeList $expanded={themesExpanded}>
          {availableThemesPro.map((themeName) => {
            const themeInfo = getThemeInfo(themeName);
            return (
              <ThemeCard
                key={themeName}
                onClick={() => ChangeTheme(themeName)}
                selected={currentTheme === themeName}
                themeName={themeName}
              >
                <ThemePreview>
                  <ColorDot color={getThemePreviewColor(themeName)} />
                </ThemePreview>
                <ThemeName>{themeName}</ThemeName>
                <ThemeMeta>
                  <ThemeType $type={themeInfo.type}>{themeInfo.typeLabel}</ThemeType>
                  <ThemeColorPreview $color={themeInfo.mainColor} />
                </ThemeMeta>
                {currentTheme === themeName && <SelectedIcon>✓</SelectedIcon>}
              </ThemeCard>
            );
          })}
        </ThemeList>
      </ThemeSection>

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
