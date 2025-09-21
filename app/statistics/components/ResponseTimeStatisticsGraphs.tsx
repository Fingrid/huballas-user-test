'use client';

import { useMemo } from 'react';
import dayjs from 'dayjs';
import { useResponseTimeStore } from '@/lib/stores';
import { useLocalization } from '@/lib/stores/localization.store';
import { useECharts } from '@/hooks/useECharts';
import type { ResponseTimeRecord } from '@/lib/types';

interface DateRange {
  startDate: string;
  endDate: string;
}

interface ResponseTimeStatisticsGraphsProps {
  activeDateRange: DateRange;
}

interface DailyResponseTimeStats {
  date: string;
  average: number;
  median: number;
  min: number;
  max: number;
  standardDeviation: number;
  count: number;
}

export default function ResponseTimeStatisticsGraphs({ 
  activeDateRange 
}: ResponseTimeStatisticsGraphsProps) {
  const { t } = useLocalization();
  const responseTimeStore = useResponseTimeStore();

  // Prepare response time data for the selected date range
  const responseTimeDataArray = useMemo(() => {
    const responseTimeData = responseTimeStore._rawdata || {};
    
    // Combine all available data
    const allData: ResponseTimeRecord[] = Object.values(responseTimeData)
      .flat()
      .filter((record): record is ResponseTimeRecord => record !== undefined && record !== null);

    // Filter by date range
    const filteredData = allData.filter(record => {
      const recordDate = new Date(record.timestamp).toISOString().split('T')[0];
      return recordDate >= activeDateRange.startDate && recordDate <= activeDateRange.endDate;
    });
    
    return filteredData;
  }, [responseTimeStore._rawdata, activeDateRange]);

  // Process data for daily statistics
  const dailyStats = useMemo((): DailyResponseTimeStats[] => {
    if (!responseTimeDataArray.length) return [];

    // Group by date
    const groupedByDate: { [date: string]: ResponseTimeRecord[] } = {};
    
    responseTimeDataArray.forEach(record => {
      const date = new Date(record.timestamp).toISOString().split('T')[0];
      if (!groupedByDate[date]) {
        groupedByDate[date] = [];
      }
      groupedByDate[date].push(record);
    });

    // Calculate daily statistics
    const dailyStatsArray = Object.entries(groupedByDate)
      .map(([date, records]) => {
        // Extract all response times (weighted by event count)
        const allResponseTimes: number[] = [];
        records.forEach(record => {
          // Add each response time for the number of events
          for (let i = 0; i < record.event_count; i++) {
            allResponseTimes.push(record.mean_response_time_ms);
          }
        });

        if (allResponseTimes.length === 0) {
          return null;
        }

        // Sort for median calculation
        allResponseTimes.sort((a, b) => a - b);

        // Calculate statistics
        const average = allResponseTimes.reduce((sum, time) => sum + time, 0) / allResponseTimes.length;
        const median = allResponseTimes.length % 2 === 0
          ? (allResponseTimes[Math.floor(allResponseTimes.length / 2) - 1] + allResponseTimes[Math.floor(allResponseTimes.length / 2)]) / 2
          : allResponseTimes[Math.floor(allResponseTimes.length / 2)];
        const min = Math.min(...allResponseTimes);
        const max = Math.max(...allResponseTimes);
        
        // Calculate standard deviation
        const variance = allResponseTimes.reduce((sum, time) => sum + Math.pow(time - average, 2), 0) / allResponseTimes.length;
        const standardDeviation = Math.sqrt(variance);

        return {
          date,
          average,
          median,
          min,
          max,
          standardDeviation,
          count: allResponseTimes.length
        };
      })
      .filter(stat => stat !== null)
      .sort((a, b) => a!.date.localeCompare(b!.date)) as DailyResponseTimeStats[];

    return dailyStatsArray;
  }, [responseTimeDataArray]);

  // Process chart data
  const chartData = useMemo(() => {
    if (!dailyStats.length) return null;

    const avgStdDev = dailyStats.reduce((sum, stat) => sum + stat.standardDeviation, 0) / dailyStats.length;
    const stdDevThreshold = avgStdDev * 1.1; // 10% above average std dev

    return {
      dates: dailyStats.map(stat => dayjs(stat.date).format('MMM DD')),
      averageData: dailyStats.map(stat => Math.round(stat.average)),
      medianData: dailyStats.map(stat => Math.round(stat.median)),
      maxData: dailyStats.map(stat => Math.round(stat.max)),
      minData: dailyStats.map(stat => Math.round(stat.min)),
      upperStdData: dailyStats.map(stat => Math.round(stat.average + stat.standardDeviation)),
      lowerStdData: dailyStats.map(stat => Math.round(Math.max(0, stat.average - stat.standardDeviation))),
      stdDevData: dailyStats.map(stat => stat.standardDeviation),
      avgStdDev,
      stdDevThreshold,
      dailyStats
    };
  }, [dailyStats]);

  const chartRef = useECharts((chart) => {
    if (!chartData) return;

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
      dailyStats
    } = chartData;

    const option = {
      title: {
        text: 'Vasteajat päivittäin',
        left: 'center',
        textStyle: {
          color: 'var(--color-text)',
          fontSize: 16,
          fontWeight: 'normal'
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
            const stats = dailyStats[dataIndex];
            const isHighVariability = stats.standardDeviation > stdDevThreshold;
            const variabilityIndicator = isHighVariability ? 
              '<span style="color: #EF4444;">⚠️ Korkea vaihtelu</span>' : 
              '<span style="color: #10B981;">✓ Normaali vaihtelu</span>';
            
            const upperStd = Math.round(stats.average + stats.standardDeviation);
            const lowerStd = Math.round(Math.max(0, stats.average - stats.standardDeviation));
            
            return `
              <strong>${dayjs(stats.date).format('DD.MM.YYYY')}</strong><br/>
              Keskiarvo: ${Math.round(stats.average)} ms<br/>
              Mediaani: ${Math.round(stats.median)} ms<br/>
              <br/>
              <strong>Luottamusvälit:</strong><br/>
              Min-Max: ${Math.round(stats.min)} - ${Math.round(stats.max)} ms<br/>
              ±1 Hajonta: ${lowerStd} - ${upperStd} ms<br/>
              <br/>
              Keskihajonta: ${Math.round(stats.standardDeviation)} ms<br/>
              Keskimääräinen hajonta: ${Math.round(avgStdDev)} ms<br/>
              ${variabilityIndicator}<br/>
              Datapisteitä: ${stats.count}
            `;
          }
          return '';
        }
      },
      legend: {
        type: 'scroll',
        orient: 'vertical',
        right: '5%',
        top: 'middle',
        data: ['Min-Max alue', '±1 Hajonta alue', 'Keskiarvo', 'Mediaani'],
        textStyle: {
          color: 'var(--color-text)'
        }
      },
      grid: {
        left: '3%',
        right: '25%',
        bottom: '15%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: {
          color: 'var(--color-textted)',
          rotate: 45,
          interval: Math.ceil(dates.length / 30) // Show every 30th date for readability
        },
        axisLine: {
          lineStyle: {
            color: 'black'
          }
        }
      },
      yAxis: {
        type: 'value',
        name: 'vasteaika (ms)',
        nameLocation: 'middle',
        nameGap: 40,
        nameTextStyle: {
          color: 'var(--color-text)'
        },
        axisLabel: {
          color: 'var(--color-text)'
        },
        axisLine: {
          lineStyle: {
            color: 'black'
          }
        },
        splitLine: {
          lineStyle: {
            color: 'black',
            type: 'solid'
          }
        }
      },
      series: [
        // Outer confidence band (min/max variance) - Lower bound
        {
          name: 'Min Bound',
          type: 'line',
          data: minData,
          lineStyle: { opacity: 0, color: 'black' },
          symbol: 'none',
          stack: 'outerBounds',
          showInLegend: false
        },
        // Outer confidence band (min/max variance) - Upper bound
        {
          name: 'Min-Max alue',
          type: 'line',
          data: maxData.map((max, index) => max - minData[index]),
          areaStyle: {
            color: 'rgba(59, 130, 246, 0.15)' // Light blue for outer band
          },
          lineStyle: { opacity: 0, color: 'black' },
          symbol: 'none',
          stack: 'outerBounds',
          itemStyle: {
            color: 'rgba(59, 130, 246, 0.5)' // Solid color for legend
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
          name: '±1 Hajonta alue',
          type: 'line',
          data: upperStdData.map((upper, index) => upper - lowerStdData[index]),
          areaStyle: {
            color: 'rgba(59, 130, 246, 0.5)' // Darker blue for inner band
          },
          lineStyle: { opacity: 0, color: 'black' },
          symbol: 'none',
          stack: 'innerBounds',
          itemStyle: {
            color: 'rgba(59, 130, 246, 1)' // Solid color for legend
          }
        },
        // Average line
        {
          name: 'Keskiarvo',
          type: 'line',
          data: averageData,
          lineStyle: {
            color: 'black',
            width: 2
          },
          symbol: 'circle',
          symbolSize: function(value: number, params: any) {
            const dataIndex = params.dataIndex;
            const isHighVariability = stdDevData[dataIndex] > stdDevThreshold;
            return isHighVariability ? 8 : 0;
          },
          itemStyle: {
            color: function(params: any) {
              const dataIndex = params.dataIndex;
              const isHighVariability = stdDevData[dataIndex] > stdDevThreshold;
              return isHighVariability ? '#EF4444' : 'transparent';
            }
          },
          smooth: true
        },
        // Median line
        {
          name: 'Mediaani',
          type: 'line',
          data: medianData,
          lineStyle: {
            color: 'black',
            width: 1,
            type: 'dotted'
          },
          smooth: true
        }
      ]
    };

    chart.setOption(option);
  }, {
    dependencies: [chartData]
  });

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (!dailyStats.length) return null;

    const totalDataPoints = dailyStats.reduce((sum, stat) => sum + stat.count, 0);
    const avgResponseTime = dailyStats.reduce((sum, stat) => sum + stat.average, 0) / dailyStats.length;
    const maxResponseTime = Math.max(...dailyStats.map(stat => stat.max));
    const minResponseTime = Math.min(...dailyStats.map(stat => stat.min));

    return {
      totalDataPoints,
      avgResponseTime: Math.round(avgResponseTime),
      maxResponseTime: Math.round(maxResponseTime),
      minResponseTime: Math.round(minResponseTime),
      totalDays: dailyStats.length
    };
  }, [dailyStats]);

  if (!responseTimeDataArray.length) {
    return (
      <div className="bg-[var(--color-background-level-1)] border border-[var(--color-separator)] p-6 shadow-fingrid rounded-[var(--border-radius-default)] h-64 flex items-center justify-center">
        <p className="text-[var(--color-text-muted)]">Ei vasteaikatietoja valitulta aikaväliltä</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Chart */}
      <div className="bg-[var(--color-background-level-1)] border border-[var(--color-separator)] p-6 shadow-fingrid rounded-[var(--border-radius-default)]">
        <div className="h-96">
          <div ref={chartRef} className="w-full h-full" />
        </div>
      </div>

      {/* Summary Statistics */}
      {summaryStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[var(--color-background-level-1)] border border-[var(--color-separator)] p-4 shadow-fingrid rounded-[var(--border-radius-default)]">
            <h4 className="text-sm font-semibold text-[var(--color-text)] mb-2">Keskimääräinen vasteaika</h4>
            <p className="text-2xl font-bold text-[var(--color-primary)]">{summaryStats.avgResponseTime} ms</p>
          </div>
          <div className="bg-[var(--color-background-level-1)] border border-[var(--color-separator)] p-4 shadow-fingrid rounded-[var(--border-radius-default)]">
            <h4 className="text-sm font-semibold text-[var(--color-text)] mb-2">Analysoitavia päiviä</h4>
            <p className="text-2xl font-bold text-[var(--color-text)]">{summaryStats.totalDays}</p>
          </div>
        </div>
      )}
    </div>
  );
}