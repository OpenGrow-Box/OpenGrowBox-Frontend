import { useEffect, useState, useRef } from 'react';
import styled from 'styled-components';
import { FaChevronDown } from 'react-icons/fa'; 
import { motion } from 'framer-motion';

import { useHomeAssistant } from '../Context/HomeAssistantContext';

const RoomSelectCard = ({title}) => {
  const { entities, currentRoom, connection } = useHomeAssistant();
  const [roomOptions, setRoomOptions] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(currentRoom);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

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
          {selectedRoom}
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
                  {room}
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

const ToggleIcon = styled.div`
  cursor: pointer;
  font-size: 1.5rem;
  margin-top: 0.5rem;
  color: ${props => props.selected ? 'var(--secondary-hover-color)' : 'var(--main-text-color)'};
  transition: color 0.3s ease;

  &:hover {
    color: ${props => props.selected ? 'var(--main-arrow-up)' : 'var(--main-text-color)'};
  }
`;