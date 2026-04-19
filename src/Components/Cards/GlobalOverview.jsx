import { useState } from 'react';
import { useHomeAssistant } from '../Context/HomeAssistantContext';
import styled from 'styled-components';
import { usePremium } from '../Context/OGBPremiumContext';
import { useMedium } from '../Context/MediumContext';
import { Leaf, Calendar, Sprout, TrendingUp } from 'lucide-react';

const GlobalOverview = () => {
  const { currentRoom } = useHomeAssistant();
  const { isPremium } = usePremium();
  const { currentMedium } = useMedium();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const currentPhase = currentMedium?.plant_stage || currentMedium?.current_phase || 'Unknown';
  const strainName = currentMedium?.plant_name || currentMedium?.breeder_name || 'Unknown';
  const growStartDate = currentMedium?.dates?.growstartdate || '';
  const remainingDays = currentMedium?.dates?.daysToChopChop || '';

  const formatDaysDisplay = (days) => {
    if (!days || isNaN(parseFloat(days))) return 'N/A';
    const numDays = Math.floor(parseFloat(days));
    if (numDays <= 0) return 'Ready!';
    return `${numDays}d`;
  };

  const isReady = !remainingDays || parseFloat(remainingDays) <= 0;

  return (
    <Container $isPremium={isPremium}>
      <Header onClick={() => setIsCollapsed(!isCollapsed)}>
        <HeaderLeft>
          <Icon $isPremium={isPremium}>
            <Leaf size={14} />
          </Icon>
          <Title>Grow Overview</Title>
        </HeaderLeft>
        <HeaderRight>
          <LiveDot />
        </HeaderRight>
      </Header>

      {!isCollapsed && (
        <Content>
          <StatsGrid>
            <StatCard $accent="green">
              <StatIcon><Sprout size={12} /></StatIcon>
              <StatInfo>
                <StatLabel>Strain</StatLabel>
                <StatValue>{strainName}</StatValue>
              </StatInfo>
            </StatCard>

            <StatCard $accent={isReady ? 'red' : 'blue'}>
              <StatIcon $accent={isReady ? 'red' : 'blue'}><Calendar size={12} /></StatIcon>
              <StatInfo>
                <StatLabel>Harvest</StatLabel>
                <StatValue $highlight={isReady}>{formatDaysDisplay(remainingDays)}</StatValue>
              </StatInfo>
            </StatCard>

            <StatCard $accent="purple">
              <StatIcon $accent="purple"><TrendingUp size={12} /></StatIcon>
              <StatInfo>
                <StatLabel>Phase</StatLabel>
                <StatValue>{currentPhase}</StatValue>
              </StatInfo>
            </StatCard>
          </StatsGrid>

          {growStartDate && (
            <StartInfo>
              <span>Started {new Date(growStartDate).toLocaleDateString()}</span>
            </StartInfo>
          )}
        </Content>
      )}
    </Container>
  );
};

export default GlobalOverview;

const Container = styled.div`
  background: linear-gradient(145deg, var(--main-bg-card-color), rgba(255,255,255,0.02));
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  transition: all 0.2s ease;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, #4ade80, #22d3ee);
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.02);
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Icon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: rgba(74, 222, 128, 0.15);
  color: #4ade80;
`;

const Title = styled.span`
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--main-text-color);
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
`;

const LiveDot = styled.div`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #4ade80;
  box-shadow: 0 0 6px #4ade80;
`;

const Content = styled.div`
  padding: 0.75rem 1rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
`;

const StatCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  padding: 0.6rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.1);
  }
`;

const StatIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: rgba(74, 222, 128, 0.1);
  color: ${props => props.$accent === 'red' ? '#f87171' : props.$accent === 'purple' ? '#a78bfa' : '#4ade80'};
  flex-shrink: 0;
`;

const StatInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const StatLabel = styled.div`
  font-size: 0.6rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 0.15rem;
`;

const StatValue = styled.div`
  font-size: 0.8rem;
  font-weight: 700;
  color: ${props => props.$highlight ? '#ef4444' : 'var(--main-text-color)'};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const StartInfo = styled.div`
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1));
  border-radius: 6px;
  padding: 0.4rem 0.75rem;
  text-align: center;
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.7);
`;