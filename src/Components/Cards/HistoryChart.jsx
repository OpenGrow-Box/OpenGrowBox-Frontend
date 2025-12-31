import { useState, useEffect } from 'react';
import styled from 'styled-components';
import ReactECharts from 'echarts-for-react';

import { useGlobalState } from '../Context/GlobalContext';
import { FaLeaf, FaTimes, FaChartLine, FaChartBar, FaExclamationTriangle, FaChartArea } from 'react-icons/fa';
import { formatDateTime, formatTime } from '../../misc/formatDateTime';
import { getThemeColor } from '../../utils/themeColors';

// Realistic color mapping functions based on sensor data
const getSensorType = (sensorId) => {
  const id = sensorId.toLowerCase();
  if (id.includes('temp') || id.includes('temperature')) return 'temperature';
  if (id.includes('humid') || id.includes('humidity')) return 'humidity';
  if (id.includes('vpd')) return 'vpd';
  if (id.includes('co2') || id.includes('carbon')) return 'co2';
  return 'default';
};

const getTemperatureColor = (value) => {
  if (value <= 10) return getThemeColor('--chart-primary-color'); // Very cold - theme blue
  if (value <= 15) return getThemeColor('--chart-primary-color'); // Cold - theme blue
  if (value <= 20) return getThemeColor('--chart-secondary-color'); // Cool - theme cyan
  if (value <= 25) return getThemeColor('--chart-success-color'); // Moderate - theme green
  if (value <= 28) return getThemeColor('--chart-warning-color'); // Warm - theme yellow
  if (value <= 32) return getThemeColor('--warning-text-color'); // Hot - theme orange
  return getThemeColor('--chart-error-color'); // Very hot - theme red
};

const getHumidityColor = (value) => {
  if (value <= 25) return getThemeColor('--chart-error-color'); // Very dry - theme red
  if (value <= 40) return getThemeColor('--warning-accent-color'); // Dry - theme orange
  if (value <= 55) return getThemeColor('--chart-warning-color'); // Moderate dry - theme yellow
  if (value <= 70) return getThemeColor('--chart-success-color'); // Comfortable - theme green
  if (value <= 85) return getThemeColor('--chart-success-color'); // Humid - theme green
  return getThemeColor('--chart-primary-color'); // Very humid - theme blue
};

const getVPDColor = (value) => {
  if (value <= 0.4) return getThemeColor('--chart-primary-color'); // Very low - theme blue
  if (value <= 0.8) return getThemeColor('--chart-secondary-color'); // Low - theme cyan
  if (value <= 1.2) return getThemeColor('--chart-success-color'); // Moderate - theme green
  if (value <= 1.6) return getThemeColor('--chart-warning-color'); // High - theme yellow
  if (value <= 2.0) return getThemeColor('--warning-text-color'); // Very high - theme orange
  return getThemeColor('--chart-error-color'); // Extreme - theme red
};

const getCO2Color = (value) => {
  if (value < 300) return getThemeColor('--sensor-co2-color'); // Very low - theme CO2 color
  if (value < 400) return getThemeColor('--chart-primary-color'); // Low - theme blue
  if (value < 600) return getThemeColor('--chart-secondary-color'); // Moderate - theme cyan
  if (value < 800) return getThemeColor('--chart-success-color'); // Good - theme green
  if (value < 1000) return getThemeColor('--chart-warning-color'); // High - theme yellow
  if (value < 1200) return getThemeColor('--warning-text-color'); // Very high - theme orange
  if (value < 1500) return getThemeColor('--chart-error-color'); // Too high - theme red
  return getThemeColor('--chart-error-color'); // Extremely high - theme red
};

const getSensorColor = (sensorType, value) => {
  switch (sensorType) {
    case 'temperature':
      return getTemperatureColor(value);
    case 'humidity':
      return getHumidityColor(value);
    case 'vpd':
      return getVPDColor(value);
    case 'co2':
      return getCO2Color(value);
    default:
      // Default gradient based on value range
      if (value < 20) return getThemeColor('--chart-primary-color');
      if (value < 40) return getThemeColor('--chart-success-color');
      if (value < 60) return getThemeColor('--chart-warning-color');
      if (value < 80) return getThemeColor('--warning-text-color');
      return getThemeColor('--chart-error-color');
  }
};

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

  // In dev mode, use Vite proxy. In production, use full URL
  const isDev = import.meta.env.DEV;
  
  const getApiUrl = (srvAddr) => {
    // In development, use relative URL to leverage Vite proxy
    if (isDev) {
      return ''; // Empty string means relative URL (/api/...)
    }
    
    if (!srvAddr) return '';
    
    try {
      let urlString = srvAddr;
      
      // Add protocol if missing
      if (!urlString.startsWith('http://') && !urlString.startsWith('https://')) {
        urlString = `http://${urlString}`;
      }
      
      const url = new URL(urlString);
      
      // If no port specified, add default HA port
      if (!url.port) {
        url.port = '8123';
      }
      
      return url.toString().replace(/\/$/, ''); // Remove trailing slash
    } catch (e) {
      console.error('Invalid server address:', srvAddr, e);
      return '';
    }
  };

  const apiBaseUrl = getApiUrl(srvAddr);

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

    // Build URL - in dev mode, use relative path for proxy
    const baseUrlPart = apiBaseUrl ? apiBaseUrl : '';
    const url = `${baseUrlPart}/api/history/period/${encodeURIComponent(startDate)}?filter_entity_id=${sensorId}&end_time=${encodeURIComponent(endDate)}`;
    console.log('HistoryChart fetching from:', url, 'isDev:', isDev);

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

       // Detect sensor type for realistic color mapping
       const sensorType = getSensorType(sensorId);

       // Daten mit realistischen, sensor-basierten Farben formatieren
       const formattedData = yData.map(value => {
         const color = getSensorColor(sensorType, value);
         return {
           value,
           itemStyle: {
             color: color,
            borderColor: getThemeColor('--main-text-color'),
             borderWidth: 2,
             shadowColor: color,
             shadowBlur: 6,
             shadowOffsetX: 0,
             shadowOffsetY: 2
           },
         };
       });

      setChartOptions({
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'axis',
          backgroundColor: getThemeColor('--main-bg-color') + 'F2',
          borderColor: getThemeColor('--chart-secondary-color') + '66',
          borderWidth: 1,
          borderRadius: 16,
          padding: [16, 20],
          textStyle: {
            color: getThemeColor('--main-text-color'),
            fontSize: 14,
            fontWeight: '500',
            lineHeight: 1.5
          },
          axisPointer: {
            type: 'cross',
            lineStyle: {
              color: getThemeColor('--chart-secondary-color') + '80',
              width: 2,
              type: 'solid'
            },
            crossStyle: {
              color: getThemeColor('--chart-secondary-color') + '4D',
              width: 1
            }
          },
            formatter: params => {
              const point = params[0];
              const time = formatDateTime(point.axisValue);
              const value = point.data.value;

              // Get realistic status based on sensor type
              let status = 'Normal';
              let statusColor = getThemeColor('--chart-success-color');

              switch (sensorType) {
                case 'temperature':
                  if (value <= 10) { status = 'Very Cold'; statusColor = getThemeColor('--chart-primary-color'); }
                  else if (value <= 15) { status = 'Cold'; statusColor = getThemeColor('--chart-primary-color'); }
                  else if (value <= 20) { status = 'Cool'; statusColor = getThemeColor('--chart-secondary-color'); }
                  else if (value <= 25) { status = 'Moderate'; statusColor = getThemeColor('--chart-success-color'); }
                  else if (value <= 28) { status = 'Warm'; statusColor = getThemeColor('--chart-warning-color'); }
                  else if (value <= 32) { status = 'Hot'; statusColor = getThemeColor('--warning-text-color'); }
                  else { status = 'Very Hot'; statusColor = getThemeColor('--chart-error-color'); }
                  break;
                case 'humidity':
                  if (value <= 25) { status = 'Very Dry'; statusColor = getThemeColor('--chart-error-color'); }
                  else if (value <= 40) { status = 'Dry'; statusColor = getThemeColor('--warning-accent-color'); }
                  else if (value <= 55) { status = 'Moderate'; statusColor = getThemeColor('--chart-warning-color'); }
                  else if (value <= 70) { status = 'Comfortable'; statusColor = getThemeColor('--chart-success-color'); }
                  else if (value <= 85) { status = 'Humid'; statusColor = getThemeColor('--chart-success-color'); }
                  else { status = 'Very Humid'; statusColor = getThemeColor('--chart-primary-color'); }
                  break;
                case 'vpd':
                  if (value <= 0.4) { status = 'Very Low'; statusColor = getThemeColor('--chart-primary-color'); }
                  else if (value <= 0.8) { status = 'Low'; statusColor = getThemeColor('--chart-secondary-color'); }
                  else if (value <= 1.2) { status = 'Moderate'; statusColor = getThemeColor('--chart-success-color'); }
                  else if (value <= 1.6) { status = 'High'; statusColor = getThemeColor('--chart-warning-color'); }
                  else if (value <= 2.0) { status = 'Very High'; statusColor = getThemeColor('--warning-text-color'); }
                  else { status = 'Extreme'; statusColor = getThemeColor('--chart-error-color'); }
                  break;
                case 'co2':
                  if (value < 300) { status = 'Very Low'; statusColor = getThemeColor('--sensor-co2-color'); }
                  else if (value < 400) { status = 'Low'; statusColor = getThemeColor('--chart-primary-color'); }
                  else if (value < 600) { status = 'Moderate'; statusColor = getThemeColor('--chart-secondary-color'); }
                  else if (value < 800) { status = 'Good'; statusColor = getThemeColor('--chart-success-color'); }
                  else if (value < 1000) { status = 'High'; statusColor = getThemeColor('--chart-warning-color'); }
                  else if (value < 1200) { status = 'Very High'; statusColor = getThemeColor('--warning-text-color'); }
                  else if (value < 1500) { status = 'Too High'; statusColor = getThemeColor('--chart-error-color'); }
                  else { status = 'Critical'; statusColor = getThemeColor('--chart-error-color'); }
                  break;
                default:
                  status = 'Normal';
                  statusColor = getThemeColor('--chart-success-color');
              }

              return `
                <div style="padding: 8px 0;">
                  <div style="color: ${getThemeColor('--chart-success-color')}; font-weight: 700; font-size: 16px; margin-bottom: 16px; display: flex; align-items: center; gap: 12px;">
                    <span style="font-size: 18px;">📊</span>
                    ${time}
                  </div>
                  <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 12px;">
                    <span style="color: ${getThemeColor('--placeholder-text-color')}; font-weight: 500; min-width: 50px;">Value:</span>
                    <span style="color: ${point.data.itemStyle.color}; font-weight: 700; font-size: 16px;">${value}</span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 16px;">
                    <span style="color: ${getThemeColor('--muted-text-color')}; font-size: 13px; font-weight: 500; min-width: 50px;">Status:</span>
                    <span style="color: ${statusColor}; font-weight: 600; font-size: 13px; background: rgba(255,255,255,0.1); padding: 4px 12px; border-radius: 12px;">${status}</span>
                  </div>
                </div>
              `;
            }
        },
        grid: {
          left: '4%',
          right: '4%',
          bottom: '15%',
          top: '10%',
          containLabel: true,
          backgroundColor: 'transparent',
          borderWidth: 0
        },
        xAxis: {
          type: 'category',
          data: xData,
          boundaryGap: false,
          axisLine: {
            show: false
          },
          axisTick: {
            show: false
          },
          axisLabel: {
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: 12,
            fontWeight: '600',
            margin: 16,
            formatter: value => formatTime(value)
          },
          splitLine: {
            show: true,
            lineStyle: {
              color: 'rgba(255, 255, 255, 0.08)',
              type: 'solid',
              width: 1
            }
          }
        },
        yAxis: {
          type: 'value',
          axisLine: {
            show: false
          },
          axisTick: {
            show: false
          },
          splitLine: {
            lineStyle: {
              color: 'rgba(255, 255, 255, 0.08)',
              type: 'solid',
              width: 1
            }
          },
          axisLabel: {
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: 12,
            fontWeight: '600'
          }
        },
        series: [{
          data: formattedData,
          type: 'line',
          smooth: true,
          smoothMonotone: 'x',
          animationDuration: 2000,
          animationEasing: 'cubicOut',
          lineStyle: {
            width: 4,
            color: (() => {
              // Create dynamic gradient based on sensor type
              switch (sensorType) {
                case 'temperature':
                  return {
                    type: 'linear',
                    x: 0, y: 0, x2: 1, y2: 0,
                    colorStops: [
                      { offset: 0, color: getThemeColor('--chart-primary-color') }, // Cold blue
                      { offset: 0.3, color: getThemeColor('--chart-primary-color') }, // Blue
                      { offset: 0.6, color: getThemeColor('--chart-success-color') }, // Green
                      { offset: 1, color: getThemeColor('--chart-error-color') } // Hot red
                    ]
                  };
                case 'humidity':
                  return {
                    type: 'linear',
                    x: 0, y: 0, x2: 1, y2: 0,
                    colorStops: [
                      { offset: 0, color: getThemeColor('--chart-error-color') }, // Dry red
                      { offset: 0.4, color: getThemeColor('--chart-warning-color') }, // Yellow
                      { offset: 0.7, color: getThemeColor('--chart-success-color') }, // Green
                      { offset: 1, color: getThemeColor('--chart-primary-color') } // Humid blue
                    ]
                  };
                case 'vpd':
                  return {
                    type: 'linear',
                    x: 0, y: 0, x2: 1, y2: 0,
                    colorStops: [
                      { offset: 0, color: getThemeColor('--chart-primary-color') }, // Low VPD blue
                      { offset: 0.5, color: getThemeColor('--chart-success-color') }, // Moderate green
                      { offset: 1, color: getThemeColor('--chart-error-color') } // High VPD red
                    ]
                  };
                case 'co2':
                  return {
                    type: 'linear',
                    x: 0, y: 0, x2: 1, y2: 0,
                    colorStops: [
                      { offset: 0, color: getThemeColor('--sensor-co2-color') }, // Very low - purple
                      { offset: 0.2, color: getThemeColor('--chart-primary-color') }, // Low - blue
                      { offset: 0.4, color: getThemeColor('--chart-success-color') }, // Good - green
                      { offset: 0.6, color: getThemeColor('--chart-warning-color') }, // High - yellow
                      { offset: 0.8, color: getThemeColor('--warning-text-color') }, // Very high - orange
                      { offset: 1, color: getThemeColor('--chart-error-color') } // Too high - red
                    ]
                  };
                default:
                  return {
                    type: 'linear',
                    x: 0, y: 0, x2: 1, y2: 0,
                    colorStops: [
                      { offset: 0, color: getThemeColor('--chart-success-color') },
                      { offset: 0.5, color: getThemeColor('--main-arrow-up') },
                      { offset: 1, color: getThemeColor('--cannabis-active-color') }
                    ]
                  };
              }
            })(),
            shadowColor: (sensorType === 'temperature' ? 'rgba(59, 130, 246, 0.6)' :
                         sensorType === 'humidity' ? 'rgba(59, 130, 246, 0.6)' :
                         sensorType === 'vpd' ? 'rgba(239, 68, 68, 0.6)' :
                         sensorType === 'co2' ? 'rgba(139, 92, 246, 0.6)' :
                         'rgba(74, 222, 128, 0.6)'),
            shadowBlur: 16,
            shadowOffsetY: 4
          },
          symbol: 'circle',
          symbolSize: 8,
          itemStyle: {
            color: params => params.data.itemStyle.color,
            borderColor: '#ffffff',
            borderWidth: 2,
            shadowColor: params => params.data.itemStyle.shadowColor,
            shadowBlur: 8,
            shadowOffsetX: 0,
            shadowOffsetY: 2
          },
          areaStyle: {
            color: (() => {
              switch (sensorType) {
                case 'temperature':
                  return {
                    type: 'linear',
                    x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: [
                      { offset: 0, color: 'rgba(59, 130, 246, 0.25)' },
                      { offset: 0.4, color: 'rgba(16, 185, 129, 0.15)' },
                      { offset: 0.8, color: 'rgba(239, 68, 68, 0.08)' },
                      { offset: 1, color: 'rgba(239, 68, 68, 0.02)' }
                    ]
                  };
                case 'humidity':
                  return {
                    type: 'linear',
                    x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: [
                      { offset: 0, color: 'rgba(239, 68, 68, 0.25)' },
                      { offset: 0.4, color: 'rgba(234, 179, 8, 0.15)' },
                      { offset: 0.7, color: 'rgba(16, 185, 129, 0.08)' },
                      { offset: 1, color: 'rgba(59, 130, 246, 0.02)' }
                    ]
                  };
                case 'vpd':
                  return {
                    type: 'linear',
                    x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: [
                      { offset: 0, color: 'rgba(59, 130, 246, 0.25)' },
                      { offset: 0.5, color: 'rgba(16, 185, 129, 0.15)' },
                      { offset: 1, color: 'rgba(239, 68, 68, 0.02)' }
                    ]
                  };
                case 'co2':
                  return {
                    type: 'linear',
                    x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: [
                      { offset: 0, color: 'rgba(139, 92, 246, 0.25)' }, // Purple
                      { offset: 0.2, color: 'rgba(59, 130, 246, 0.2)' }, // Blue
                      { offset: 0.4, color: 'rgba(16, 185, 129, 0.15)' }, // Green
                      { offset: 0.6, color: 'rgba(234, 179, 8, 0.1)' }, // Yellow
                      { offset: 0.8, color: 'rgba(245, 158, 11, 0.08)' }, // Orange
                      { offset: 1, color: 'rgba(239, 68, 68, 0.02)' } // Red
                    ]
                  };
                default:
                  return {
                    type: 'linear',
                    x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: [
                      { offset: 0, color: 'rgba(74, 222, 128, 0.25)' },
                      { offset: 0.4, color: 'rgba(34, 197, 94, 0.15)' },
                      { offset: 0.8, color: 'rgba(22, 163, 74, 0.08)' },
                      { offset: 1, color: 'rgba(21, 128, 61, 0.02)' }
                    ]
                  };
              }
            })()
          },
            emphasis: {
              focus: 'series',
              lineStyle: {
                width: 6,
                shadowBlur: 20,
                shadowColor: (sensorType === 'temperature' ? 'rgba(59, 130, 246, 0.9)' :
                             sensorType === 'humidity' ? 'rgba(59, 130, 246, 0.9)' :
                             sensorType === 'vpd' ? 'rgba(239, 68, 68, 0.9)' :
                             sensorType === 'co2' ? 'rgba(139, 92, 246, 0.9)' :
                             'rgba(74, 222, 128, 0.9)')
              },
            itemStyle: {
              shadowColor: (sensorType === 'temperature' ? 'rgba(59, 130, 246, 0.9)' :
                           sensorType === 'humidity' ? 'rgba(59, 130, 246, 0.9)' :
                           sensorType === 'vpd' ? 'rgba(239, 68, 68, 0.9)' :
                           sensorType === 'co2' ? 'rgba(139, 92, 246, 0.9)' :
                           'rgba(74, 222, 128, 0.9)'),
              shadowBlur: 16,
              borderWidth: 3
            },
            areaStyle: {
              opacity: 0.9
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
         <HeaderTitle><FaChartLine size={20} /> {sensorId}</HeaderTitle>
         <CloseButton onClick={onClose}>
           <FaTimes />
         </CloseButton>
       </Header>
      
       <ChartMenu>
         {[
           { key: 'daily', label: '24 Hours', icon: <FaChartBar size={16} /> },
           { key: 'weekly', label: '7 Days', icon: <FaChartLine size={16} /> }
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
         {error && <ErrorMessage><FaExclamationTriangle size={16} /> {error}</ErrorMessage>}
        {chartOptions && !loading && !error ? (
          <ReactECharts 
            option={chartOptions} 
            style={{ height: '100%', width: '100%' }} 
            opts={{ renderer: 'canvas' }}
          />
        ) : !loading && !error && (
           <PlaceholderMessage>
             <div className="placeholder-icon"><FaChartArea size={48} /></div>
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
  background: linear-gradient(135deg,
    rgba(26, 35, 50, 0.95) 0%,
    rgba(45, 55, 72, 0.95) 50%,
    rgba(26, 35, 50, 0.95) 100%
  );
  backdrop-filter: blur(20px);
  border-radius: 20px;
  box-shadow:
    0 25px 50px rgba(0, 0, 0, 0.25),
    0 10px 25px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  overflow: hidden;
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.1);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg,
      rgba(102, 126, 234, 0.8) 0%,
      rgba(118, 75, 162, 0.8) 50%,
      rgba(236, 72, 153, 0.8) 100%
    );
    border-radius: 20px 20px 0 0;
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg,
      transparent 0%,
      rgba(102, 126, 234, 0.03) 50%,
      transparent 100%
    );
    animation: containerShimmer 12s ease-in-out infinite;
    pointer-events: none;
    z-index: 0;
  }

  @keyframes containerShimmer {
    0%, 100% { left: -100%; }
    50% { left: 100%; }
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2rem 2.5rem;
  background: linear-gradient(135deg,
    rgba(255, 255, 255, 0.08) 0%,
    rgba(255, 255, 255, 0.04) 100%
  );
  backdrop-filter: blur(15px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  flex-shrink: 0;
  position: relative;
  z-index: 2;

  @media (max-width: 768px) {
    padding: 1.5rem 2rem;
  }

  @media (max-width: 640px) {
    padding: 1.25rem 1.5rem;
  }
`;

const HeaderTitle = styled.h2`
  font-size: 1.75rem;
  font-weight: 800;
  color: #E8F4FD;
  margin: 0;
  background: linear-gradient(135deg, #45B7D1 0%, #96CEB4 50%, #667eea 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  letter-spacing: -0.025em;
  line-height: 1.2;

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }

  @media (max-width: 640px) {
    font-size: 1.375rem;
    gap: 0.5rem;
  }
`;

const CloseButton = styled.button`
  background: linear-gradient(135deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.05) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94A3B8;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    background: rgba(255, 107, 107, 0.2);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    transition: width 0.3s ease, height 0.3s ease;
  }

  &:hover {
    background: linear-gradient(135deg,
      rgba(255, 107, 107, 0.15) 0%,
      rgba(239, 68, 68, 0.1) 100%
    );
    border-color: rgba(255, 107, 107, 0.3);
    color: #FF6B6B;
    transform: translateY(-2px) scale(1.05);
    box-shadow: 0 8px 25px rgba(255, 107, 107, 0.2);

    &::before {
      width: 100%;
      height: 100%;
    }
  }

  &:active {
    transform: translateY(0) scale(0.95);
  }

  @media (max-width: 640px) {
    width: 40px;
    height: 40px;
  }
`;

const ChartMenu = styled.div`
  display: flex;
  justify-content: center;
  gap: 1.25rem;
  padding: 1.5rem 2.5rem;
  background: linear-gradient(135deg,
    rgba(255, 255, 255, 0.06) 0%,
    rgba(255, 255, 255, 0.03) 100%
  );
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
  position: relative;
  z-index: 2;

  @media (max-width: 768px) {
    padding: 1.25rem 2rem;
    gap: 1rem;
  }

  @media (max-width: 640px) {
    padding: 1rem 1.5rem;
    gap: 0.75rem;
  }
`;

const ViewButton = styled.button`
  background: ${props => props.$isActive
    ? 'linear-gradient(135deg, #45B7D1 0%, #667eea 50%, #764ba2 100%)'
    : 'transparent'
  };
  color: ${props => props.$isActive ? '#ffffff' : '#94A3B8'};
  border: 1px solid ${props => props.$isActive
    ? 'rgba(69, 183, 209, 0.3)'
    : 'rgba(255, 255, 255, 0.15)'
  };
  border-radius: 16px;
  padding: 0.875rem 1.75rem;
  cursor: pointer;
  font-weight: 700;
  font-size: 0.9rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
  letter-spacing: 0.025em;
  text-transform: uppercase;

  ${props => props.$isActive && `
    box-shadow:
      0 4px 15px rgba(69, 183, 209, 0.3),
      0 2px 8px rgba(102, 126, 234, 0.2);
  `}

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.2) 50%,
      transparent 100%
    );
    transition: left 0.5s ease;
  }

  .icon {
    font-size: 1.125rem;
    transition: transform 0.3s ease;
  }

  &:hover {
    background: ${props => props.$isActive
      ? 'linear-gradient(135deg, #22d3ee 0%, #3b82f6 50%, #8b5cf6 100%)'
      : 'rgba(255, 255, 255, 0.08)'
    };
    border-color: ${props => props.$isActive
      ? 'rgba(34, 211, 238, 0.4)'
      : 'rgba(255, 255, 255, 0.25)'
    };
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(69, 183, 209, 0.25);

    .icon {
      transform: scale(1.1);
    }

    &::before {
      left: 100%;
    }
  }

  &:active {
    transform: translateY(-1px);
    box-shadow: 0 4px 15px rgba(69, 183, 209, 0.2);
  }

  @media (max-width: 640px) {
    padding: 0.75rem 1.25rem;
    font-size: 0.825rem;
    gap: 0.5rem;

    .icon {
      font-size: 1rem;
    }
  }
`;

const DateInputs = styled.div`
  display: flex;
  justify-content: center;
  gap: 2.5rem;
  padding: 1.5rem 2.5rem;
  background: linear-gradient(135deg,
    rgba(255, 255, 255, 0.05) 0%,
    rgba(255, 255, 255, 0.02) 100%
  );
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
  position: relative;
  z-index: 2;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1.5rem;
    align-items: center;
    padding: 1.25rem 2rem;
  }

  @media (max-width: 640px) {
    gap: 1.25rem;
    padding: 1rem 1.5rem;
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
  background: linear-gradient(135deg,
    rgba(255, 255, 255, 0.08) 0%,
    rgba(255, 255, 255, 0.04) 100%
  );
  backdrop-filter: blur(12px);
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: 0.875rem 1.125rem;
  color: #E8F4FD;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  &:focus {
    outline: none;
    border-color: rgba(69, 183, 209, 0.5);
    background: linear-gradient(135deg,
      rgba(255, 255, 255, 0.12) 0%,
      rgba(255, 255, 255, 0.08) 100%
    );
    box-shadow:
      0 0 0 3px rgba(69, 183, 209, 0.15),
      0 4px 16px rgba(0, 0, 0, 0.15);
    transform: translateY(-1px);
  }

  &:hover {
    border-color: rgba(255, 255, 255, 0.25);
    background: linear-gradient(135deg,
      rgba(255, 255, 255, 0.1) 0%,
      rgba(255, 255, 255, 0.06) 100%
    );
  }

  &::-webkit-calendar-picker-indicator {
    filter: invert(1) brightness(0.8);
    opacity: 0.8;
    cursor: pointer;
    transition: opacity 0.2s ease;

    &:hover {
      opacity: 1;
    }
  }

  &::placeholder {
    color: rgba(232, 244, 253, 0.6);
    font-weight: 400;
  }

  @media (max-width: 640px) {
    padding: 0.75rem 1rem;
    font-size: 16px; /* Prevents zoom on iOS */
  }
`;

const ChartContainer = styled.div`
  flex: 1;
  padding: 2rem 2.5rem 3rem;
  position: relative;
  min-height: 350px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.02);
  backdrop-filter: blur(8px);

  @media (max-width: 768px) {
    padding: 1.5rem 2rem 2.5rem;
    min-height: 300px;
  }

  @media (max-width: 640px) {
    padding: 1.25rem 1.5rem 2rem;
    min-height: 280px;
  }
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
  background: linear-gradient(135deg,
    rgba(255, 107, 107, 0.15) 0%,
    rgba(239, 68, 68, 0.1) 100%
  );
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 107, 107, 0.3);
  border-radius: 16px;
  padding: 2rem 2.5rem;
  color: #FF6B6B;
  text-align: center;
  font-weight: 600;
  font-size: 1rem;
  box-shadow:
    0 12px 32px rgba(255, 107, 107, 0.15),
    0 4px 16px rgba(255, 107, 107, 0.1);
  max-width: 320px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  animation: errorPulse 0.5s ease-out;

  @keyframes errorPulse {
    0% {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.9);
    }
    100% {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
  }

  @media (max-width: 640px) {
    padding: 1.5rem 2rem;
    max-width: 280px;
    font-size: 0.9rem;
  }
`;

const PlaceholderMessage = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  color: #94A3B8;
  text-align: center;
  animation: placeholderFadeIn 0.6s ease-out;

  .placeholder-icon {
    font-size: 4rem;
    opacity: 0.6;
    color: #64748b;
    filter: drop-shadow(0 4px 12px rgba(100, 116, 139, 0.2));
    animation: placeholderFloat 3s ease-in-out infinite;
  }

  div:last-child {
    font-weight: 600;
    font-size: 1.25rem;
    color: #cbd5e1;
    letter-spacing: 0.025em;
  }

  @keyframes placeholderFadeIn {
    from {
      opacity: 0;
      transform: translate(-50%, -50%) translateY(20px);
    }
    to {
      opacity: 1;
      transform: translate(-50%, -50%) translateY(0);
    }
  }

  @keyframes placeholderFloat {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-8px);
    }
  }

  @media (max-width: 640px) {
    gap: 1.25rem;

    .placeholder-icon {
      font-size: 3rem;
    }

    div:last-child {
      font-size: 1.1rem;
    }
  }
`;