import { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { MdDevices, MdTerminal, MdShowChart, MdVideocam } from 'react-icons/md';
import BottomBar from '../Components/Navigation/BottomBar';
import DashboardTitle from '../Components/Dashboard/DashboardTitle';
import RoomsCard from '../Components/Cards/RoomsCard';
import { useHomeAssistant } from '../Components/Context/HomeAssistantContext';
import TentControlCard from '../Components/Dashboard/TentControlCard';
import GlobalOverview from '../Components/Cards/GlobalOverview';
import DeviceCard from '../Components/Cards/ControlCards/DeviceCard';
import DashboardSlider from '../Components/Dashboard/DashboardSlider';
import DashboardStats from '../Components/Dashboard/DashboardStats';
import ConsoleCard from '../Components/Cards/ControlCards/ConsoleCard';
import CameraCard from '../Components/Cards/ControlCards/CameraCard';

import OtherSensors from '../Components/Cards/OtherSensors';
import { usePremium } from '../Components/Context/OGBPremiumContext';

const Home = () => {
  const { roomOptions } = useHomeAssistant();
  const { isPremium } = usePremium();
  const [activeTab, setActiveTab] = useState('devices');
  
 
  return (
    <MainContainer>
      <ContainerHeader>
        <DashboardTitle firstText="Open" secondText="Grow" thirdText="Box"/>
      </ContainerHeader>

      <InnerContent>
        <MainSection>
          <RoomsCard areas={roomOptions}/>
          <DashboardStats />
          <GlobalOverview/>
          <TentControlCard/>
        </MainSection>

        <DataSection>
          <TabContainer>
            <TabButton
              active={activeTab === 'devices'}
              onClick={() => setActiveTab('devices')}
            >
              <MdDevices size={20} />
              <span>Device Control</span>
              {activeTab === 'devices' && (
                <ActiveIndicator
                  layoutId="activeTab"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </TabButton>

            <TabButton
              active={activeTab === 'terminal'}
              onClick={() => setActiveTab('terminal')}
            >
              <MdTerminal size={20} />
              <span>Terminal</span>
              {activeTab === 'terminal' && (
                <ActiveIndicator
                  layoutId="activeTab"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </TabButton>

            <TabButton
              active={activeTab === 'camera'}
              onClick={() => setActiveTab('camera')}
            >
              <MdVideocam size={20} />
              <span>Camera</span>
              {activeTab === 'camera' && (
                <ActiveIndicator
                  layoutId="activeTab"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </TabButton>

            <TabButton
              active={activeTab === 'others'}
              onClick={() => setActiveTab('others')}
            >
              <MdTerminal size={20} />
              <span>Others</span>
              {activeTab === 'others' && (
                <ActiveIndicator
                  layoutId="activeTab"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </TabButton>
          </TabContainer>

          <TabContent>
            <AnimatePresence mode="wait">
              {activeTab === 'devices' && (
                <motion.div
                  key="devices"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <DeviceCard />
                </motion.div>
              )}
              
              {activeTab === 'terminal' && (
                <motion.div
                  key="terminal"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <ConsoleCard />
                </motion.div>
              )}

              {activeTab === 'camera' && (
                <motion.div
                  key="camera"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <CameraCard />
                </motion.div>
              )}



              {activeTab === 'others' && (
                <motion.div
                  key="others"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <OtherSensors />
                </motion.div>
              )}
            </AnimatePresence>
          </TabContent>

          <DashboardSlider/>
        </DataSection>
      </InnerContent>

      <BottomBar/>
    </MainContainer>
  );
};

export default Home;

const MainContainer = styled.div`
  overflow-y: auto;
  padding-bottom: 10vh;

  @media (max-width: 768px) {
    height: calc(100vh - 12.0vh);
  }
`;

const InnerContent = styled.div`
  display: flex;
  gap: 0.5rem;
  margin: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const MainSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 40vw;
  height: 100%;
  min-width: 180px;

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const DataSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 60vw;
  height: 92%;
  min-width: 180px;

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const TabContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  background: var(--main-bg-card-color);
  padding: 0.5rem;
  border-radius: 12px;
  backdrop-filter: blur(10px);
`;

const TabButton = styled.button`
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: ${props => props.active ? 'var(--main-text-color)' : 'var(--placeholder-text-color)'};
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 1;

  &:hover {
    color: var(--main-text-color);
    transform: translateY(-1px);
  }

  span {
    @media (max-width: 480px) {
      display: none;
    }
  }
`;

const ActiveIndicator = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, var(--main-arrow-up), var(--cannabis-active-color));
  border-radius: 8px;
  z-index: -1;
  box-shadow: 0 4px 12px var(--main-arrow-up);
`;

const TabContent = styled.div`
  flex: 1;
  min-height: 0;
`;

const ContainerHeader = styled.div`
  display: flex;
  top: 1;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: 3.5vh;
  margin-bottom: 0.5rem;
  padding: 0 2rem;
  background: var(--main-bg-nav-color);
  box-shadow: var(--main-shadow-art);
`;