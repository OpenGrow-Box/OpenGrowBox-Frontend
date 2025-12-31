import { useEffect, useState, useMemo } from 'react';
import { useHomeAssistant } from '../Context/HomeAssistantContext';
import styled, { keyframes } from 'styled-components';
import OGBIcon from '../../misc/OGBIcon'
import { usePremium } from '../Context/OGBPremiumContext';
import { Leaf, Calendar, Target, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
const GlobalOverview = () => {
  const { entities, currentRoom } = useHomeAssistant();
  const{isPremium,activeGrowPlan} = usePremium();
  const [remainingDays, setRemainingDays] = useState('');
  const [strainName, setStrainName] = useState('');
  const [growStartDate, setGrowStartDate] = useState('');
  const [currentPhase, setCurrentPhase] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(true); // Default collapsed

  const roomKey = useMemo(() => currentRoom.toLowerCase(), [currentRoom]);

   useEffect(() => {
     const chopChopSensor = entities[`sensor.ogb_chopchoptime_${roomKey}`];
     if (chopChopSensor) {
       setRemainingDays(chopChopSensor.state);
     }

     const strainSensor = entities[`text.ogb_strainname_${roomKey}`];
     if (strainSensor) {
       setStrainName(strainSensor.state);
     }

     const startDateSensor = entities[`date.ogb_growstartdate_${roomKey}`];
     if (startDateSensor) {
       setGrowStartDate(startDateSensor.state);
     }

     // Calculate current phase based on days
     const totalDaysSensor = entities[`sensor.ogb_planttotaldays_${roomKey}`];
     if (totalDaysSensor && totalDaysSensor.state) {
       const days = parseFloat(totalDaysSensor.state);
       if (days < 30) setCurrentPhase('Seedling');
       else if (days < 60) setCurrentPhase('Vegetative');
       else if (days < 90) setCurrentPhase('Flowering');
       else setCurrentPhase('Late Flower');
     }
   }, [entities, roomKey]);

  const formatDaysDisplay = (days) => {
    if (!days || isNaN(parseFloat(days))) return 'N/A';
    const numDays = Math.floor(parseFloat(days));
    if (numDays <= 0) return 'Ready to Harvest';
    return numDays === 1 ? '1 Day' : `${numDays} Days`;
  };

  const toggleCollapsed = () => {
    setIsCollapsed(!isCollapsed);
  };

  

  return (
    <Container>
      <Header onClick={toggleCollapsed} style={{ cursor: 'pointer' }}>
        <IconContainer>
          <Leaf size={20} color="#4ade80" />
        </IconContainer>
        <Title>Grow Overview</Title>
        <HeaderActions>
          <StatusIndicator>
            <div className="pulse-dot"></div>
            <span>Live</span>
          </StatusIndicator>
          <ToggleButton>
            {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </ToggleButton>
        </HeaderActions>
      </Header>

      {!isCollapsed && (
        <Content>
        <InfoGrid>
          <InfoCard>
            <CardIcon>
              <Target size={16} />
            </CardIcon>
            <CardContent>
              <Label>Strain</Label>
              <Value>{strainName || 'Unknown'}</Value>
            </CardContent>
          </InfoCard>

          <InfoCard>
            <CardIcon>
              <Calendar size={16} />
            </CardIcon>
            <CardContent>
              <Label>Harvest in</Label>
              <Value highlight isReady={!remainingDays || parseFloat(remainingDays) <= 0}>
                {formatDaysDisplay(remainingDays)}
              </Value>
            </CardContent>
          </InfoCard>

          <InfoCard>
            <CardIcon>
              <TrendingUp size={16} />
            </CardIcon>
            <CardContent>
              <Label>Growth Phase</Label>
              <Value>{currentPhase || 'Unknown'}</Value>
            </CardContent>
          </InfoCard>
        </InfoGrid>

        {growStartDate && (
          <GrowStartInfo>
            <Label>Grow Started</Label>
            <Value>{new Date(growStartDate).toLocaleDateString()}</Value>
          </GrowStartInfo>
        )}

        {isPremium === true && (
          <PremiumSection>
            <PremiumHeader>
              <span>Premium Grow Plan</span>
            </PremiumHeader>
            <PremiumGrid>
              <PremiumCard>
                <Label>Active Plan</Label>
                <Value>{activeGrowPlan.plan_name || 'No Plan Active'}</Value>
              </PremiumCard>
              <PremiumCard>
                <Label>Current Week</Label>
                <Value>{activeGrowPlan.active_week || 'N/A'}</Value>
              </PremiumCard>
            </PremiumGrid>
          </PremiumSection>
        )}
        </Content>
      )}
    </Container>
  );
};

const slideDown = keyframes`
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

export default GlobalOverview;

const Container = styled.div`
  background: linear-gradient(145deg, var(--main-bg-card-color), rgba(255,255,255,0.02));
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow:
    var(--main-shadow-art),
    inset 0 1px 0 rgba(255,255,255,0.1);
  border-radius: 16px;
  overflow: hidden;
  position: relative;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow:
      0 8px 25px rgba(0,0,0,0.15),
      inset 0 1px 0 rgba(255,255,255,0.1);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #4ade80, #3b82f6, #8b5cf6);
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.02);
`;

const IconContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(74, 222, 128, 0.1);
  border: 1px solid rgba(74, 222, 128, 0.2);
`;

const Title = styled.h3`
  margin: 0;
  font-size: 1.3rem;
  font-weight: 600;
  color: var(--main-text-color);
  letter-spacing: 0.5px;
`;

const StatusIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: #4ade80;
  font-weight: 500;

  .pulse-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #4ade80;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const ToggleButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  padding: 0.25rem;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.3);
    color: white;
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(74, 222, 128, 0.3);
  }
`;

const Content = styled.div`
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  animation: ${slideDown} 0.3s ease-out;
`;

const CollapsedContent = styled.div`
  padding: 0.75rem 1.5rem;
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
`;

const InfoCard = styled.div`
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    border-color: rgba(255, 255, 255, 0.15);
  }
`;

const CardIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(74, 222, 128, 0.1);
  color: #4ade80;
  flex-shrink: 0;
`;

const CardContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const GrowStartInfo = styled.div`
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1));
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 10px;
  padding: 0.75rem 1rem;
  text-align: center;
  backdrop-filter: blur(10px);
`;

const PremiumSection = styled.div`
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.05), rgba(255, 165, 0, 0.05));
  border: 1px solid rgba(255, 165, 0, 0.2);
  border-radius: 12px;
  padding: 1rem;
  backdrop-filter: blur(10px);
`;

const PremiumHeader = styled.div`
  font-size: 0.9rem;
  font-weight: 600;
  color: #fbbf24;
  text-align: center;
  margin-bottom: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const PremiumGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
`;

const PremiumCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 165, 0, 0.15);
  border-radius: 8px;
  padding: 0.75rem;
  text-align: center;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
    transform: translateY(-1px);
  }
`;

const GrowPlanCard = styled.div`
  background: rgba(74, 222, 128, 0.08);
  border: 1px solid rgba(74, 222, 128, 0.2);
  padding: 0.5rem;
  border-radius: 8px;
  text-align: center;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(74, 222, 128, 0.12);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(74, 222, 128, 0.15);
  }
`;
const GrowPlanWeekCard = styled.div`
  background: rgba(255, 125, 0, 0.10);
  border: 1px solid rgba(74, 222, 128, 0.2);
  padding: 0.5rem;
  border-radius: 8px;
  text-align: center;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(74, 222, 128, 0.12);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(74, 222, 128, 0.15);
  }
`;



const DaysCard = styled.div`
  background: ${props => props.isReady ? 
    'rgba(239, 68, 68, 0.08)' : 
    'rgba(59, 130, 246, 0.08)'};
  border: 1px solid ${props => props.isReady ? 
    'rgba(239, 68, 68, 0.2)' : 
    'rgba(59, 130, 246, 0.2)'};
  padding: 0.5rem;
  border-radius: 8px;
  text-align: center;
  transition: all 0.3s ease;
  
  &:hover {
    background: ${props => props.isReady ? 
      'rgba(239, 68, 68, 0.12)' : 
      'rgba(59, 130, 246, 0.12)'};
    transform: translateY(-1px);
    box-shadow: ${props => props.isReady ? 
      '0 4px 12px rgba(239, 68, 68, 0.15)' : 
      '0 4px 12px rgba(59, 130, 246, 0.15)'};
  }
`;

const Divider = styled.div`
  width: 1px;
  height: 40px;
  background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.2), transparent);
`;

const Label = styled.div`
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 0.25rem;
`;

const Value = styled.div`
  font-size: ${props => props.isReady ? '1rem' : '1.1rem'};
  font-weight: 700;
  color: ${props =>
    props.isReady ? '#ef4444' :
    props.highlight ? '#3b82f6' : '#4ade80'};
  text-shadow: 0 1px 2px rgba(0,0,0,0.1);
  word-break: break-word;
`;