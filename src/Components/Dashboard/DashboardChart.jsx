import { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import ReactECharts from 'echarts-for-react';
import { useGlobalState } from '../Context/GlobalContext';
import { useHomeAssistant } from '../Context/HomeAssistantContext';
import { formatTime, formatDateTime } from '../../misc/formatDateTime';
import { getThemeColor } from '../../utils/themeColors';
import { FaLeaf, FaExclamationTriangle, FaSpinner } from 'react-icons/fa';

// Sensor type detection and gradient functions
const getSensorType = (sensorId) => {
  const id = sensorId.toLowerCase();
  if (id.includes('temp') || id.includes('temperature')) return 'temperature';
  if (id.includes('humid') || id.includes('humidity')) return 'humidity';
  if (id.includes('vpd')) return 'vpd';
  if (id.includes('co2') || id.includes('carbon')) return 'co2';
  return 'default';
};

const getSensorGradient = (sensorType) => {
  // Clean, single-color gradients per sensor type
  switch (sensorType) {
    case 'temperature':
      return [
        { offset: 0, color: '#f97316' },  // Orange
        { offset: 1, color: '#ea580c' }   // Darker orange
      ];
    case 'humidity':
      return [
        { offset: 0, color: '#3b82f6' },  // Blue
        { offset: 1, color: '#2563eb' }   // Darker blue
      ];
    case 'vpd':
      return [
        { offset: 0, color: '#22c55e' },  // Green
        { offset: 1, color: '#16a34a' }   // Darker green
      ];
    case 'co2':
      return [
        { offset: 0, color: '#a855f7' },  // Purple
        { offset: 1, color: '#9333ea' }   // Darker purple
      ];
    default:
      return [
        { offset: 0, color: '#22c55e' },  // Green
        { offset: 1, color: '#16a34a' }   // Darker green
      ];
  }
};

const SensorChart = ({ 
  sensorId, 
  minThreshold = 0, 
  maxThreshold = 2500, 
  title = 'Sensor Trends (24h)', 
  unit = '', 
  priority = 'medium',
  sensorOptions = null,
  selectedSensorIndex = 0,
  onSensorChange = null
}) => {
  const getDefaultDate = (offset = 0) => {
    const date = new Date(Date.now() + offset);
    const localISOTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    return localISOTime;
  };

  const { state } = useGlobalState();
  const srvAddr = state?.Conf?.hassServer;
  const accessToken = state?.Conf?.haToken;

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

  const [startDate, setStartDate] = useState(getDefaultDate());
  const [endDate, setEndDate] = useState(getDefaultDate());
  const [chartOptions, setChartOptions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedView, setSelectedView] = useState(() => localStorage.getItem('selectedView') || '12h');

  // Handler für View-Änderung
  const handleViewChange = (view) => {
    setSelectedView(view);
    localStorage.setItem('selectedView', view);
  };

  // Aktualisiere startDate und endDate, wenn der View geändert wird.
  useEffect(() => {
    if (selectedView === 'Live') {
      setStartDate(getDefaultDate());
    } else if (selectedView === '12h') {
      setStartDate(getDefaultDate(-12 * 60 * 60 * 1000));
    } else if (selectedView === 'daily') {
      setStartDate(getDefaultDate(-24 * 60 * 60 * 1000));
    } else if (selectedView === 'weekly') {
      setStartDate(getDefaultDate(-7 * 24 * 60 * 60 * 1000));
    }
    setEndDate(getDefaultDate());
  }, [selectedView]);

  // Im Live-Modus: Aktualisiere endDate regelmäßig ohne den Ladezustand (wenn bereits Chart-Daten vorhanden sind).
  useEffect(() => {
    if (selectedView !== 'Live') return;

    const interval = setInterval(() => {
      setEndDate(getDefaultDate());
    }, 5000); // Aktualisierung alle 5 Sekunden, anpassbar.

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [selectedView]);

  // Hole die historischen Daten.
  useEffect(() => {
    const fetchHistoryData = async () => {
      // Validate required parameters - in dev mode we don't need apiBaseUrl (using proxy)
      if ((!isDev && !apiBaseUrl) || !accessToken || !sensorId) {
        setError('Home Assistant connection not configured or sensor ID missing');
        setLoading(false);
        return;
      }

      // Nur laden anzeigen, wenn nicht im Live-Modus mit bereits geladenen Daten.
      if (selectedView !== 'Live' || !chartOptions) {
        setLoading(true);
      }
      setError(null);
      try {
        // Build URL - in dev mode, use relative path for proxy
        const baseUrlPart = apiBaseUrl ? apiBaseUrl : '';
        const url = `${baseUrlPart}/api/history/period/${encodeURIComponent(startDate)}?filter_entity_id=${sensorId}&end_time=${encodeURIComponent(endDate)}`;
        console.log('Fetching history data from:', url, 'isDev:', isDev, 'apiBaseUrl:', apiBaseUrl);
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();

        // Handle empty data gracefully - show "No Data Available" instead of error
        if (!Array.isArray(data) || data.length === 0) {
          setChartOptions(null); // Triggers "No Data Available" UI
          return;
        }

        const sensorData = data[0];
        if (!Array.isArray(sensorData) || sensorData.length === 0) {
          setChartOptions(null); // Triggers "No Data Available" UI
          return;
        }

        // Validate data structure and filter out invalid entries
        const validData = sensorData.filter(item =>
          item && item.last_changed && typeof item.state !== 'undefined' && !isNaN(parseFloat(item.state))
        );

        if (validData.length === 0) {
          setChartOptions(null); // Triggers "No Data Available" UI
          return;
        }

        const xData = validData.map(item => new Date(item.last_changed).toISOString());
        const yData = validData.map(item => parseFloat(item.state));
        
        // Detect sensor type for realistic color mapping
        const sensorType = getSensorType(sensorId);

        setChartOptions({
          backgroundColor: 'transparent',
          tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderColor: 'rgba(79, 195, 247, 0.3)',
            borderWidth: 1,
            borderRadius: 8,
            textStyle: {
              color: getThemeColor('--main-text-color'),
              fontSize: 13,
              fontWeight: 500
            },
            axisPointer: {
              type: 'cross',
              crossStyle: {
                color: 'rgba(79, 195, 247, 0.5)',
                width: 1
              },
              lineStyle: {
                color: 'rgba(79, 195, 247, 0.3)',
                width: 1
              }
            },
            formatter: params => {
              const point = params[0];
              const time = formatTime(point.axisValue);
              const value = point.data;

              // Get realistic status based on sensor type
              let status = 'Normal';
              let statusColor = '#10b981';

              switch (sensorType) {
                case 'temperature':
                  if (value <= 10) { status = 'Very Cold'; statusColor = '#2563eb'; } // Deep blue
                  else if (value <= 15) { status = 'Cold'; statusColor = '#3b82f6'; } // Blue
                  else if (value <= 20) { status = 'Cool'; statusColor = '#06b6d4'; } // Cyan
                  else if (value <= 25) { status = 'Moderate'; statusColor = '#10b981'; } // Green
                  else if (value <= 28) { status = 'Warm'; statusColor = '#eab308'; } // Yellow
                  else if (value <= 32) { status = 'Hot'; statusColor = '#f59e0b'; } // Orange
                  else { status = 'Very Hot'; statusColor = '#ef4444'; } // Red
                  break;
                case 'humidity':
                  if (value <= 25) { status = 'Very Dry'; statusColor = '#ef4444'; }
                  else if (value <= 40) { status = 'Dry'; statusColor = '#f97316'; }
                  else if (value <= 55) { status = 'Moderate'; statusColor = '#eab308'; }
                  else if (value <= 70) { status = 'Comfortable'; statusColor = '#84cc16'; }
                  else if (value <= 85) { status = 'Humid'; statusColor = '#10b981'; }
                  else { status = 'Very Humid'; statusColor = '#3b82f6'; }
                  break;
                case 'vpd':
                  if (value <= 0.4) { status = 'Very Low'; statusColor = '#3b82f6'; }
                  else if (value <= 0.8) { status = 'Low'; statusColor = '#06b6d4'; }
                  else if (value <= 1.2) { status = 'Moderate'; statusColor = '#10b981'; }
                  else if (value <= 1.6) { status = 'High'; statusColor = '#eab308'; }
                  else if (value <= 2.0) { status = 'Very High'; statusColor = '#f59e0b'; }
                  else { status = 'Extreme'; statusColor = '#ef4444'; }
                  break;
                case 'co2':
                  if (value < 300) { status = 'Very Low'; statusColor = '#8b5cf6'; }
                  else if (value < 400) { status = 'Low'; statusColor = '#3b82f6'; }
                  else if (value < 600) { status = 'Moderate'; statusColor = '#06b6d4'; }
                  else if (value < 800) { status = 'Good'; statusColor = '#10b981'; }
                  else if (value < 1000) { status = 'High'; statusColor = '#eab308'; }
                  else if (value < 1200) { status = 'Very High'; statusColor = '#f59e0b'; }
                  else if (value < 1500) { status = 'Too High'; statusColor = '#ef4444'; }
                  else { status = 'Critical'; statusColor = '#b91c1c'; }
                  break;
                default:
                  status = 'Normal';
                  statusColor = '#10b981';
              }

              return `
                <div style="color: ${getThemeColor('--main-text-color')}; font-size: 13px; line-height: 1.6;">
                  <div style="color: ${getThemeColor('--chart-success-color')}; font-weight: 700; font-size: 14px; margin-bottom: 8px;">${time}</div>
                  <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 6px;">
                    <span style="color: ${getThemeColor('--chart-secondary-color')}; font-size: 16px;">●</span>
                    <span style="font-weight: 500;">${point.seriesName}:</span>
                    <span style="color: ${getThemeColor('--chart-success-color')}; font-weight: 700; font-size: 14px;">${value}${unit}</span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="color: ${getThemeColor('--placeholder-text-color')}; font-size: 12px;">Status:</span>
                    <span style="color: ${statusColor}; font-weight: 600; font-size: 12px; background: var(--glass-bg-primary); padding: 2px 8px; border-radius: 10px;">${status}</span>
                  </div>
                </div>
              `;
            }
          },
          grid: {
            left: '6%',
            right: '4%',
            bottom: '12%',
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
              fontSize: 11,
              fontWeight: 500,
              margin: 12,
              formatter: value => {
                const date = formatDateTime(value);
                return date;
              }
            },
            splitLine: {
              show: true,
              lineStyle: {
                color: 'var(--glass-bg-primary)',
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
                color: 'var(--glass-bg-primary)',
                type: 'solid',
                width: 1
              }
            },
            axisLabel: {
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: 11,
              fontWeight: 500
            }
          },
          series: [{
            name: title.replace(' (24h)', ''),
            data: yData,
            type: 'line',
            smooth: true,
            smoothMonotone: 'x',
            animationDuration: 1500,
            animationEasing: 'cubicOut',
            lineStyle: {
              width: 3,
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 1,
                y2: 0,
                colorStops: getSensorGradient(sensorType)
              },
              shadowColor: (sensorType === 'temperature' ? 'rgba(249, 115, 22, 0.5)' :
                           sensorType === 'humidity' ? 'rgba(59, 130, 246, 0.5)' :
                           sensorType === 'vpd' ? 'rgba(34, 197, 94, 0.5)' :
                           sensorType === 'co2' ? 'rgba(168, 85, 247, 0.5)' :
                           'rgba(34, 197, 94, 0.5)'),
              shadowBlur: 12,
              shadowOffsetY: 3
            },
            symbol: 'none',
            areaStyle: {
              color: (() => {
                // Clean, single-color area fills matching the line color
                switch (sensorType) {
                  case 'temperature':
                    return {
                      type: 'linear',
                      x: 0, y: 0, x2: 0, y2: 1,
                      colorStops: [
                        { offset: 0, color: 'rgba(249, 115, 22, 0.3)' },
                        { offset: 0.5, color: 'rgba(249, 115, 22, 0.15)' },
                        { offset: 1, color: 'rgba(249, 115, 22, 0.02)' }
                      ]
                    };
                  case 'humidity':
                    return {
                      type: 'linear',
                      x: 0, y: 0, x2: 0, y2: 1,
                      colorStops: [
                        { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
                        { offset: 0.5, color: 'rgba(59, 130, 246, 0.15)' },
                        { offset: 1, color: 'rgba(59, 130, 246, 0.02)' }
                      ]
                    };
                  case 'vpd':
                    return {
                      type: 'linear',
                      x: 0, y: 0, x2: 0, y2: 1,
                      colorStops: [
                        { offset: 0, color: 'rgba(34, 197, 94, 0.3)' },
                        { offset: 0.5, color: 'rgba(34, 197, 94, 0.15)' },
                        { offset: 1, color: 'rgba(34, 197, 94, 0.02)' }
                      ]
                    };
                  case 'co2':
                    return {
                      type: 'linear',
                      x: 0, y: 0, x2: 0, y2: 1,
                      colorStops: [
                        { offset: 0, color: 'rgba(168, 85, 247, 0.3)' },
                        { offset: 0.5, color: 'rgba(168, 85, 247, 0.15)' },
                        { offset: 1, color: 'rgba(168, 85, 247, 0.02)' }
                      ]
                    };
                  default:
                    return {
                      type: 'linear',
                      x: 0, y: 0, x2: 0, y2: 1,
                      colorStops: [
                        { offset: 0, color: 'rgba(34, 197, 94, 0.3)' },
                        { offset: 0.5, color: 'rgba(34, 197, 94, 0.15)' },
                        { offset: 1, color: 'rgba(34, 197, 94, 0.02)' }
                      ]
                    };
                }
              })()
            },
            emphasis: {
              focus: 'series',
              lineStyle: {
                width: 4,
                shadowBlur: 16,
                shadowColor: (sensorType === 'temperature' ? 'rgba(249, 115, 22, 0.7)' :
                             sensorType === 'humidity' ? 'rgba(59, 130, 246, 0.7)' :
                             sensorType === 'vpd' ? 'rgba(34, 197, 94, 0.7)' :
                             sensorType === 'co2' ? 'rgba(168, 85, 247, 0.7)' :
                             'rgba(34, 197, 94, 0.7)')
              },
              areaStyle: {
                opacity: 0.8
              }
            },
            markLine: minThreshold !== undefined || maxThreshold !== undefined ? {
              silent: true,
              lineStyle: {
                color: '#ef4444',
                width: 2,
                type: 'dashed'
              },
              data: [
                ...(minThreshold !== undefined ? [{
                  yAxis: minThreshold,
                  label: {
                    formatter: `Min: ${minThreshold}${unit}`,
                    position: 'middle',
                    color: '#ef4444',
                    fontSize: 10,
                    fontWeight: 'bold'
                  }
                }] : []),
                ...(maxThreshold !== undefined ? [{
                  yAxis: maxThreshold,
                  label: {
                    formatter: `Max: ${maxThreshold}${unit}`,
                    position: 'middle',
                    color: '#ef4444',
                    fontSize: 10,
                    fontWeight: 'bold'
                  }
                }] : [])
              ]
            } : undefined
          }]
        });
      } catch (err) {
        console.error('Chart data fetch error:', err);
        setError(err.message || 'Failed to load chart data');
      } finally {
        setLoading(false);
      }
    };

    fetchHistoryData();
  }, [startDate, endDate, sensorId, srvAddr, accessToken, minThreshold, maxThreshold, selectedView, title, unit]);

  // Loading state
  if (loading && !chartOptions) {
    return (
      <ChartWrapper $priority={priority}>
        <ChartHeader>
          <ChartTitle>{title}</ChartTitle>
          <ChartMenu>
            {['Live', '12h', 'daily', 'weekly'].map(view => (
              <ViewButton
                key={view}
                $isActive={selectedView === view}
                onClick={() => handleViewChange(view)}
                disabled={loading}
              >
                {view}
              </ViewButton>
            ))}
          </ChartMenu>
        </ChartHeader>

        <Chart>
          <LoadingWrapper>
            <LoadingSpinner>
              <FaSpinner className="fa-spin" />
            </LoadingSpinner>
            <LoadingText>Loading sensor data...</LoadingText>
            <LoadingSubtext>Please wait while we fetch the latest readings</LoadingSubtext>
          </LoadingWrapper>
        </Chart>
      </ChartWrapper>
    );
  }

  // Error state
  if (error) {
    return (
      <ChartWrapper $priority={priority}>
        <ChartHeader>
          <ChartTitle>{title}</ChartTitle>
          <ChartMenu>
            {['Live', '12h', 'daily', 'weekly'].map(view => (
              <ViewButton
                key={view}
                $isActive={selectedView === view}
                onClick={() => handleViewChange(view)}
                disabled={true}
              >
                {view}
              </ViewButton>
            ))}
          </ChartMenu>
        </ChartHeader>

        <Chart>
          <ErrorWrapper>
            <ErrorIcon>
              <FaExclamationTriangle />
            </ErrorIcon>
            <ErrorTitle>Data Unavailable</ErrorTitle>
            <ErrorMessage>Unable to load sensor data. Please check your connection.</ErrorMessage>
          </ErrorWrapper>
        </Chart>
      </ChartWrapper>
    );
  }

  // No data state
  if (!chartOptions && !loading) {
    return (
      <ChartWrapper $priority={priority}>
        <ChartHeader>
          <ChartTitle>{title}</ChartTitle>
          <ChartMenu>
            {['Live', '12h', 'daily', 'weekly'].map(view => (
              <ViewButton
                key={view}
                $isActive={selectedView === view}
                onClick={() => handleViewChange(view)}
              >
                {view}
              </ViewButton>
            ))}
          </ChartMenu>
        </ChartHeader>

        <Chart>
          <EmptyWrapper>
            <EmptyIcon><FaLeaf /></EmptyIcon>
            <EmptyTitle>No Data Available</EmptyTitle>
            <EmptyMessage>
              Sensor data will appear here once {title.toLowerCase()} readings are available.
            </EmptyMessage>
          </EmptyWrapper>
        </Chart>
      </ChartWrapper>
    );
  }

  return (
    <ChartWrapper $priority={priority}>
      <ChartHeader>
        <ChartTitleRow>
          <ChartTitle>{title}</ChartTitle>
          {sensorOptions && sensorOptions.length > 1 && onSensorChange && (
            <SensorSelect
              value={selectedSensorIndex}
              onChange={(e) => onSensorChange(parseInt(e.target.value))}
            >
              {sensorOptions.map((sensor, index) => (
                <option key={sensor.id} value={index}>
                  {sensor.friendly_name}
                </option>
              ))}
            </SensorSelect>
          )}
        </ChartTitleRow>
        <ChartMenu>
          {['Live', '12h', 'daily', 'weekly'].map(view => (
            <ViewButton
              key={view}
              $isActive={selectedView === view}
              onClick={() => handleViewChange(view)}
              disabled={loading}
            >
              {view}
            </ViewButton>
          ))}
        </ChartMenu>
      </ChartHeader>

      <Chart>
        {loading && (
          <LoadingOverlay>
            <LoadingSpinner size="small">
              <FaSpinner className="fa-spin" />
            </LoadingSpinner>
          </LoadingOverlay>
        )}
        <ReactECharts
          option={chartOptions}
          style={{ height: '100%', width: '100%' }}
          opts={{ renderer: 'canvas' }}
        />
      </Chart>
    </ChartWrapper>
  );
};

export default SensorChart;

const ChartWrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  background: linear-gradient(135deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.05) 50%,
    rgba(255, 255, 255, 0.02) 100%
  );
  backdrop-filter: blur(20px);
  border-radius: 20px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.12),
    0 2px 8px rgba(0, 0, 0, 0.08),
    var(--glass-shadow-inset);
  width: 100%;
  height: 100%;
  min-height: ${({ $priority }) => $priority === 'high' ? '16rem' : '14rem'};
  position: relative;
  overflow: hidden;
  border: 1px solid var(--glass-border-light);

  @media (max-width: 768px) {
    padding: 1rem;
    min-height: ${({ $priority }) => $priority === 'high' ? '14rem' : '12rem'};
    border-radius: 16px;
  }

  @media (max-width: 480px) {
    padding: 0.75rem;
    min-height: ${({ $priority }) => $priority === 'high' ? '12rem' : '10rem'};
    border-radius: 12px;
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg,
      transparent 0%,
      rgba(79, 195, 247, 0.4) 20%,
      rgba(156, 39, 176, 0.4) 50%,
      rgba(63, 81, 181, 0.4) 80%,
      transparent 100%
    );
    z-index: 1;
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
      rgba(79, 195, 247, 0.03) 50%,
      transparent 100%
    );
    animation: chartShimmer 8s ease-in-out infinite;
    pointer-events: none;
    z-index: 0;
  }

  @keyframes chartShimmer {
    0%, 100% { left: -100%; }
    50% { left: 100%; }
  }

  @media (max-width: 768px) {
    min-height: 24rem;
    padding: 1.25rem;
    border-radius: 16px;
  }

  @media (max-width: 640px) {
    padding: 1rem;
    min-height: 20rem;
  }
`;

const ChartHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  position: relative;
  z-index: 2;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
    align-items: flex-start;
  }

  @media (max-width: 640px) {
    gap: 1.25rem;
    margin-bottom: 1.25rem;
  }
`;

const ChartTitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const ChartTitle = styled.h3`
  background: linear-gradient(135deg, ${getThemeColor('--chart-success-color')} 0%, ${getThemeColor('--main-arrow-up')} 50%, ${getThemeColor('--cannabis-active-color')} 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 1.375rem;
  font-weight: 700;
  margin: 0;
  letter-spacing: -0.025em;
  line-height: 1.2;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 30%;
    height: 2px;
    background: linear-gradient(90deg, ${getThemeColor('--chart-success-color')}, ${getThemeColor('--main-arrow-up')});
    border-radius: 1px;
  }

  @media (max-width: 640px) {
    font-size: 1.25rem;

    &::after {
      width: 40%;
    }
  }
`;

const SensorSelect = styled.select`
  padding: 0.375rem 0.625rem;
  background: rgba(168, 85, 247, 0.15);
  border: 1px solid rgba(168, 85, 247, 0.3);
  border-radius: 8px;
  color: var(--main-text-color);
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  max-width: 140px;

  &:hover {
    background: rgba(168, 85, 247, 0.25);
    border-color: rgba(168, 85, 247, 0.5);
  }

  &:focus {
    outline: none;
    border-color: rgba(168, 85, 247, 0.6);
  }

  option {
    background: rgba(15, 23, 42, 0.95);
    color: var(--main-text-color);
  }

  @media (max-width: 640px) {
    padding: 0.25rem 0.5rem;
    font-size: 0.7rem;
    max-width: 100px;
  }
`;

const ChartMenu = styled.div`
  display: flex;
  gap: 0.375rem;
  background: linear-gradient(135deg,
    rgba(255, 255, 255, 0.08) 0%,
    rgba(255, 255, 255, 0.04) 100%
  );
  backdrop-filter: blur(12px);
  border-radius: 16px;
  padding: 0.375rem;
  border: 1px solid var(--glass-border);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  @media (max-width: 640px) {
    gap: 0.25rem;
    padding: 0.25rem;
  }
`;

const ViewButton = styled.button`
  background: ${props => props.$isActive
    ? `linear-gradient(135deg, ${getThemeColor('--chart-primary-color')} 0%, ${getThemeColor('--chart-primary-color')} 100%)`
    : 'transparent'
  };
  color: ${props => props.$isActive ? 'white' : 'var(--main-text-color)'};
  border: 1px solid ${props => props.$isActive
    ? 'rgba(59, 130, 246, 0.3)'
    : 'var(--button-hover-bg)'
  };
  cursor: pointer;
  padding: 0.625rem 1.25rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  letter-spacing: 0.025em;
  text-transform: uppercase;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg,
      transparent 0%,
      var(--button-hover-bg) 50%,
      transparent 100%
    );
    transition: left 0.5s ease;
  }

  &:hover {
    background: ${props => props.$isActive
      ? `linear-gradient(135deg, ${getThemeColor('--chart-primary-color')} 0%, ${getThemeColor('--chart-primary-color')} 100%)`
      : 'var(--glass-bg-primary)'
    };
    border-color: ${props => props.$isActive
      ? 'rgba(37, 99, 235, 0.4)'
      : 'var(--input-focus-border-color)'
    };
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);

    &::before {
      left: 100%;
    }
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  @media (max-width: 640px) {
    padding: 0.5rem 1rem;
    font-size: 0.8125rem;
  }
`;

const Chart = styled.div`
  flex: 1;
  width: 100%;
  position: relative;
  z-index: 2;
  border-radius: 16px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.02);
  backdrop-filter: blur(8px);
  border: 1px solid var(--glass-border);

  .echarts-for-react {
    min-height: 16rem;
    border-radius: 16px;

    @media (max-width: 768px) {
      min-height: 14rem;
    }

    @media (max-width: 640px) {
      min-height: 12rem;
    }
  }
`;

const Message = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
  font-size: 1.125rem;
  font-weight: 500;
  margin: 3rem 0;
  padding: 2rem;
  background: linear-gradient(135deg,
    rgba(255, 255, 255, 0.05) 0%,
    rgba(255, 255, 255, 0.02) 100%
  );
  border-radius: 16px;
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(8px);

  /* Removed emoticon content */

  @media (max-width: 640px) {
    font-size: 1rem;
    padding: 1.5rem;
    margin: 2rem 0;
  }
`;

const bounce = keyframes`
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  40% {
    transform: translateY(-10px) rotate(10deg);
  }
  60% {
    transform: translateY(-5px) rotate(-5deg);
  }
`;

const glow = keyframes`
  0%, 100% {
    color: rgba(79, 195, 247, 0.8);
    filter: drop-shadow(0 0 5px rgba(79, 195, 247, 0.5));
  }
  50% {
    color: rgba(156, 39, 176, 0.8);
    filter: drop-shadow(0 0 8px rgba(156, 39, 176, 0.6));
  }
`;

const LoadingIcon = styled(FaLeaf)`
  animation: ${bounce} 2s infinite, ${glow} 3s infinite;
  margin-left: 0.5rem;
  font-size: 1.5rem;
`;

const LoadingText = styled.span`
  color: var(--main-text-color);
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 1rem;
  letter-spacing: 0.025em;
  text-transform: uppercase;
  opacity: 0.9;
`;

const LoadingWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  background: linear-gradient(135deg,
    rgba(255, 255, 255, 0.08) 0%,
    rgba(255, 255, 255, 0.04) 100%
  );
  backdrop-filter: blur(12px);
  border-radius: 16px;
  border: 1px solid var(--glass-border);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg,
      transparent 0%,
      rgba(79, 195, 247, 0.1) 50%,
      transparent 100%
    );
    animation: loadingShimmer 2s ease-in-out infinite;
  }

  @keyframes loadingShimmer {
    0%, 100% { left: -100%; }
    50% { left: 100%; }
  }
`;

// Enhanced Loading States
const LoadingSpinner = styled.div`
  font-size: ${({ size }) => size === 'small' ? '1.5rem' : '3rem'};
  color: var(--primary-accent, #007AFF);
  animation: spin 1s linear infinite;

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
  pointer-events: none;
`;

const LoadingSubtext = styled.p`
  color: var(--second-text-color, #ccc);
  margin: 0.5rem 0 0 0;
  font-size: 0.875rem;
  text-align: center;
`;

// Error States
const ErrorWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  padding: 2rem;
`;

const ErrorIcon = styled.div`
  font-size: 3rem;
  color: var(--chart-error-color, #dc3545);
  margin-bottom: 1rem;
`;

const ErrorTitle = styled.h3`
  color: var(--main-text-color, #fff);
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
  font-weight: 600;
`;

const ErrorMessage = styled.p`
  color: var(--second-text-color, #ccc);
  margin: 0;
  font-size: 0.9rem;
  max-width: 250px;
`;

// Empty States
const EmptyWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  padding: 2rem;
`;

const EmptyIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.7;
`;

const EmptyTitle = styled.h3`
  color: var(--main-text-color, #fff);
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
  font-weight: 500;
`;

const EmptyMessage = styled.p`
  color: var(--second-text-color, #ccc);
  margin: 0;
  font-size: 0.9rem;
  max-width: 250px;
`;

