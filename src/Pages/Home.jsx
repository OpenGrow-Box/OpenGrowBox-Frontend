import { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { MdDevices, MdTerminal, MdShowChart } from 'react-icons/md';
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
import HeatMap from '../Components/Cards/HeatMap';
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

            {isPremium && (
              <TabButton
                active={activeTab === 'heatmap'}
                onClick={() => setActiveTab('heatmap')}
              >
                <MdShowChart size={20} />
                <span>Heat Map</span>
                {activeTab === 'heatmap' && (
                  <ActiveIndicator
                    layoutId="activeTab"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </TabButton>
            )}

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
              
              {isPremium && activeTab === 'heatmap' && (
                <motion.div
                  key="heatmap"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <HeatMap />
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
  background: rgba(0, 0, 0, 0.3);
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
  color: ${props => props.active ? '#fff' : 'rgba(255, 255, 255, 0.6)'};
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 1;

  &:hover {
    color: #fff;
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
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.3), rgba(56, 142, 60, 0.3));
  border-radius: 8px;
  z-index: -1;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
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
  background: rgba(0, 0, 0, 0.4);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
`;