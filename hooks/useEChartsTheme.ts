import { useEffect } from 'react';
import * as echarts from 'echarts/core';
import echartsTheme from '../app/echarts.theme.json';

/**
 * Hook to register ECharts theme once per component
 */
export function useEChartsTheme() {
  useEffect(() => {
    echarts.registerTheme('huballas', echartsTheme);
  }, []);
}
