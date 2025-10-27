import React, { useState } from 'react'
import styled from 'styled-components'
import { FaTemperatureHigh, FaDroplet, FaWind } from 'react-icons/fa6'

const HeatMap = () => {
  const [sensors] = useState([
    { id: 1, position: 'top-left', temp: 22.5, humidity: 45, name: 'Oben Links' },
    { id: 2, position: 'top-right', temp: 24.8, humidity: 52, name: 'Oben Rechts' },
    { id: 3, position: 'center', temp: 23.2, humidity: 48, name: 'Mitte' },
    { id: 4, position: 'bottom-left', temp: 21.3, humidity: 55, name: 'Unten Links' },
    { id: 5, position: 'bottom-right', temp: 25.1, humidity: 50, name: 'Unten Rechts' },
  ])

  const getColorByTemp = (temp) => {
    if (temp < 20) return '#3b82f6' // Blau
    if (temp < 22) return '#22c55e' // Grün
    if (temp < 24) return '#eab308' // Gelb
    if (temp < 26) return '#f97316' // Orange
    return '#ef4444' // Rot
  }

  const getPositionStyles = (position) => {
    const positions = {
      'top-left': { top: '15%', left: '15%' },
      'top-right': { top: '15%', right: '15%' },
      'center': { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
      'bottom-left': { bottom: '15%', left: '15%' },
      'bottom-right': { bottom: '15%', right: '15%' },
    }
    return positions[position]
  }

  return (
    <Container>
      <Header>
        <Title>Raum Heatmap</Title>
        <Subtitle>Temperatur & Luftfeuchtigkeit Übersicht</Subtitle>
      </Header>

      <RoomContainer>
        <RoomLabel>Raum Grundriss</RoomLabel>
        
        {sensors.map((sensor) => (
          <SensorPoint
            key={sensor.id}
            style={getPositionStyles(sensor.position)}
            color={getColorByTemp(sensor.temp)}
          >
            <SensorPulse color={getColorByTemp(sensor.temp)} />
            <SensorTooltip>
              <TooltipTitle>{sensor.name}</TooltipTitle>
              <TooltipRow>
                <FaTemperatureHigh />
                <span>{sensor.temp}°C</span>
              </TooltipRow>
              <TooltipRow>
                <FaDroplet />
                <span>{sensor.humidity}%</span>
              </TooltipRow>
            </SensorTooltip>
          </SensorPoint>
        ))}

        <Gradient />
      </RoomContainer>

      <Legend>
        <LegendTitle>Temperaturskala</LegendTitle>
        <LegendItems>
          <LegendItem>
            <LegendColor color="#3b82f6" />
            <span>&lt; 20°C</span>
          </LegendItem>
          <LegendItem>
            <LegendColor color="#22c55e" />
            <span>20-22°C</span>
          </LegendItem>
          <LegendItem>
            <LegendColor color="#eab308" />
            <span>22-24°C</span>
          </LegendItem>
          <LegendItem>
            <LegendColor color="#f97316" />
            <span>24-26°C</span>
          </LegendItem>
          <LegendItem>
            <LegendColor color="#ef4444" />
            <span>&gt; 26°C</span>
          </LegendItem>
        </LegendItems>
      </Legend>
    </Container>
  )
}

const Container = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 800px;
  margin: 20px auto;
  color: white;
`

const Header = styled.div`
  text-align: center;
  margin-bottom: 30px;
`

const Title = styled.h2`
  margin: 0;
  font-size: 28px;
  font-weight: 700;
`

const Subtitle = styled.p`
  margin: 8px 0 0 0;
  font-size: 14px;
  opacity: 0.9;
`

const RoomContainer = styled.div`
  position: relative;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 15px;
  height: 400px;
  margin-bottom: 25px;
  backdrop-filter: blur(10px);
  overflow: hidden;
`

const RoomLabel = styled.div`
  position: absolute;
  top: 10px;
  left: 10px;
  font-size: 12px;
  opacity: 0.7;
  font-weight: 600;
`

const SensorPoint = styled.div`
  position: absolute;
  width: 24px;
  height: 24px;
  background: ${props => props.color};
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 0 20px ${props => props.color}80;
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.3);
    z-index: 10;
  }

  &:hover > div:last-child {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }
`

const SensorPulse = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: ${props => props.color};
  animation: pulse 2s ease-in-out infinite;

  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(2.5);
      opacity: 0;
    }
  }
`

const SensorTooltip = styled.div`
  position: absolute;
  bottom: 120%;
  left: 50%;
  transform: translateX(-50%) translateY(-10px);
  background: rgba(0, 0, 0, 0.9);
  padding: 12px 16px;
  border-radius: 8px;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  z-index: 100;

  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 6px solid transparent;
    border-top-color: rgba(0, 0, 0, 0.9);
  }
`

const TooltipTitle = styled.div`
  font-weight: 600;
  margin-bottom: 8px;
  font-size: 13px;
`

const TooltipRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  margin-bottom: 4px;

  &:last-child {
    margin-bottom: 0;
  }

  svg {
    font-size: 14px;
  }
`

const Gradient = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  pointer-events: none;
  opacity: 0.15;
  background: radial-gradient(
    circle at 15% 15%,
    #3b82f6 0%,
    transparent 30%
  ),
  radial-gradient(
    circle at 85% 15%,
    #ef4444 0%,
    transparent 30%
  ),
  radial-gradient(
    circle at 50% 50%,
    #eab308 0%,
    transparent 30%
  ),
  radial-gradient(
    circle at 15% 85%,
    #22c55e 0%,
    transparent 30%
  ),
  radial-gradient(
    circle at 85% 85%,
    #f97316 0%,
    transparent 30%
  );
`

const Legend = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 15px 20px;
  backdrop-filter: blur(10px);
`

const LegendTitle = styled.div`
  font-weight: 600;
  margin-bottom: 12px;
  font-size: 14px;
`

const LegendItems = styled.div`
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
`

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
`

const LegendColor = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 4px;
  background: ${props => props.color};
  box-shadow: 0 2px 8px ${props => props.color}60;
`

export default HeatMap