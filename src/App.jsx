import styled from 'styled-components';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { GlobalStateProvider } from './Components/Context/GlobalContext';
import HomeAssistantProvider from './Components/Context/HomeAssistantContext';

import { OGBPremiumProvider } from './Components/Context/OGBPremiumContext';


import ErrorBoundary from '../src/misc/ErrorBoundary';
import ConnectionStatus from '../src/misc/ConnectionStatus'

import GrowBook from './Pages/GrowBook';
import Dashboard from './Pages/Dashboard';
import SetupPage from './Pages/SetupPage';
import Settings from './Pages/Settings';
import Home from './Pages/Home';
import Interface from './Pages/Interface'
import Premium from './Pages/Premium';
import FourOFour from './Pages/Four0Four'
import ThemeGlobalStyle from './Pages/ThemeGlobalStyle';

import StrainDB from './Components/Premium/StrainDB';

export default function App() {

  const basename = process.env.NODE_ENV === 'development' ? '/ogb-gui/static' : '/ogb-gui';

  return (
    <GlobalOGBContainer>
        <GlobalStateProvider>
          <ErrorBoundary>
            <HomeAssistantProvider>
                <OGBPremiumProvider>
                  <ThemeGlobalStyle />
                  <Router basename={basename}>
                    <AppContainer>
                      {/* Hintergrund-Gradients */}
                      <SubtleGridOverlay />
                      <BackgroundContainer>
                        <div className='gradient-1'></div>
                        <div className='gradient-2'></div>
                        <div className='gradient-3'></div>
                        <div className='gradient-4'></div>
                        <div className='gradient-5'></div>
                      </BackgroundContainer>
                      {/* Sidebar und Main-Content */}
                      {/* Connection Status Notification */}
                      <ConnectionStatus />
                      <MainContent>
                        <Routes>
                          <Route path="/" element={<Interface />} />
                          <Route path="/home" element={<Home />} />
                          <Route path="/dashboard" element={<Dashboard />} />
                          <Route path="/premium" element={<Premium />} />
                          <Route path="/strainDB" element={<StrainDB />} />
                          <Route path="/settings" element={<Settings />} />
                          <Route path="/growbook" element={<GrowBook />} />
                          <Route path="/config" element={<SetupPage />} />
                          <Route path="/*" element={<FourOFour/>}/>
                        </Routes>
                      </MainContent>
                    </AppContainer>
                  </Router>
                </OGBPremiumProvider>
            </HomeAssistantProvider>
          </ErrorBoundary>
        </GlobalStateProvider>
    </GlobalOGBContainer>
  );
}
const GlobalOGBContainer = styled.div`

`

const AppContainer = styled.div`
  position: relative; /* Damit MainContent sich normal verhält */
  display: flex;
  z-index: 0;
  min-height:100vh;
`;

// Hintergrund für Gradients
const BackgroundContainer = styled.div`
  position: fixed; /* Stellt sicher, dass der Hintergrund fixiert bleibt */
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  z-index: -1; /* Bringt den Hintergrund nach hinten */

  .gradient-1, .gradient-2, .gradient-3, .gradient-4, .gradient-5{
    position: absolute;
    width: 250px;
    height: 250px;
    filter: blur(140px);
  }

  .gradient-1 {
    background: var(--main-gradient-1);
    top: 5%;
    left: 5%;
  }

  .gradient-2 {
    background: var(--main-gradient-2);
    top: 10%;
    left: 88%;
  }

  .gradient-3 {
    background: var(--main-gradient-3);
    top: 85%;
    left: 10%;
  }
  
  .gradient-4 {
    background: var(--main-gradient-4);
    top: 35%;
    left: 50%;
  }
  .gradient-5 {
    background: var(--main-gradient-5);
    top: 85%;
    left: 85%;
  }
`;

const SubtleGridOverlay = styled.div`
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
  background-size: 50px 50px;
  pointer-events: none;
`;



// Hauptinhalt, damit er über den Gradients bleibt
const MainContent = styled.div`
  flex-grow: 1;
  width: 100%;
  height:100%;
`;

