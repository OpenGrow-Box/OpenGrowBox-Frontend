import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { FaPowerOff } from "react-icons/fa";
import { useHomeAssistant } from "../../Context/HomeAssistantContext";
import formatLabel from "../../../misc/formatLabel";
import { useGlobalState } from "../../Context/GlobalContext";

const DeviceCard = () => {
  const { entities, connection, currentRoom} = useHomeAssistant();
  const { HASS} = useGlobalState();
  const [devices, setDevices] = useState([]);
  const [deviceSelect, setDeviceSelect] = useState("room");

  const updateDevices = () => {
    let sensors = Object.entries(entities)
      .filter(([key, entity]) => {
        const isRelevantType =
          (key.startsWith("switch.") ||
            key.startsWith("light.") ||
            key.startsWith("fan.") ||
            key.startsWith("climate.") ||
            key.startsWith("humidifier.")) &&
          !key.includes("template"); // Template-Entities ausschließen
        const isAvailable = entity.state !== "unavailable";
        return isRelevantType && isAvailable;
      })
      .map(([key, entity]) => {
        const domain = key.split(".")[0];
        const title = formatLabel(entity.attributes?.friendly_name || entity.entity_id);
        return {
          id: key,
          title,
          entity_id: entity.entity_id,
          state: entity.state,
          domain,
          brightness:
            domain === "light" && entity.attributes?.brightness !== undefined
              ? Math.round((entity.attributes.brightness / 255) * 100)
              : undefined,
          duty:
            domain === "fan" && entity.attributes?.percentage !== undefined
              ? entity.attributes.percentage
              : undefined,
          hvacMode:
            domain === "climate" && entity.attributes?.hvac_mode !== undefined
              ? entity.attributes.hvac_mode
              : undefined,
          hvacModes:
            domain === "climate" && entity.attributes?.hvac_modes !== undefined
              ? entity.attributes.hvac_modes
              : [],
        };
      });
  
    // Filter: Wenn "room" ausgewählt ist, nur Geräte des aktuellen Raumes anzeigen
    if (deviceSelect === "room") {
      if (import.meta.env.PROD) {
        const devices = HASS?.devices;
        const haEntities = HASS?.entities;
        let roomDeviceIds = []; // Array zum Speichern der eindeutigen Geräte-IDs
        let roomEntities = [];  // Array für die passenden Entities
  
        if (devices) {
          // Durchlaufe alle Devices
          for (const [key, device] of Object.entries(devices)) {
            // Prüfe, ob das Device im aktuellen Raum ist
            if (device.area_id === currentRoom.toLowerCase()) {
              if (!roomDeviceIds.includes(key)) {
                roomDeviceIds.push(key);
              }
            }
          }
        }
        if (haEntities) {
          for (const [entityKey, entity] of Object.entries(haEntities)) {
            if (roomDeviceIds.includes(entity.device_id)) {
              roomEntities.push(entity.entity_id);
            }
          }
        }
        // Filtere nur die Entitäten, die in roomEntities enthalten sind
        sensors = sensors.filter(sensor => roomEntities.includes(sensor.entity_id));
      }
    }
  
    // Sortierung nach Status und Domain
    const sortedSensors = sensors.sort((a, b) => {
      if (a.state === "on" && b.state !== "on") return -1;
      if (a.state !== "on" && b.state === "on") return 1;
      if (a.domain < b.domain) return -1;
      if (a.domain > b.domain) return 1;
      return 0;
    });
  
    setDevices(sortedSensors);
  };
  

  useEffect(() => {
    updateDevices();

    if (connection) {
      const handleMessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "state_changed" && data.entity_id) {
          updateDevices();
        }
      };

      connection.addEventListener("message", handleMessage);
      return () => connection.removeEventListener("message", handleMessage);
    }
  }, [entities, connection, deviceSelect, currentRoom]);

  const handleDeviceSelect = (select) => {
    setDeviceSelect(select);
  };

  const toggleDevice = async (sensor) => {
    if (connection) {
      try {
        const domain = sensor.entity_id.split(".")[0];
        await connection.sendMessagePromise({
          type: "call_service",
          domain: domain,
          service: "toggle",
          service_data: { entity_id: sensor.entity_id },
        });
      } catch (error) {
        console.error("Error toggling device:", error);
      }
    }
  };

  const updateDutyCycle = async (entityId, value) => {
    if (connection) {
      try {
        await connection.sendMessagePromise({
          type: "call_service",
          domain: "fan",
          service: "set_percentage",
          service_data: {
            entity_id: entityId,
            percentage: Number(value),
          },
        });
      } catch (error) {
        console.error("Error updating duty cycle:", error);
      }
    }
  };

  const updateBrightness = async (entityId, value) => {
    if (connection) {
      try {
        const brightnessValue = Math.round((value / 100) * 255);
        await connection.sendMessagePromise({
          type: "call_service",
          domain: "light",
          service: "turn_on",
          service_data: {
            entity_id: entityId,
            brightness: brightnessValue,
          },
        });
      } catch (error) {
        console.error("Error updating brightness:", error);
      }
    }
  };

  const updateHvacMode = async (entityId, mode) => {
    if (connection) {
      try {
        await connection.sendMessagePromise({
          type: "call_service",
          domain: "climate",
          service: "set_hvac_mode",
          service_data: {
            entity_id: entityId,
            hvac_mode: mode,
          },
        });
      } catch (error) {
        console.error("Error updating HVAC mode:", error);
      }
    }
  };

  return (
    <CardContainer>
      <CardHeader>
        <HeaderTitle 
          $active={deviceSelect === "room"} 
          onClick={() => handleDeviceSelect("room")}
        >
          Room
        </HeaderTitle>
        <HeaderTitle 
          $active={deviceSelect === "all"} 
          onClick={() => handleDeviceSelect("all")}
        >
          All
        </HeaderTitle>
      </CardHeader>
      <Content>
        {devices.map((sensor) => (
          <DeviceBox key={sensor.id}>
            <DeviceHeader>
              <DeviceTitle>{sensor.title}</DeviceTitle>
              <PowerButton onClick={() => toggleDevice(sensor)}>
                <FaPowerOff color={sensor.state === "on" ? "green" : "red"} />
              </PowerButton>
            </DeviceHeader>
            {sensor.domain === "fan" && sensor.duty !== null && (
              <ControlBox>
                <ControlHeader>
                  <ControlLabel>Duty Cycle</ControlLabel>
                  <ControlLabelValue>{sensor.duty}%</ControlLabelValue>
                </ControlHeader>
                <ControlSliderWrapper>
                  <ControlSlider
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={sensor.duty}
                    onChange={(e) => updateDutyCycle(sensor.entity_id, e.target.value)}
                  />
                </ControlSliderWrapper>
              </ControlBox>
            )}
            {sensor.domain === "light" && sensor.brightness !== undefined && (
              <ControlBox>
                <ControlHeader>
                  <ControlLabel>Brightness</ControlLabel>
                  <ControlLabelValue>{sensor.brightness}%</ControlLabelValue>
                </ControlHeader>
                <ControlSliderWrapper>
                  <ControlSlider
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={sensor.brightness}
                    onChange={(e) => updateBrightness(sensor.entity_id, e.target.value)}
                  />
                </ControlSliderWrapper>
              </ControlBox>
            )}
            {sensor.domain === "climate" && sensor.hvacMode !== undefined && (
              <ControlBox>
                <ControlLabel>HVAC Mode</ControlLabel>
                <HvacModeSelect
                  value={sensor.hvacMode}
                  onChange={(e) => updateHvacMode(sensor.entity_id, e.target.value)}
                >
                  {sensor.hvacModes.map((mode) => (
                    <option key={mode} value={mode}>
                      {mode}
                    </option>
                  ))}
                </HvacModeSelect>
              </ControlBox>
            )}
          </DeviceBox>
        ))}
        {devices.length === 0 && <NoData>No Devices found.</NoData>}
      </Content>
    </CardContainer>
  );
};

export default DeviceCard;

//
// Styled Components
//
const CardContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.5rem;
  background: var(--main-bg-card-color);
  border-radius: 25px;
  box-shadow: var(--main-shadow-art);
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-around;
  width: 100%;
  gap: 0.3rem;
  margin-top: 1rem;

`;

const HeaderTitle = styled.div`
  padding: 1rem;
  background: var(--main-bg-card-color);
  border-radius: 6px;
  box-shadow: var(--main-shadow-art);
  cursor: pointer;
  color: ${(props) => (props.$active ? "var(--primary-button-color)" : "#fff")};

  &:hover{
    color:var(--secondary-hover-color);
  }

  `;

const Content = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: space-around;
  width: 100%;
  padding: 0.2rem;
  margin-bottom:0.5rem;
`;

const DeviceBox = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  background: var(--main-bg-card-color);
  padding: 0.6rem;
  border-radius: 6px;
  box-shadow: var(--main-shadow-art);
  width: 44%;
  min-width: 180px;
  box-sizing: border-box;
  @media (max-width: 1024px) {
    transition: color 0.3s ease;
  }
  @media (max-width: 768px) {
    transition: color 0.3s ease;
  }
  @media (max-width: 480px) {
    width: 85%;
    transition: color 0.3s ease;
  }
  &:hover {
    background: var(--main-hover-color);
  }
`;

const DeviceHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.2rem;
`;

const DeviceTitle = styled.div`
  font-size: 1rem;
  color: var(--main-text-color);
  font-weight: bold;
`;

const PowerButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
`;

const ControlBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
`;

const ControlLabel = styled.div`
  font-size: 0.7rem;
  color: var(--main-text-color);
`;

const ControlHeader = styled.div`
  display: flex;
  justify-content: space-between;
`;

const ControlSliderWrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

const ControlSlider = styled.input`
  width: 100%;
  height: 6px;
  border-radius: 4px;
  background: #444;
  appearance: none;
  cursor: pointer;
  &:focus {
    outline: none;
  }
  &::-webkit-slider-thumb {
    appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #4caf50;
    cursor: pointer;
  }
  &::-moz-range-thumb {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #4caf50;
    cursor: pointer;
  }
`;

const ControlLabelValue = styled.div`
  font-size: 0.9rem;
  font-weight: bold;
  color: var(--main-text-color);
`;

const HvacModeSelect = styled.select`
  padding: 0.5rem;
  border-radius: 4px;
  color: var(--main-text-color);
  border: none;
  font-size: 0.9rem;
`;

const NoData = styled.div`
  color: var(--error-text-color);
  text-align: center;
  padding-bottom:1rem;
`;
