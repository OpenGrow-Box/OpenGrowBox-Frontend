import { useState, useEffect } from 'react';
import styled from 'styled-components';
import ReactECharts from 'echarts-for-react';

import { useGlobalState } from '../Context/GlobalContext';
import { FaLeaf, FaTimes } from 'react-icons/fa';
import { formatDateTime, formatTime } from '../../misc/formatDateTime';

const LoadingIndicator = () => (
  <LoadingContainer>
    <div className="loading-spinner">
      <FaLeaf className="loading-icon" />
    </div>
    <LoadingText>Loading Grow Data...</LoadingText>
  </LoadingContainer>
);

const HistoryChart = ({ sensorId, onClose, minThreshold = 20, maxThreshold = 2500 }) => {
  
  const getDefaultDate = (offset = 0) => {
    const date = new Date(Date.now() + offset);
    const localISOTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    return localISOTime;
  };

  const [startDate, setStartDate] = useState(getDefaultDate(-24 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState(getDefaultDate());
  const [chartOptions, setChartOptions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedView, setSelectedView] = useState(() => {
    // Entfernt localStorage usage, verwendet stattdessen 'daily' als default
    return 'daily';
  });

  const { state } = useGlobalState();
  const srvAddr = state?.Conf?.hassServer;
  const token = state?.Conf?.haToken;

  useEffect(() => {
    if (selectedView === 'daily') {
      setStartDate(getDefaultDate(-24 * 60 * 60 * 1000));
    } else if (selectedView === 'weekly') {
      setStartDate(getDefaultDate(-7 * 24 * 60 * 60 * 1000));
    }
    setEndDate(getDefaultDate());
  }, [selectedView]);

  const fetchHistoryData = async () => {
    if (!startDate || !endDate) {
      setError('Bitte wählen Sie Start- und Enddatum aus.');
      return;
    }
    setError(null);
    setLoading(true);

    const url = `${srvAddr}/api/history/period/${encodeURIComponent(startDate)}?filter_entity_id=${sensorId}&end_time=${encodeURIComponent(endDate)}`;

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
      const data = await response.json();
      const sensorData = data && data.length > 0 ? data[0] : [];

      const xData = sensorData.map(item => item.last_changed);
      const yData = sensorData.map(item => parseFloat(item.state));

      // Elegante Farbpalette
      const colorScheme = {
        critical: '#FF6B6B',      // Warmes Rot für kritische Werte
        warning: '#4ECDC4',       // Türkis für hohe Werte
        optimal: '#45B7D1',       // Elegantes Blau für optimale Werte
        gradient: ['#667eea', '#764ba2'], // Verlauf für Linie
        area: 'rgba(69, 183, 209, 0.1)', // Transparenter Bereich
      };

      // Daten mit eleganten Farben formatieren
      const formattedData = yData.map(value => ({
        value,
        itemStyle: { 
          color: value < minThreshold 
            ? colorScheme.critical 
            : value > maxThreshold 
              ? colorScheme.warning 
              : colorScheme.optimal,
          borderColor: '#fff',
          borderWidth: 1,
          shadowColor: 'rgba(0,0,0,0.3)',
          shadowBlur: 4
        },
      }));

      setChartOptions({
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(26, 35, 53, 0.95)',
          borderColor: 'rgba(69, 183, 209, 0.5)',
          borderWidth: 1,
          borderRadius: 8,
          textStyle: { 
            color: '#E8F4FD',
            fontSize: 12,
            fontWeight: '500'
          },
          axisPointer: { 
            type: 'cross',
            lineStyle: {
              color: 'rgba(69, 183, 209, 0.6)',
              width: 1,
              type: 'dashed'
            }
          },
          formatter: params => {
            const point = params[0];
            const time = formatDateTime(point.axisValue);
            const status = point.data.value < minThreshold 
              ? 'Critical' 
              : point.data.value > maxThreshold 
                ? 'High' 
                : 'Optimal';
            
            return `
              <div style="padding: 8px;">
                <div style="color: #45B7D1; font-weight: 600; margin-bottom: 4px;">
                  📊 ${time}
                </div>
                <div style="color: #E8F4FD; margin-bottom: 2px;">
                  Wert: <span style="color: ${point.data.itemStyle.color}; font-weight: 600;">${point.data.value}</span>
                </div>
                <div style="color: #94A3B8; font-size: 11px;">
                  Status: ${status}
                </div>
              </div>
            `;
          }
        },
        grid: { 
          left: '3%', 
          right: '3%', 
          bottom: '12%', 
          top: '8%',
          containLabel: true 
        },
        xAxis: {
          type: 'category',
          data: xData,
          boundaryGap: false,
          axisLine: { 
            lineStyle: { 
              color: 'rgba(148, 163, 184, 0.3)',
              width: 1
            } 
          },
          axisTick: {
            lineStyle: { color: 'rgba(148, 163, 184, 0.2)' }
          },
          axisLabel: {
            color: '#94A3B8',
            fontSize: 11,
            fontWeight: '500',
            formatter: value =>
              formatTime(value)
          },
        },
        yAxis: {
          type: 'value',
          axisLine: { 
            lineStyle: { 
              color: 'rgba(148, 163, 184, 0.3)',
              width: 1
            } 
          },
          splitLine: { 
            lineStyle: { 
              color: 'rgba(148, 163, 184, 0.1)',
              type: 'dashed'
            } 
          },
          axisTick: {
            lineStyle: { color: 'rgba(148, 163, 184, 0.2)' }
          },
          axisLabel: { 
            color: '#94A3B8',
            fontSize: 11,
            fontWeight: '500'
          },
        },
        series: [{
          data: formattedData,
          type: 'line',
          smooth: true,
          smoothMonotone: 'x',
          lineStyle: {
            width: 3,
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 1, y2: 0,
              colorStops: [
                { offset: 0, color: colorScheme.gradient[0] },
                { offset: 1, color: colorScheme.gradient[1] }
              ]
            },
            shadowColor: 'rgba(69, 183, 209, 0.3)',
            shadowBlur: 8,
            shadowOffsetY: 2
          },
          symbol: 'circle',
          symbolSize: 6,
          itemStyle: {
            color: params => params.data.itemStyle.color,
            borderColor: params => params.data.itemStyle.borderColor,
            borderWidth: params => params.data.itemStyle.borderWidth,
            shadowColor: params => params.data.itemStyle.shadowColor,
            shadowBlur: params => params.data.itemStyle.shadowBlur
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(69, 183, 209, 0.3)' },
                { offset: 1, color: 'rgba(69, 183, 209, 0.05)' }
              ]
            }
          },
          emphasis: {
            focus: 'series',
            itemStyle: {
              shadowColor: 'rgba(69, 183, 209, 0.8)',
              shadowBlur: 12
            }
          }
        }],
      });

    } catch (err) {
      console.error(err);
      setError('Fehler beim Laden der Daten.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistoryData();
  }, [startDate, endDate, sensorId, srvAddr, token]); // Dependencies hinzugefügt

  return (
    <HistoryContainer>
      <Header>
        <HeaderTitle>📊 {sensorId}</HeaderTitle>
        <CloseButton onClick={onClose}>
          <FaTimes />
        </CloseButton>
      </Header>
      
      <ChartMenu>
        {[
          { key: 'daily', label: '24 Hours', icon: '📊' },
          { key: 'weekly', label: '7 Days', icon: '📈' }
        ].map(view => (
          <ViewButton
            key={view.key}
            $isActive={selectedView === view.key}
            onClick={() => setSelectedView(view.key)}
          >
            <span className="icon">{view.icon}</span>
            {view.label}
          </ViewButton>
        ))}
      </ChartMenu> 

      <DateInputs>
        <DateInputGroup>
          <DateLabel>Start</DateLabel>
          <DateInput 
            type="datetime-local" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)} 
          />
        </DateInputGroup>
        <DateInputGroup>
          <DateLabel>End</DateLabel>
          <DateInput 
            type="datetime-local" 
            value={endDate} 
            onChange={(e) => setEndDate(e.target.value)} 
          />
        </DateInputGroup>
      </DateInputs>

      <ChartContainer>
        {loading && <LoadingIndicator />} 
        {error && <ErrorMessage>⚠️ {error}</ErrorMessage>}
        {chartOptions && !loading && !error ? (
          <ReactECharts 
            option={chartOptions} 
            style={{ height: '100%', width: '100%' }} 
            opts={{ renderer: 'canvas' }}
          />
        ) : !loading && !error && (
          <PlaceholderMessage>
            <div className="placeholder-icon">📊</div>
            <div>Select Time</div>
          </PlaceholderMessage>
        )}
      </ChartContainer>
    </HistoryContainer>
  );
};

export default HistoryChart;

// Styled Components mit elegantem Design

const HistoryContainer = styled.div`
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #1a2332 0%, #2d3748 100%);
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  background: rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
`;

const HeaderTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #E8F4FD;
  margin: 0;
  background: linear-gradient(135deg, #45B7D1 0%, #96CEB4 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  @media (max-width: 768px) {
    font-size: 1.2rem;
  }
`;

const CloseButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94A3B8;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  
  &:hover {
    background: rgba(255, 107, 107, 0.2);
    color: #FF6B6B;
    transform: scale(1.1);
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

const ChartMenu = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  padding: 1rem 2rem;
  background: rgba(255, 255, 255, 0.02);
  flex-shrink: 0;
`;

const ViewButton = styled.button`
  background: ${props => props.$isActive 
    ? 'linear-gradient(135deg, #45B7D1 0%, #667eea 100%)' 
    : 'rgba(255, 255, 255, 0.05)'};
  color: ${props => props.$isActive ? '#fff' : '#94A3B8'};
  border: 1px solid ${props => props.$isActive ? 'transparent' : 'rgba(255, 255, 255, 0.1)'};
  border-radius: 12px;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  backdrop-filter: blur(10px);
  box-shadow: ${props => props.$isActive 
    ? '0 4px 15px rgba(69, 183, 209, 0.3)' 
    : 'none'};
  
  .icon {
    font-size: 1rem;
  }
  
  &:hover {
    background: ${props => props.$isActive 
      ? 'linear-gradient(135deg, #45B7D1 0%, #667eea 100%)' 
      : 'rgba(255, 255, 255, 0.1)'};
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(69, 183, 209, 0.2);
  }

  &:active {
    transform: translateY(0);
  }
`;

const DateInputs = styled.div`
  display: flex;
  justify-content: center;
  gap: 2rem;
  padding: 1rem 2rem;
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
    align-items: center;
  }
`;

const DateInputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: center;
`;

const DateLabel = styled.label`
  color: #94A3B8;
  font-weight: 600;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const DateInput = styled.input`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  color: #E8F4FD;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  
  &:focus {
    outline: none;
    border-color: #45B7D1;
    box-shadow: 0 0 0 3px rgba(69, 183, 209, 0.1);
    background: rgba(255, 255, 255, 0.08);
  }
  
  &::-webkit-calendar-picker-indicator {
    filter: invert(1);
    opacity: 0.7;
    cursor: pointer;
  }
`;

const ChartContainer = styled.div`
  flex: 1;
  padding: 1rem 2rem 2rem;
  position: relative;
  min-height: 300px;
  overflow: hidden;
`;

const LoadingContainer = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: #45B7D1;
  
  .loading-spinner {
    position: relative;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: linear-gradient(135deg, #45B7D1, #667eea);
    display: flex;
    align-items: center;
    justify-content: center;
    animation: spin 2s linear infinite;
    
    &::before {
      content: '';
      position: absolute;
      top: -4px;
      left: -4px;
      right: -4px;
      bottom: -4px;
      border-radius: 50%;
      background: linear-gradient(135deg, #45B7D1, #667eea);
      opacity: 0.3;
      animation: pulse 2s ease-in-out infinite;
    }
  }
  
  .loading-icon {
    font-size: 1.5rem;
    color: white;
    z-index: 1;
    animation: bounce 1s ease-in-out infinite alternate;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 0.3; }
    50% { transform: scale(1.1); opacity: 0.1; }
  }
  
  @keyframes bounce {
    from { transform: translateY(0); }
    to { transform: translateY(-4px); }
  }
`;

const LoadingText = styled.p`
  color: #94A3B8;
  font-weight: 500;
  margin: 0;
  font-size: 0.9rem;
`;

const ErrorMessage = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid rgba(255, 107, 107, 0.3);
  border-radius: 12px;
  padding: 1.5rem 2rem;
  color: #FF6B6B;
  text-align: center;
  font-weight: 500;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(255, 107, 107, 0.1);
  max-width: 300px;
`;

const PlaceholderMessage = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: #94A3B8;
  text-align: center;
  
  .placeholder-icon {
    font-size: 3rem;
    opacity: 0.5;
  }
  
  div:last-child {
    font-weight: 500;
    font-size: 1.1rem;
  }
`;