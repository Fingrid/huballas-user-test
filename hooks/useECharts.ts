import { useEffect, useRef, DependencyList } from 'react';
import * as echarts from 'echarts/core';
import {
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DataZoomComponent,
  TitleComponent,
  VisualMapComponent,
  GraphicComponent,
} from 'echarts/components';
import { BarChart, LineChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import echartsTheme from '../app/echarts.theme.json';

// Register ECharts components
echarts.use([
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DataZoomComponent,
  TitleComponent,
  VisualMapComponent,
  GraphicComponent,
  BarChart,
  LineChart,
  CanvasRenderer,
]);

echarts.registerTheme('huballas', echartsTheme);

interface UseEChartsOptions {
  dependencies?: DependencyList;
}

/**
 * Hook to manage ECharts instance lifecycle with automatic theme registration
 */
export function useECharts(
  renderChart: (chartInstance: echarts.ECharts) => void,
  options: UseEChartsOptions = {}
) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Initialize or get existing chart instance
    if (!chartInstanceRef.current) {
      chartInstanceRef.current = echarts.init(chartRef.current, 'huballas');
    }

    // Render the chart
    renderChart(chartInstanceRef.current);

    // Cleanup function
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose();
        chartInstanceRef.current = null;
      }
    };
  }, options.dependencies || []);

  return chartRef;
}
