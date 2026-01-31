import { useEffect, useState } from "react";
import styled from "styled-components";
import { FaPowerOff } from "react-icons/fa";
import { Shield } from 'lucide-react';
import { useHomeAssistant } from "../../Context/HomeAssistantContext";
import formatLabel from "../../../misc/formatLabel";
import { useGlobalState } from "../../Context/GlobalContext";
import { useSafeMode } from "../../../hooks/useSafeMode";
import SafeModeConfirmModal from "../../Common/SafeModeConfirmModal";

const DeviceCard = () => {
  const { entities, connection, currentRoom, isConnectionValid, sendCommand } = useHomeAssistant();
  const { HASS } = useGlobalState();
  const { isSafeModeEnabled, confirmChange, confirmationState, handleConfirm, handleCancel } = useSafeMode();
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
          !key.includes("template");

        // Hole die entity-Konfiguration aus HASS.entities
        const haEntity = HASS?.entities?.[key];
        
        const isHidden =
          entity.hidden === true ||
          entity.hidden === "true" ||
          entity.attributes?.hidden === true ||
          entity.attributes?.hidden === "true" ||
          haEntity?.hidden === true ||
          haEntity?.hidden === "true";

        const isDisabled =
          entity.disabled === true ||
          entity.disabled === "true" ||
          entity.attributes?.disabled === true ||
          entity.attributes?.disabled === "true" ||
          haEntity?.disabled === true ||
          haEntity?.disabled === "true";

        return isRelevantType && entity.state !== "unavailable" && !isHidden && !isDisabled;
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

    if (deviceSelect === "room" && import.meta.env.PROD) {
      const devices = HASS?.devices;
      const haEntities = HASS?.entities;
      let roomDeviceIds = [];
      let roomEntities = [];

      if (devices) {
        for (const [key, device] of Object.entries(devices)) {
          if (device.area_id === currentRoom.toLowerCase()) {
            roomDeviceIds.push(key);
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

      sensors = sensors.filter(sensor => roomEntities.includes(sensor.entity_id));
    }

    setDevices(sensors);
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

  const handleDeviceSelect = (select) => setDeviceSelect(select);

  const toggleDevice = async (sensor) => {
    // Request confirmation if Safe Mode is enabled
    const confirmed = await confirmChange(
      sensor.title,
      sensor.state,
      sensor.state === 'on' ? 'off' : 'on'
    );

    if (!confirmed) {
      return; // User cancelled the change
    }

    try {
      const domain = sensor.entity_id.split(".")[0];
      await sendCommand({
        type: "call_service",
        domain,
        service: "toggle",
        service_data: { entity_id: sensor.entity_id },
      });
    } catch (error) {
      console.error("Error toggling device:", error);
    }
  };

  const updateDutyCycle = async (entityId, value) => {
    try {
      await sendCommand({
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
  };

  const updateBrightness = async (entityId, value) => {
    try {
      const brightnessValue = Math.round((value / 100) * 255);
      await sendCommand({
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
  };

  const updateHvacMode = async (entityId, mode) => {
    try {
      await sendCommand({
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
  };

  const [localSliderValues, setLocalSliderValues] = useState({});

  const handleSliderChange = (entityId, value) => {
    setLocalSliderValues((prev) => ({ ...prev, [entityId]: value }));
  };

  const handleDutyCommit = async (entityId, value, device) => {
    // Request confirmation if Safe Mode is enabled
    const confirmed = await confirmChange(
      device.title,
      `${device.duty}%`,
      `${value}%`
    );

    if (!confirmed) {
      // Reset slider to original value
      setLocalSliderValues(prev => {
        const updated = { ...prev };
        delete updated[entityId];
        return updated;
      });
      return; // User cancelled the change
    }

    updateDutyCycle(entityId, value);
  };

  const handleBrightnessCommit = async (entityId, value, device) => {
    // Request confirmation if Safe Mode is enabled
    const confirmed = await confirmChange(
      device.title,
      `${device.brightness}%`,
      `${value}%`
    );

    if (!confirmed) {
      // Reset slider to original value
      setLocalSliderValues(prev => {
        const updated = { ...prev };
        delete updated[entityId];
        return updated;
      });
      return; // User cancelled the change
    }

    updateBrightness(entityId, value);
  };

  return (
    <>
      <CardContainer>
        <CardHeader>
          <HeaderTitle $active={deviceSelect === "room"} onClick={() => handleDeviceSelect("room")}>Room</HeaderTitle>
          <HeaderTitle $active={deviceSelect === "all"} onClick={() => handleDeviceSelect("all")}>All</HeaderTitle>
        </CardHeader>
        <Content>
          {devices.map((sensor) => (
            <DeviceBox key={sensor.id} $safeModeEnabled={isSafeModeEnabled}>
              <DeviceHeader>
                 <DeviceTitle $hasLockIcons={isSafeModeEnabled}>{sensor.title}</DeviceTitle>
                {isSafeModeEnabled && <SafeModeIndicator title="Safe Mode Active"><Shield size={14} /></SafeModeIndicator>}
                <PowerButton onClick={() => toggleDevice(sensor)}>
                  <FaPowerOff color={sensor.state === "on" ? "green" : "red"} />
                </PowerButton>
              </DeviceHeader>

              {/* FAN SLIDER */}
              {sensor.domain === "fan" && sensor.duty !== null && (
                <ControlBox>
                  <ControlHeader>
                    <ControlLabel>Duty Cycle</ControlLabel>
                    <ControlLabelValue>{localSliderValues[sensor.entity_id] ?? sensor.duty}%</ControlLabelValue>
                  </ControlHeader>
                  <ControlSliderWrapper>
                    <ControlSlider
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={localSliderValues[sensor.entity_id] ?? sensor.duty}
                      onChange={(e) => handleSliderChange(sensor.entity_id, e.target.value)}
                      onMouseUp={(e) => handleDutyCommit(sensor.entity_id, e.target.value, sensor)}
                      onTouchEnd={(e) => handleDutyCommit(sensor.entity_id, e.target.value, sensor)}
                    />
                  </ControlSliderWrapper>
                </ControlBox>
              )}

              {/* LIGHT BRIGHTNESS SLIDER */}
              {sensor.domain === "light" && sensor.brightness !== null && (
                <ControlBox>
                  <ControlHeader>
                    <ControlLabel>Brightness</ControlLabel>
                    <ControlLabelValue>{localSliderValues[sensor.entity_id] ?? sensor.brightness}%</ControlLabelValue>
                  </ControlHeader>
                  <ControlSliderWrapper>
                    <ControlSlider
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={localSliderValues[sensor.entity_id] ?? sensor.brightness}
                      onChange={(e) => handleSliderChange(sensor.entity_id, e.target.value)}
                      onMouseUp={(e) => handleBrightnessCommit(sensor.entity_id, e.target.value, sensor)}
                      onTouchEnd={(e) => handleBrightnessCommit(sensor.entity_id, e.target.value, sensor)}
                    />
                  </ControlSliderWrapper>
                </ControlBox>
              )}
            </DeviceBox>
          ))}
          {devices.length === 0 && <NoData>No Devices found.</NoData>}
        </Content>
      </CardContainer>

      {/* Safe Mode Confirmation Modal */}
      <SafeModeConfirmModal
        isOpen={confirmationState.isOpen}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        entityName={confirmationState.entityName}
        currentValue={confirmationState.currentValue}
        newValue={confirmationState.newValue}
      />
    </>
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
  color: ${(props) => (props.$active ? "var(--primary-button-color)" : "var(--main-text-color)")};

  &:hover {
    color: var(--secondary-hover-color);
  }
`;

const Content = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: space-around;
  width: 100%;
  padding: 0.2rem;
  margin-bottom: 0.5rem;
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
  border: ${props => props.$safeModeEnabled ? '1px solid rgba(59, 130, 246, 0.2)' : 'none'};
  position: relative;

  @media (max-width: 480px) {
    width: 85%;
  }

  &:hover {
    background: var(--main-hover-color);
  }
`;

const SafeModeIndicator = styled.span`
  position: absolute;
  top: 6px;
  left: 8px;
  font-size: 14px;
  opacity: 0.8;
  color: #ef4444;
  filter: drop-shadow(0 0 3px rgba(239, 68, 68, 0.3));
  transition: all 0.2s ease;

  &:hover {
    opacity: 1;
    transform: scale(1.1);
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
  margin-left: ${({ $hasLockIcons }) => $hasLockIcons ? '3rem' : '0'};

  @media (max-width: 640px) {
    font-size: 0.9rem;
    margin-left: ${({ $hasLockIcons }) => $hasLockIcons ? '2.5rem' : '0'};
  }

  @media (max-width: 640px) {
    font-size: 0.9rem;
  }
`;

const PowerButton = styled.button`
  @media (max-width: 640px) {
    align-self: flex-end;
  }
  background: none;
  @media (max-width: 640px) {
    align-self: flex-end;
  }
  border: none;
  @media (max-width: 640px) {
    align-self: flex-end;
  }
  cursor: pointer;
  @media (max-width: 640px) {
    align-self: flex-end;
  }
  font-size: 1rem;
  @media (max-width: 640px) {
    align-self: flex-end;
  }

  @media (max-width: 640px) {
    align-self: flex-end;
  }
`;

const ControlBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
`;

const ControlHeader = styled.div`
  @media (max-width: 640px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
  display: flex;
  @media (max-width: 640px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
  justify-content: space-between;
  @media (max-width: 640px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
`;

const ControlLabel = styled.div`
  font-size: 0.7rem;
  color: var(--main-text-color);
`;

const ControlLabelValue = styled.div`
  font-size: 0.9rem;
  font-weight: bold;
  color: var(--main-text-color);
`;

const ControlSliderWrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

const ControlSlider = styled.input`
  width: 100%;
  height: 6px;
  border-radius: 4px;
  background: var(--input-bg-color);
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
    background: var(--chart-success-color);
    cursor: pointer;
  }

  &::-moz-range-thumb {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--chart-success-color);
    cursor: pointer;
  }
`;

const HvacModeSelect = styled.select`
  padding: 0.5rem;
  border-radius: 4px;
  color: var(--main-text-color);
  background: var(--main-bg-card-color);
  border: none;
  font-size: 0.9rem;
`;

const NoData = styled.div`
  color: var(--error-text-color);
  text-align: center;
  padding-bottom: 1rem;
`;
