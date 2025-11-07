import { useEffect, useRef, DependencyList } from 'react';
import * as echarts from 'echarts/core';
import {
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DataZoomComponent,
  ToolboxComponent,
  TitleComponent,
  VisualMapComponent,
  GraphicComponent,
} from 'echarts/components';
import { BarChart, LineChart } from 'echarts/charts';
import { CanvasRenderer, SVGRenderer } from 'echarts/renderers';
import echartsTheme from '@/app/echarts.theme.json';

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
  ToolboxComponent,
  SVGRenderer
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
      chartInstanceRef.current = echarts.init(chartRef.current, 'huballas', {
        renderer: 'svg',
      });
    }

    chartInstanceRef.current.setOption({
      borderRadius: 0,
      toolbox: {
        show: true,
        feature: {
          restore: {},
          saveAsImage: {},
          //dataView: {},
        },
      },
      grid: {
        left: 0,
        right: '33%',
        top: '15%',
        bottom: '15%',
      },
      legend: {
        borderRadius: 0,
        right: '18%',
        top: 'center',
        icon: 'rect'
      },
      dataZoom: [{
        xAxisIndex: 0,
        bottom: 0,
        height: '10%',
      },
      {
        yAxisIndex: 0,
        bottom: "15%",
        top: '20%',
        left: '68%',
      }],
    });

    // Render the chart
    renderChart(chartInstanceRef.current);

    // Cleanup function
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose();
        chartInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, options.dependencies || []);

  return chartRef;
}
