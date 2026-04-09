import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useHomeAssistant } from '../Context/HomeAssistantContext';
import { Lightbulb, Thermometer, Droplets, Power, Sunrise, Sunset, Settings2, ChevronDown, ChevronUp, ToggleLeft, ToggleRight, Wind, Leaf, Info } from 'lucide-react';

const HelpTooltip = ({ text }) => (
  <TooltipWrapper>
    <TooltipButton type="button" aria-label={text}>
      <Info size={14} />
      <TooltipBubble>{text}</TooltipBubble>
    </TooltipButton>
  </TooltipWrapper>
);

const LiteControlCard = () => {
  const { currentRoom, entities, connection } = useHomeAssistant();
  
  // Section expand states
  const [expandedSections, setExpandedSections] = useState({
    tentMode: false,
    lightControl: false,
    co2Control: false,
    temperature: false,
    fan: false,
    plantStage: false,
    ventilation: false,
  });
  
  const [lightOn, setLightOn] = useState(false);
  const [tempMin, setTempMin] = useState(20);
  const [tempMax, setTempMax] = useState(28);
  const [humMin, setHumMin] = useState(40);
  const [humMax, setHumMax] = useState(60);
  const [lightOnTime, setLightOnTime] = useState('06:00');
  const [lightOffTime, setLightOffTime] = useState('22:00');
  const [sunriseTime, setSunriseTime] = useState('00:30:00');
  const [sunsetTime, setSunsetTime] = useState('00:30:00');
  const [tentMode, setTentMode] = useState('');
  const [tentModeOptions, setTentModeOptions] = useState([]);
  const [minmaxEnabled, setMinmaxEnabled] = useState(false);
  const [lightControlEnabled, setLightControlEnabled] = useState(false);
  const [lightEntityId, setLightEntityId] = useState(null);
  
  // Fan & PlantStage
  const [fanEntityId, setFanEntityId] = useState(null);
  const [fanOn, setFanOn] = useState(false);
  const [fanSpeed, setFanSpeed] = useState(50);
  const [plantStage, setPlantStage] = useState('');
  const [plantStageOptions, setPlantStageOptions] = useState([]);
  const [plantSpecies, setPlantSpecies] = useState('');
  const [plantSpeciesOptions, setPlantSpeciesOptions] = useState([]);
  
  // Ventilation
  const [exhaustMinMax, setExhaustMinMax] = useState({ min: 30, max: 100 });
  const [intakeMinMax, setIntakeMinMax] = useState({ min: 30, max: 100 });
  const [ventilationMinMax, setVentilationMinMax] = useState({ min: 30, max: 100 });
  const [exhaustMinMaxEnabled, setExhaustMinMaxEnabled] = useState(false);
  const [intakeMinMaxEnabled, setIntakeMinMaxEnabled] = useState(false);
  const [ventilationMinMaxEnabled, setVentilationMinMaxEnabled] = useState(false);

  // CO2 Control
  const [co2Enabled, setCo2Enabled] = useState(false);
  const [co2Min, setCo2Min] = useState(400);
  const [co2Max, setCo2Max] = useState(1500);
  const [co2Target, setCo2Target] = useState(1200);

  const room = currentRoom?.trim()?.toLowerCase() || 'default';

  const tooltips = {
    tentMode: 'Select a grow mode to activate automated control.',
    plantStage: 'Set the current plant stage. Lights can adapt based on the selected stage.',
    plantSpecies: 'Select the plant species used for this room, for example via ogb_plantspecies_dev_room.',
    lightControl: 'Enable automatic light control via OpenGrowBox.',
    lightOn: 'Set the time when lights switch on.',
    lightOff: 'Set the time when lights switch off.',
    sunrise: 'Set the sunrise transition duration.',
    sunset: 'Set the sunset transition duration.',
    co2Control: 'Enable CO2-based environmental control.',
    co2Min: 'Set the minimum CO2 value.',
    co2Max: 'Set the maximum CO2 value.',
    co2Target: 'Set the target CO2 value.',
    environment: 'Enable custom min/max values for temperature and humidity.',
    tempMin: 'Set the custom minimum temperature.',
    tempMax: 'Set the custom maximum temperature.',
    humMin: 'Set the custom minimum humidity.',
    humMax: 'Set the custom maximum humidity.',
    fan: 'Control the detected fan entity for the current room.',
    fanSpeed: 'Adjust the current fan speed in percent.',
    ventilation: 'Configure custom min/max duty cycles for exhaust, intake and ventilation.',
    ventMinMax: 'Enable custom min/max duty cycle limits.',
    ventMin: 'Set the minimum duty cycle.',
    ventMax: 'Set the maximum duty cycle.',
  };

  useEffect(() => {
    if (!entities) return;
    // Load current values from entities
    const lightOnEntity = entities[`input_datetime.ogb_lightontime_${room}`];
    const lightOffEntity = entities[`input_datetime.ogb_lightofftime_${room}`];
    const sunriseEntity = entities[`input_datetime.ogb_sunrisetime_${room}`];
    const sunsetEntity = entities[`input_datetime.ogb_sunsettime_${room}`];
    const tentModeEntity = entities[`select.ogb_tentmode_${room}`];
    const minmaxEntity = entities[`select.ogb_minmax_control_${room}`];
    const lightControlEntity = entities[`select.ogb_lightcontrol_${room}`];
    
    // Check if light control is enabled
    if (lightControlEntity) {
      setLightControlEnabled(lightControlEntity.state === 'YES');
    }
    
    // Try multiple entity patterns for light
    let foundLightEntity = null;
    const entityKeys = Object.keys(entities);
    
    const specificLightKey = `switch.ogb_light_${room}`;
    if (entities[specificLightKey]) {
      foundLightEntity = entities[specificLightKey];
    } else {
      for (const key of entityKeys) {
        const isLightEntity = (key.startsWith('switch.ogb_light') || key.startsWith('light.ogb_light')) && key.includes(room);
        const isGenericLight = (key.startsWith('switch.') || key.startsWith('light.')) && !key.includes('template') && !key.includes('scene');
        if (isLightEntity || (isGenericLight && key.toLowerCase().includes(room.toLowerCase()))) {
          foundLightEntity = entities[key];
          break;
        }
      }
    }
    
    if (foundLightEntity) {
      const isOn = foundLightEntity.state === 'on' || 
        (foundLightEntity.attributes?.brightness !== undefined && foundLightEntity.attributes?.brightness > 0);
      setLightOn(isOn);
      setLightEntityId(foundLightEntity.entity_id);
    } else {
      setLightEntityId(null);
    }
    
    if (lightOnEntity?.state) setLightOnTime(lightOnEntity.state);
    if (lightOffEntity?.state) setLightOffTime(lightOffEntity.state);
    if (sunriseEntity?.state) setSunriseTime(sunriseEntity.state);
    if (sunsetEntity?.state) setSunsetTime(sunsetEntity.state);
    
    if (tentModeEntity) {
      setTentMode(tentModeEntity.state);
      setTentModeOptions(tentModeEntity.attributes?.options || []);
    }
    
    if (minmaxEntity) {
      setMinmaxEnabled(minmaxEntity.state === 'YES');
    }
    
    // Load Fan entity
    let foundFanEntity = null;
    for (const key of entityKeys) {
      if ((key.startsWith('fan.ogb_') || key.startsWith('switch.ogb_fan')) && key.includes(room)) {
        foundFanEntity = entities[key];
        break;
      }
    }
    if (foundFanEntity) {
      setFanEntityId(foundFanEntity.entity_id);
      setFanOn(foundFanEntity.state === 'on');
      if (foundFanEntity.attributes?.percentage !== undefined) {
        setFanSpeed(foundFanEntity.attributes.percentage);
      }
    }
    
    // Load Plant Stage
    const plantStageEntity = entities[`select.ogb_plantstage_${room}`];
    const plantSpeciesEntity = entities[`select.ogb_plantspecies_${room}`];
    if (plantStageEntity) {
      setPlantStage(plantStageEntity.state);
      setPlantStageOptions(plantStageEntity.attributes?.options || []);
    } else {
      setPlantStage('');
      setPlantStageOptions([]);
    }

    if (plantSpeciesEntity) {
      setPlantSpecies(plantSpeciesEntity.state);
      setPlantSpeciesOptions(plantSpeciesEntity.attributes?.options || []);
    } else {
      setPlantSpecies('');
      setPlantSpeciesOptions([]);
    }
    
    // Load Ventilation Min/Max settings
    const exhaustMinEntity = entities[`input_number.ogb_exhaust_duty_min_${room}`];
    const exhaustMaxEntity = entities[`input_number.ogb_exhaust_duty_max_${room}`];
    const intakeMinEntity = entities[`input_number.ogb_intake_duty_min_${room}`];
    const intakeMaxEntity = entities[`input_number.ogb_intake_duty_max_${room}`];
    const ventilationMinEntity = entities[`input_number.ogb_ventilation_duty_min_${room}`];
    const ventilationMaxEntity = entities[`input_number.ogb_ventilation_duty_max_${room}`];
    const exhaustMinMaxEntity = entities[`select.ogb_exhaust_minmax_${room}`];
    const intakeMinMaxEntity = entities[`select.ogb_intake_minmax_${room}`];
    const ventilationMinMaxEntity = entities[`select.ogb_ventilation_minmax_${room}`];
    
    if (exhaustMinEntity) setExhaustMinMax(prev => ({ ...prev, min: parseFloat(exhaustMinEntity.state) || 30 }));
    if (exhaustMaxEntity) setExhaustMinMax(prev => ({ ...prev, max: parseFloat(exhaustMaxEntity.state) || 100 }));
    if (intakeMinEntity) setIntakeMinMax(prev => ({ ...prev, min: parseFloat(intakeMinEntity.state) || 30 }));
    if (intakeMaxEntity) setIntakeMinMax(prev => ({ ...prev, max: parseFloat(intakeMaxEntity.state) || 100 }));
    if (ventilationMinEntity) setVentilationMinMax(prev => ({ ...prev, min: parseFloat(ventilationMinEntity.state) || 30 }));
    if (ventilationMaxEntity) setVentilationMinMax(prev => ({ ...prev, max: parseFloat(ventilationMaxEntity.state) || 100 }));
    if (exhaustMinMaxEntity) setExhaustMinMaxEnabled(exhaustMinMaxEntity.state === 'YES');
    if (intakeMinMaxEntity) setIntakeMinMaxEnabled(intakeMinMaxEntity.state === 'YES');
    if (ventilationMinMaxEntity) setVentilationMinMaxEnabled(ventilationMinMaxEntity.state === 'YES');
    
    // Load CO2 Control settings
    const co2ControlEntity = entities[`select.ogb_co2_control_${room}`];
    const co2MinEntity = entities[`input_number.ogb_co2minvalue_${room}`];
    const co2MaxEntity = entities[`input_number.ogb_co2maxvalue_${room}`];
    const co2TargetEntity = entities[`input_number.ogb_co2targetvalue_${room}`];
    
    if (co2ControlEntity) setCo2Enabled(co2ControlEntity.state === 'YES');
    if (co2MinEntity) setCo2Min(parseFloat(co2MinEntity.state) || 400);
    if (co2MaxEntity) setCo2Max(parseFloat(co2MaxEntity.state) || 1500);
    if (co2TargetEntity) setCo2Target(parseFloat(co2TargetEntity.state) || 1200);
  }, [entities, currentRoom]);

  const handleCallService = async (domain, service, serviceData) => {
    if (!connection) return;
    try {
      await connection.sendMessagePromise({
        type: 'call_service',
        domain,
        service,
        service_data: serviceData,
      });
    } catch (error) {
      // console.error('Error calling service:', error);
    }
  };

  const toggleLight = async () => {
    if (!connection || !lightEntityId) return;
    const newState = !lightOn;
    setLightOn(newState);
    
    await handleCallService('homeassistant', newState ? 'turn_on' : 'turn_off', {
      entity_id: lightEntityId,
    });
  };

  const updateTempMin = async (value) => {
    setTempMin(value);
    const room = currentRoom?.trim()?.toLowerCase() || 'default';
    const inputEntity = `input_number.ogb_tempmin_${room}`;
    await handleCallService('input_number', 'set_value', {
      entity_id: inputEntity,
      value: parseFloat(value),
    });
  };

  const updateTempMax = async (value) => {
    setTempMax(value);
    const room = currentRoom?.trim()?.toLowerCase() || 'default';
    const inputEntity = `input_number.ogb_tempmax_${room}`;
    await handleCallService('input_number', 'set_value', {
      entity_id: inputEntity,
      value: parseFloat(value),
    });
  };

  const updateHumMin = async (value) => {
    setHumMin(value);
    const room = currentRoom?.trim()?.toLowerCase() || 'default';
    const inputEntity = `input_number.ogb_hummin_${room}`;
    await handleCallService('input_number', 'set_value', {
      entity_id: inputEntity,
      value: parseFloat(value),
    });
  };

  const updateHumMax = async (value) => {
    setHumMax(value);
    const room = currentRoom?.trim()?.toLowerCase() || 'default';
    const inputEntity = `input_number.ogb_hummax_${room}`;
    await handleCallService('input_number', 'set_value', {
      entity_id: inputEntity,
      value: parseFloat(value),
    });
  };

  const updateTimeEntity = async (entityId, timeValue) => {
    if (!connection) return;
    try {
      await connection.sendMessagePromise({
        type: 'call_service',
        domain: 'opengrowbox',
        service: 'update_time',
        service_data: {
          entity_id: entityId,
          time: timeValue,
        },
      });
    } catch (error) {
      // console.error('Error updating time:', error);
    }
  };

  const updateTentMode = async (newMode) => {
    setTentMode(newMode);
    const room = currentRoom?.trim()?.toLowerCase() || 'default';
    const selectEntity = `select.ogb_tentmode_${room}`;
    await handleCallService('select', 'select_option', {
      entity_id: selectEntity,
      option: newMode,
    });
  };

  const toggleMinMax = async () => {
    const newState = !minmaxEnabled;
    setMinmaxEnabled(newState);
    const room = currentRoom?.trim()?.toLowerCase() || 'default';
    const selectEntity = `select.ogb_minmax_control_${room}`;
    await handleCallService('select', 'select_option', {
      entity_id: selectEntity,
      option: newState ? 'YES' : 'NO',
    });
  };

  const toggleFan = async () => {
    if (!connection || !fanEntityId) return;
    const newState = !fanOn;
    setFanOn(newState);
    await handleCallService('homeassistant', newState ? 'turn_on' : 'turn_off', {
      entity_id: fanEntityId,
    });
  };

  const updateFanSpeed = async (value) => {
    setFanSpeed(value);
    if (!connection || !fanEntityId) return;
    await handleCallService('fan', 'set_percentage', {
      entity_id: fanEntityId,
      percentage: parseInt(value),
    });
  };

  const updatePlantStage = async (newStage) => {
    setPlantStage(newStage);
    const selectEntity = `select.ogb_plantstage_${room}`;
    await handleCallService('select', 'select_option', {
      entity_id: selectEntity,
      option: newStage,
    });
  };

  const updatePlantSpecies = async (newSpecies) => {
    setPlantSpecies(newSpecies);
    const selectEntity = `select.ogb_plantspecies_${room}`;
    await handleCallService('select', 'select_option', {
      entity_id: selectEntity,
      option: newSpecies,
    });
  };

  const updateVentilationMinMax = async (type, minVal, maxVal) => {
    const room = currentRoom?.trim()?.toLowerCase() || 'default';
    if (type === 'exhaust') {
      setExhaustMinMax({ min: minVal, max: maxVal });
      await handleCallService('input_number', 'set_value', { entity_id: `input_number.ogb_exhaust_duty_min_${room}`, value: minVal });
      await handleCallService('input_number', 'set_value', { entity_id: `input_number.ogb_exhaust_duty_max_${room}`, value: maxVal });
    } else if (type === 'intake') {
      setIntakeMinMax({ min: minVal, max: maxVal });
      await handleCallService('input_number', 'set_value', { entity_id: `input_number.ogb_intake_duty_min_${room}`, value: minVal });
      await handleCallService('input_number', 'set_value', { entity_id: `input_number.ogb_intake_duty_max_${room}`, value: maxVal });
    } else if (type === 'ventilation') {
      setVentilationMinMax({ min: minVal, max: maxVal });
      await handleCallService('input_number', 'set_value', { entity_id: `input_number.ogb_ventilation_duty_min_${room}`, value: minVal });
      await handleCallService('input_number', 'set_value', { entity_id: `input_number.ogb_ventilation_duty_max_${room}`, value: maxVal });
    }
  };

  const toggleExhaustMinMax = async () => {
    const newState = !exhaustMinMaxEnabled;
    setExhaustMinMaxEnabled(newState);
    const room = currentRoom?.trim()?.toLowerCase() || 'default';
    await handleCallService('select', 'select_option', {
      entity_id: `select.ogb_exhaust_minmax_${room}`,
      option: newState ? 'YES' : 'NO',
    });
  };

  const toggleIntakeMinMax = async () => {
    const newState = !intakeMinMaxEnabled;
    setIntakeMinMaxEnabled(newState);
    const room = currentRoom?.trim()?.toLowerCase() || 'default';
    await handleCallService('select', 'select_option', {
      entity_id: `select.ogb_intake_minmax_${room}`,
      option: newState ? 'YES' : 'NO',
    });
  };

  const toggleVentilationMinMax = async () => {
    const newState = !ventilationMinMaxEnabled;
    setVentilationMinMaxEnabled(newState);
    const room = currentRoom?.trim()?.toLowerCase() || 'default';
    await handleCallService('select', 'select_option', {
      entity_id: `select.ogb_ventilation_minmax_${room}`,
      option: newState ? 'YES' : 'NO',
    });
  };

  const toggleLightControl = async () => {
    const newState = !lightControlEnabled;
    setLightControlEnabled(newState);
    const room = currentRoom?.trim()?.toLowerCase() || 'default';
    const selectEntity = `select.ogb_lightcontrol_${room}`;
    await handleCallService('select', 'select_option', {
      entity_id: selectEntity,
      option: newState ? 'YES' : 'NO',
    });
  };

  const toggleCo2Control = async () => {
    const newState = !co2Enabled;
    setCo2Enabled(newState);
    const room = currentRoom?.trim()?.toLowerCase() || 'default';
    const selectEntity = `select.ogb_co2_control_${room}`;
    await handleCallService('select', 'select_option', {
      entity_id: selectEntity,
      option: newState ? 'YES' : 'NO',
    });
  };

  const updateCo2Min = async (value) => {
    setCo2Min(value);
    const room = currentRoom?.trim()?.toLowerCase() || 'default';
    await handleCallService('input_number', 'set_value', {
      entity_id: `input_number.ogb_co2minvalue_${room}`,
      value: parseFloat(value),
    });
  };

  const updateCo2Max = async (value) => {
    setCo2Max(value);
    const room = currentRoom?.trim()?.toLowerCase() || 'default';
    await handleCallService('input_number', 'set_value', {
      entity_id: `input_number.ogb_co2maxvalue_${room}`,
      value: parseFloat(value),
    });
  };

  const updateCo2Target = async (value) => {
    setCo2Target(value);
    const room = currentRoom?.trim()?.toLowerCase() || 'default';
    await handleCallService('input_number', 'set_value', {
      entity_id: `input_number.ogb_co2targetvalue_${room}`,
      value: parseFloat(value),
    });
  };

  const adjustValue = (value, delta, min, max, callback) => {
    const newValue = Math.max(min, Math.min(max, value + delta));
    callback(newValue);
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const lightSchedule = lightControlEnabled ? `${lightOnTime} - ${lightOffTime}` : 'Disabled';
  const plantSummary = [plantStage, plantSpecies].filter(Boolean).join(' • ') || 'Not configured';
  const environmentSummary = minmaxEnabled
    ? `${tempMin}-${tempMax}°C • ${humMin}-${humMax}%`
    : 'Default automation';
  const co2Summary = co2Enabled ? `${co2Target} ppm target` : 'Disabled';
  const fanSummary = fanEntityId ? `${fanOn ? 'On' : 'Off'} • ${fanSpeed}%` : 'Not available';
  const ventilationSummary = [
    exhaustMinMaxEnabled && 'Exhaust',
    intakeMinMaxEnabled && 'Intake',
    ventilationMinMaxEnabled && 'Vent',
  ].filter(Boolean).join(' • ') || 'All default';

  return (
    <Container>
      <CardHeader>
        <HeaderTextBlock>
          <CardEyebrow>Eviorment Control</CardEyebrow>
          <CardTitle>{currentRoom || 'Default Room'}</CardTitle>
          <CardDescription>Fast access to the most important grow settings without opening the full control view.</CardDescription>
        </HeaderTextBlock>
        <HeaderStatusPill>{tentMode || 'No mode'}</HeaderStatusPill>
      </CardHeader>

      <OverviewGrid>
        <OverviewCard>
          <OverviewLabel>Plant</OverviewLabel>
          <OverviewValue>{plantSummary}</OverviewValue>
        </OverviewCard>
        <OverviewCard>
          <OverviewLabel>Lights</OverviewLabel>
          <OverviewValue>{lightSchedule}</OverviewValue>
        </OverviewCard>
        <OverviewCard>
          <OverviewLabel>Climate</OverviewLabel>
          <OverviewValue>{environmentSummary}</OverviewValue>
        </OverviewCard>
        <OverviewCard>
          <OverviewLabel>CO2</OverviewLabel>
          <OverviewValue>{co2Summary}</OverviewValue>
        </OverviewCard>
      </OverviewGrid>

      {/* Tent Mode Accordion */}
      <AccordionSection>
          <AccordionHeader onClick={() => toggleSection('tentMode')}>
            <SectionInfo>
              <SectionIconBadge>
                <Settings2 size={16} />
              </SectionIconBadge>
              <SectionTextGroup>
                <SectionTitleWithTooltip>
                  <SectionTitle>Tent Mode</SectionTitle>
                  <HelpTooltip text={tooltips.tentMode} />
                </SectionTitleWithTooltip>
                <SectionSummary>{tentMode || 'No mode selected'}</SectionSummary>
              </SectionTextGroup>
            </SectionInfo>
            <HeaderActions>
              <HeaderValuePill>{tentMode || 'Unset'}</HeaderValuePill>
              <AccordionArrow $expanded={expandedSections.tentMode}>
                <ChevronDown size={20} />
              </AccordionArrow>
            </HeaderActions>
        </AccordionHeader>
        {expandedSections.tentMode && (
          <AccordionContent>
            <TentModeSelect
              value={tentMode}
              onChange={(e) => updateTentMode(e.target.value)}
            >
              {tentModeOptions.map((option, index) => (
                <TentModeOption key={index} value={option}>
                  {option}
                </TentModeOption>
              ))}
            </TentModeSelect>
          </AccordionContent>
        )}
      </AccordionSection>

      {/* Plant Stage Accordion */}
      {(plantStageOptions.length > 0 || plantSpeciesOptions.length > 0) && (
        <AccordionSection>
          <AccordionHeader onClick={() => toggleSection('plantStage')}>
            <SectionInfo>
              <SectionIconBadge>
                <Leaf size={16} />
              </SectionIconBadge>
              <SectionTextGroup>
                <SectionTitleWithTooltip>
                  <SectionTitle>Plant Data</SectionTitle>
                  <HelpTooltip text={tooltips.plantStage} />
                </SectionTitleWithTooltip>
                <SectionSummary>{plantSummary}</SectionSummary>
              </SectionTextGroup>
            </SectionInfo>
            <HeaderActions>
              <HeaderValuePill>{plantStage || plantSpecies || 'Unset'}</HeaderValuePill>
              <AccordionArrow $expanded={expandedSections.plantStage}>
                <ChevronDown size={20} />
              </AccordionArrow>
            </HeaderActions>
          </AccordionHeader>
          {expandedSections.plantStage && (
            <AccordionContent>
              {plantStageOptions.length > 0 && (
                <ControlGroup>
                  <LabelWithTooltip>
                    <Label>Plant Stage</Label>
                    <HelpTooltip text={tooltips.plantStage} />
                  </LabelWithTooltip>
                  <TentModeSelect
                    value={plantStage}
                    onChange={(e) => updatePlantStage(e.target.value)}
                  >
                    {plantStageOptions.map((option, index) => (
                      <TentModeOption key={index} value={option}>
                        {option}
                      </TentModeOption>
                    ))}
                  </TentModeSelect>
                </ControlGroup>
              )}

              {plantSpeciesOptions.length > 0 && (
                <ControlGroup>
                  <LabelWithTooltip>
                    <Label>Plant Species</Label>
                    <HelpTooltip text={tooltips.plantSpecies} />
                  </LabelWithTooltip>
                  <TentModeSelect
                    value={plantSpecies}
                    onChange={(e) => updatePlantSpecies(e.target.value)}
                  >
                    {plantSpeciesOptions.map((option, index) => (
                      <TentModeOption key={index} value={option}>
                        {option}
                      </TentModeOption>
                    ))}
                  </TentModeSelect>
                </ControlGroup>
              )}
            </AccordionContent>
          )}
        </AccordionSection>
      )}

      {/* Light Control Accordion */}
      <AccordionSection>
        <AccordionHeader onClick={() => toggleSection('lightControl')}>
          <SectionInfo>
            <SectionIconBadge>
              <Lightbulb size={16} />
            </SectionIconBadge>
            <SectionTextGroup>
              <SectionTitleWithTooltip>
                <SectionTitle>Light Control</SectionTitle>
                <HelpTooltip text={tooltips.lightControl} />
              </SectionTitleWithTooltip>
              <SectionSummary>{lightSchedule}</SectionSummary>
            </SectionTextGroup>
          </SectionInfo>
          <HeaderActions>
            <HeaderValuePill $active={lightControlEnabled}>{lightControlEnabled ? 'Active' : 'Off'}</HeaderValuePill>
            <AccordionArrow $expanded={expandedSections.lightControl}>
              <ChevronDown size={20} />
            </AccordionArrow>
          </HeaderActions>
        </AccordionHeader>
        {expandedSections.lightControl && (
          <AccordionContent>
            <MinMaxToggleRow>
              <LabelWithTooltip>
                <MinMaxLabel>Enable Light Control</MinMaxLabel>
                <HelpTooltip text={tooltips.lightControl} />
              </LabelWithTooltip>
              <MinMaxToggle onClick={toggleLightControl}>
                <MinMaxToggleSlider $enabled={lightControlEnabled}>
                  <MinMaxToggleCircle $enabled={lightControlEnabled}>
                    {lightControlEnabled ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                  </MinMaxToggleCircle>
                </MinMaxToggleSlider>
                <MinMaxToggleLabel>
                  {lightControlEnabled ? 'ON' : 'OFF'}
                </MinMaxToggleLabel>
              </MinMaxToggle>
            </MinMaxToggleRow>

            {lightControlEnabled && (
              <>
                <Divider />
                
                <TimeRow>
                  <TimeControl>
                    <LabelWithTooltip>
                      <Label>Light ON</Label>
                      <HelpTooltip text={tooltips.lightOn} />
                    </LabelWithTooltip>
                    <TimeInput
                      type="time"
                      value={lightOnTime}
                      onChange={(e) => {
                        setLightOnTime(e.target.value);
                        const room = currentRoom?.trim()?.toLowerCase() || 'default';
                        updateTimeEntity(`input_datetime.ogb_lightontime_${room}`, e.target.value);
                      }}
                    />
                  </TimeControl>
                  <TimeControl>
                    <LabelWithTooltip>
                      <Label>Light OFF</Label>
                      <HelpTooltip text={tooltips.lightOff} />
                    </LabelWithTooltip>
                    <TimeInput
                      type="time"
                      value={lightOffTime}
                      onChange={(e) => {
                        setLightOffTime(e.target.value);
                        const room = currentRoom?.trim()?.toLowerCase() || 'default';
                        updateTimeEntity(`input_datetime.ogb_lightofftime_${room}`, e.target.value);
                      }}
                    />
                  </TimeControl>
                </TimeRow>
                <SunSection>
                  <SunControl>
                    <SunIcon>
                      <Sunrise size={18} />
                    </SunIcon>
                    <LabelWithTooltip>
                      <SunLabel>Sunrise</SunLabel>
                      <HelpTooltip text={tooltips.sunrise} />
                    </LabelWithTooltip>
                    <SunTimeInput
                      type="time"
                      step="1"
                      value={sunriseTime}
                      onChange={(e) => {
                        setSunriseTime(e.target.value);
                        const room = currentRoom?.trim()?.toLowerCase() || 'default';
                        updateTimeEntity(`input_datetime.ogb_sunrisetime_${room}`, e.target.value);
                      }}
                    />
                  </SunControl>
                  <SunControl>
                    <SunIcon>
                      <Sunset size={18} />
                    </SunIcon>
                    <LabelWithTooltip>
                      <SunLabel>Sunset</SunLabel>
                      <HelpTooltip text={tooltips.sunset} />
                    </LabelWithTooltip>
                    <SunTimeInput
                      type="time"
                      step="1"
                      value={sunsetTime}
                      onChange={(e) => {
                        setSunsetTime(e.target.value);
                        const room = currentRoom?.trim()?.toLowerCase() || 'default';
                        updateTimeEntity(`input_datetime.ogb_sunsettime_${room}`, e.target.value);
                      }}
                    />
                  </SunControl>
                </SunSection>
              </>
            )}
          </AccordionContent>
        )}
      </AccordionSection>

      {/* CO2 Control Accordion */}
      <AccordionSection>
        <AccordionHeader onClick={() => toggleSection('co2Control')}>
          <SectionInfo>
            <SectionIconBadge>
              <Wind size={16} />
            </SectionIconBadge>
            <SectionTextGroup>
              <SectionTitleWithTooltip>
                <SectionTitle>CO2 Control</SectionTitle>
                <HelpTooltip text={tooltips.co2Control} />
              </SectionTitleWithTooltip>
              <SectionSummary>{co2Summary}</SectionSummary>
            </SectionTextGroup>
          </SectionInfo>
          <HeaderActions>
            <HeaderValuePill $active={co2Enabled}>{co2Enabled ? 'Active' : 'Off'}</HeaderValuePill>
            <AccordionArrow $expanded={expandedSections.co2Control}>
              <ChevronDown size={20} />
            </AccordionArrow>
          </HeaderActions>
        </AccordionHeader>
        {expandedSections.co2Control && (
          <AccordionContent>
            <MinMaxToggleRow>
              <LabelWithTooltip>
                <MinMaxLabel>Enable CO2 Control</MinMaxLabel>
                <HelpTooltip text={tooltips.co2Control} />
              </LabelWithTooltip>
              <MinMaxToggle onClick={toggleCo2Control}>
                <MinMaxToggleSlider $enabled={co2Enabled}>
                  <MinMaxToggleCircle $enabled={co2Enabled}>
                    {co2Enabled ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                  </MinMaxToggleCircle>
                </MinMaxToggleSlider>
                <MinMaxToggleLabel>
                  {co2Enabled ? 'ON' : 'OFF'}
                </MinMaxToggleLabel>
              </MinMaxToggle>
            </MinMaxToggleRow>

            {co2Enabled && (
              <>
                <Divider />
                <ControlRow>
                  <ControlGroup>
                    <LabelWithTooltip>
                      <Label>CO2 Min (ppm)</Label>
                      <HelpTooltip text={tooltips.co2Min} />
                    </LabelWithTooltip>
                    <ValueControl>
                      <ValueButton onClick={() => adjustValue(co2Min, -50, 300, 1000, updateCo2Min)}>
                        <ChevronDown size={16} />
                      </ValueButton>
                      <ValueDisplay>{co2Min}</ValueDisplay>
                      <ValueButton onClick={() => adjustValue(co2Min, 50, 300, 1000, updateCo2Min)}>
                        <ChevronUp size={16} />
                      </ValueButton>
                    </ValueControl>
                  </ControlGroup>
                  <ControlGroup>
                    <LabelWithTooltip>
                      <Label>CO2 Max (ppm)</Label>
                      <HelpTooltip text={tooltips.co2Max} />
                    </LabelWithTooltip>
                    <ValueControl>
                      <ValueButton onClick={() => adjustValue(co2Max, -50, 1000, 2000, updateCo2Max)}>
                        <ChevronDown size={16} />
                      </ValueButton>
                      <ValueDisplay>{co2Max}</ValueDisplay>
                      <ValueButton onClick={() => adjustValue(co2Max, 50, 1000, 2000, updateCo2Max)}>
                        <ChevronUp size={16} />
                      </ValueButton>
                    </ValueControl>
                  </ControlGroup>
                </ControlRow>
                <ControlRow>
                  <ControlGroup>
                    <LabelWithTooltip>
                      <Label>CO2 Target (ppm)</Label>
                      <HelpTooltip text={tooltips.co2Target} />
                    </LabelWithTooltip>
                    <ValueControl>
                      <ValueButton onClick={() => adjustValue(co2Target, -50, 400, 1500, updateCo2Target)}>
                        <ChevronDown size={16} />
                      </ValueButton>
                      <ValueDisplay>{co2Target}</ValueDisplay>
                      <ValueButton onClick={() => adjustValue(co2Target, 50, 400, 1500, updateCo2Target)}>
                        <ChevronUp size={16} />
                      </ValueButton>
                    </ValueControl>
                  </ControlGroup>
                </ControlRow>
              </>
            )}
          </AccordionContent>
        )}
      </AccordionSection>

      {/* Environment Accordion */}
      <AccordionSection>
        <AccordionHeader onClick={() => toggleSection('temperature')}>
          <SectionInfo>
            <SectionIconBadge>
              <Thermometer size={16} />
            </SectionIconBadge>
            <SectionTextGroup>
              <SectionTitleWithTooltip>
                <SectionTitle>Environment (Temp + Humidity)</SectionTitle>
                <HelpTooltip text={tooltips.environment} />
              </SectionTitleWithTooltip>
              <SectionSummary>{environmentSummary}</SectionSummary>
            </SectionTextGroup>
          </SectionInfo>
          <HeaderActions>
            <HeaderValuePill $active={minmaxEnabled}>{minmaxEnabled ? 'Custom' : 'Auto'}</HeaderValuePill>
            <AccordionArrow $expanded={expandedSections.temperature}>
              <ChevronDown size={20} />
            </AccordionArrow>
          </HeaderActions>
        </AccordionHeader>
        {expandedSections.temperature && (
          <AccordionContent>
            <MinMaxToggleRow>
              <LabelWithTooltip>
                <MinMaxLabel>Min/Max Control</MinMaxLabel>
                <HelpTooltip text={tooltips.environment} />
              </LabelWithTooltip>
              <MinMaxToggle onClick={toggleMinMax}>
                <MinMaxToggleSlider $enabled={minmaxEnabled}>
                  <MinMaxToggleCircle $enabled={minmaxEnabled}>
                    {minmaxEnabled ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                  </MinMaxToggleCircle>
                </MinMaxToggleSlider>
                <MinMaxToggleLabel>
                  {minmaxEnabled ? 'ON' : 'OFF'}
                </MinMaxToggleLabel>
              </MinMaxToggle>
            </MinMaxToggleRow>

            {minmaxEnabled && (
              <>
                <Divider />
                <ControlRow>
                  <ControlGroup>
                    <LabelWithTooltip>
                      <Label><Thermometer size={14} /> Temp Min</Label>
                      <HelpTooltip text={tooltips.tempMin} />
                    </LabelWithTooltip>
                    <ValueControl>
                      <ValueButton onClick={() => adjustValue(tempMin, -1, 15, 35, updateTempMin)}>
                        <ChevronDown size={16} />
                      </ValueButton>
                      <ValueDisplay>{tempMin}°C</ValueDisplay>
                      <ValueButton onClick={() => adjustValue(tempMin, 1, 15, 35, updateTempMin)}>
                        <ChevronUp size={16} />
                      </ValueButton>
                    </ValueControl>
                  </ControlGroup>
                  <ControlGroup>
                    <LabelWithTooltip>
                      <Label><Thermometer size={14} /> Temp Max</Label>
                      <HelpTooltip text={tooltips.tempMax} />
                    </LabelWithTooltip>
                    <ValueControl>
                      <ValueButton onClick={() => adjustValue(tempMax, -1, 20, 40, updateTempMax)}>
                        <ChevronDown size={16} />
                      </ValueButton>
                      <ValueDisplay>{tempMax}°C</ValueDisplay>
                      <ValueButton onClick={() => adjustValue(tempMax, 1, 20, 40, updateTempMax)}>
                        <ChevronUp size={16} />
                      </ValueButton>
                    </ValueControl>
                  </ControlGroup>
                </ControlRow>
                <ControlRow>
                  <ControlGroup>
                    <LabelWithTooltip>
                      <Label><Droplets size={14} /> Hum Min</Label>
                      <HelpTooltip text={tooltips.humMin} />
                    </LabelWithTooltip>
                    <ValueControl>
                      <ValueButton onClick={() => adjustValue(humMin, -1, 20, 60, updateHumMin)}>
                        <ChevronDown size={16} />
                      </ValueButton>
                      <ValueDisplay>{humMin}%</ValueDisplay>
                      <ValueButton onClick={() => adjustValue(humMin, 1, 20, 60, updateHumMin)}>
                        <ChevronUp size={16} />
                      </ValueButton>
                    </ValueControl>
                  </ControlGroup>
                  <ControlGroup>
                    <LabelWithTooltip>
                      <Label><Droplets size={14} /> Hum Max</Label>
                      <HelpTooltip text={tooltips.humMax} />
                    </LabelWithTooltip>
                    <ValueControl>
                      <ValueButton onClick={() => adjustValue(humMax, -1, 40, 90, updateHumMax)}>
                        <ChevronDown size={16} />
                      </ValueButton>
                      <ValueDisplay>{humMax}%</ValueDisplay>
                      <ValueButton onClick={() => adjustValue(humMax, 1, 40, 90, updateHumMax)}>
                        <ChevronUp size={16} />
                      </ValueButton>
                    </ValueControl>
                  </ControlGroup>
                </ControlRow>
              </>
            )}
          </AccordionContent>
        )}
      </AccordionSection>

      {/* Fan Accordion */}
      {fanEntityId && (
        <AccordionSection>
          <AccordionHeader onClick={() => toggleSection('fan')}>
            <SectionInfo>
              <SectionIconBadge>
                <Wind size={16} />
              </SectionIconBadge>
              <SectionTextGroup>
                <SectionTitleWithTooltip>
                  <SectionTitle>Fan</SectionTitle>
                  <HelpTooltip text={tooltips.fan} />
                </SectionTitleWithTooltip>
                <SectionSummary>{fanSummary}</SectionSummary>
              </SectionTextGroup>
            </SectionInfo>
            <HeaderActions>
              <HeaderValuePill $active={fanOn}>{fanOn ? 'On' : 'Off'}</HeaderValuePill>
              <AccordionArrow $expanded={expandedSections.fan}>
                <ChevronDown size={20} />
              </AccordionArrow>
            </HeaderActions>
          </AccordionHeader>
          {expandedSections.fan && (
            <AccordionContent>
              <FanControl>
                <FanToggle onClick={toggleFan}>
                  <Power size={20} />
                  <FanLabel>{fanOn ? 'ON' : 'OFF'}</FanLabel>
                </FanToggle>
                <FanSpeedControl>
                  <LabelWithTooltip>
                    <Label>Speed: {fanSpeed}%</Label>
                    <HelpTooltip text={tooltips.fanSpeed} />
                  </LabelWithTooltip>
                  <VentSlider 
                    type="range" 
                    min="0" 
                    max="100"
                    value={fanSpeed}
                    onChange={(e) => updateFanSpeed(e.target.value)}
                  />
                </FanSpeedControl>
              </FanControl>
            </AccordionContent>
          )}
        </AccordionSection>
      )}

      {/* Ventilation Accordion */}
      <AccordionSection>
        <AccordionHeader onClick={() => toggleSection('ventilation')}>
          <SectionInfo>
            <SectionIconBadge>
              <Wind size={16} />
            </SectionIconBadge>
            <SectionTextGroup>
              <SectionTitleWithTooltip>
                <SectionTitle>Ventilation (Exhaust/Intake)</SectionTitle>
                <HelpTooltip text={tooltips.ventilation} />
              </SectionTitleWithTooltip>
              <SectionSummary>{ventilationSummary}</SectionSummary>
            </SectionTextGroup>
          </SectionInfo>
          <HeaderActions>
            <HeaderValuePill $active={ventilationSummary !== 'All default'}>{ventilationSummary !== 'All default' ? 'Custom' : 'Auto'}</HeaderValuePill>
            <AccordionArrow $expanded={expandedSections.ventilation}>
              <ChevronDown size={20} />
            </AccordionArrow>
          </HeaderActions>
        </AccordionHeader>
          {expandedSections.ventilation && (
            <AccordionContent>
              <VentilationGrid>
                <VentilationCard>
                  <VentTitle>Exhaust</VentTitle>
                  <VentToggleRow>
                    <LabelWithTooltip>
                      <VentLabel>Min/Max Control</VentLabel>
                      <HelpTooltip text={tooltips.ventMinMax} />
                    </LabelWithTooltip>
                    <VentToggle onClick={toggleExhaustMinMax} $enabled={exhaustMinMaxEnabled}>
                      <VentToggleSlider $enabled={exhaustMinMaxEnabled}>
                        <VentToggleCircle $enabled={exhaustMinMaxEnabled}>
                          {exhaustMinMaxEnabled ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                        </VentToggleCircle>
                      </VentToggleSlider>
                      <VentToggleLabel>
                        {exhaustMinMaxEnabled ? 'ON' : 'OFF'}
                      </VentToggleLabel>
                    </VentToggle>
                  </VentToggleRow>
                  {exhaustMinMaxEnabled && (
                    <>
                      <VentRow>
                        <LabelWithTooltip>
                          <VentLabel>Min:</VentLabel>
                          <HelpTooltip text={tooltips.ventMin} />
                        </LabelWithTooltip>
                        <VentValue>{exhaustMinMax.min}%</VentValue>
                      </VentRow>
                      <VentSlider 
                        type="range" 
                        min="0" 
                        max="100"
                        value={exhaustMinMax.min}
                        onChange={(e) => updateVentilationMinMax('exhaust', parseInt(e.target.value), exhaustMinMax.max)}
                        disabled={!exhaustMinMaxEnabled}
                      />
                      <VentRow>
                        <LabelWithTooltip>
                          <VentLabel>Max:</VentLabel>
                          <HelpTooltip text={tooltips.ventMax} />
                        </LabelWithTooltip>
                        <VentValue>{exhaustMinMax.max}%</VentValue>
                      </VentRow>
                      <VentSlider 
                        type="range" 
                        min="0" 
                        max="100"
                        value={exhaustMinMax.max}
                        onChange={(e) => updateVentilationMinMax('exhaust', exhaustMinMax.min, parseInt(e.target.value))}
                        disabled={!exhaustMinMaxEnabled}
                      />
                    </>
                  )}
                </VentilationCard>
                <VentilationCard>
                  <VentTitle>Intake</VentTitle>
                  <VentToggleRow>
                    <LabelWithTooltip>
                      <VentLabel>Min/Max Control</VentLabel>
                      <HelpTooltip text={tooltips.ventMinMax} />
                    </LabelWithTooltip>
                    <VentToggle onClick={toggleIntakeMinMax} $enabled={intakeMinMaxEnabled}>
                      <VentToggleSlider $enabled={intakeMinMaxEnabled}>
                        <VentToggleCircle $enabled={intakeMinMaxEnabled}>
                          {intakeMinMaxEnabled ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                        </VentToggleCircle>
                      </VentToggleSlider>
                      <VentToggleLabel>
                        {intakeMinMaxEnabled ? 'ON' : 'OFF'}
                      </VentToggleLabel>
                    </VentToggle>
                  </VentToggleRow>
                  {intakeMinMaxEnabled && (
                    <>
                      <VentRow>
                        <LabelWithTooltip>
                          <VentLabel>Min:</VentLabel>
                          <HelpTooltip text={tooltips.ventMin} />
                        </LabelWithTooltip>
                        <VentValue>{intakeMinMax.min}%</VentValue>
                      </VentRow>
                      <VentSlider 
                        type="range" 
                        min="0" 
                        max="100"
                        value={intakeMinMax.min}
                        onChange={(e) => updateVentilationMinMax('intake', parseInt(e.target.value), intakeMinMax.max)}
                        disabled={!intakeMinMaxEnabled}
                      />
                      <VentRow>
                        <LabelWithTooltip>
                          <VentLabel>Max:</VentLabel>
                          <HelpTooltip text={tooltips.ventMax} />
                        </LabelWithTooltip>
                        <VentValue>{intakeMinMax.max}%</VentValue>
                      </VentRow>
                      <VentSlider 
                        type="range" 
                        min="0" 
                        max="100"
                        value={intakeMinMax.max}
                        onChange={(e) => updateVentilationMinMax('intake', intakeMinMax.min, parseInt(e.target.value))}
                        disabled={!intakeMinMaxEnabled}
                      />
                    </>
                  )}
                </VentilationCard>
                <VentilationCard>
                  <VentTitle>Ventilation</VentTitle>
                  <VentToggleRow>
                    <LabelWithTooltip>
                      <VentLabel>Min/Max Control</VentLabel>
                      <HelpTooltip text={tooltips.ventMinMax} />
                    </LabelWithTooltip>
                    <VentToggle onClick={toggleVentilationMinMax} $enabled={ventilationMinMaxEnabled}>
                      <VentToggleSlider $enabled={ventilationMinMaxEnabled}>
                        <VentToggleCircle $enabled={ventilationMinMaxEnabled}>
                          {ventilationMinMaxEnabled ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                        </VentToggleCircle>
                      </VentToggleSlider>
                      <VentToggleLabel>
                        {ventilationMinMaxEnabled ? 'ON' : 'OFF'}
                      </VentToggleLabel>
                    </VentToggle>
                  </VentToggleRow>
                  {ventilationMinMaxEnabled && (
                    <>
                      <VentRow>
                        <LabelWithTooltip>
                          <VentLabel>Min:</VentLabel>
                          <HelpTooltip text={tooltips.ventMin} />
                        </LabelWithTooltip>
                        <VentValue>{ventilationMinMax.min}%</VentValue>
                      </VentRow>
                      <VentSlider 
                        type="range" 
                        min="0" 
                        max="100"
                        value={ventilationMinMax.min}
                        onChange={(e) => updateVentilationMinMax('ventilation', parseInt(e.target.value), ventilationMinMax.max)}
                        disabled={!ventilationMinMaxEnabled}
                      />
                      <VentRow>
                        <LabelWithTooltip>
                          <VentLabel>Max:</VentLabel>
                          <HelpTooltip text={tooltips.ventMax} />
                        </LabelWithTooltip>
                        <VentValue>{ventilationMinMax.max}%</VentValue>
                      </VentRow>
                      <VentSlider 
                        type="range" 
                        min="0" 
                        max="100"
                        value={ventilationMinMax.max}
                        onChange={(e) => updateVentilationMinMax('ventilation', ventilationMinMax.min, parseInt(e.target.value))}
                        disabled={!ventilationMinMaxEnabled}
                      />
                    </>
                  )}
                </VentilationCard>
              </VentilationGrid>
          </AccordionContent>
        )}
      </AccordionSection>
    </Container>
  );
};

export default LiteControlCard;

const Container = styled.div`
  background: var(--main-bg-card-color);
  border-radius: 20px;
  padding: 1.5rem;
  box-shadow: var(--main-shadow-art);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  border: 1px solid var(--glass-border);
`;

const CardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;

  @media (max-width: 640px) {
    flex-direction: column;
  }
`;

const HeaderTextBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const CardEyebrow = styled.div`
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--primary-accent);
`;

const CardTitle = styled.h3`
  margin: 0;
  font-size: 1.2rem;
  line-height: 1.2;
  color: var(--main-text-color);
`;

const CardDescription = styled.p`
  margin: 0;
  max-width: 46ch;
  color: var(--placeholder-text-color);
  font-size: 0.88rem;
  line-height: 1.45;
`;

const HeaderStatusPill = styled.div`
  padding: 0.55rem 0.85rem;
  border-radius: 999px;
  background: rgba(74, 222, 128, 0.12);
  border: 1px solid rgba(74, 222, 128, 0.25);
  color: #86efac;
  font-size: 0.8rem;
  font-weight: 700;
  white-space: nowrap;
`;

const OverviewGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const OverviewCard = styled.div`
  background: linear-gradient(180deg, var(--glass-bg-secondary), var(--glass-bg-primary));
  border: 1px solid var(--glass-border);
  border-radius: 14px;
  padding: 0.85rem 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const OverviewLabel = styled.div`
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--placeholder-text-color);
`;

const OverviewValue = styled.div`
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--main-text-color);
  line-height: 1.35;
`;

const AccordionSection = styled.div`
  background: var(--glass-bg-primary);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  overflow: visible;
  transition: all 0.3s ease;
  position: relative;
  z-index: 0;

  &:hover {
    border-color: var(--primary-accent);
    z-index: 5;
  }
`;

const AccordionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  gap: 0.75rem;
  cursor: pointer;
  background: var(--glass-bg-secondary);
  transition: background 0.2s ease;

  &:hover {
    background: var(--active-bg-color);
  }

  @media (max-width: 640px) {
    align-items: flex-start;
  }
`;

const SectionInfo = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  color: var(--main-text-color);
  min-width: 0;
`;

const SectionIconBadge = styled.div`
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(74, 222, 128, 0.12);
  border: 1px solid rgba(74, 222, 128, 0.2);
  color: var(--primary-accent);
  flex: 0 0 auto;
`;

const SectionTextGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
`;

const SectionTitle = styled.span`
  font-size: 1rem;
  font-weight: 600;
`;

const SectionTitleWithTooltip = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
`;

const SectionSummary = styled.div`
  color: var(--placeholder-text-color);
  font-size: 0.8rem;
  line-height: 1.35;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex: 0 0 auto;
`;

const HeaderValuePill = styled.div`
  padding: 0.35rem 0.6rem;
  border-radius: 999px;
  background: ${props => props.$active ? 'rgba(74, 222, 128, 0.14)' : 'var(--glass-bg-primary)'};
  border: 1px solid ${props => props.$active ? 'rgba(74, 222, 128, 0.22)' : 'var(--glass-border)'};
  color: ${props => props.$active ? '#86efac' : 'var(--placeholder-text-color)'};
  font-size: 0.74rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;

  @media (max-width: 640px) {
    display: none;
  }
`;

const AccordionArrow = styled.div`
  color: var(--placeholder-text-color);
  transform: ${props => props.$expanded ? 'rotate(180deg)' : 'rotate(0deg)'};
  transition: transform 0.3s ease;
`;

const AccordionContent = styled.div`
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  animation: slideDown 0.3s ease-out;
  background: var(--glass-bg-primary);

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const MinMaxToggleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--glass-bg-secondary);
  border-radius: 8px;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const MinMaxLabel = styled.span`
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--main-text-color);
`;

const Divider = styled.div`
  height: 1px;
  background: var(--glass-border);
  margin: 0.75rem 0;
`;

const MinMaxToggle = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 0.75rem;
  background: ${props => props.$enabled ? 'var(--active-bg-color)' : 'var(--glass-bg-secondary)'};
  border-radius: 8px;
  transition: all 0.3s ease;
  border: 1px solid ${props => props.$enabled ? 'var(--primary-accent)' : 'transparent'};

  &:hover {
    background: ${props => props.$enabled ? 'var(--pressed-bg-color)' : 'var(--border-hover-color)'};
    transform: translateX(2px);
  }
`;

const MinMaxToggleSlider = styled.div`
  position: relative;
  width: 48px;
  height: 26px;
  background: ${props => props.$enabled 
    ? 'linear-gradient(135deg, #4ade80, #22c55e)' 
    : 'var(--disabled-text-color)'};
  border-radius: 13px;
  transition: background 0.3s ease;
  box-shadow: ${props => props.$enabled ? '0 4px 12px rgba(74, 222, 128, 0.3)' : 'none'};
`;

const MinMaxToggleCircle = styled.div`
  position: absolute;
  top: 3px;
  left: ${props => props.$enabled ? '27px' : '3px'};
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: left 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--disabled-text-color);
`;

const MinMaxToggleLabel = styled.span`
  color: var(--main-text-color);
  font-size: 0.9rem;
  font-weight: 500;
  flex: 1;
`;

const LightControl = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: var(--glass-bg-primary);
  border: 2px solid var(--glass-border);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: var(--active-bg-color);
    transform: translateY(-2px);
  }
`;

const LightControlDisabled = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: var(--glass-bg-secondary);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  opacity: 0.6;
`;

const LightIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: ${props => props.$on 
    ? 'linear-gradient(135deg, #FFD700, #FFA500)' 
    : 'var(--disabled-text-color)'};
  color: white;
  transition: all 0.3s ease;
  box-shadow: ${props => props.$on ? '0 4px 15px rgba(255, 215, 0, 0.5)' : 'none'};
`;

const LightInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
`;

const LightLabel = styled.div`
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--main-text-color);
`;

const LightSchedule = styled.div`
  font-size: 0.85rem;
  color: var(--placeholder-text-color);
  font-weight: 500;
`;

const LightStatus = styled.div`
  font-size: 0.9rem;
  font-weight: 700;
  color: ${props => props.$on ? '#4ade80' : 'var(--disabled-text-color)'};
  padding: 0.5rem 1rem;
  border-radius: 20px;
  background: ${props => props.$on 
    ? 'rgba(74, 222, 128, 0.15)' 
    : 'var(--glass-bg-secondary)'};
`;

const TentModeSelect = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--glass-border);
  border-radius: 8px;
  background: var(--glass-bg-secondary);
  color: var(--main-text-color);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: var(--active-bg-color);
    border-color: var(--primary-accent);
  }

  &:focus {
    outline: none;
    border-color: var(--primary-accent);
    box-shadow: 0 0 0 2px rgba(74, 222, 128, 0.2);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const TentModeOption = styled.option`
  background: var(--main-bg-card-color);
  color: var(--main-text-color);
  padding: 0.5rem;
`;

const TimeRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const TimeControl = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const TimeInput = styled.input`
  padding: 0.75rem;
  border: 1px solid var(--glass-border);
  border-radius: 8px;
  background: var(--glass-bg-secondary);
  color: var(--main-text-color);
  font-size: 1rem;
  font-weight: 600;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: var(--active-bg-color);
    border-color: var(--primary-accent);
  }

  &:focus {
    outline: none;
    border-color: var(--primary-accent);
    box-shadow: 0 0 0 2px rgba(74, 222, 128, 0.2);
  }

  &::-webkit-calendar-picker-indicator {
    filter: invert(1);
    cursor: pointer;
  }
`;

const SunSection = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--glass-border);
`;

const SunControl = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: var(--glass-bg-secondary);
  padding: 0.75rem;
  border-radius: 8px;
`;

const SunIcon = styled.div`
  color: #FFA500;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const SunLabel = styled.div`
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--main-text-color);
  flex: 1;
`;

const SunTimeInput = styled.input`
  padding: 0.5rem;
  border: 1px solid var(--glass-border);
  border-radius: 6px;
  background: var(--active-bg-color);
  color: var(--main-text-color);
  font-size: 0.9rem;
  font-weight: 600;
  text-align: center;
  cursor: pointer;
  width: 100px;
  transition: all 0.2s ease;

  &:hover {
    background: var(--pressed-bg-color);
    border-color: var(--primary-accent);
  }

  &:focus {
    outline: none;
    border-color: var(--primary-accent);
  }

  &::-webkit-calendar-picker-indicator {
    filter: invert(1);
    cursor: pointer;
  }
`;

const ControlRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
`;

const ControlGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const LabelWithTooltip = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  min-width: 0;
  flex-wrap: wrap;
`;

const Label = styled.div`
  font-size: 0.85rem;
  color: var(--placeholder-text-color);
  font-weight: 500;
`;

const TooltipWrapper = styled.span`
  position: relative;
  display: inline-flex;
`;

const TooltipButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--placeholder-text-color);
  cursor: help;
  opacity: 0.85;

  &:hover {
    color: var(--primary-accent);
    opacity: 1;
  }

  &:focus-visible {
    color: var(--primary-accent);
    opacity: 1;
    outline: none;
  }

  &:hover > span,
  &:focus-visible > span {
    opacity: 1;
    visibility: visible;
    transform: translate(-50%, -6px);
  }
`;

const TooltipBubble = styled.span`
  position: absolute;
  left: 50%;
  bottom: calc(100% + 0.55rem);
  transform: translate(-50%, 0);
  width: min(240px, 70vw);
  padding: 0.55rem 0.7rem;
  border-radius: 10px;
  background: rgba(10, 14, 18, 0.96);
  border: 1px solid var(--glass-border);
  color: #fff;
  font-size: 0.75rem;
  line-height: 1.35;
  text-align: left;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.28);
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 0.18s ease, transform 0.18s ease, visibility 0.18s ease;
  z-index: 30;

  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border-width: 6px;
    border-style: solid;
    border-color: rgba(10, 14, 18, 0.96) transparent transparent transparent;
  }
`;

const ValueControl = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--glass-bg-secondary);
  border-radius: 8px;
  padding: 0.5rem;
  border: 1px solid var(--glass-border);
`;

const ValueButton = styled.button`
  background: var(--active-bg-color);
  border: none;
  color: var(--main-text-color);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;

  &:hover {
    background: var(--pressed-bg-color);
  }
`;

const ValueDisplay = styled.div`
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--main-text-color);
`;

const FanControl = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const FanToggle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: ${props => props.$isOn ? 'var(--active-bg-color)' : 'var(--glass-bg-secondary)'};
  border-radius: 8px;
  cursor: pointer;
  border: 1px solid ${props => props.$isOn ? 'var(--primary-accent)' : 'var(--glass-border)'};
`;

const FanLabel = styled.span`
  font-weight: 600;
  color: ${props => props.$isOn ? '#4ade80' : 'var(--placeholder-text-color)'};
`;

const FanSpeedControl = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const VentilationGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const VentilationCard = styled.div`
  background: linear-gradient(180deg, var(--glass-bg-secondary), var(--glass-bg-primary));
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  padding: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
`;

const VentTitle = styled.div`
  font-weight: 600;
  color: var(--main-text-color);
  font-size: 0.9rem;
  text-align: center;
`;

const VentRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const VentLabel = styled.span`
  color: var(--placeholder-text-color);
  font-size: 0.8rem;
`;

const VentValue = styled.span`
  color: var(--primary-accent);
  font-weight: 600;
  font-size: 0.85rem;
`;

const VentSlider = styled.input`
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: ${props => props.disabled ? 'var(--disabled-text-color)' : 'var(--glass-bg-primary)'};
  appearance: none;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  
  &::-webkit-slider-thumb {
    appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: ${props => props.disabled ? 'var(--disabled-text-color)' : 'var(--primary-accent)'};
    cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  }
`;

const VentToggleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0;
  margin-bottom: 0.5rem;
`;

const VentToggle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
`;

const VentToggleSlider = styled.div`
  position: relative;
  width: 40px;
  height: 22px;
  background: ${props => props.$enabled 
    ? 'linear-gradient(135deg, var(--primary-accent), var(--secondary-accent))' 
    : 'var(--disabled-text-color)'};
  border-radius: 11px;
  transition: background 0.3s ease;
`;

const VentToggleCircle = styled.div`
  position: absolute;
  top: 2px;
  left: ${props => props.$enabled ? '21px' : '2px'};
  width: 18px;
  height: 18px;
  background: white;
  border-radius: 50%;
  transition: left 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--disabled-text-color);
`;

const VentToggleLabel = styled.span`
  color: var(--main-text-color);
  font-size: 0.75rem;
  font-weight: 600;
`;
