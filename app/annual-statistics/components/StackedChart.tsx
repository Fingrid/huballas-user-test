"use client";

import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import dayjs from 'dayjs';
import echartsTheme from '../../echarts.theme.json';
import {
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DataZoomComponent,
  TitleComponent
} from 'echarts/components';
import { BarChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import type { UsageDataRecord } from '../../../lib/stores';
import { cn } from '../../../lib/cn';

echarts.use([
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DataZoomComponent,
  TitleComponent,
  BarChart,
  CanvasRenderer
]);

type StackingType = 'channel' | 'process_group' | 'marketRoleCode';

interface StackedChartProps {
  stackingType: StackingType;
  getChannelDescription: (code: string) => string;
  getMarketRoleDescription: (code: string) => string;
  usageData: UsageDataRecord[];
}

// Style objects for consistent styling
const styles = {
  container: 'bg-white border border-[var(--color-border-light)] p-6 shadow-sm mb-8',
  chartDiv: 'w-full h-[600px]'
};

export default function StackedChart({ 
  stackingType, 
  getChannelDescription, 
  getMarketRoleDescription, 
  usageData 
}: StackedChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  // Register the custom theme
  useEffect(() => {
    echarts.registerTheme('huballas', echartsTheme);
  }, []);

  useEffect(() => {
    if (!chartRef.current || !usageData || usageData.length === 0) return;
    
    // Aggregate usage data into monthly data by the selected stacking type
    const monthlyAggregatedData: { [monthKey: string]: { [stackKey: string]: number } } = {};
    
    usageData.forEach(record => {
      const monthKey = dayjs(record.event_timestamp).format('YYYY-MM');
      
      if (!monthlyAggregatedData[monthKey]) {
        monthlyAggregatedData[monthKey] = {};
      }
      
      let stackKey: string;
      if (stackingType === 'channel') {
        stackKey = record.channel;
      } else if (stackingType === 'process_group') {
        stackKey = record.process_group;
      } else {
        stackKey = record.marketRoleCode;
      }
      
      monthlyAggregatedData[monthKey][stackKey] = (monthlyAggregatedData[monthKey][stackKey] || 0) + record.event_count;
    });

    // Convert back to StackingData format for monthly periods
    const monthlyStackingData = Object.entries(monthlyAggregatedData).map(([monthKey, stacks]) => ({
      date: monthKey,
      stacks
    })).sort((a, b) => a.date.localeCompare(b.date));

    const chart = echarts.init(chartRef.current, 'huballas');
    
    // Get all unique stack keys
    const allStackKeys = new Set<string>();
    monthlyStackingData.forEach(item => {
      Object.keys(item.stacks).forEach(key => allStackKeys.add(key));
    });
    
    const stackKeysArray = Array.from(allStackKeys);
    
    // Get all unique months and sort them
    const allMonths = monthlyStackingData.map(item => item.date).sort();
    
    // Use theme colors for consistency
    const themeColors = echartsTheme.color;

    const series = stackKeysArray.map((stackKey, index) => ({
      name: stackKey,
      type: 'bar' as const,
      stack: 'total',
      data: allMonths.map(month => {
        const monthData = monthlyStackingData.find(item => item.date === month);
        return monthData?.stacks[stackKey] || 0;
      }),
      itemStyle: {
        color: themeColors[index % themeColors.length]
      }
    }));

    const option = {
      title: {
        text: `Annual Statistics - Monthly Aggregation by ${
          stackingType === 'process_group' ? 'Process Group' : 
          stackingType === 'marketRoleCode' ? 'Market Role' : 
          'Channel'
        }`,
        left: 'center',
        textStyle: {
          color: 'var(--color-text)',
          fontSize: 16,
          fontWeight: 'normal'
        }
      },
      tooltip: {
        trigger: 'axis' as const,
        axisPointer: {
          type: 'cross' as const,
          crossStyle: {
            color: 'var(--color-text-subtle)'
          }
        },
        formatter: function(params: any) {
          let result = `<strong>${params[0].axisValue}</strong><br/>`;
          let total = 0;
          params.forEach((param: any) => {
            const seriesName = param.seriesName;
            let displayName = seriesName;
            
            // Get human-readable description based on stacking type
            if (stackingType === 'channel') {
              displayName = getChannelDescription(seriesName);
            } else if (stackingType === 'marketRoleCode') {
              displayName = getMarketRoleDescription(seriesName);
            }
            
            result += `${param.marker} <strong>${displayName}</strong><br/>`;
            result += `&nbsp;&nbsp;&nbsp;&nbsp;Code: ${seriesName}<br/>`;
            result += `&nbsp;&nbsp;&nbsp;&nbsp;Events: ${param.value.toLocaleString()}<br/>`;
            total += param.value;
          });
          result += `<hr style="margin: 8px 0; border: none; border-top: 1px solid var(--color-separator);"/>`;
          result += `<strong>Total: ${total.toLocaleString()}</strong>`;
          return result;
        }
      },
      legend: {
        type: 'scroll' as const,
        orient: 'vertical' as const,
        right: '5%',
        top: 'center',
        textStyle: {
          color: 'var(--color-text)'
        }
      },
      grid: {
        left: '3%',
        right: '25%',
        bottom: '15%',
        top: '10%',
        containLabel: false
      },
      xAxis: {
        type: 'category' as const,
        data: allMonths.map(month => {
          const date = new Date(month + '-01');
          return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        }),
        axisLabel: {
          color: 'var(--color-text)',
          rotate: 45,
          interval: Math.ceil(allMonths.length / 12)
        },
        axisLine: {
          lineStyle: {
            color: 'var(--color-text)'
          }
        }
      },
      yAxis: {
        type: 'value' as const,
        name: 'Monthly Event Count',
        nameTextStyle: {
          color: 'var(--color-text)'
        },
        axisLabel: {
          color: 'var(--color-text)',
          formatter: (value: number) => value.toLocaleString()
        },
        axisLine: {
          lineStyle: {
            color: 'var(--color-text)'
          }
        },
        splitLine: {
          lineStyle: {
            color: 'rgba(0,0,0,0.1)'
          }
        }
      },
      dataZoom: [
        {
          type: 'slider' as const,
          show: true,
          xAxisIndex: [0],
          start: 0,
          end: 100,
          bottom: '5%'
        }
      ],
      series: series
    };

    chart.setOption(option);

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, [stackingType, usageData, getChannelDescription, getMarketRoleDescription]);

  return (
    <div className={styles.container}>
      <div 
        ref={chartRef} 
        className={styles.chartDiv}
      />
    </div>
  );
}
