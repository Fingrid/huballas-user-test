'use client';

import { useMemo, useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { useResponseTimeStore, useDictionaryStore } from '@/lib/stores';
import { useLocalization } from '@/lib/stores/localization.store';
import { useECharts } from '@/lib/hooks/useECharts';
import GroupingSelector from '../controls/GroupingSelector';
import ResponseTimeBreakdownTable from '../tables/ResponseTimeBreakdownTable';

interface DateRange {
  startDate: string;
  endDate: string;
}

interface ResponseTimeStatisticsGraphsProps {
  activeDateRange: DateRange;
}

export default function ResponseTimeStatisticsGraphs({ 
  activeDateRange 
}: ResponseTimeStatisticsGraphsProps) {
  const { t } = useLocalization();
  const responseTimeStore = useResponseTimeStore();
  const dictionaryStore = useDictionaryStore();

  // Single channel selection state - default to REST_API
  const [selectedChannel, setSelectedChannel] = useState<string>('REST_API');
  
  // Get available channels from the store
  const availableChannels = useMemo(() => {
    return responseTimeStore.getAvailableChannels();
  }, [responseTimeStore]);

  // Channel options for GroupingSelector
  const channelOptions = useMemo(() => {
    return availableChannels.map(channel => ({
      value: channel,
      label: dictionaryStore.getChannelDescription(channel)
    }));
  }, [availableChannels, dictionaryStore]);

  // Get processed data from the store for the selected date range and single channel
  const processedData = useMemo(() => {
    return responseTimeStore.getProcessedDataForRange(
      activeDateRange.startDate, 
      activeDateRange.endDate,
      [selectedChannel] // Pass single channel as array
    );
  }, [responseTimeStore, activeDateRange, selectedChannel]);

  const chartRef = useECharts((chart) => {
    if (!processedData) return;

    const {
      dailyStats,
      chartData: {
        dates,
        averageData,
        medianData,
        maxData,
        minData,
        upperStdData,
        lowerStdData,
        stdDevData,
        avgStdDev,
        stdDevThreshold
      }
    } = processedData;

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
        data: dates.map(date => dayjs(date).format('MMM DD')),
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
          showInLegend: false,
          icon: 'rect'
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
          showInLegend: false,
          icon: 'rect'
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
    dependencies: [processedData]
  });

  if (!processedData) {
    return (
      <div className="bg-[var(--color-background-level-1)] border border-[var(--color-separator)] p-6 shadow-fingrid rounded-[var(--border-radius-default)] h-64 flex items-center justify-center">
        <p className="text-[var(--color-text-muted)]">Ei vasteaikatietoja valitulta aikaväliltä</p>
      </div>
    );
  }

  const { channelBreakdown } = processedData;

  return (
    <div className="space-y-6">
      {/* Chart */}
      <div className="bg-[var(--color-background-level-1)] border border-[var(--color-separator)] p-6 shadow-fingrid rounded-[var(--border-radius-default)] relative">
        {/* Channel Selector in top right corner */}
        <div className="absolute top-4 right-4 z-10">
          <GroupingSelector
            value={selectedChannel}
            onChange={setSelectedChannel}
            options={channelOptions}
            label={t('statistics.filters.channels')}
          />
        </div>
        
        <div className="h-96">
          <div ref={chartRef} className="w-full h-full" />
        </div>
      </div>

      {/* Channel Breakdown Table */}
      <ResponseTimeBreakdownTable channelBreakdown={channelBreakdown} />
    </div>
  );
}