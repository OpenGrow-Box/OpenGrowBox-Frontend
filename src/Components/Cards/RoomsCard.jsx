import { useHomeAssistant } from '../Context/HomeAssistantContext';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { Home, MapPin, ChevronRight } from 'lucide-react';

const RoomsCard = ({ areas }) => {
  const { currentRoom, entities } = useHomeAssistant();

  // Filtere nur Räume, die sensor.ogb_ Entities haben
  const filteredAreas = useMemo(() => {
    return areas.filter(room => {
      // Filtere "ambient" aus
      if (room.toLowerCase() === "ambient") return false;
      
      // Prüfe ob es für diesen Raum mindestens einen sensor.ogb_ gibt
      const hasSensors = Object.keys(entities).some(entityId => 
        entityId.startsWith('sensor.ogb_') && 
        entityId.toLowerCase().includes(room.toLowerCase())
      );
      return hasSensors;
    });
  }, [areas, entities]);

  // Verdoppelt das Array, um einen nahtlosen Übergang zu erreichen
  const duplicatedAreas = filteredAreas.concat(filteredAreas);

  return (
    <Container>
      <CompactHeader>
        <HeaderLeft>
          <HeaderIcon>
            <Home size={16} />
          </HeaderIcon>
          <HeaderTitle>Room</HeaderTitle>
        </HeaderLeft>
        <CurrentRoomBadge>
          <MapPin size={12} />
          <span>{currentRoom}</span>
        </CurrentRoomBadge>
      </CompactHeader>

      {filteredAreas.length > 1 && (
        <ScrollingContainer>
          <ScrollingList
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 15, ease: "linear", repeat: Infinity }}
          >
            {duplicatedAreas.map((area, index) => (
              <RoomItem key={index} $isActive={area === currentRoom}>
                <RoomName>{area}</RoomName>
              </RoomItem>
            ))}
          </ScrollingList>
        </ScrollingContainer>
      )}
    </Container>
  );
};

export default RoomsCard;

const Container = styled.div`
  background: linear-gradient(145deg, var(--main-bg-card-color), rgba(255,255,255,0.02));
  border: 1px solid var(--glass-border-light);
  border-radius: 12px;
  box-shadow: var(--main-shadow-art);
  overflow: hidden;
`;

const CompactHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: var(--glass-bg-secondary);
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const HeaderIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: rgba(74, 222, 128, 0.1);
  color: #4ade80;
`;

const HeaderTitle = styled.h3`
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--main-text-color);
`;

const CurrentRoomBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(147, 51, 234, 0.15));
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 16px;
  padding: 0.375rem 0.75rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: #3b82f6;

  svg {
    opacity: 0.8;
  }
`;

const ScrollingContainer = styled.div`
  overflow: hidden;
  width: 100%;
  position: relative;
  padding: 0.5rem 0.75rem;
  border-top: 1px solid var(--glass-border);

  &::before,
  &::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    width: 30px;
    z-index: 1;
    pointer-events: none;
  }

  &::before {
    left: 0;
    background: linear-gradient(90deg, var(--main-bg-card-color), transparent);
  }

  &::after {
    right: 0;
    background: linear-gradient(-90deg, var(--main-bg-card-color), transparent);
  }
`;

const ScrollingList = styled(motion.div)`
  display: flex;
  align-items: center;
  width: 200%;
  gap: 0.5rem;
`;

const RoomItem = styled.div`
  background: ${props => props.$isActive 
    ? 'rgba(34, 197, 94, 0.15)' 
    : 'var(--glass-bg-secondary)'};
  border: 1px solid ${props => props.$isActive 
    ? 'rgba(34, 197, 94, 0.3)' 
    : 'var(--glass-border)'};
  border-radius: 12px;
  padding: 0.25rem 0.625rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: ${props => props.$isActive ? '#22c55e' : 'var(--main-text-color)'};
  white-space: nowrap;
`;

const RoomName = styled.span`
  font-weight: 600;
`;