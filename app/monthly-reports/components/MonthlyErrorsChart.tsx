import React, { useMemo } from 'react';
import dayjs from 'dayjs';
import { useECharts } from '../../../hooks/useECharts';
import { ChartWithRef } from '../../../components/ChartLoadingState';
import { getThemeColors } from '../../../utils/chartUtils';
import { useBaseData } from '../../../lib/stores';

interface ErrorRecord {
  event_timestamp: Date;
  errortype: string;
  type: 'system_error' | 'validation_error';
  event_count: number;
}

interface ErrorStatsChartProps {
  selectedMonth: string;
  errorType: 'system_error' | 'validation_error';
  title: string;
}

export default function ErrorStatsChart({ 
  selectedMonth, 
  errorType,
  title 
}: ErrorStatsChartProps) {
  // Get error data from the store
  const { errorStatsData, errorStatsLoadingState, errorStatsError } = useBaseData();
  
  // Filter data by month using the same logic as useChartData
  const filteredData = useMemo(() => {
    if (!errorStatsData || errorStatsData.length === 0) return [];
    
    return errorStatsData.filter(record => {
      const recordDate = dayjs(record.event_timestamp);
      const [year, month] = selectedMonth.split('-').map(Number);
      return recordDate.year() === year && recordDate.month() + 1 === month;
    });
  }, [errorStatsData, selectedMonth]);
  
  const typeFilteredData = useMemo(() => 
    (filteredData as ErrorRecord[]).filter(record => record.type === errorType), 
    [filteredData, errorType]
  );

  const processedData = useMemo(() => {
    if (typeFilteredData.length === 0) return null;

    // Group by date and error type
    const dailyErrorsByType: { [date: string]: { [errorType: string]: number } } = {};
    const allErrorTypes = new Set<string>();
    
    typeFilteredData.forEach(record => {
      const date = dayjs(record.event_timestamp).format('YYYY-MM-DD');
      if (!dailyErrorsByType[date]) {
        dailyErrorsByType[date] = {};
      }
      dailyErrorsByType[date][record.errortype] = (dailyErrorsByType[date][record.errortype] || 0) + record.event_count;
      allErrorTypes.add(record.errortype);
    });

    const dates = Object.keys(dailyErrorsByType).sort();
    const errorTypesArray = Array.from(allErrorTypes).sort();

    return {
      dates,
      errorTypesArray,
      dailyErrorsByType
    };
  }, [typeFilteredData]);

  const chartRef = useECharts((chart) => {
    if (!processedData) {
      const option = {
        title: {
          text: title,
          left: 'center',
          textStyle: {
            fontSize: 16,
            fontWeight: '500'
          }
        },
        graphic: {
          type: 'text',
          left: 'center',
          top: 'middle',
          style: {
            text: `No ${errorType.replace('_', ' ')} data available for ${selectedMonth}`,
            fontSize: 16,
            fill: '#666'
          }
        }
      };
      chart.setOption(option);
      return;
    }

    const { dates, errorTypesArray, dailyErrorsByType } = processedData;
    const themeColors = getThemeColors();

    const series = errorTypesArray.map((errorTypeCode, index) => ({
      name: errorTypeCode,
      type: 'bar',
      stack: 'errors',
      color: themeColors[index % themeColors.length],
      data: dates.map(date => dailyErrorsByType[date][errorTypeCode] || 0),
    }));

    const option = {
      title: {
        text: title,
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: '500'
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      legend: {
        type: 'scroll',
        orient: 'vertical',
        right: '5%',
        top: 'center',
        textStyle: {
          fontSize: 12
        }
      },
      grid: {
        left: '3%',
        right: '25%',
        bottom: '3%',
        top: '10%',
        outerBoundsMode: 'same',
        outerBoundsContain: 'axisLabel'
      },
      xAxis: {
        type: 'category',
        data: dates.map(date => {
          const d = new Date(date);
          return `${d.getDate()}/${d.getMonth() + 1}`;
        }),
        axisLabel: {
          rotate: 45
        }
      },
      yAxis: {
        type: 'value',
        name: 'Error Count'
      },
      series: series
    };

    chart.setOption(option);
  }, {
    dependencies: [processedData, selectedMonth, errorType, title]
  });

  return (
    <ChartWithRef
      loading={errorStatsLoadingState === 'loading'}
      error={errorStatsError}
      loadingMessage={`Loading ${title.toLowerCase()}...`}
      errorTitle={`Error loading ${title.toLowerCase()}`}
      chartRef={chartRef}
      width="100%"
      height={300}
    />
  );
}
