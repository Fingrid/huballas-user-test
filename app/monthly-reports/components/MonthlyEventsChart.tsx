"use client";

import React, { useRef, useEffect } from 'react';
import * as echarts from 'echarts/core';
import echartsTheme from '../../echarts.theme.json';
import { BarChart } from 'echarts/charts';
import { useBaseData, useMonthlyReports } from "@/lib/stores";
import { ChartWithRef } from "@/components/ChartLoadingState";
import { useECharts } from "@/hooks/useECharts";

interface MonthlyEventsChartProps {
  selectedMonth: string;
  groupBy: "channel" | "process_group" | "marketRoleCode";
  getDisplayName: (name: string) => string;
}

export default function MonthlyEventsChart({
  selectedMonth,
  groupBy,
  getDisplayName,
}: MonthlyEventsChartProps) {
  const { loadingState, error, chartData } = useMonthlyReports();
  
  const chartRef = useECharts((chart) => {
    if (!chartData || loadingState !== 'ready' || error) return;

    const { dates, categories, dailyGroupedData } = chartData;

    // Use theme colors for consistency
    const themeColors = echartsTheme.color;

    const option = {
      title: {
        text: `Monthly Report - ${new Date(
          selectedMonth + "-01"
        ).toLocaleDateString("en-US", { year: "numeric", month: "long" })}`,
        subtext: `Grouped by ${
          groupBy === "marketRoleCode"
            ? "Market Role"
            : groupBy === "process_group"
            ? "Process Group"
            : "Channel"
        }`,
        textStyle: {
          fontSize: 18,
          fontWeight: "normal",
          color: "#3e5660",
        },
        subtextStyle: {
          fontSize: 12,
          color: "#6d838f",
        },
      },
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow",
        },
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        borderColor: "var(--color-separator)",
        borderWidth: 1,
        textStyle: {
          color: "#3e5660",
        },
        formatter: function (params: any) {
          const date = params[0].axisValue;
          let tooltip = `${date}<br/>`;
          let dayTotal = 0;
          params.forEach((param: any) => {
            if (param.value > 0) {
              tooltip += `${
                param.seriesName
              }: ${param.value.toLocaleString()}<br/>`;
              dayTotal += param.value;
            }
          });
          tooltip += `<strong>Day Total: ${dayTotal.toLocaleString()}</strong>`;
          return tooltip;
        },
      },
      legend: {
        type: "scroll",
        orient: "vertical",
        right: "5%",
        top: "center",
        textStyle: {
          color: "#3e5660",
          fontSize: 12,
        },
        formatter: function (name: string) {
          return getDisplayName(name);
        },
      },
      grid: {
        left: "10%",
        right: "25%",
        top: "10%",
        bottom: "15%",
        outerBoundsMode: "same",
        outerBoundsContain: "axisLabel",
      },
      dataZoom: [
        {
          type: "slider",
          show: true,
          xAxisIndex: [0],
          start: 0,
          end: 100,
          bottom: "5%",
        },
      ],
      xAxis: {
        type: "category",
        data: dates.map((date) => {
          const d = new Date(date);
          return `${d.getDate()}/${d.getMonth() + 1}`;
        }),
        axisLabel: {
          color: "#3e5660",
        },
        axisLine: {
          lineStyle: {
            color: "#3e5660",
          },
        },
      },
      yAxis: {
        type: "value",
        axisLabel: {
          color: "#3e5660",
          formatter: (value: number) => value.toLocaleString(),
        },
        axisLine: {
          lineStyle: {
            color: "#3e5660",
          },
        },
      },
      series: categories.map((category, index) => ({
        name: getDisplayName(category),
        type: "bar",
        stack: "total",
        data: dates.map((date) => dailyGroupedData[date][category] || 0),
        itemStyle: {
          color: themeColors[index % themeColors.length],
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: "rgba(0, 0, 0, 0.3)",
          },
        },
      })),
    };

    chart.setOption(option);

    // Handle resize
    const handleResize = () => chart.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, {
    dependencies: [selectedMonth, groupBy, chartData, getDisplayName, loadingState, error]
  });

  return (
    <ChartWithRef
      loading={loadingState !== 'ready'}
      error={error}
      loadingMessage="Loading monthly events..."
      errorTitle="Error loading monthly events"
      chartRef={chartRef}
      width="100%"
      height={450}
    />
  );
}
