import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import * as echarts from 'echarts';

/**
 * React 19 StrictMode-safe ECharts wrapper
 * Replaces echarts-for-react which has componentWillUnmount bugs with React 19
 */
const EChartsWrapper = forwardRef(({
  option,
  style = { height: '300px', width: '100%' },
  className,
  notMerge = false,
  lazyUpdate = false,
  opts = { renderer: 'canvas' }
}, ref) => {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const disposedRef = useRef(false);

  // Expose getEchartsInstance via ref
  useImperativeHandle(ref, () => ({
    getEchartsInstance: () => chartRef.current,
    getInstance: () => chartRef.current
  }), []);

  // Initialize chart
  useEffect(() => {
    if (!containerRef.current) return;

    // Prevent double-init in React 19 StrictMode
    if (chartRef.current) return;

    disposedRef.current = false;
    const chart = echarts.init(containerRef.current, undefined, opts);
    chartRef.current = chart;

    // Set initial option if provided
    if (option) {
      try {
        chart.setOption(option, notMerge, lazyUpdate);
      } catch (e) {
        console.warn('Chart init failed:', e);
      }
    }

    return () => {
      // Safe dispose - check if already disposed
      if (!disposedRef.current && chartRef.current) {
        disposedRef.current = true;
        try {
          chartRef.current.dispose();
        } catch (e) {
          // Ignore dispose errors
        }
        chartRef.current = null;
      }
    };
  }, []); // Only run on mount

  // Update chart when option changes
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !option || disposedRef.current) return;

    try {
      // Check if chart is disposed
      if (chart.isDisposed()) return;
      chart.setOption(option, notMerge, lazyUpdate);
    } catch (e) {
      console.warn('Chart update failed:', e);
    }
  }, [option, notMerge, lazyUpdate]);

  // Handle resize
  const handleResize = useCallback(() => {
    const chart = chartRef.current;
    if (!chart || disposedRef.current) return;
    try {
      if (chart.isDisposed()) return;
      chart.resize();
    } catch (e) {
      // Ignore resize errors
    }
  }, []);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  return (
    <div
      ref={containerRef}
      style={style}
      className={className}
    />
  );
});

EChartsWrapper.displayName = 'EChartsWrapper';

export default EChartsWrapper;
