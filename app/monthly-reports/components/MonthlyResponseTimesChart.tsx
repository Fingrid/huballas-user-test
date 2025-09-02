"use client";

import React, { useRef, useEffect } from 'react';
import * as echarts from 'echarts/core';
import echartsTheme from '../../echarts.theme.json';
import { useMonthlyReports } from '../../../lib/stores';
import { useECharts } from '../../../hooks/useECharts';
import { ChartWithRef } from '../../../components/ChartLoadingState';
import { DatasetStatisticsPanel } from '../../../components/StatisticsPanel';

interface MonthlyResponseTimesChartProps {
  selectedMonth: string;
  groupBy: 'channel' | 'process_group' | 'marketRoleCode';
  selectedSegment?: string;
}

export default function MonthlyResponseTimesChart({ 
  selectedMonth,
  groupBy,
  selectedSegment
}: MonthlyResponseTimesChartProps) {
  const { responseTimeChartData, responseTimesLoadingState, loadingState, error } = useMonthlyReports();

  const chartRef = useECharts((chart) => {
    if (!responseTimeChartData || loadingState !== 'ready' || responseTimesLoadingState !== 'ready' || error) return;

    const { dailyResponseTimeStats, chartArrays, displayNames } = responseTimeChartData;
    
    // Use pre-calculated arrays from the store
    const {
      dates,
      averageData,
      medianData,
      maxData,
      minData,
      upperStdData,
      lowerStdData,
      stdDevData,
      avgStdDev,
      stdDevThreshold,
    } = chartArrays;

    const { segment: segmentDisplayName, groupBy: groupDisplayName } = displayNames;

    const option = {
      title: {
        text: `Response Times Confidence Chart - ${selectedMonth}`,
        subtext: `${groupDisplayName}: ${segmentDisplayName} • Outer: Min-Max Range • Inner: ±1 Std Dev • Red points: High Variation (>10% above avg)`,
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'normal',
          color: '#3e5660'
        },
        subtextStyle: {
          fontSize: 12,
          color: '#6d838f'
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross'
        },
        formatter: function(params: any) {
          if (params.length > 0) {
            const dataIndex = params[0].dataIndex;
            const stats = dailyResponseTimeStats[dataIndex];
            const isHighVariability = stats.standardDeviation > stdDevThreshold;
            const variabilityIndicator = isHighVariability ? 
              '<span style="color: #EF4444;">⚠️ High Variability</span>' : 
              '<span style="color: #10B981;">✓ Normal Variability</span>';
            
            const upperStd = Math.round(stats.average + stats.standardDeviation);
            const lowerStd = Math.round(Math.max(0, stats.average - stats.standardDeviation));
            
            return `
              <strong>${stats.date}</strong><br/>
              Average: ${Math.round(stats.average)} ms<br/>
              Median: ${Math.round(stats.median)} ms<br/>
              <br/>
              <strong>Confidence Bands:</strong><br/>
              Min-Max Range: ${Math.round(stats.min)} - ${Math.round(stats.max)} ms<br/>
              ±1 Std Dev Range: ${lowerStd} - ${upperStd} ms<br/>
              <br/>
              Std Dev: ${Math.round(stats.standardDeviation)} ms<br/>
              Avg Std Dev: ${Math.round(avgStdDev)} ms<br/>
              ${variabilityIndicator}<br/>
              Data Points: ${stats.count}
            `;
          }
          return '';
        }
      },
      legend: {
        orient: 'vertical',
        right: '5%',
        top: 'middle',
        data: ['Min-Max Range', '±1 Std Dev Range', 'Average', 'Median']
      },
      visualMap: {
        type: 'piecewise',
        show: false,
        dimension: 0,
        selectedMode: false,
        pieces: stdDevData.map((stdDev, index) => ({
          min: index,
          max: index,
          color: stdDev > stdDevThreshold ? '#EF4444' : '#4F46E5',
          symbol: stdDev > stdDevThreshold ? 'rect' : 'circle',
          symbolSize: stdDev > stdDevThreshold ? [10, 10] : [6, 6]
        })),
        seriesIndex: [4], // Apply to the Average series (index 4)
        right: '5%',
        bottom: '5%',
        itemWidth: 15,
        itemHeight: 10,
        showLabel: false
      },
      grid: {
        left: '3%',
        right: '20%',
        bottom: '3%',
        top: '15%',
        outerBoundsMode: 'same',
        outerBoundsContain: 'axisLabel'
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: {
          rotate: 45,
          formatter: function(value: string) {
            return new Date(value).toLocaleDateString('fi-FI', { 
              month: 'short', 
              day: 'numeric' 
            });
          }
        }
      },
      yAxis: {
        type: 'value',
        name: 'Response Time (ms)',
        nameLocation: 'middle',
        nameGap: 40
      },
      series: [
        // Outer confidence band (min/max variance) - Lower bound
        {
          name: 'Min Bound',
          type: 'line',
          data: minData,
          lineStyle: { opacity: 0 },
          symbol: 'none',
          stack: 'outerBounds',
          showInLegend: false
        },
        // Outer confidence band (min/max variance) - Upper bound
        {
          name: 'Min-Max Range',
          type: 'line',
          data: maxData.map((max, index) => max - minData[index]),
          areaStyle: {
            color: 'rgba(59, 130, 246, 0.15)' // Light blue for outer band
          },
          lineStyle: { opacity: 0 },
          symbol: 'none',
          stack: 'outerBounds',
          itemStyle: {
            color: 'rgba(59, 130, 246, 0.4)' // Solid color for legend
          }
        },
        // Inner confidence band (±1 std deviation) - Lower bound
        {
          name: 'Lower Std Bound',
          type: 'line',
          data: lowerStdData,
          lineStyle: { opacity: 0 },
          symbol: 'none',
          stack: 'innerBounds',
          showInLegend: false
        },
        // Inner confidence band (±1 std deviation) - Upper bound
        {
          name: '±1 Std Dev Range',
          type: 'line',
          data: upperStdData.map((upper, index) => upper - lowerStdData[index]),
          areaStyle: {
            color: 'rgba(59, 130, 246, 0.3)' // Darker blue for inner band
          },
          lineStyle: { opacity: 0 },
          symbol: 'none',
          stack: 'innerBounds',
          itemStyle: {
            color: 'rgba(59, 130, 246, 0.6)' // Solid color for legend
          }
        },
        // Average line
        {
          name: 'Average',
          type: 'line',
          data: averageData,
          lineStyle: {
            color: '#4F46E5',
            width: 3
          },
          itemStyle: {
            color: '#4F46E5'
          },
          symbol: 'circle',
          symbolSize: 6,
          smooth: true
        },
        // Median line
        {
          name: 'Median',
          type: 'line',
          data: medianData,
          lineStyle: {
            color: '#10B981',
            width: 2,
            type: 'dashed'
          },
          itemStyle: {
            color: '#10B981'
          },
          symbol: 'diamond',
          symbolSize: 5,
          smooth: true
        }
      ]
    };

    chart.setOption(option);
  }, {
    dependencies: [responseTimeChartData, selectedMonth, groupBy, selectedSegment]
  });

  return (
    <div className="space-y-6">
      <ChartWithRef
        loading={loadingState === 'loading'}
        error={error}
        loadingMessage="Loading response times..."
        errorTitle="Error loading response times"
        chartRef={chartRef}
        width="100%"
        height={400}
      />

      {responseTimeChartData && responseTimeChartData.datasetStatistics && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Dataset Statistics</h3>
          <DatasetStatisticsPanel 
            datasetStatistics={responseTimeChartData.datasetStatistics}
          />
          
          {responseTimeChartData.responseTimeStatistics && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border">
                <h4 className="text-sm font-semibold text-blue-700 mb-2">Daily Averages Statistics</h4>
                <div className="text-xs space-y-1">
                  <div>
                    <span className="text-blue-600">Mean of Daily Averages:</span>
                    <span className="font-medium ml-1">{Math.round(responseTimeChartData.responseTimeStatistics.averageResponseTimes.average)} ms</span>
                  </div>
                  <div>
                    <span className="text-blue-600">Std Dev of Daily Averages:</span>
                    <span className="font-medium ml-1">{Math.round(responseTimeChartData.responseTimeStatistics.averageResponseTimes.standardDeviation)} ms</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg border">
                <h4 className="text-sm font-semibold text-green-700 mb-2">Daily Std Dev Statistics</h4>
                <div className="text-xs space-y-1">
                  <div>
                    <span className="text-green-600">Mean Std Dev:</span>
                    <span className="font-medium ml-1">{Math.round(responseTimeChartData.responseTimeStatistics.standardDeviations.average)} ms</span>
                  </div>
                  <div>
                    <span className="text-green-600">Threshold (110%):</span>
                    <span className="font-medium ml-1">{Math.round(responseTimeChartData.responseTimeStatistics.standardDeviations.average * 1.1)} ms</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
            <span>Total Days: <strong>{responseTimeChartData.totalDays}</strong></span>
            <span>Total Records: <strong>{responseTimeChartData.totalRecords?.toLocaleString()}</strong></span>
            {responseTimeChartData.dateRange && (
              <span>
                Period: <strong>{responseTimeChartData.dateRange.start}</strong> to <strong>{responseTimeChartData.dateRange.end}</strong>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
