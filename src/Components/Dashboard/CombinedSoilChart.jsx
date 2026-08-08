import { useState, useEffect, useRef, useMemo } from 'react';
import styled from 'styled-components';
import EChartsWrapper from '../Common/EChartsWrapper';
import { useHomeAssistant } from '../Context/HomeAssistantContext';
import { formatDateTime } from '../../misc/formatDateTime';
import { getThemeColor } from '../../utils/themeColors';
import { FaExclamationTriangle, FaSpinner, FaChartLine, FaArrowUp, FaArrowDown, FaEquals, FaDownload, FaTint, FaBolt, FaThermometerHalf } from 'react-icons/fa';
import { Maximize2, Minimize2, LineChart, BarChart3, Image, FileSpreadsheet } from 'lucide-react';

const CombinedSoilChart = ({
  soilSensors,
  mediumSeries = null,
  isGlobalLiveMode = false,
  globalLiveRefreshTrigger = 0,
  onLiveModeChange,
  chartHeight = 350
}) => {
  // HA history API + sensor timestamps are UTC — always use the same UTC convention
  // for the window (start/end) so the chart extends to "now" on every refresh.
  const toDateString = (date) => date.toISOString().slice(0, 16);

  const { haApiBaseUrl, haToken: accessToken, entities } = useHomeAssistant();
  const isDev = import.meta.env.DEV;
  const HISTORY_FETCH_TIMEOUT_MS = 20000;

  // Stable key from sensor IDs only (not values) to prevent re-fetches on every entity update
  const sensorIdsKey = useMemo(() =>
    ['moisture', 'ec', 'temperature']
      .map(k => soilSensors?.[k]?.id)
      .filter(Boolean)
      .sort()
      .join(','),
    [soilSensors]
  );

  const chartDataRef = useRef({
    moisture: { xData: [], yData: [] },
    ec: { xData: [], yData: [] },
    temperature: { xData: [], yData: [] }
  });
  const currentValuesRef = useRef({ moisture: null, ec: null, temperature: null });
  const lastPointsRef = useRef({});

  const [startDate, setStartDate] = useState(() => toDateString(new Date(Date.now() - 12 * 60 * 60 * 1000)));
  const [endDate, setEndDate] = useState(() => toDateString(new Date()));
  const [chartOptions, setChartOptions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedView, setSelectedView] = useState('12h');
  const [isLive, setIsLive] = useState(false);
  const liveIntervalRef = useRef(null);
  const [stats, setStats] = useState({
    moisture: { current: '--', min: '--', max: '--', avg: '--', trend: 'stable' },
    ec: { current: '--', min: '--', max: '--', avg: '--', trend: 'stable' },
    temperature: { current: '--', min: '--', max: '--', avg: '--', trend: 'stable' }
  });
  const [chartType, setChartType] = useState('line');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const chartRef = useRef(null);

  const handleViewChange = (view) => {
    const isLiveMode = view === 'Live';
    setSelectedView(view);
    setIsLive(isLiveMode);
    
    if (liveIntervalRef.current) {
      clearInterval(liveIntervalRef.current);
      liveIntervalRef.current = null;
    }
    
    if (isLiveMode) {
      // Live mode: rolling 1h window so every series has data and reaches "now"
      const now = new Date();
      setStartDate(toDateString(new Date(now.getTime() - 60 * 60 * 1000)));
      setEndDate(toDateString(now));

      liveIntervalRef.current = setInterval(() => {
        setEndDate(toDateString(new Date()));
      }, 30000);
    } else {
      const hours = view === '6h' ? 6 : view === '12h' ? 12 : view === '24h' ? 24 : 168;
      const now = new Date();
      setStartDate(toDateString(new Date(now.getTime() - hours * 60 * 60 * 1000)));
      setEndDate(toDateString(now));
    }
  };

  useEffect(() => {
    const fetchSoilData = async () => {
      if ((!isDev && !haApiBaseUrl) || !accessToken) {
        setError('Connection not configured');
        return;
      }

      setLoading(true);
      setError(null);

      const metricKeys = ['moisture', 'ec', 'temperature'];
      const availableSensors = metricKeys.filter(
        s => soilSensors?.[s]
      );
      const hasMediumData = metricKeys.some(s => mediumSeries?.[s]?.length);

      if (availableSensors.length === 0 && !hasMediumData) {
        setError('No soil sensors found');
        setLoading(false);
        return;
      }

      try {
        const allData = {};
        const failedSensors = [];
        
        // Fetch all sensors in parallel for better performance
        const fetchPromises = availableSensors.map(async (sensorKey) => {
          const sensorId = soilSensors[sensorKey]?.id;
          if (!sensorId) {
            failedSensors.push(sensorKey);
            return { sensorKey, data: { xData: [], yData: [] } };
          }

          const url = `${haApiBaseUrl || ''}/api/history/period/${encodeURIComponent(startDate)}?filter_entity_id=${sensorId}&end_time=${encodeURIComponent(endDate)}&minimal_response`;
          
          // Retry logic for failed requests
          let retries = 1;
          let lastError = null;
          
          while (retries >= 0) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), HISTORY_FETCH_TIMEOUT_MS);
            
            try {
              const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${accessToken}` },
                signal: controller.signal
              });
              
              clearTimeout(timeoutId);
              
              if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
              }
              
              const data = await response.json();
              
              if (!Array.isArray(data) || data.length === 0 || !data[0]?.length) {
                return { sensorKey, data: { xData: [], yData: [] } };
              }

              const sensorData = data[0];

              // Scale µS/cm EC entities to mS/cm (generic EC probes report microsiemens).
              // Fallback: if the entity does not explicitly claim mS/cm and raw values are
              // large (> 50), assume µS/cm even when HA omits the unit attribute.
              const entityUnit = entities?.[sensorId]?.attributes?.unit_of_measurement || '';
              const rawValues = sensorData.map(item => parseFloat(item.state)).filter(v => !isNaN(v));
              const rawMax = rawValues.length ? Math.max(...rawValues) : 0;
              const isMicroUnit = /µs|μs|us\/cm/i.test(entityUnit);
              const isMilliUnit = /mS\/cm/i.test(entityUnit);
              const scale = sensorKey === 'ec' && (isMicroUnit || (!isMilliUnit && rawMax >= 50)) ? 0.001 : 1;

              const xData = sensorData.map(item => new Date(item.last_changed).getTime());
              const yData = sensorData.map(item => {
                const val = parseFloat(item.state) * scale;
                return isNaN(val) ? null : val;
              });
              const values = yData.filter(v => v !== null);

              if (values.length > 0) {
                currentValuesRef.current[sensorKey] = values[values.length - 1];
              }

              return { sensorKey, data: { xData, yData } };
            } catch (err) {
              clearTimeout(timeoutId);
              lastError = err;
              retries--;
              if (retries >= 0) {
                // Wait 1s before retry
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            }
          }
          
          // All retries failed
          failedSensors.push(sensorKey);
          return { sensorKey, data: { xData: [], yData: [] } };
        });
        
        // Wait for all sensors to load (in parallel)
        const results = await Promise.all(fetchPromises);
        
        // Process results
        results.forEach(({ sensorKey, data }) => {
          allData[sensorKey] = data;
        });
        
        // Show warning if some sensors failed
        if (failedSensors.length > 0 && failedSensors.length < availableSensors.length) {
          console.warn(`CombinedSoilChart: Failed to load sensors: ${failedSensors.join(', ')}`);
        }

        const textColor = getThemeColor('--main-text-color');
        const secondaryTextColor = getThemeColor('--second-text-color');
        const gridColor = getThemeColor('--glass-border');

        const series = [];
        const colorMap = {
          moisture: '#3b82f6',
          ec: '#8b5cf6',
          temperature: '#f59e0b'
        };
        const unitMap = {
          moisture: '%',
          ec: ' mS/cm',
          temperature: ' °C'
        };

        metricKeys.forEach((sensorKey) => {
          const haData = allData[sensorKey];

          // Build time-stamped points [timestamp, value] so every line is
          // correctly aligned on the shared time axis regardless of sample rate.
          const haPts = haData?.xData?.length
            ? haData.xData.map((t, i) => [t, haData.yData[i]]).filter(p => p[1] !== null)
            : [];

          // Medium-event points are the authoritative per-medium values; HA history
          // backfills the past. Merge with medium points taking precedence.
          const merged = new Map();
          haPts.forEach(p => merged.set(p[0], p[1]));
          (mediumSeries?.[sensorKey] || []).forEach(p => merged.set(p[0], p[1]));
          let points = [...merged].sort((a, b) => a[0] - b[0]);

          // If neither source returned anything (transient API hiccup, sensor briefly
          // unavailable), keep the last known points so the line doesn't vanish.
          if (points.length === 0) {
            const last = lastPointsRef.current[sensorKey];
            if (last && last.length) points = last;
          }
          if (points.length === 0) return;
          lastPointsRef.current[sensorKey] = points;

          const values = points.map(p => p[1]);
          const current = values[values.length - 1];
          const min = Math.min(...values);
          const max = Math.max(...values);
          const avg = values.reduce((a, b) => a + b, 0) / values.length;

          const firstHalf = values.slice(0, Math.floor(values.length / 2));
          const secondHalf = values.slice(Math.floor(values.length / 2));
          const firstAvg = firstHalf.length > 0 ? firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length : 0;
          const secondAvg = secondHalf.length > 0 ? secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length : 0;
          const trend = secondAvg > firstAvg * 1.05 ? 'up' : secondAvg < firstAvg * 0.95 ? 'down' : 'stable';

          setStats(prev => ({
            ...prev,
            [sensorKey]: {
              current: current?.toFixed(2) || '--',
              min: min?.toFixed(2) || '--',
              max: max?.toFixed(2) || '--',
              avg: avg?.toFixed(2) || '--',
              trend
            }
          }));

          series.push({
            name: sensorKey.charAt(0).toUpperCase() + sensorKey.slice(1),
            data: points,
            type: chartType === 'area' ? 'line' : chartType,
            smooth: 0.3,
            symbol: chartType === 'line' ? 'circle' : 'rect',
            symbolSize: chartType === 'line' ? 4 : 8,
            showSymbol: chartType === 'line' ? false : true,
            yAxisIndex: sensorKey === 'moisture' ? 0 : sensorKey === 'ec' ? 1 : 2,
            itemStyle: { color: colorMap[sensorKey] },
            lineStyle: {
              width: 3,
              color: colorMap[sensorKey],
              shadowColor: colorMap[sensorKey] + '40',
              shadowBlur: 10
            },
            areaStyle: chartType === 'area' ? {
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                  { offset: 0, color: colorMap[sensorKey] + '60' },
                  { offset: 0.5, color: colorMap[sensorKey] + '30' },
                  { offset: 1, color: colorMap[sensorKey] + '05' }
                ]
              }
            } : undefined
          });
        });

        if (series.length === 0) {
          setLoading(false);
          return;
        }

        const newOptions = {
          backgroundColor: 'transparent',
          grid: { top: 60, right: 140, bottom: 60, left: 60 },
          tooltip: {
            trigger: 'axis',
            backgroundColor: getThemeColor('--main-bg-card-color'),
            borderColor: '#3b82f6',
            borderWidth: 1,
            padding: [12, 16],
            textStyle: { color: textColor, fontSize: 13 },
            // Show ALL series at the hovered time, even when their timestamps
            // don't line up exactly (HA history vs medium events) - pick the
            // nearest point of each series to the hovered axis value.
            formatter: (params) => {
              if (!params?.length) return '';
              const p = params[0];
              const date = formatDateTime(p.axisValue);
              const t = typeof p.axisValue === 'number' ? p.axisValue : new Date(p.axisValue).getTime();
              let html = `<div style="font-weight:600;margin-bottom:4px">${date}</div>`;
              series.forEach(s => {
                const data = s.data || [];
                let nearest = null;
                for (const pt of data) {
                  nearest = pt;
                  if (pt[0] >= t) break;
                }
                if (!nearest) return;
                const unit = unitMap[s.name.toLowerCase()] || '';
                const raw = nearest[1];
                const value = raw != null && !isNaN(raw) ? Number(raw).toFixed(2) : '--';
                const color = s.itemStyle?.color || colorMap[s.name.toLowerCase()];
                html += `<div style="display:flex;align-items:center;gap:8px;margin-top:4px">
                  <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color}"></span>
                  <span>${s.name}:</span>
                  <span style="font-weight:700">${value}${unit}</span>
                </div>`;
              });
              return html;
            }
          },
          dataZoom: [{ type: 'inside', start: 0, end: 100 }],
          xAxis: {
            type: 'time',
            boundaryGap: false,
            axisLine: { lineStyle: { color: gridColor } },
            axisLabel: {
              color: secondaryTextColor,
              fontSize: 11,
              formatter: (value) => {
                const date = new Date(value);
                const now = new Date();
                if (isNaN(date.getTime())) return '';
                if (date.toDateString() === now.toDateString()) {
                  return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
                }
                return `${date.getDate()}.${date.getMonth() + 1} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
              }
            },
            splitLine: { show: false }
          },
          yAxis: [
            { type: 'value', name: 'Moisture %', position: 'left', axisLine: { show: false }, axisLabel: { color: secondaryTextColor, fontSize: 10 }, nameTextStyle: { color: secondaryTextColor, fontSize: 10, padding: [0, 0, 0, 30] }, splitLine: { lineStyle: { color: gridColor + '30', type: 'dashed' } } },
            { type: 'value', name: 'EC mS', position: 'right', offset: 0, axisLine: { show: false }, axisLabel: { color: secondaryTextColor, fontSize: 10 }, nameTextStyle: { color: secondaryTextColor, fontSize: 10, padding: [0, 0, 0, 20] }, splitLine: { show: false } },
            { type: 'value', name: 'Temp °C', position: 'right', offset: 60, axisLine: { show: false }, axisLabel: { color: secondaryTextColor, fontSize: 10 }, nameTextStyle: { color: secondaryTextColor, fontSize: 10, padding: [0, 0, 0, 20] }, splitLine: { show: false } }
          ],
          series
        };
        setChartOptions(newOptions);

      } catch (err) {
        console.error('Soil chart error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    // Always fetch when dependencies change
    fetchSoilData();
  }, [startDate, endDate, sensorIdsKey, haApiBaseUrl, accessToken, chartType, mediumSeries]);

  // Sync with global live mode (like CombinedClimateChart)
  useEffect(() => {
    if (isGlobalLiveMode !== isLive) {
      handleViewChange(isGlobalLiveMode ? 'Live' : '12h');
    }
  }, [isGlobalLiveMode, globalLiveRefreshTrigger]);

  // Periodic refresh for non-live modes: every 60s
  useEffect(() => {
    if (isLive) return;

    const interval = setInterval(() => {
      setEndDate(toDateString(new Date()));
    }, 60000);

    return () => clearInterval(interval);
  }, [isLive]);

  const handleExportPNG = () => {
    const chartInstance = chartRef.current?.getEchartsInstance();
    if (!chartInstance) return;
    
    try {
      const url = chartInstance.getDataURL({
        type: 'png',
        pixelRatio: 2,
        backgroundColor: '#1a1a2e',
        excludeComponents: ['toolbox', 'dataZoom']
      });
      
      const link = document.createElement('a');
      link.download = `soil_chart_${selectedView}_${new Date().toISOString().slice(0,10)}.png`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('PNG Export error:', err);
    } finally {
      setShowExportMenu(false);
    }
  };

  const handleExportCSV = () => {
    if (!chartOptions?.series) return;
    
    const xData = [...new Set(chartOptions.series.flatMap(s => (s.data || []).map(p => p[0])))].sort((a, b) => a - b);
    const series = chartOptions.series;
    
    const headers = ['Timestamp', ...series.map(s => s.name)].join(',');
    const rows = xData.map((t) => {
      return [new Date(t).toISOString(), ...series.map(s => (s.data || []).find(p => p[0] === t)?.[1] ?? '')].join(',');
    });
    
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.download = `soil_data_${selectedView}.csv`;
    link.href = URL.createObjectURL(blob);
    link.click();
    setShowExportMenu(false);
  };

  const getTrendIcon = (sensorKey) => {
    const trend = stats[sensorKey]?.trend;
    if (trend === 'up') return <FaArrowUp style={{ color: getThemeColor('--chart-success-color') }} />;
    if (trend === 'down') return <FaArrowDown style={{ color: getThemeColor('--chart-error-color') }} />;
    return <FaEquals style={{ color: getThemeColor('--second-text-color') }} />;
  };

  if (!soilSensors) {
    return (
      <ChartCard>
        <NoDataState>
          <FaChartLine size={32} />
          <span>No soil sensors defined</span>
        </NoDataState>
      </ChartCard>
    );
  }

  return (
    <ChartCard $fullscreen={isFullscreen}>
      <ChartHeader>
        <HeaderTopRow>
          <ChartTitle>Soil Analytics</ChartTitle>
          <ChartActions>
            <FullscreenBtn onClick={() => setIsFullscreen(!isFullscreen)}>
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </FullscreenBtn>
            <ExportBtnContainer>
              <ExportBtn onClick={() => setShowExportMenu(!showExportMenu)}>
                <FaDownload size={14} />
              </ExportBtn>
              {showExportMenu && (
                <ExportMenu>
                  <ExportMenuBtn onClick={handleExportPNG}>
                    <Image size={14} /><span>PNG</span>
                  </ExportMenuBtn>
                  <ExportMenuBtn onClick={handleExportCSV}>
                    <FileSpreadsheet size={14} /><span>CSV</span>
                  </ExportMenuBtn>
                </ExportMenu>
              )}
            </ExportBtnContainer>
          </ChartActions>
        </HeaderTopRow>
        
        <HeaderBottomRow>
          <TimeSelector>
            {['Live', '6h', '12h', '24h', '7d'].map(view => (
              <TimeButton key={view} $active={selectedView === view} onClick={() => handleViewChange(view)}>
                {view}
              </TimeButton>
            ))}
          </TimeSelector>
          <ChartTypeSelector>
            <ChartTypeBtn $active={chartType === 'line'} onClick={() => setChartType('line')} title="Line">
              <LineChart size={14} />
            </ChartTypeBtn>
            <ChartTypeBtn $active={chartType === 'area'} onClick={() => setChartType('area')} title="Area">
              <LineChart size={14} style={{ opacity: 0.7 }} />
            </ChartTypeBtn>
            <ChartTypeBtn $active={chartType === 'bar'} onClick={() => setChartType('bar')} title="Bar">
              <BarChart3 size={14} />
            </ChartTypeBtn>
          </ChartTypeSelector>
        </HeaderBottomRow>
      </ChartHeader>

      <ChartContainer $fullscreen={isFullscreen} $chartHeight={chartHeight}>
        {loading ? (
          <LoadingState $chartHeight={chartHeight}>
            <FaSpinner className="spin" size={32} />
            <span>Loading soil data...</span>
          </LoadingState>
        ) : error ? (
          <ErrorState $chartHeight={chartHeight}>
            <FaExclamationTriangle size={32} />
            <div>{error}</div>
          </ErrorState>
        ) : chartOptions ? (
          <EChartsWrapper
            ref={chartRef}
            option={chartOptions}
            notMerge={false}
            lazyUpdate={false}
            style={{ height: isFullscreen ? '70vh' : `${chartHeight}px`, width: '100%' }}
            opts={{ renderer: 'canvas' }}
          />
        ) : (
          <NoDataState $chartHeight={chartHeight}>
            <FaChartLine size={32} />
            <span>No data available</span>
          </NoDataState>
        )}
      </ChartContainer>

      <StatsBar>
        {Object.entries(stats).map(([key, stat]) => (
          <StatBox key={key}>
            <StatLabel>
              {key === 'moisture' && <FaTint size={12} />}
              {key === 'ec' && <FaBolt size={12} />}
              {key === 'temperature' && <FaThermometerHalf size={12} />}
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </StatLabel>
            <StatValue>{stat.current}</StatValue>
            <TrendIndicator>{getTrendIcon(key)}</TrendIndicator>
          </StatBox>
        ))}
      </StatsBar>
    </ChartCard>
  );
};

const ChartCard = styled.div`
  background: ${props => props.$fullscreen ? 'var(--main-bg-card-color)' : 'var(--glass-bg-primary)'};
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  position: ${props => props.$fullscreen ? 'fixed' : 'relative'};
  top: ${props => props.$fullscreen ? '0' : 'auto'};
  left: ${props => props.$fullscreen ? '0' : 'auto'};
  width: ${props => props.$fullscreen ? '100vw' : '100%'};
  height: ${props => props.$fullscreen ? '100vh' : 'auto'};
  z-index: ${props => props.$fullscreen ? '9999' : '1'};
  padding: ${props => props.$fullscreen ? '2rem' : '1rem'};
  overflow: auto;
`;

const ChartHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const HeaderTopRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const HeaderBottomRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ChartTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--main-text-color);
  margin: 0;
`;

const ChartActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const FullscreenBtn = styled.button`
  background: var(--glass-bg-secondary);
  border: 1px solid var(--glass-border);
  border-radius: 8px;
  padding: 0.5rem;
  cursor: pointer;
  color: var(--placeholder-text-color);
  &:hover {
    background: var(--active-bg-color);
    color: var(--primary-accent);
  }
`;

const ExportBtnContainer = styled.div`
  position: relative;
`;

const ExportBtn = styled.button`
  background: var(--glass-bg-secondary);
  border: 1px solid var(--glass-border);
  border-radius: 8px;
  padding: 0.5rem;
  cursor: pointer;
  color: var(--placeholder-text-color);
  &:hover {
    background: var(--active-bg-color);
  }
`;

const ExportMenu = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  background: var(--main-bg-card-color);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  padding: 0.5rem;
  z-index: 100;
  box-shadow: var(--main-shadow-art);
  min-width: 120px;
`;

const ExportMenuBtn = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.875rem;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--main-text-color);
  cursor: pointer;
  font-size: 0.875rem;
  &:hover {
    background: var(--active-bg-color);
  }
`;

const TimeSelector = styled.div`
  display: flex;
  gap: 0.25rem;
  background: var(--glass-bg-secondary);
  padding: 0.25rem;
  border-radius: 10px;
`;

const TimeButton = styled.button`
  padding: 0.375rem 0.875rem;
  font-size: 0.8rem;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  background: ${props => props.$active ? 'var(--primary-accent)' : 'transparent'};
  color: ${props => props.$active ? 'white' : 'var(--placeholder-text-color)'};
`;

const ChartTypeSelector = styled.div`
  display: flex;
  gap: 0.25rem;
  background: var(--glass-bg-secondary);
  padding: 0.25rem;
  border-radius: 8px;
`;

const ChartTypeBtn = styled.button`
  padding: 0.5rem;
  border: 1px solid var(--glass-border);
  border-radius: 8px;
  background: ${props => props.$active ? 'var(--primary-accent)' : 'var(--glass-bg-secondary)'};
  color: ${props => props.$active ? 'white' : 'var(--main-text-color)'};
  cursor: pointer;
  &:hover {
    background: ${props => props.$active ? 'var(--primary-accent)' : 'var(--active-bg-color)'};
  }
`;

const ChartContainer = styled.div`
  min-height: ${props => props.$chartHeight ? props.$chartHeight : 300}px;
  background: var(--glass-bg-secondary);
  border-radius: 12px;
  overflow: hidden;
  height: ${props => props.$fullscreen ? 'auto' : props.$chartHeight ? `${props.$chartHeight}px` : '300px'};
  flex: ${props => props.$fullscreen ? '1' : 'none'};
`;

const LoadingState = styled.div`
  height: ${props => props.$chartHeight ? props.$chartHeight : 300}px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: var(--placeholder-text-color);
  .spin {
    animation: spin 1s linear infinite;
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const ErrorState = styled.div`
  height: ${props => props.$chartHeight ? props.$chartHeight : 300}px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: var(--chart-error-color);
`;

const NoDataState = styled.div`
  height: ${props => props.$chartHeight ? props.$chartHeight : 300}px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: var(--placeholder-text-color);
`;

const StatsBar = styled.div`
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--glass-bg-secondary);
  border-radius: 8px;
  flex-wrap: wrap;
  justify-content: center;
`;

const StatBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  flex: 1;
  min-width: 60px;
  align-items: center;
`;

const StatLabel = styled.span`
  font-size: 0.6rem;
  color: var(--placeholder-text-color);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const StatValue = styled.span`
  font-size: 0.85rem;
  font-weight: 700;
`;

const TrendIndicator = styled.div`
  font-size: 1rem;
`;

export default CombinedSoilChart;