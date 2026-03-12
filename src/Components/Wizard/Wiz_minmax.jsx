import React from 'react'
import styled from 'styled-components'
import { MdThermostat, MdOpacity, MdWaterDrop, MdLightMode, MdEco } from 'react-icons/md'

// Growth stage color scheme
const stageColors = {
  germination: '#64B5F6', // Soft blue - water and beginning
  clones: '#81C784', // Light green - early growth
  earlyVeg: '#66BB6A', // Medium green - vegetative growth
  midVeg: '#4CAF50', // Dark green - peak growth
  lateVeg: '#9CCC65', // Yellow-green - transition phase
  earlyFlower: '#FFB74D', // Light orange - flowering begins
  midFlower: '#FF9800', // Bright orange - peak flowering
  lateFlower: '#FF7043', // Deep orange - maturation
  default: '#00ff00' // Fallback color
}

const getStageColor = (stage) => stageColors[stage] || stageColors.default

// Parameter-specific colors
const parameterColors = {
  temperature: '#4CAF50', // Green spectrum
  humidity: '#2196F3', // Blue spectrum  
  vpd: '#FF9800', // Orange spectrum
  light: '#FFC107' // Yellow/Gold spectrum
}

const Wiz_minmax = ({ stage, stageName, icon, data, updateData, showDescription = true }) => {
  const stageData = data.plantStages[stage]
  const stageColor = getStageColor(stage)

  const updateStageData = (field, value) => {
    updateData({
      plantStages: {
        ...data.plantStages,
        [stage]: {
          ...stageData,
          [field]: value
        }
      }
    })
  }

  return (
    <ConfigContainer>

      {showDescription && (
        <StageHeader>
          <StageIcon stageColor={stageColor}>{icon}</StageIcon>
          <div>
            <h3>{stageName} Stage Configuration</h3>
            <p>Configure the optimal environmental parameters for the {stageName.toLowerCase()} stage.</p>
          </div>
        </StageHeader>
      )}


      <ConfigGrid>
        <ConfigSection paramColor={parameterColors.temperature}>
          <SectionTitle paramColor={parameterColors.temperature}>
            <MdThermostat /> Temperature (°C)
          </SectionTitle>
          <RangeInputWrapper
            label="Min Temp"
            value={stageData.minTemp}
            onChange={(e) => updateStageData('minTemp', parseFloat(e.target.value))}
            min="10"
            max="40"
            step="0.5"
            paramColor={parameterColors.temperature}
          />
          <RangeInputWrapper
            label="Max Temp"
            value={stageData.maxTemp}
            onChange={(e) => updateStageData('maxTemp', parseFloat(e.target.value))}
            min="10"
            max="40"
            step="0.5"
            paramColor={parameterColors.temperature}
          />
          <RangeDisplay paramColor={parameterColors.temperature}>
            <span>{stageData.minTemp}°C</span>
            <span>→</span>
            <span>{stageData.maxTemp}°C</span>
          </RangeDisplay>
        </ConfigSection>

        <ConfigSection paramColor={parameterColors.humidity}>
          <SectionTitle paramColor={parameterColors.humidity}>
            <MdOpacity /> Humidity (%)
          </SectionTitle>
          <RangeInputWrapper
            label="Min Humidity"
            value={stageData.minHumidity}
            onChange={(e) => updateStageData('minHumidity', parseFloat(e.target.value))}
            min="20"
            max="90"
            step="1"
            paramColor={parameterColors.humidity}
          />
          <RangeInputWrapper
            label="Max Humidity"
            value={stageData.maxHumidity}
            onChange={(e) => updateStageData('maxHumidity', parseFloat(e.target.value))}
            min="20"
            max="90"
            step="1"
            paramColor={parameterColors.humidity}
          />
          <RangeDisplay paramColor={parameterColors.humidity}>
            <span>{stageData.minHumidity}%</span>
            <span>→</span>
            <span>{stageData.maxHumidity}%</span>
          </RangeDisplay>
        </ConfigSection>

        <ConfigSection paramColor={parameterColors.vpd}>
          <SectionTitle paramColor={parameterColors.vpd}>
            <MdWaterDrop /> VPD (kPa)
          </SectionTitle>
          <RangeInputWrapper
            label="Min VPD"
            value={stageData.minVPD}
            onChange={(e) => updateStageData('minVPD', parseFloat(e.target.value))}
            min="0.2"
            max="2.0"
            step="0.1"
            paramColor={parameterColors.vpd}
          />
          <RangeInputWrapper
            label="Max VPD"
            value={stageData.maxVPD}
            onChange={(e) => updateStageData('maxVPD', parseFloat(e.target.value))}
            min="0.2"
            max="2.0"
            step="0.1"
            paramColor={parameterColors.vpd}
          />
          <RangeDisplay paramColor={parameterColors.vpd}>
            <span>{stageData.minVPD} kPa</span>
            <span>→</span>
            <span>{stageData.maxVPD} kPa</span>
          </RangeDisplay>
        </ConfigSection>

        <ConfigSection paramColor={parameterColors.light}>
          <SectionTitle paramColor={parameterColors.light}>
            <MdLightMode /> Light (%)
          </SectionTitle>
          <RangeInputWrapper
            label="Min Light"
            value={stageData.minLight}
            onChange={(e) => updateStageData('minLight', parseInt(e.target.value))}
            min="0"
            max="100"
            step="1"
            isLight={true}
            paramColor={parameterColors.light}
          />
          <RangeInputWrapper
            label="Max Light"
            value={stageData.maxLight}
            onChange={(e) => updateStageData('maxLight', parseInt(e.target.value))}
            min="0"
            max="100"
            step="1"
            isLight={true}
            paramColor={parameterColors.light}
          />
          <RangeDisplay paramColor={parameterColors.light}>
            <span>{stageData.minLight}%</span>
            <span>→</span>
            <span>{stageData.maxLight}%</span>
          </RangeDisplay>
        </ConfigSection>
      </ConfigGrid>


    </ConfigContainer>
  )
}

// Helper function for stage descriptions
const getStageDescription = (stage) => {
  const descriptions = {
    germination: "The germination stage is where seeds sprout and begin to develop roots. Maintain high humidity and stable temperatures for optimal results.",
    clones: "The clones stage involves root development and initial growth. Provide high humidity and moderate light to encourage root establishment.",
    earlyVeg: "Early vegetative stage focuses on leaf development and structure. Increase light intensity and maintain balanced humidity for strong growth.",
    midVeg: "Mid vegetative stage is where plants develop their framework. Maximum light intensity and balanced nutrients promote vigorous development.",
    lateVeg: "Late vegetative stage prepares plants for flowering. Slightly reduce humidity and maintain high light to strengthen plants.",
    earlyFlower: "Early flowering stage initiates bud development. Adjust temperature and humidity to support flower formation and prevent mold.",
    midFlower: "Mid flowering stage is peak bud development. Maintain optimal conditions for maximum flower growth and resin production.",
    lateFlower: "Late flowering stage focuses on maturation. Lower humidity helps prevent mold and improves final product quality."
  }
  return descriptions[stage] || ""
}

// Styled Components
const ConfigContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const StageHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
  
  h3 {
    margin: 0;
    color: var(--main-text-color, #fff);
    font-size: 0.9rem;
    font-weight: 600;
    line-height: 1.2;
  }
  
  p {
    margin: 0;
    color: var(--second-text-color, rgba(255, 255, 255, 0.7));
    font-size: 0.7rem;
    line-height: 1.3;
  }
`

const ConfigurationInfo = styled.div`
  display: flex;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: var(--glass-bg-primary, rgba(255, 255, 255, 0.1));
  border-left: 3px solid var(--primary-accent, var(--main-unit-color));
  border-radius: 0 6px 6px 0;
  margin-bottom: 0.75rem;
  
  h4 {
    margin: 0;
    color: var(--primary-accent, var(--main-unit-color));
    font-size: 0.85rem;
    font-weight: 500;
  }
`

const StageIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: var(--glass-bg-secondary, rgba(255, 255, 255, 0.05));
  border: 1px solid ${props => props.stageColor || 'var(--glass-border, rgba(255, 255, 255, 0.1))'};
  border-radius: 8px;
  color: ${props => props.stageColor || 'var(--primary-accent, var(--main-unit-color))'};
  box-shadow: 0 0 10px ${props => props.stageColor ? `${props.stageColor}33` : 'transparent'};
  transition: all 0.3s ease;
  
  &:hover {
    background: ${props => props.stageColor ? `${props.stageColor}22` : 'var(--glass-bg-secondary, rgba(255, 255, 255, 0.1))'};
    transform: scale(1.1);
  }
  
  svg {
    font-size: 1.5rem;
    color: ${props => props.stageColor || 'var(--primary-accent, var(--main-unit-color))'};
  }
`

const ConfigGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 0.4rem;
  }
`

const ConfigSection = styled.div`
  background: var(--glass-bg-secondary, rgba(255, 255, 255, 0.05));
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.1));
  border-radius: 6px;
  padding: 0.4rem;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  height: fit-content;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 3px;
    height: 100%;
    background: ${props => props.paramColor || 'var(--primary-accent, var(--main-unit-color))'};
    opacity: 0.8;
    box-shadow: ${props => props.paramColor ? `0 0 8px ${props.paramColor}66` : 'none'};
  }
  
  &:hover {
    border-color: ${props => props.paramColor || 'var(--primary-accent, var(--main-unit-color))'};
    background: ${props => props.paramColor ? `${props.paramColor}11` : 'var(--glass-bg-primary, rgba(255, 255, 255, 0.08))'};
    transform: translateY(-2px);
    box-shadow: ${props => props.paramColor ? `0 4px 12px ${props.paramColor}33` : '0 4px 12px rgba(0, 0, 0, 0.2)'};
    
    &::before {
      opacity: 1;
      width: 4px;
      box-shadow: ${props => props.paramColor ? `0 0 12px ${props.paramColor}99` : 'none'};
    }
  }
`

const SectionTitle = styled.h4`
  margin: 0 0 0.4rem 0;
  color: ${props => props.paramColor || 'var(--primary-accent, var(--main-unit-color))'};
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  line-height: 1.2;
  
  svg {
    color: ${props => props.paramColor || 'var(--primary-accent, var(--main-unit-color))'};
    font-size: 0.8rem;
    filter: drop-shadow(0 0 2px ${props => props.paramColor ? `${props.paramColor}66` : 'transparent'});
    flex-shrink: 0;
  }
`

const RangeInput = styled.div`
  margin-bottom: 0.3rem;
  
  label {
    display: block;
    margin-bottom: 0.15rem;
    color: var(--main-text-color, #fff);
    font-size: 0.7rem;
    font-weight: 500;
    line-height: 1.1;
  }
  
  input[type="range"] {
    width: 100%;
    height: 6px;
    border-radius: 3px;
    background: ${props => {
      const paramColor = props.paramColor || 'var(--primary-accent, var(--main-unit-color))';
      return `linear-gradient(to right, 
        ${paramColor}33, 
        ${paramColor}88, 
        ${paramColor})`;
    }};
    outline: none;
    -webkit-appearance: none;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.3);
    
    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: white;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
      border: 2px solid ${props => props.paramColor || 'var(--primary-accent, var(--main-unit-color))'};
      
      &:hover {
        transform: scale(1.3);
        box-shadow: 0 2px 12px ${props => props.paramColor ? `${props.paramColor}99` : 'rgba(0, 0, 0, 0.6)'};
      }
    }
    
    &::-moz-range-thumb {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: white;
      cursor: pointer;
      border: 2px solid ${props => props.paramColor || 'var(--primary-accent, var(--main-unit-color))'};
      transition: all 0.2s ease;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
      
      &:hover {
        transform: scale(1.3);
        box-shadow: 0 2px 12px ${props => props.paramColor ? `${props.paramColor}99` : 'rgba(0, 0, 0, 0.6)'};
      }
    }
  }
  
  .value-display {
    text-align: center;
    color: ${props => props.paramColor || 'var(--second-text-color, rgba(255, 255, 255, 0.7))'};
    font-size: 0.65rem;
    margin-top: 0.15rem;
    font-weight: 600;
    background: ${props => props.paramColor ? `${props.paramColor}22` : 'var(--glass-bg-primary, rgba(255, 255, 255, 0.08))'};
    padding: 0.15rem 0.3rem;
    border-radius: 3px;
    display: inline-block;
    min-width: 40px;
    border: 1px solid ${props => props.paramColor ? `${props.paramColor}44` : 'var(--glass-border, rgba(255, 255, 255, 0.1))'};
  }
`

const RangeDisplay = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.3rem;
  background: ${props => props.paramColor ? `${props.paramColor}11` : 'var(--glass-bg-primary, rgba(255, 255, 255, 0.02))'};
  border-radius: 3px;
  margin-top: 0.3rem;
  border: 1px solid ${props => props.paramColor ? `${props.paramColor}33` : 'var(--glass-border, rgba(255, 255, 255, 0.1))'};
  
  span {
    font-size: 0.65rem;
    color: var(--second-text-color, rgba(255, 255, 255, 0.8));
    font-weight: 500;
    line-height: 1.1;
    
    &:nth-child(2) {
      color: ${props => props.paramColor || 'var(--primary-accent, var(--main-unit-color))'};
    }
    
    &:first-child {
      color: ${props => props.paramColor ? `${props.paramColor}cc` : 'var(--warning-color, #fbbf24)'};
    }
    
    &:last-child {
      color: ${props => props.paramColor || 'var(--chart-success-color, #10b981)'};
    }
  }
`

const StageDescription = styled.div`
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: var(--glass-bg-secondary, rgba(255, 255, 255, 0.05));
  border-left: 2px solid ${props => props.stageColor || 'var(--primary-accent, var(--main-unit-color))'};
  border-radius: 0 4px 4px 0;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: ${props => props.stageColor ? `${props.stageColor}11` : 'transparent'};
    border-radius: 0 4px 4px 0;
    pointer-events: none;
  }
  
  h4 {
    margin: 0 0 0.3rem 0;
    color: ${props => props.stageColor || 'var(--main-text-color, #fff)'};
    font-size: 0.7rem;
    font-weight: 600;
    text-shadow: ${props => props.stageColor ? `0 0 3px ${props.stageColor}66` : 'none'};
    line-height: 1.2;
  }
  
  p {
    margin: 0;
    color: var(--second-text-color, rgba(255, 255, 255, 0.7));
    font-size: 0.65rem;
    line-height: 1.3;
  }
`

// Enhanced input component for range values
const RangeInputWrapper = ({ label, value, onChange, min, max, step, isLight = false, paramColor }) => (
  <RangeInput paramColor={paramColor}>
    <label>{label}</label>
    <input
      type="range"
      value={value}
      onChange={onChange}
      min={min}
      max={max}
      step={step}
    />
    <div className="value-display">{value}{isLight ? '%' : ''}</div>
  </RangeInput>
)

export default Wiz_minmax