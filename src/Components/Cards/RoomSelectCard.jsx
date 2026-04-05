import { useEffect, useState, useRef } from 'react';
import styled from 'styled-components';
import { FaChevronDown } from 'react-icons/fa'; 
import { motion } from 'framer-motion';

import { useHomeAssistant } from '../Context/HomeAssistantContext';

const RoomSelectCard = ({title}) => {
  const { entities, currentRoom, connection, areas } = useHomeAssistant();
  const [roomOptions, setRoomOptions] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(currentRoom);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Debug: log areas when they change
  useEffect(() => {
    console.log('=== RoomSelectCard areas ===');
    console.log('Areas object:', areas);
    console.log('Areas keys:', Object.keys(areas));
    console.log('dev_room area:', areas['dev_room']);
  }, [areas]);

  // Get friendly name/alias for a room - with priority: area aliases → options_with_alias → area name → fallback
  const getRoomDisplayName = (roomId) => {
    if (!roomId) return '';
    
    console.log('Looking for room:', roomId);
    console.log('Looking up in areas:', areas[roomId]);
    
    const roomIdNormalized = roomId.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');
    
    // 1. Try to get alias from select.ogb_rooms entity's options_with_alias attribute
    const roomEntity = Object.entries(entities).find(([key]) =>
      key.startsWith('select.ogb_rooms')
    )?.[1];
    
    if (roomEntity?.attributes?.options_with_alias) {
      const aliases = roomEntity.attributes.options_with_alias;
      if (aliases[roomId]) {
        console.log('Found in options_with_alias:', aliases[roomId]);
        return aliases[roomId];
      }
    }
    
    // 2. Direct area lookup by room ID - use alias first, then name
    const area = areas[roomId] || areas[roomIdNormalized];
    console.log('Found area:', area);
    
    if (area) {
      // Use alias if available (e.g., "BaboRoom #1")
      if (area.aliases && area.aliases.length > 0) {
        console.log('Using alias:', area.aliases[0]);
        return area.aliases[0];
      }
      // Fallback to area name if different from ID
      if (area.name && area.name !== area.area_id) {
        console.log('Using area name:', area.name);
        return area.name;
      }
    }
    
    // 3. Fallback: return the raw room ID
    console.log('Using fallback:', roomId);
    return roomId;
  };

  useEffect(() => {
    // Hole alle verfügbaren Räume aus der select.ogb_rooms Entity
    const allRooms = Object.entries(entities)
      .filter(([key]) => key.startsWith("select.ogb_rooms"))
      .flatMap(([_, entity]) => entity.attributes?.options || [])
      .filter(r => r.toLowerCase() !== "ambient");

    // Filtere nur Räume, die auch sensor.ogb_ Entities haben
    const roomsWithSensors = allRooms.filter(room => {
      // Prüfe ob es für diesen Raum mindestens einen sensor.ogb_ gibt
      const hasSensors = Object.keys(entities).some(entityId => 
        entityId.startsWith('sensor.ogb_') && 
        entityId.toLowerCase().includes(room.toLowerCase())
      );
      return hasSensors;
    });

    setRoomOptions([...new Set(roomsWithSensors)]);
    setSelectedRoom(currentRoom);
  }, [entities, currentRoom]);

  const handleRoomChange = async (selectedRoom) => {
    const roomEntity = Object.entries(entities).find(([key]) =>
      key.startsWith('select.ogb_rooms')
    );

    if (roomEntity && connection) {
      try {
        await connection.sendMessagePromise({
          type: 'call_service',
          domain: 'select',
          service: 'select_option',
          service_data: {
            entity_id: roomEntity[0],
            option: selectedRoom,
          },
        });
        setSelectedRoom(selectedRoom);
        setIsOpen(false);
      } catch (error) {
        console.error('Error updating room:', error);
      }
    }
  };

  // Schließt das Dropdown, wenn außerhalb geklickt wird
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <InfoContainer>
      <Label>{title}</Label>      

      <DropdownContainer ref={dropdownRef}>
        <DropdownHeader onClick={() => setIsOpen(!isOpen)}>
          {getRoomDisplayName(selectedRoom)}
          <FaChevronDown />
        </DropdownHeader>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isOpen ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        >
          {isOpen && (
            <DropdownList>
              {roomOptions.map((room, index) => (
                <DropdownItem key={index} onMouseDown={() => handleRoomChange(room)}>
                  {getRoomDisplayName(room)}
                </DropdownItem>
              ))}
            </DropdownList>
          )}
        </motion.div>
    
      </DropdownContainer>
    </InfoContainer>
  );
};

export default RoomSelectCard;

const InfoContainer = styled.div`
  width: 80%;
  max-width:25rem;
  text-align: center;
  color: white;
`;

const Label = styled.p`
  font-size: 0.9rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
`;

const DropdownContainer = styled.div`
  position: relative;
  width: 100%;
`;

const DropdownHeader = styled.div`
  width: 100%;
  padding: 12px 16px;
  font-size: 1rem;
  background: var(--main-bg-color);
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  box-shadow: var(--main-shadow-art);
  color: var(--main-text-color);
  
  &:hover {
     background: var(--third-hover-color);
  }
`;

const DropdownList = styled.ul`
  position: absolute;
  width: 100%;
  background: var(--main-bg-color);
  border-radius: 8px;
  margin-top: 5px;
  list-style: none;
  padding: 0;
  max-height: 200px;
  overflow-y: auto;
  box-shadow: var(--main-shadow-art);
  z-index: 10;
`;

const DropdownItem = styled.li`
  padding: 12px 16px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s ease-in-out;
  color: var(--main-text-color);
  
  &:hover {
     background: var(--third-hover-color);
  }
`;

