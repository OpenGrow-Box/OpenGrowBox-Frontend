import { useState, useEffect } from 'react';
import styled from 'styled-components';

import { useHomeAssistant } from '../Context/HomeAssistantContext';
import StatCard from '../Cards/StatCard';
import formatLabel from '../../misc/formatLabel';


const DashboardStats = () => {
  const { entities,currentRoom, connection } = useHomeAssistant();
  const [roomSensors, setRoomSensors] = useState([]);

  const normalizeStatLabel = (label) => {
    const cleaned = String(label || '')
      .replace(/^Current\s+/i, '')
      .replace(/^Avg\s+/i, '')
      .trim();

    return cleaned.toLowerCase() === 'dew point' ? 'Dewpoint' : cleaned;
  };

  const updateRoomSensors = () => {
    const sensors = Object.entries(entities)
      .filter(([key, entity]) =>
        key.startsWith('sensor.') &&
        (key.toLowerCase().includes('ogb_avg') || 
         key.toLowerCase().includes('ogb_currentvpd')) && 
        key.toLowerCase().includes(currentRoom.toLowerCase()) && 
        !isNaN(parseFloat(entity.state))
      )
      .map(([key, entity]) => ({
        id: key,
        value: parseFloat(entity.state),
        unit: entity.attributes?.unit_of_measurement || '',
        friendlyName: normalizeStatLabel(
          formatLabel(
            entity.attributes?.friendly_name || key,
            currentRoom,
            entity.entity_id || key
          )
        ),
      }))
      // Sortiere in umgekehrter alphabetischer Reihenfolge basierend auf dem friendlyName
      .sort((a, b) => b.friendlyName.localeCompare(a.friendlyName));
  
    setRoomSensors(sensors);
  };
  
  
  

  useEffect(() => {
    updateRoomSensors();

    if (connection) {
      const handleStateChange = (event) => {
        const data = JSON.parse(event.data);
        if (
          data.type === 'state_changed' &&
          data.entity_id.startsWith('sensor.') &&
          data.entity_id.toLowerCase().includes('ogb_avg')
        ) {
          updateRoomSensors();
        }
      };

      connection.addEventListener('message', handleStateChange);
      return () => connection.removeEventListener('message', handleStateChange);
    }
  }, [entities, connection, currentRoom]);

  return (
    <StatsContainer>
      {roomSensors.length > 0 ? (
        roomSensors.map((sensor,index) => (
          <StatCard key={index} title={sensor.friendlyName} value={sensor.value} unit={sensor.unit}/>
        ))
      ) : (
        <p>NO Sensors Found !!!!</p>
      )}
    </StatsContainer>
  );
};

export default DashboardStats;

// Styled Components
const StatsContainer = styled.div`
  display: flex;
  flex-direction: row;  

  justify-content:space-around;
  align-items:center;
  height: auto;
  padding: 0.5rem;

  color: var(--main-text-color);
  background:  var(--main-bg-card-color);

  box-shadow: var(--main-shadow-art);
  border-radius: 25px;
  p{
    color:red;
    font-size:0.8rem;
  }

  `;
