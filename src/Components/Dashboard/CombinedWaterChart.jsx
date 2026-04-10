import { useState, useEffect, useRef, useMemo } from 'react';
import styled from 'styled-components';
import ReactECharts from 'echarts-for-react';
import { useHomeAssistant } from '../Context/HomeAssistantContext';
import { formatDateTime } from '../../misc/formatDateTime';
import { getThemeColor } from '../../utils/themeColors';
import { FaExclamationTriangle, FaSpinner, FaChartLine, FaArrowUp, FaArrowDown, FaEquals, FaDownload, FaChevronDown } from 'react-icons/fa';
import { Maximize2, Minimize2, LineChart, BarChart3, Image, FileSpreadsheet } from 'lucide-react';

// Combined Water Chart - Shows pH, EC, Water Temperature and optional Tank Level in one chart
const CombinedWaterChart = ({
  waterSensors,
  isGlobalLiveMode = false,
  globalLiveRefreshTrigger = 0,
  onLiveModeChange
}) => {
  const getDefaultDate = (offset = 0) => {
    const date = new Date(Date.now() + offset);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString().slice(0, 16);
  };

  const { haApiBaseUrl, haToken: accessToken, entities } = useHomeAssistant();
  const isDev = import.meta.env.DEV;
  const HISTORY_FETCH_TIMEOUT_MS = 15000;

  // Store chart data in ref
  const chartDataRef = useRef({
    ph: { xData: [], yData: [] },
    ec: { xData: [], yData: [] },
    temp: { xData: [], yData: [] },
    tankLevel: { xData: [], yData: [] }
  });
  const currentValuesRef = useRef({ ph: null, ec: null, temp: null, tankLevel: null });

  const [startDate, setStartDate] = useState(getDefaultDate(-12 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState(getDefaultDate());
  const [chartOptions, setChartOptions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedView, setSelectedView] = useState('12h');
  const [isLive, setIsLive] = useState(false);
  const liveIntervalRef = useRef(null);
  const [stats, setStats] = useState({
    ph: { current: '--', min: '--', max: '--', avg: '--', trend: 'stable' },
    ec: { current: '--', min: '--', max: '--', avg: '--', trend: 'stable' },
    temp: { current: '--', min: '--', max: '--', avg: '--', trend: 'stable' },
    tankLevel: { current: '--', min: '--', max: '--', avg: '--', trend: 'stable' }
  });
  const [chartType, setChartType] = useState('line');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const chartRef = useRef(null);

  // Sensor configuration with colors - use useMemo to update when waterSensors change
  const sensorsConfig = useMemo(() => ({
    ph: { id: waterSensors?.ph?.id, title: 'pH', unit: '', color: '#8b5cf6', yAxisIndex: 0 },
    ec: { id: waterSensors?.ec?.id, title: 'EC', unit: 'mS/cm', color: '#f59e0b', yAxisIndex: 1 },
    temp: { id: waterSensors?.temp?.id, title: 'Water Temp', unit: '°C', color: '#06b6d4', yAxisIndex: 2 },
    tankLevel: { id: waterSensors?.tankLevel?.id, title: 'Tank Level', unit: '%', color: '#3b82f6', yAxisIndex: 3, optional: true }
  }), [waterSensors]);

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
      link.download = `water_overview_${selectedView}_${new Date().toISOString().slice(0,10)}.png`;
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
    const chartInstance = chartRef.current?.getEchartsInstance();
    if (!chartInstance) return;

    const option = chartInstance.getOption();
    const xData = option.xAxis[0].data;
    const series = option.series;

    const headers = ['Timestamp', 'pH', 'EC (mS/cm)', 'Water Temp (°C)'];
    if (waterSensors?.tankLevel) headers.push('Tank Level (%)');

    const csvContent = [
      headers.join(','),
      ...xData.map((x, i) => {
        const values = [x];
        values.push(series[0]?.data?.[i] ?? '');
        values.push(series[2]?.data?.[i] ?? '');
        values.push(series[4]?.data?.[i] ?? '');
        if (waterSensors?.tankLevel) {
          values.push(series[6]?.data?.[i] ?? '');
        }
        return values.join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.download = `water_overview_${selectedView}_${new Date().toISOString().slice(0,10)}.csv`;
    link.href = URL.createObjectURL(blob);
    link.click();
    setShowExportMenu(false);
  };

  const handleViewChange = (view) => {
    const isLiveMode = view === 'Live';
    setSelectedView(view);
    setIsLive(isLiveMode);

    if (onLiveModeChange) {
      onLiveModeChange(isLiveMode);
    }

    if (liveIntervalRef.current) {
      clearInterval(liveIntervalRef.current);
      liveIntervalRef.current = null;
    }

    if (isLiveMode) {
      const now = new Date();
      setStartDate(now.toISOString().slice(0, 16));
      setEndDate(now.toISOString().slice(0, 16));

      liveIntervalRef.current = setInterval(() => {
        const currentTime = new Date();
        setEndDate(currentTime.toISOString().slice(0, 16));
      }, 30000);
    } else {
      const hours = view === '6h' ? 6 : view === '12h' ? 12 : view === '24h' ? 24 : 168;
      setStartDate(getDefaultDate(-hours * 60 * 60 * 1000));
      setEndDate(getDefaultDate());
    }
  };

  // Sync with global live mode
  useEffect(() => {
    if (isGlobalLiveMode !== isLive) {
      handleViewChange(isGlobalLiveMode ? 'Live' : '12h');
    }
  }, [isGlobalLiveMode, globalLiveRefreshTrigger]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (liveIntervalRef.current) {
        clearInterval(liveIntervalRef.current);
      }
    };
  }, []);

  // Fetch data for all water sensors
  useEffect(() => {
    const fetchAllSensorData = async () => {
      if ((!isDev && !haApiBaseUrl) || !accessToken) {
        setError('Connection not configured');
        return;
      }

      // Check if we have any water sensors
      const hasAnySensors = Object.values(sensorsConfig).some(config => config.id);
      if (!hasAnySensors) {
        setError('No water sensors available');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Fetch all sensors in parallel
        const fetchPromises = Object.entries(sensorsConfig).map(async ([key, config]) => {
          if (!config.id || (config.optional && !waterSensors?.[key])) return { key, data: null };

          const url = `${haApiBaseUrl || ''}/api/history/period/${encodeURIComponent(startDate)}?filter_entity_id=${config.id}&end_time=${encodeURIComponent(endDate)}&minimal_response`;

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), HISTORY_FETCH_TIMEOUT_MS);

          try {
            const response = await fetch(url, {
              headers: { 'Authorization': `Bearer ${accessToken}` },
              signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            return { key, data };
          } catch (err) {
            clearTimeout(timeoutId);
            return { key, data: null, error: err.message };
          }
        });

        const results = await Promise.all(fetchPromises);

        // Process results
        const processedData = {};
        const newStats = { ...stats };

        results.forEach(({ key, data, error: fetchError }) => {
          if (fetchError || !data || !Array.isArray(data) || data.length === 0 || !data[0]?.length) {
            processedData[key] = { xData: [], yData: [], avg: 0 };
            return;
          }

          const sensorData = data[0];
          const values = sensorData.map(item => parseFloat(item.state)).filter(v => !isNaN(v));

          // Calculate stats
          const current = values.length > 0 ? values[values.length - 1] : 0;
          const min = values.length > 0 ? Math.min(...values) : 0;
          const max = values.length > 0 ? Math.max(...values) : 0;
          const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;

          // Calculate trend
          const firstHalf = values.slice(0, Math.floor(values.length / 2));
          const secondHalf = values.slice(Math.floor(values.length / 2));
          const firstAvg = firstHalf.length > 0 ? firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length : 0;
          const secondAvg = secondHalf.length > 0 ? secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length : 0;
          const trend = secondAvg > firstAvg * 1.05 ? 'up' : secondAvg < firstAvg * 0.95 ? 'down' : 'stable';

          newStats[key] = {
            current: current.toFixed(2),
            min: min.toFixed(2),
            max: max.toFixed(2),
            avg: avg.toFixed(2),
            trend
          };

          // Process data points
          let lastValidValue = null;
          const filledYData = sensorData.map(item => {
            const val = parseFloat(item.state);
            if (!isNaN(val)) {
              lastValidValue = val;
              return val;
            }
            return lastValidValue;
          });

          processedData[key] = {
            xData: sensorData.map(item => item.last_changed),
            yData: filledYData,
            avg
          };
        });

        setStats(newStats);
        chartDataRef.current = processedData;

        // Update current values ref
        currentValuesRef.current = {
          ph: parseFloat(newStats.ph.current) || null,
          ec: parseFloat(newStats.ec.current) || null,
          temp: parseFloat(newStats.temp.current) || null,
          tankLevel: waterSensors?.tankLevel ? parseFloat(newStats.tankLevel.current) || null : null
        };

        // Build chart options
        const textColor = getThemeColor('--main-text-color');
        const secondaryTextColor = getThemeColor('--second-text-color');
        const gridColor = getThemeColor('--glass-border');

        // Helper function to create [timestamp, value] pairs for each sensor
        // This keeps each sensor's data independent with its own timestamps
        const createTimeValuePairs = (sensorKey) => {
          const sensorData = processedData[sensorKey];
          if (!sensorData?.xData?.length || !sensorData?.yData?.length) {
            return { data: [], avg: sensorData?.avg || 0 };
          }
          
          // Create [timestamp, value] pairs - each sensor keeps its own timestamps
          const pairs = sensorData.xData.map((ts, idx) => [ts, sensorData.yData[idx]]);
          
          return { data: pairs, avg: sensorData.avg };
        };
        
        // Create time-value pairs for each sensor (independent timestamps)
        const phData = createTimeValuePairs('ph');
        const ecData = createTimeValuePairs('ec');
        const tempData = createTimeValuePairs('temp');
        const tankLevelData = createTimeValuePairs('tankLevel');

        // Create unified X-axis with all timestamps from all sensors (like DashboardChart)
        const allTimestamps = new Set();
        ['ph', 'ec', 'temp', 'tankLevel'].forEach(key => {
          if (processedData[key]?.xData) {
            processedData[key].xData.forEach(ts => allTimestamps.add(ts));
          }
        });
        const baseXData = Array.from(allTimestamps).sort();

        // Helper function to align sensor data to unified x-axis (like DashboardChart)
        const alignDataToXAxis = (sensorKey) => {
          const sensorData = processedData[sensorKey];
          if (!sensorData?.xData?.length || !sensorData?.yData?.length) {
            return { data: [], avg: sensorData?.avg || 0 };
          }
          
          const alignedData = [];
          const xMap = new Map();
          
          // Create map of timestamp -> value
          sensorData.xData.forEach((ts, idx) => {
            if (!xMap.has(ts)) {
              xMap.set(ts, sensorData.yData[idx]);
            }
          });
          
          // Fill aligned data for each timestamp in baseXData
          let lastValue = null;
          baseXData.forEach(ts => {
            if (xMap.has(ts)) {
              lastValue = xMap.get(ts);
              alignedData.push(lastValue);
            } else if (lastValue !== null) {
              alignedData.push(lastValue);
            } else {
              alignedData.push(sensorData.yData[0] || 0);
            }
          });
          
          return { data: alignedData, avg: sensorData.avg };
        };
        
        // Align all sensor data to unified x-axis
        const alignedPH = alignDataToXAxis('ph');
        const alignedEC = alignDataToXAxis('ec');
        const alignedTemp = alignDataToXAxis('temp');
        const alignedTankLevel = alignDataToXAxis('tankLevel');

        // Build legend data
        const legendData = ['pH', 'EC', 'Water Temp'];
        if (waterSensors?.tankLevel && alignedTankLevel.data.length > 0) legendData.push('Tank Level');

        // Build Y-axes
        const yAxes = [
          // pH Y-Axis (left)
          {
            type: 'value',
            name: 'pH',
            nameTextStyle: { color: sensorsConfig.ph.color, fontSize: 11, fontWeight: 'bold' },
            axisLine: { show: true, lineStyle: { color: sensorsConfig.ph.color } },
            axisLabel: { color: sensorsConfig.ph.color, fontSize: 10, formatter: '{value}' },
            splitLine: { lineStyle: { color: gridColor + '20', type: 'dashed' } },
            position: 'left'
          },
          // EC Y-Axis (right)
          {
            type: 'value',
            name: '',
            nameTextStyle: { show: false },
            axisLine: { show: true, lineStyle: { color: sensorsConfig.ec.color } },
            axisLabel: { color: sensorsConfig.ec.color, fontSize: 10, formatter: '{value}' },
            splitLine: { show: false },
            position: 'right'
          },
          // Water Temp Y-Axis (right)
          {
            type: 'value',
            name: '',
            nameTextStyle: { show: false },
            axisLine: { show: true, lineStyle: { color: sensorsConfig.temp.color } },
            axisLabel: { color: sensorsConfig.temp.color, fontSize: 10, formatter: '{value}' },
            splitLine: { show: false },
            position: 'right',
            offset: 40
          }
        ];

        // Add Tank Level Y-axis if available
        if (waterSensors?.tankLevel && tankLevelData.data.length > 0) {
          yAxes.push({
            type: 'value',
            name: '',
            nameTextStyle: { show: false },
            axisLine: { show: true, lineStyle: { color: sensorsConfig.tankLevel.color } },
            axisLabel: { color: sensorsConfig.tankLevel.color, fontSize: 10, formatter: '{value}' },
            splitLine: { show: false },
            position: 'right',
            offset: 80
          });
        }

        // Build series using time-value pairs (each sensor has its own timestamps)
        const series = [];

        // pH Series - aligned to unified x-axis
        if (alignedPH.data.length > 0) {
          series.push({
            name: 'pH',
            data: alignedPH.data,
            type: chartType === 'area' ? 'line' : chartType,
            yAxisIndex: 0,
            smooth: 0.3,
            symbol: chartType === 'line' || chartType === 'area' ? 'circle' : 'rect',
            symbolSize: chartType === 'line' || chartType === 'area' ? 4 : 8,
            showSymbol: chartType === 'line' || chartType === 'area' ? false : true,
            itemStyle: { color: sensorsConfig.ph.color },
            lineStyle: chartType !== 'bar' ? {
              width: 3,
              color: sensorsConfig.ph.color,
              shadowColor: sensorsConfig.ph.color + '40',
              shadowBlur: 10
            } : { width: 0 },
            areaStyle: chartType === 'bar' ? undefined : {
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                  { offset: 0, color: sensorsConfig.ph.color + '40' },
                  { offset: 1, color: sensorsConfig.ph.color + '05' }
                ]
              }
            }
          });
        }

        // EC Series - aligned to unified x-axis
        if (alignedEC.data.length > 0) {
          series.push({
            name: 'EC',
            data: alignedEC.data,
            type: chartType === 'area' ? 'line' : chartType,
            yAxisIndex: 1,
            smooth: 0.3,
            symbol: chartType === 'line' || chartType === 'area' ? 'circle' : 'rect',
            symbolSize: chartType === 'line' || chartType === 'area' ? 4 : 8,
            showSymbol: chartType === 'line' || chartType === 'area' ? false : true,
            itemStyle: { color: sensorsConfig.ec.color },
            lineStyle: chartType !== 'bar' ? {
              width: 3,
              color: sensorsConfig.ec.color,
              shadowColor: sensorsConfig.ec.color + '40',
              shadowBlur: 10
            } : { width: 0 },
            areaStyle: chartType === 'bar' ? undefined : {
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                  { offset: 0, color: sensorsConfig.ec.color + '40' },
                  { offset: 1, color: sensorsConfig.ec.color + '05' }
                ]
              }
            }
          });
        }

        // Water Temp Series - aligned to unified x-axis
        if (alignedTemp.data.length > 0) {
          series.push({
            name: 'Water Temp',
            data: alignedTemp.data,
            type: chartType === 'area' ? 'line' : chartType,
            yAxisIndex: 2,
            smooth: 0.3,
            symbol: chartType === 'line' || chartType === 'area' ? 'circle' : 'rect',
            symbolSize: chartType === 'line' || chartType === 'area' ? 4 : 8,
            showSymbol: chartType === 'line' || chartType === 'area' ? false : true,
            itemStyle: { color: sensorsConfig.temp.color },
            lineStyle: chartType !== 'bar' ? {
              width: 3,
              color: sensorsConfig.temp.color,
              shadowColor: sensorsConfig.temp.color + '40',
              shadowBlur: 10
            } : { width: 0 },
            areaStyle: chartType === 'bar' ? undefined : {
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                  { offset: 0, color: sensorsConfig.temp.color + '40' },
                  { offset: 1, color: sensorsConfig.temp.color + '05' }
                ]
              }
            }
          });
        }

        // Tank Level Series - aligned to unified x-axis
        if (waterSensors?.tankLevel && alignedTankLevel.data.length > 0) {
          series.push({
            name: 'Tank Level',
            data: alignedTankLevel.data,
            type: chartType === 'area' ? 'line' : chartType,
            yAxisIndex: 3,
            smooth: 0.3,
            symbol: chartType === 'line' || chartType === 'area' ? 'circle' : 'rect',
            symbolSize: chartType === 'line' || chartType === 'area' ? 4 : 8,
            showSymbol: chartType === 'line' || chartType === 'area' ? false : true,
            itemStyle: { color: sensorsConfig.tankLevel.color },
            lineStyle: chartType !== 'bar' ? {
              width: 3,
              color: sensorsConfig.tankLevel.color,
              shadowColor: sensorsConfig.tankLevel.color + '40',
              shadowBlur: 10
            } : { width: 0 },
            areaStyle: chartType === 'bar' ? undefined : {
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                  { offset: 0, color: sensorsConfig.tankLevel.color + '40' },
                  { offset: 1, color: sensorsConfig.tankLevel.color + '05' }
                ]
              }
            }
          });
        }

        setChartOptions({
          backgroundColor: 'transparent',
          grid: {
            top: 80,
            right: waterSensors?.tankLevel && tankLevelData.data.length > 0 ? 140 : 100,
            bottom: 60,
            left: 60
          },
          tooltip: {
            trigger: 'axis',
            backgroundColor: getThemeColor('--main-bg-card-color'),
            borderColor: getThemeColor('--glass-border'),
            borderWidth: 1,
            padding: [12, 16],
            textStyle: { color: textColor, fontSize: 13 },
            formatter: (params) => {
              // Get timestamp from first param - it's the axis value
              const timestamp = params[0]?.axisValue;
              if (!timestamp) return '';
              
              const date = formatDateTime(timestamp);
              let html = `<div style="font-weight:600;margin-bottom:8px">${date}</div>`;

              // Group params by series name (excluding AVG lines)
              const sensorValues = {};
              params.forEach(p => {
                if (!p.seriesName.includes('AVG') && p.value !== undefined && p.value !== null) {
                  // For time axis, value is the Y value (not [timestamp, value])
                  sensorValues[p.seriesName] = Array.isArray(p.value) ? p.value[1] : p.value;
                }
              });

              const sensorOrder = [
                { name: 'pH', config: sensorsConfig.ph },
                { name: 'EC', config: sensorsConfig.ec },
                { name: 'Water Temp', config: sensorsConfig.temp },
                { name: 'Tank Level', config: sensorsConfig.tankLevel }
              ];

              sensorOrder.forEach(({ name, config }) => {
                if (sensorValues[name] !== undefined && config && config.id) {
                  html += `
                    <div style="display:flex;align-items:center;gap:8px;margin:4px 0">
                      <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${config.color}"></span>
                      <span style="font-size:14px;font-weight:600">${name}:</span>
                      <span style="font-size:14px;font-weight:700">${parseFloat(sensorValues[name]).toFixed(2)} ${config.unit}</span>
                    </div>
                  `;
                }
              });

              return html;
            }
          },
          legend: {
            data: legendData,
            top: 10,
            textStyle: { color: textColor, fontSize: 12 },
            itemGap: 20
          },
          dataZoom: [{
            type: 'inside',
            start: 0,
            end: 100
          }],
          xAxis: {
            type: 'category',
            data: baseXData,
            boundaryGap: false,
            axisLine: { lineStyle: { color: gridColor } },
            axisLabel: {
              color: secondaryTextColor,
              fontSize: 11,
              formatter: (value) => {
                const date = new Date(value);
                const now = new Date();
                const isToday = date.toDateString() === now.toDateString();
                if (isToday) {
                  return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
                }
                return `${date.getDate()}.${date.getMonth() + 1} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
              }
            },
            splitLine: { show: false }
          },
          yAxis: yAxes,
          series: series
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAllSensorData();
  }, [startDate, endDate, waterSensors, haApiBaseUrl, accessToken, chartType]);

  // Live update effect - updates chart when new data comes from WebSocket
  useEffect(() => {
    if (!waterSensors || !entities || !chartOptions) return;

    const chartInstance = chartRef.current?.getEchartsInstance();
    if (!chartInstance) return;

    let hasUpdate = false;
    const now = new Date().toISOString();
    const seriesUpdates = [];
    let newXData = null;

    // Process each sensor
    Object.entries(sensorsConfig).forEach(([key, config]) => {
      if (!config.id || (config.optional && !waterSensors?.[key])) return;

      const entity = entities[config.id];
      if (!entity || !entity.state) return;

      const newValue = parseFloat(entity.state);
      if (isNaN(newValue)) return;

      // Only update if value changed
      if (currentValuesRef.current[key] === newValue) return;
      currentValuesRef.current[key] = newValue;
      hasUpdate = true;

      // Update stats
      setStats(prev => ({
        ...prev,
        [key]: { ...prev[key], current: newValue.toFixed(2) }
      }));

      // Update chart data
      const currentData = chartDataRef.current[key];
      if (currentData?.xData?.length > 0) {
        // Add new data point
        const xData = [...currentData.xData, now];
        const yData = [...currentData.yData, newValue];

        // Keep only last 1000 points
        if (xData.length > 1000) {
          xData.shift();
          yData.shift();
        }

        // Calculate new average
        const newAvg = yData.reduce((a, b) => a + b, 0) / yData.length;
        chartDataRef.current[key] = { xData, yData, avg: newAvg };
        
        // Store for batch update
        newXData = xData;

        // Update stats avg
        setStats(prev => ({
          ...prev,
          [key]: { ...prev[key], avg: newAvg.toFixed(2) }
        }));

        // Find series indices for this sensor
        try {
          const option = chartInstance.getOption();
          if (!option || !option.series) return;
          
          const series = option.series;
          let dataSeriesIndex = -1;
          let avgSeriesIndex = -1;
          
          series.forEach((s, idx) => {
            if (s.name === config.title) dataSeriesIndex = idx;
            // Check for AVG line with different naming patterns
            if (s.name === `${config.title} AVG` || 
                (key === 'ph' && s.name === 'pH AVG') ||
                (key === 'ec' && s.name === 'EC AVG') ||
                (key === 'temp' && s.name === 'Water Temp AVG') ||
                (key === 'tankLevel' && s.name === 'Tank Level AVG')) {
              avgSeriesIndex = idx;
            }
          });

          if (dataSeriesIndex >= 0) {
            seriesUpdates[dataSeriesIndex] = { data: yData };
          }
          if (avgSeriesIndex >= 0) {
            seriesUpdates[avgSeriesIndex] = { data: yData.map(() => newAvg) };
          }
        } catch (e) {
          // Chart not ready, skip update
          return;
        }
      }
    });

    // Update chart directly without full re-fetch
    if (hasUpdate && seriesUpdates.length > 0) {
      try {
        const updateOption = {};
        if (newXData) {
          updateOption.xAxis = { data: newXData };
        }
        updateOption.series = seriesUpdates;
        
        chartInstance.setOption(updateOption);
      } catch (e) {
        console.warn('Chart update failed:', e);
      }
    }
  }, [entities, waterSensors, chartOptions, sensorsConfig]);

  const getTrendIcon = (trend) => {
    if (trend === 'up') return <FaArrowUp style={{ color: getThemeColor('--chart-success-color') }} />;
    if (trend === 'down') return <FaArrowDown style={{ color: getThemeColor('--chart-error-color') }} />;
    return <FaEquals style={{ color: getThemeColor('--second-text-color') }} />;
  };

  if (error) {
    return (
      <ChartCard>
        <ErrorState>
          <FaExclamationTriangle size={32} />
          <div>{error}</div>
        </ErrorState>
      </ChartCard>
    );
  }

  return (
    <ChartCard $fullscreen={isFullscreen}>
      <ChartHeader>
        <HeaderTopRow>
          <TitleSection>
            <ChartTitle>Water Overview</ChartTitle>
            <ChartSubtitle>pH, EC, Water Temperature {waterSensors?.tankLevel && '& Tank Level'}</ChartSubtitle>
          </TitleSection>
          <HeaderRightSection>
            <ChartTypeSelector>
              <ChartTypeBtn $active={chartType === 'line'} onClick={() => setChartType('line')} title="Line">
                <LineChart size={14} />
              </ChartTypeBtn>
              <ChartTypeBtn $active={chartType === 'bar'} onClick={() => setChartType('bar')} title="Bar">
                <BarChart3 size={14} />
              </ChartTypeBtn>
            </ChartTypeSelector>
          </HeaderRightSection>
        </HeaderTopRow>

        <StatsRow>
          <StatBox>
            <StatLabel style={{ color: sensorsConfig.ph.color }}>pH</StatLabel>
            <StatValue>{stats.ph.current}</StatValue>
            <TrendIndicator>{getTrendIcon(stats.ph.trend)}</TrendIndicator>
            <StatAvg>Ø {stats.ph.avg}</StatAvg>
          </StatBox>
          <StatBox>
            <StatLabel style={{ color: sensorsConfig.ec.color }}>EC</StatLabel>
            <StatValue>{stats.ec.current}<Unit>mS/cm</Unit></StatValue>
            <TrendIndicator>{getTrendIcon(stats.ec.trend)}</TrendIndicator>
            <StatAvg>Ø {stats.ec.avg}</StatAvg>
          </StatBox>
          <StatBox>
            <StatLabel style={{ color: sensorsConfig.temp.color }}>Water Temp</StatLabel>
            <StatValue>{stats.temp.current}<Unit>°C</Unit></StatValue>
            <TrendIndicator>{getTrendIcon(stats.temp.trend)}</TrendIndicator>
            <StatAvg>Ø {stats.temp.avg}</StatAvg>
          </StatBox>
          {waterSensors?.tankLevel && stats.tankLevel.current !== '--' && (
            <StatBox>
              <StatLabel style={{ color: sensorsConfig.tankLevel.color }}>Tank Level</StatLabel>
              <StatValue>{stats.tankLevel.current}<Unit>%</Unit></StatValue>
              <TrendIndicator>{getTrendIcon(stats.tankLevel.trend)}</TrendIndicator>
              <StatAvg>Ø {stats.tankLevel.avg}</StatAvg>
            </StatBox>
          )}
        </StatsRow>

        <HeaderBottomRow>
          <HeaderActions>
            <FullscreenBtn onClick={() => setIsFullscreen(!isFullscreen)} title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </FullscreenBtn>
            <ExportBtnContainer>
              <ExportBtn onClick={() => setShowExportMenu(!showExportMenu)} title="Export">
                <FaDownload size={14} />
              </ExportBtn>
              {showExportMenu && (
                <ExportMenu>
                  <ExportMenuBtn onClick={handleExportPNG}>
                    <Image size={14} />
                    <span>PNG Image</span>
                  </ExportMenuBtn>
                  <ExportMenuBtn onClick={handleExportCSV}>
                    <FileSpreadsheet size={14} />
                    <span>CSV Data</span>
                  </ExportMenuBtn>
                </ExportMenu>
              )}
            </ExportBtnContainer>
          </HeaderActions>
          <TimeSelector>
            {['Live', '6h', '12h', '24h', '7d'].map(view => (
              <TimeButton
                key={view}
                $active={selectedView === view}
                onClick={() => handleViewChange(view)}
              >
                {view}
              </TimeButton>
            ))}
          </TimeSelector>
        </HeaderBottomRow>
      </ChartHeader>

      <ChartContainer $fullscreen={isFullscreen}>
        {loading ? (
          <LoadingState>
            <FaSpinner className="spin" size={32} />
            <span>Loading water data...</span>
          </LoadingState>
        ) : chartOptions ? (
          <ReactECharts
            ref={chartRef}
            option={chartOptions}
            notMerge={false}
            lazyUpdate={false}
            style={{ height: isFullscreen ? '70vh' : '350px', width: '100%' }}
            opts={{ renderer: 'canvas' }}
          />
        ) : (
          <NoDataState>
            <FaChartLine size={32} />
            <span>No water data available</span>
          </NoDataState>
        )}
      </ChartContainer>
    </ChartCard>
  );
};

export default CombinedWaterChart;

// Styled Components (same as CombinedClimateChart)
const ChartCard = styled.div`
  background: ${props => props.$fullscreen ? 'var(--main-bg-card-color)' : 'var(--glass-bg-primary)'};
  border: 1px solid var(--glass-border);
  border-radius: 20px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  position: ${props => props.$fullscreen ? 'fixed' : 'relative'};
  top: ${props => props.$fullscreen ? '0' : 'auto'};
  left: ${props => props.$fullscreen ? '0' : 'auto'};
  width: ${props => props.$fullscreen ? '100vw' : '100%'};
  height: ${props => props.$fullscreen ? '100vh' : 'auto'};
  z-index: ${props => props.$fullscreen ? '9999' : '1'};
  padding: ${props => props.$fullscreen ? '2rem' : '1.5rem'};
  overflow: auto;
`;

const ChartHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const HeaderTopRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const TitleSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const HeaderRightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const ChartTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--main-text-color);
  margin: 0;
`;

const ChartSubtitle = styled.span`
  font-size: 0.85rem;
  color: var(--second-text-color);
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
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: ${props => props.$active ? 'var(--primary-accent)' : 'var(--active-bg-color)'};
  }
`;

const StatsRow = styled.div`
  display: flex;
  gap: 1rem;
  padding: 0.75rem;
  background: var(--glass-bg-secondary);
  border-radius: 12px;
  flex-wrap: wrap;
`;

const StatBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  flex: 1;
  min-width: 70px;
  position: relative;
`;

const StatLabel = styled.span`
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const StatValue = styled.span`
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--main-text-color);
  display: flex;
  align-items: baseline;
  gap: 0.25rem;
`;

const Unit = styled.span`
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--second-text-color);
`;

const TrendIndicator = styled.div`
  font-size: 0.85rem;
  position: absolute;
  top: 0;
  right: 0;
`;

const StatAvg = styled.span`
  font-size: 0.7rem;
  color: var(--second-text-color);
  font-weight: 500;
`;

const HeaderBottomRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const FullscreenBtn = styled.button`
  background: var(--glass-bg-secondary);
  border: 1px solid var(--glass-border);
  border-radius: 8px;
  padding: 0.5rem;
  cursor: pointer;
  color: var(--placeholder-text-color);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: var(--active-bg-color);
    color: var(--primary-accent);
    border-color: var(--primary-accent);
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
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: var(--active-bg-color);
    color: var(--primary-accent);
    border-color: var(--primary-accent);
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
  min-width: 140px;
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
  transition: all 0.2s ease;
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
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.$active ? 'var(--primary-accent)' : 'var(--glass-bg-primary)'};
  }
`;

const ChartContainer = styled.div`
  min-height: 350px;
  background: var(--glass-bg-secondary);
  border-radius: 12px;
  overflow: hidden;
  height: ${props => props.$fullscreen ? 'auto' : '350px'};
  flex: ${props => props.$fullscreen ? '1' : 'none'};
`;

const LoadingState = styled.div`
  height: 350px;
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
  height: 350px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: var(--chart-error-color);
`;

const NoDataState = styled.div`
  height: 350px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: var(--placeholder-text-color);
`;
