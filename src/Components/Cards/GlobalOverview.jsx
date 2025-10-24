import { useEffect, useState, useMemo } from 'react';
import { useHomeAssistant } from '../Context/HomeAssistantContext';
import styled from 'styled-components';
import OGBIcon from '../../misc/OGBIcon'
const GlobalOverview = () => {
  const { entities, currentRoom } = useHomeAssistant();
  const [remainingDays, setRemainingDays] = useState('');
  const [strainName, setStrainName] = useState('');

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
  }, [entities, roomKey]);

  const formatDaysDisplay = (days) => {
    if (!days || isNaN(parseFloat(days))) return 'N/A';
    const numDays = Math.floor(parseFloat(days));
    if (numDays <= 0) return 'Ready to Harvest';
    return numDays === 1 ? '1 Day' : `${numDays} Days`;
  };

  return (
    <Container>
      <Header>
        <Icon>    <OGBIcon style={{ width: '1.2em', height: '1.2em' }} /> </Icon>
        <Title>Grow Overview</Title>
      </Header>
      
      <Content>
        <StrainCard>
          <Label>Strain</Label>
          <Value>{strainName || 'Unknown'}</Value>
        </StrainCard>
        
        <Divider />
        
        <DaysCard isReady={!remainingDays || parseFloat(remainingDays) <= 0}>
          <Label>Harvest in</Label>
          <Value highlight isReady={!remainingDays || parseFloat(remainingDays) <= 0}>{formatDaysDisplay(remainingDays)}</Value>
        </DaysCard>
      </Content>
    </Container>
  );
};

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
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--primary-accent), #4ade80);
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content:center;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
`;

const Icon = styled.div`
  font-size: 1.5rem;
  filter: drop-shadow(0 2px 4px rgba(74, 222, 128, 0.3));
`;

const Title = styled.h3`
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--main-text-color);
  letter-spacing: 0.5px;
`;

const Content = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 1.25rem 1.5rem;
  gap: 1.5rem;
`;

const StrainCard = styled.div`
  background: rgba(74, 222, 128, 0.08);
  border: 1px solid rgba(74, 222, 128, 0.2);
  padding: 1rem;
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
  padding: 1rem;
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
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 0.5rem;
`;

const Value = styled.div`
  font-size: 1.1rem;
  font-weight: 700;
  color: ${props => 
    props.isReady ? '#ef4444' : 
    props.highlight ? '#3b82f6' : '#4ade80'};
  text-shadow: 0 1px 2px rgba(0,0,0,0.1);
`;