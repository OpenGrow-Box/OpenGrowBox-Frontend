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
        
        const isClimateOn = domain === "climate" && entity.state !== "off" && entity.state !== "unavailable";
        const isHumidifierOn = domain === "humidifier" && entity.state === "on";
        const isOn = entity.state === "on" || isClimateOn || isHumidifierOn;

        return {
          id: key,
          title,
          entity_id: entity.entity_id,
          originalState: entity.state,
          state: isOn ? "on" : "off",
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
            domain === "climate" 
              ? (entity.attributes?.hvac_mode || entity.state)
              : undefined,
          hvacModes:
            domain === "climate" && entity.attributes?.hvac_modes
              ? entity.attributes.hvac_modes
              : [],
          currentTemp:
            domain === "climate" && entity.attributes?.current_temperature !== undefined
              ? entity.attributes.current_temperature
              : undefined,
          targetTemp:
            domain === "climate" && entity.attributes?.temperature !== undefined
              ? entity.attributes.temperature
              : undefined,
          hvacAction:
            domain === "climate" && entity.attributes?.hvac_action
              ? entity.attributes.hvac_action
              : undefined,
          currentHumidity:
            domain === "humidifier" && entity.attributes?.current_humidity !== undefined
              ? entity.attributes.current_humidity
              : undefined,
          targetHumidity:
            domain === "humidifier" && entity.attributes?.target_humidity !== undefined
              ? entity.attributes.target_humidity
              : undefined,
          mode:
            domain === "humidifier" && entity.attributes?.mode
              ? entity.attributes.mode
              : undefined,
          availableModes:
            domain === "humidifier" && entity.attributes?.available_modes
              ? entity.attributes.available_modes
              : [],
          action:
            domain === "humidifier" && entity.attributes?.action
              ? entity.attributes.action
              : undefined,
          minHumidity:
            domain === "humidifier" && entity.attributes?.min_humidity !== undefined
              ? entity.attributes.min_humidity
              : 0,
          maxHumidity:
            domain === "humidifier" && entity.attributes?.max_humidity !== undefined
              ? entity.attributes.max_humidity
              : 100,
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
    const domain = sensor.entity_id.split(".")[0];
    const currentState = domain === "climate" ? sensor.originalState : sensor.state;
    const newState = currentState === 'on' || (domain === "climate" && currentState !== 'off') ? 'off' : 'on';
    
    const confirmed = await confirmChange(
      sensor.title,
      currentState === 'on' || (domain === "climate" && currentState !== 'off') ? 'on' : 'off',
      newState === 'on' || (domain === "climate" && newState !== 'off') ? 'on' : 'off'
    );

    if (!confirmed) {
      return;
    }

    try {
      if (domain === "climate") {
        const newMode = sensor.originalState !== 'off' ? 'off' : 'auto';
        await sendCommand({
          type: "call_service",
          domain: "climate",
          service: "set_hvac_mode",
          service_data: {
            entity_id: sensor.entity_id,
            hvac_mode: newMode,
          },
        });
      } else if (domain === "humidifier") {
        if (sensor.state === 'on') {
          await sendCommand({
            type: "call_service",
            domain: "humidifier",
            service: "turn_off",
            service_data: { entity_id: sensor.entity_id },
          });
        } else {
          await sendCommand({
            type: "call_service",
            domain: "humidifier",
            service: "turn_on",
            service_data: { entity_id: sensor.entity_id },
          });
        }
      } else {
        await sendCommand({
          type: "call_service",
          domain,
          service: "toggle",
          service_data: { entity_id: sensor.entity_id },
        });
      }
    } catch (error) {
      console.error("Error toggling device:", error);
    }
  };

  const updateHumidity = async (entityId, value) => {
    try {
      await sendCommand({
        type: "call_service",
        domain: "humidifier",
        service: "set_humidity",
        service_data: {
          entity_id: entityId,
          humidity: Number(value),
        },
      });
    } catch (error) {
      console.error("Error updating humidity:", error);
    }
  };

  const updateHumidifierMode = async (entityId, mode) => {
    try {
      await sendCommand({
        type: "call_service",
        domain: "humidifier",
        service: "set_mode",
        service_data: {
          entity_id: entityId,
          mode: mode,
        },
      });
    } catch (error) {
      console.error("Error updating humidifier mode:", error);
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

  const handleHvacModeChange = async (entityId, mode, deviceTitle, currentMode) => {
    const confirmed = await confirmChange(
      deviceTitle,
      currentMode,
      mode
    );

    if (!confirmed) {
      return;
    }

    updateHvacMode(entityId, mode);
  };

  const handleHumidifierModeChange = async (entityId, mode, deviceTitle, currentMode) => {
    const confirmed = await confirmChange(
      deviceTitle,
      currentMode,
      mode
    );

    if (!confirmed) {
      return;
    }

    updateHumidifierMode(entityId, mode);
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

  const handleHumidityCommit = async (entityId, value, device) => {
    const confirmed = await confirmChange(
      device.title,
      `${device.targetHumidity}%`,
      `${value}%`
    );

    if (!confirmed) {
      setLocalSliderValues(prev => {
        const updated = { ...prev };
        delete updated[entityId];
        return updated;
      });
      return;
    }

    updateHumidity(entityId, value);
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
                  {sensor.domain === "climate" && sensor.originalState !== "off" && (
                    <ClimateStateBadge $active={sensor.originalState !== "off"}>
                      {sensor.originalState}
                    </ClimateStateBadge>
                  )}
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

              {/* CLIMATE INFO */}
              {sensor.domain === "climate" && (
                <ControlBox>
                  <ClimateInfo>
                    <ClimateRow>
                      <ClimateLabel>Mode:</ClimateLabel>
                      {sensor.hvacModes && sensor.hvacModes.length > 0 ? (
                        <ModeSelect 
                          value={sensor.hvacMode || ''}
                          onChange={(e) => handleHvacModeChange(sensor.entity_id, e.target.value, sensor.title, sensor.hvacMode)}
                        >
                          {sensor.hvacModes.map(mode => (
                            <option key={mode} value={mode}>
                              {mode === 'heat' ? 'Heat' : 
                               mode === 'cool' ? 'Cool' : 
                               mode === 'auto' ? 'Auto' : 
                               mode === 'dry' ? 'Dry' : 
                               mode === 'fan_only' ? 'Fan' : 
                               mode === 'off' ? 'Off' : mode}
                            </option>
                          ))}
                        </ModeSelect>
                      ) : (
                        <ClimateValue $active={sensor.hvacMode !== "off"}>
                          {sensor.hvacMode === "off" ? "Off" : 
                           sensor.hvacMode === "heat" ? "Heat" :
                           sensor.hvacMode === "cool" ? "Cool" :
                           sensor.hvacMode === "auto" ? "Auto" :
                           sensor.hvacMode === "dry" ? "Dry" :
                           sensor.hvacMode === "fan_only" ? "Fan" :
                           sensor.hvacMode || "Unknown"}
                        </ClimateValue>
                      )}
                    </ClimateRow>
                    {sensor.currentTemp !== undefined && (
                      <ClimateRow>
                        <ClimateLabel>Current:</ClimateLabel>
                        <ClimateValue>{sensor.currentTemp}°C</ClimateValue>
                      </ClimateRow>
                    )}
                    {sensor.targetTemp !== undefined && sensor.hvacMode !== "off" && (
                      <ClimateRow>
                        <ClimateLabel>Target:</ClimateLabel>
                        <ClimateValue>{sensor.targetTemp}°C</ClimateValue>
                      </ClimateRow>
                    )}
                    {sensor.hvacAction && sensor.hvacMode !== "off" && (
                      <ClimateRow>
                        <ClimateLabel>Status:</ClimateLabel>
                        <ClimateValue $action>
                          {sensor.hvacAction === "heating" ? "Heating" :
                           sensor.hvacAction === "cooling" ? "Cooling" :
                           sensor.hvacAction === "drying" ? "Drying" :
                           sensor.hvacAction === "idle" ? "Idle" :
                           sensor.hvacAction}
                        </ClimateValue>
                      </ClimateRow>
                    )}
                  </ClimateInfo>
                </ControlBox>
              )}

              {/* HUMIDIFIER INFO */}
              {sensor.domain === "humidifier" && (
                <ControlBox>
                  <ClimateInfo>
                    {sensor.currentHumidity !== undefined && (
                      <ClimateRow>
                        <ClimateLabel>Current:</ClimateLabel>
                        <ClimateValue>{sensor.currentHumidity}%</ClimateValue>
                      </ClimateRow>
                    )}
                    {sensor.targetHumidity !== undefined && sensor.state === "on" && (
                      <ClimateRow>
                        <ClimateLabel>Target:</ClimateLabel>
                        <ClimateValue>{sensor.targetHumidity}%</ClimateValue>
                      </ClimateRow>
                    )}
                    {sensor.targetHumidity !== undefined && sensor.state === "on" && (
                      <ControlSliderWrapper>
                        <ControlSlider
                          type="range"
                          min={sensor.minHumidity || 0}
                          max={sensor.maxHumidity || 100}
                          step={1}
                          value={localSliderValues[sensor.entity_id] ?? sensor.targetHumidity}
                          onChange={(e) => handleSliderChange(sensor.entity_id, e.target.value)}
                          onMouseUp={(e) => handleHumidityCommit(sensor.entity_id, e.target.value, sensor)}
                          onTouchEnd={(e) => handleHumidityCommit(sensor.entity_id, e.target.value, sensor)}
                        />
                      </ControlSliderWrapper>
                    )}
                    {sensor.availableModes && sensor.availableModes.length > 0 ? (
                      <ClimateRow>
                        <ClimateLabel>Mode:</ClimateLabel>
                        <ModeSelect 
                          value={sensor.mode || ''}
                          onChange={(e) => handleHumidifierModeChange(sensor.entity_id, e.target.value, sensor.title, sensor.mode)}
                        >
                          {sensor.availableModes.map(mode => (
                            <option key={mode} value={mode}>
                              {mode.charAt(0).toUpperCase() + mode.slice(1)}
                            </option>
                          ))}
                        </ModeSelect>
                      </ClimateRow>
                    ) : sensor.mode ? (
                      <ClimateRow>
                        <ClimateLabel>Mode:</ClimateLabel>
                        <ClimateValue $active={sensor.state === "on"}>
                          {sensor.state === "on" ? sensor.mode : "Off"}
                        </ClimateValue>
                      </ClimateRow>
                    ) : null}
                    {sensor.action && sensor.state === "on" && (
                      <ClimateRow>
                        <ClimateLabel>Status:</ClimateLabel>
                        <ClimateValue $action>
                          {sensor.action === "humidifying" ? "Humidifying" : 
                           sensor.action === "drying" ? "Drying" :
                           sensor.action === "idle" ? "Idle" : sensor.action}
                        </ClimateValue>
                      </ClimateRow>
                    )}
                  </ClimateInfo>
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

const ClimateStateBadge = styled.span`
  font-size: 0.6rem;
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
  margin-left: 0.25rem;
  background: ${props => props.$active ? 'var(--chart-success-color)' : 'var(--error-text-color)'};
  color: var(--main-bg-color);
  font-weight: bold;
  text-transform: uppercase;
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

const ModeSelect = styled.select`
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  color: var(--main-text-color);
  background: var(--input-bg-color);
  border: 1px solid var(--border-color);
  font-size: 0.75rem;
  cursor: pointer;
  max-width: 80px;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23d3d3d3%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E");
  background-repeat: no-repeat;
  background-position: right 0.4rem center;
  background-size: 0.6rem auto;
  padding-right: 1.5rem;

  &:focus {
    outline: none;
    border-color: var(--primary-button-color);
  }

  option {
    background: var(--main-bg-card-color);
    color: var(--main-text-color);
    padding: 0.5rem;
  }
`;

const ClimateInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const ClimateRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ClimateLabel = styled.span`
  font-size: 0.7rem;
  color: var(--main-text-color);
  opacity: 0.7;
`;

const ClimateValue = styled.span`
  font-size: 0.8rem;
  font-weight: bold;
  color: ${props => props.$active ? 'var(--chart-success-color)' : 
    props.$action === 'heating' ? '#fc7c7c' : 
    props.$action === 'cooling' ? '#7cd6fc' : 
    props.$action === 'drying' ? '#fcd67c' : 
    props.$action === 'humidifying' ? '#7cfcfc' : 
    props.$action === 'idle' ? '#d3d3d3' : 
    'var(--main-text-color)'};
`;

const NoData = styled.div`
  color: var(--error-text-color);
  text-align: center;
  padding-bottom: 1rem;
`;
