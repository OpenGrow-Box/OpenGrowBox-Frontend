import styled from 'styled-components';
import { useGlobalState } from '../Context/GlobalContext';
import SettingsFooter from './SettingsFooter';
import ControlMode from './ControlMode';

// Definiere deine Themes mit den entsprechenden CSS-Variablen


const SettingsPanel = () => {
  const { state, setDeep } = useGlobalState();
  const currentTheme = state.Design.theme;
  const availableThemes = state.Design.availableThemes;

  // Funktion, um das Theme anzuwenden, indem CSS-Variablen gesetzt werden

  const ChangeTheme = (themeName) => {
    setDeep('Design.theme', themeName)
    window.location.reload();
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

