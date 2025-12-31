import { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useMedium } from '../Context/MediumContext';
import { useHomeAssistant } from '../Context/HomeAssistantContext';
import { 
  FaSeedling, FaChevronDown, FaChevronUp, FaLeaf, FaClock,
  FaCalendarAlt, FaFlask, FaSpinner
} from 'react-icons/fa';

const MediumSelector = () => {
  const { mediums, currentMediumIndex, setCurrentMediumIndex, loading, error } = useMedium();
  const { currentRoom } = useHomeAssistant();
  const [isExpanded, setIsExpanded] = useState(false);

  if (loading) {
    return (
      <LoadingContainer>
        <LoadingSpinner>
          <FaSpinner className="fa-spin" />
        </LoadingSpinner>
        <LoadingText>Loading mediums...</LoadingText>
      </LoadingContainer>
    );
  }

  if (error) {
    return (
      <ErrorContainer>
        <ErrorIcon>⚠️</ErrorIcon>
        <ErrorText>{error}</ErrorText>
      </ErrorContainer>
    );
  }

  if (!mediums || mediums.length === 0) {
    return (
      <NoMediumsContainer>
        <NoMediumsIcon><FaSeedling size={32} /></NoMediumsIcon>
        <NoMediumsText>No mediums configured for {currentRoom}</NoMediumsText>
        <NoMediumsHint>Configure mediums in the settings to start tracking plants</NoMediumsHint>
      </NoMediumsContainer>
    );
  }

  const currentMedium = mediums[currentMediumIndex];

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Not set';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const getDaysRemaining = (medium) => {
    if (!medium?.dates?.daysToChopChop && medium?.dates?.daysToChopChop !== 0) {
      return null;
    }
    return medium.dates.daysToChopChop;
  };

  const getPhaseColor = (phase) => {
    switch (phase?.toLowerCase()) {
      case 'veg':
      case 'vegetative':
        return 'var(--main-arrow-up)';
      case 'flower':
      case 'flowering':
        return 'var(--warning-text-color)';
      case 'harvest':
      case 'drying':
        return 'var(--error-text-color)';
      default:
        return 'var(--primary-accent)';
    }
  };

  return (
    <SelectorContainer>
      {/* Main Selector */}
      <MainSelector onClick={() => setIsExpanded(!isExpanded)}>
        <MediumInfo>
          <MediumIcon>
            <FaFlask size={20} />
          </MediumIcon>
          <MediumDetails>
            <MediumName>{currentMedium?.plant_name || currentMedium?.medium_name || `Medium ${currentMediumIndex + 1}`}</MediumName>
            <MediumMeta>
              <MetaItem>
                <FaFlask size={12} />
                <strong>{currentMedium?.medium_name || `Medium ${currentMediumIndex + 1}`}</strong>
              </MetaItem>
              <MetaItem>
                <FaLeaf size={12} />
                {currentMedium?.plant_strain || 'No strain'}
              </MetaItem>
              <MetaItem>
                <PhaseBadge phase={currentMedium?.current_phase}>
                  {currentMedium?.current_phase || 'Unknown'}
                </PhaseBadge>
              </MetaItem>
            </MediumMeta>
          </MediumDetails>
        </MediumInfo>
        <ExpandButton $isExpanded={isExpanded}>
          {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
        </ExpandButton>
      </MainSelector>

      {/* Overview Grid */}
      <AnimatePresence>
        {isExpanded && (
          <OverviewGrid
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <GridHeader>
              <GridTitle>
                <FaSeedling size={16} />
                All Plants Overview
              </GridTitle>
              <PlantCount>{mediums.length} Plant{mediums.length !== 1 ? 's' : ''}</PlantCount>
            </GridHeader>

            <GridContent>
              {mediums.map((medium, index) => {
                const daysRemaining = getDaysRemaining(medium);
                const isActive = index === currentMediumIndex;
                
                return (
                  <PlantCard
                    key={index}
                    $isActive={isActive}
                    onClick={() => {
                      setCurrentMediumIndex(index);
                      setIsExpanded(false);
                    }}
                  >
                    <CardHeader>
                      <PlantIcon $isActive={isActive}>
                        <FaFlask size={16} />
                      </PlantIcon>
                      <CardInfo>
                        <PlantCardName $isActive={isActive}>
                          {medium?.plant_name || `Plant ${index + 1}`}
                        </PlantCardName>
                        <StrainName>{medium?.plant_strain || 'Unknown strain'}</StrainName>
                        <MediumNameBadge>
                          <FaFlask size={10} />
                          {medium?.medium_name || `Medium ${index + 1}`}
                        </MediumNameBadge>
                      </CardInfo>
                    </CardHeader>

                    <CardStats>
                      <StatItem>
                        <StatIcon><FaCalendarAlt size={12} /></StatIcon>
                        <StatLabel>Started</StatLabel>
                        <StatValue>{formatDate(medium?.dates?.growstartdate)}</StatValue>
                      </StatItem>

                      {medium?.dates?.bloomswitchdate && (
                        <StatItem>
                          <StatIcon><FaCalendarAlt size={12} /></StatIcon>
                          <StatLabel>Bloom</StatLabel>
                          <StatValue>{formatDate(medium?.dates?.bloomswitchdate)}</StatValue>
                        </StatItem>
                      )}

                      {daysRemaining !== null && (
                        <StatItem $highlight={daysRemaining <= 7}>
                          <StatIcon><FaClock size={12} /></StatIcon>
                          <StatLabel>Days Left</StatLabel>
                          <StatValue>{daysRemaining}</StatValue>
                        </StatItem>
                      )}
                    </CardStats>

                    <CardFooter>
                      <PhaseTag phase={medium?.current_phase}>
                        {medium?.plant_stage || medium?.current_phase || 'Unknown'}
                      </PhaseTag>
                      <DayCounter>
                        Day {medium?.dates?.planttotaldays || 0}
                      </DayCounter>
                    </CardFooter>
                  </PlantCard>
                );
              })}
            </GridContent>
          </OverviewGrid>
        )}
      </AnimatePresence>
    </SelectorContainer>
  );
};

export default MediumSelector;

// Styled Components
const SelectorContainer = styled.div`
  width: 100%;
  max-width: 600px;
  margin: 0 auto 1.5rem;
`;

const MainSelector = styled.div`
  background: linear-gradient(135deg,
    var(--main-bg-card-color)
  );
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border-light);
  border-radius: 16px;
  padding: 1.25rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.15);
    border-color: var(--primary-accent);
  }

  @media (max-width: 640px) {
    padding: 1rem 1.25rem;
  }
`;

const MediumInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
`;

const MediumIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 12px rgba(74, 222, 128, 0.3);

  @media (max-width: 640px) {
    width: 40px;
    height: 40px;
  }
`;

const MediumDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const MediumName = styled.div`
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--main-text-color);
  line-height: 1.2;

  @media (max-width: 640px) {
    font-size: 1rem;
  }
`;

const MediumMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  color: var(--second-text-color);
`;

const PhaseBadge = styled.span`
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${props => {
    const phase = props.phase?.toLowerCase();
    if (phase === 'veg' || phase === 'vegetative') {
      return 'rgba(74, 222, 128, 0.2)';
    } else if (phase === 'flower' || phase === 'flowering') {
      return 'rgba(251, 191, 36, 0.2)';
    } else if (phase === 'harvest' || phase === 'drying') {
      return 'rgba(239, 68, 68, 0.2)';
    }
    return 'rgba(59, 130, 246, 0.2)';
  }};
  color: ${props => {
    const phase = props.phase?.toLowerCase();
    if (phase === 'veg' || phase === 'vegetative') {
      return '#22c55e';
    } else if (phase === 'flower' || phase === 'flowering') {
      return '#f59e0b';
    } else if (phase === 'harvest' || phase === 'drying') {
      return '#ef4444';
    }
    return '#3b82f6';
  }};
`;

const ExpandButton = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--main-text-color);
  transition: all 0.3s ease;
  transform: ${props => props.$isExpanded ? 'rotate(180deg)' : 'rotate(0)'};

  ${MainSelector}:hover & {
    background: var(--primary-accent);
    color: white;
  }
`;

const OverviewGrid = motion(styled.div`
  margin-top: 1rem;
  background: linear-gradient(135deg,
    rgba(255, 255, 255, 0.05) 0%,
    rgba(255, 255, 255, 0.02) 100%
  );
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  overflow: hidden;
`);

const GridHeader = styled.div`
  padding: 1rem 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--glass-border);
`;

const GridTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--main-text-color);
`;

const PlantCount = styled.div`
  font-size: 0.875rem;
  color: var(--second-text-color);
  background: rgba(255, 255, 255, 0.1);
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
`;

const GridContent = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
  padding: 1rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
`;

const PlantCard = styled.div`
  background: ${props => props.$isActive 
    ? 'linear-gradient(135deg, rgba(74, 222, 128, 0.15) 0%, rgba(34, 197, 94, 0.1) 100%)'
    : 'rgba(255, 255, 255, 0.05)'
  };
  border: 1px solid ${props => props.$isActive ? 'rgba(74, 222, 128, 0.4)' : 'var(--glass-border)'};
  border-radius: 12px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    border-color: var(--primary-accent);
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

const PlantIcon = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: ${props => props.$isActive 
    ? 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)'
    : 'rgba(255, 255, 255, 0.1)'
  };
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.$isActive ? 'white' : 'var(--main-text-color)'};
`;

const CardInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const PlantCardName = styled.div`
  font-size: 0.95rem;
  font-weight: 600;
  color: ${props => props.$isActive ? '#22c55e' : 'var(--main-text-color)'};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const StrainName = styled.div`
  font-size: 0.8rem;
  color: var(--second-text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const MediumNameBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.25rem;
  padding: 0.125rem 0.5rem;
  background: rgba(74, 222, 128, 0.15);
  border: 1px solid rgba(74, 222, 128, 0.3);
  border-radius: 8px;
  font-size: 0.7rem;
  font-weight: 600;
  color: #22c55e;
  white-space: nowrap;
  
  svg {
    opacity: 0.8;
  }
`;

const CardStats = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: ${props => props.$highlight ? '#ef4444' : 'var(--second-text-color)'};
`;

const StatIcon = styled.div`
  opacity: 0.7;
`;

const StatLabel = styled.div`
  flex: 1;
`;

const StatValue = styled.div`
  font-weight: 600;
  color: var(--main-text-color);
`;

const CardFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 0.75rem;
  border-top: 1px solid var(--glass-border);
`;

const PhaseTag = styled.div`
  padding: 0.25rem 0.625rem;
  border-radius: 8px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${props => {
    const phase = props.phase?.toLowerCase();
    if (phase === 'veg' || phase === 'vegetative') {
      return 'rgba(74, 222, 128, 0.2)';
    } else if (phase === 'flower' || phase === 'flowering') {
      return 'rgba(251, 191, 36, 0.2)';
    }
    return 'rgba(59, 130, 246, 0.2)';
  }};
  color: ${props => {
    const phase = props.phase?.toLowerCase();
    if (phase === 'veg' || phase === 'vegetative') {
      return '#22c55e';
    } else if (phase === 'flower' || phase === 'flowering') {
      return '#f59e0b';
    }
    return '#3b82f6';
  }};
`;

const DayCounter = styled.div`
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--main-text-color);
  opacity: 0.8;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: var(--main-bg-card-color);
  border-radius: 16px;
  border: 1px solid var(--glass-border);
`;

const LoadingSpinner = styled.div`
  font-size: 2rem;
  color: var(--primary-accent);
  margin-bottom: 1rem;
`;

const LoadingText = styled.div`
  color: var(--second-text-color);
  font-size: 0.95rem;
`;

const ErrorContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 16px;
`;

const ErrorIcon = styled.div`
  font-size: 1.5rem;
`;

const ErrorText = styled.div`
  color: #ef4444;
  font-size: 0.95rem;
`;

const NoMediumsContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  background: var(--main-bg-card-color);
  border: 2px dashed var(--glass-border);
  border-radius: 16px;
  text-align: center;
`;

const NoMediumsIcon = styled.div`
  color: var(--primary-accent);
  margin-bottom: 1rem;
  opacity: 0.7;
`;

const NoMediumsText = styled.div`
  color: var(--main-text-color);
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
`;

const NoMediumsHint = styled.div`
  color: var(--second-text-color);
  font-size: 0.875rem;
  max-width: 400px;
`;
