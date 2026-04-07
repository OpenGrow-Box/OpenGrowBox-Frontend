import { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { MdDevices, MdTerminal, MdVideocam, MdSmartToy } from 'react-icons/md';
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
import AICareChat from '../Components/AICare/AICareChat';

import OtherSensors from '../Components/Cards/OtherSensors';

const Home = () => {
  const { roomOptions } = useHomeAssistant();
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
              $active={activeTab === 'devices'}
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
              $active={activeTab === 'plantbuddy'}
              onClick={() => setActiveTab('plantbuddy')}
            >
              <MdSmartToy size={20} />
              <span>Plant-Buddy</span>
              {activeTab === 'plantbuddy' && (
                <ActiveIndicator
                  layoutId="activeTab"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </TabButton>

            <TabButton
              $active={activeTab === 'terminal'}
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
              $active={activeTab === 'camera'}
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
              $active={activeTab === 'others'}
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

              {activeTab === 'plantbuddy' && (
                <motion.div
                  key="plantbuddy"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <AICareChat />
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
                  <OthersInfoText>These sensors are only for viewing and have no connection to OpenGrowBox controls</OthersInfoText>
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
  flex-wrap: wrap;
  gap: 0.5rem;
  background: var(--main-bg-card-color);
  padding: 0.5rem;
  border-radius: 12px;
  backdrop-filter: blur(10px);
  justify-content: center;
`;

const TabButton = styled.button`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: ${props => props.$active ? 'var(--main-text-color)' : 'var(--placeholder-text-color)'};
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &:hover {
    color: var(--main-text-color);
    transform: translateY(-1px);
  }

  span {
    @media (max-width: 600px) {
      display: none;
    }
  }

  @media (max-width: 480px) {
    padding: 0.6rem 0.8rem;
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
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: 3.5vh;
  min-height: 50px;
  margin-bottom: 0.5rem;
  padding: 0 2rem;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
  gap: 1rem;

  @media (max-width: 768px) {
    padding: 0 1rem;
    height: 4vh;
    min-height: 45px;
    gap: 0.5rem;
  }

  @media (max-width: 480px) {
    padding: 0 0.75rem;
    height: 4.5vh;
    min-height: 40px;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
`;

const OthersInfoText = styled.p`
  color: var(--main-text-color);
  font-size: 0.85rem;
  text-align: center;
  padding: 0.75rem 1rem;
  background: var(--glass-bg-primary);
  border: 1px solid var(--glass-border);
  border-radius: 10px;
  margin-bottom: 1rem;
  line-height: 1.4;
  opacity: 0.8;
`;

