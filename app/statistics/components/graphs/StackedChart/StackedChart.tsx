"use client";

import React from "react";
import * as echarts from "echarts/core";
import dayjs from "dayjs";
import echartsTheme from "../../../../echarts.theme.json";
import type { UsageDataRecord } from "@/lib/types";
import { useLocalization } from "@/lib/stores";
import { useECharts } from "@/lib/hooks/useECharts";
import { cn } from "@/lib/utils/cn";
import styles from "./StackedChart.module.css";

type StackingType = "channel" | "process_group" | "marketRoleCode";

interface StackedChartProps {
  stackingType: StackingType;
  getChannelDescription: (code: string) => string;
  getMarketRoleDescription: (code: string) => string;
  usageData: UsageDataRecord[];
}

export default function StackedChart({
  stackingType,
  getChannelDescription,
  getMarketRoleDescription,
  usageData,
}: StackedChartProps) {
  const { t } = useLocalization();

  const chartRef = useECharts(
    (chart) => {
      if (!usageData || usageData.length === 0) return;

      // Aggregate usage data into daily data by the selected stacking type
      const dailyAggregatedData: {
        [dateKey: string]: { [stackKey: string]: number };
      } = {};

      usageData.forEach((record) => {
        const dateKey = dayjs(record.event_timestamp).format("YYYY-MM-DD");

        if (!dailyAggregatedData[dateKey]) {
          dailyAggregatedData[dateKey] = {};
        }

        let stackKey: string;
        if (stackingType === "channel") {
          stackKey = record.channel;
        } else if (stackingType === "process_group") {
          stackKey = record.process_group;
        } else {
          stackKey = record.marketRoleCode;
        }

        dailyAggregatedData[dateKey][stackKey] =
          (dailyAggregatedData[dateKey][stackKey] || 0) + record.event_count;
      });

      // Convert back to StackingData format for daily periods
      const dailyStackingData = Object.entries(dailyAggregatedData)
        .map(([dateKey, stacks]) => ({
          date: dateKey,
          stacks,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Get all unique stack keys
      const allStackKeys = new Set<string>();
      dailyStackingData.forEach((item) => {
        Object.keys(item.stacks).forEach((key) => allStackKeys.add(key));
      });

      const stackKeysArray = Array.from(allStackKeys);

      // Get all unique dates and sort them
      const allDates = dailyStackingData.map((item) => item.date).sort();

      // Use theme colors for consistency
      const themeColors = echartsTheme.color;

      const series = stackKeysArray.map((stackKey, index) => ({
        name: stackKey,
        type: "bar" as const,
        stack: "total",
        data: allDates.map((date) => {
          const dateData = dailyStackingData.find((item) => item.date === date);
          return dateData?.stacks[stackKey] || 0;
        }),
        itemStyle: {
          color: themeColors[index % themeColors.length],
        },
      }));

      const option: echarts.EChartsCoreOption = {
        title: {
          text: `Tilastot - Päivittäinen aggregointi ${
            stackingType === "process_group"
              ? "prosessiryhmittäin"
              : stackingType === "marketRoleCode"
              ? "markkinarooleittain"
              : "kanavittain"
          }`,
          left: "center",
          textStyle: {
            color: "var(--color-text)",
            fontSize: 16,
            fontWeight: "normal",
          },
        },
        tooltip: {
          trigger: "axis" as const,
          axisPointer: {
            type: "cross" as const,
            crossStyle: {
              color: "var(--color-text-subtle)",
            },
          },
          formatter: function (
            params: Array<{
              axisValue: string;
              marker: string;
              seriesName: string;
              value: number;
            }>
          ) {
            let result = `<strong>${params[0].axisValue}</strong><br/>`;
            let total = 0;
            params.forEach(
              (param: {
                marker: string;
                seriesName: string;
                value: number;
              }) => {
                const seriesName = param.seriesName;
                let displayName = seriesName;

                // Get human-readable description based on stacking type
                if (stackingType === "channel") {
                  displayName = getChannelDescription(seriesName);
                } else if (stackingType === "marketRoleCode") {
                  displayName = getMarketRoleDescription(seriesName);
                }

                result += `${param.marker} <strong>${displayName}</strong><br/>`;
                result += `&nbsp;&nbsp;&nbsp;&nbsp;Koodi: ${seriesName}<br/>`;
                result += `&nbsp;&nbsp;&nbsp;&nbsp;Tapahtumat: ${param.value.toLocaleString()}<br/>`;
                total += param.value;
              }
            );
            result += `<hr style="margin: 8px 0; border: none; border-top: 1px solid var(--color-separator);"/>`;
            result += `<strong>Yhteensä: ${total.toLocaleString()}</strong>`;
            return result;
          },
        },
        legend: {
          textStyle: {
            color: "var(--color-text)",
          },
        },
        grid: {
          containLabel: false,
        },
        xAxis: {
          type: "category" as const,
          data: allDates.map((date) => {
            return dayjs(date).format("MMM DD");
          }),
          axisLabel: {
            rotate: 45,
            interval: Math.ceil(allDates.length / 30), // Show every 30th date for readability
          },
        },
        yAxis: {
          type: "value" as const,
          axisLabel: {
            formatter: (value: number) => value.toLocaleString(),
          },
        },
        dataZoom: [
          {
            xAxisIndex: 0,
          },
          {
            yAxisIndex: 0,
          },
        ],
        series: series,
      };

      chart.setOption(option);

      // Handle window resize
      const handleResize = () => chart.resize();
      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
      };
    },
    {
      dependencies: [
        stackingType,
        usageData,
        getChannelDescription,
        getMarketRoleDescription,
      ],
    }
  );

  return (
    <div className={cn(styles.container)}>
      <div className={cn(styles.header)}>
        <h4>{t("statistics.usage.dailyEventsTitle")}</h4>
        <p>{t("statistics.usage.description")}</p>
      </div>
      <div ref={chartRef} className={cn(styles.chartDiv)} />
    </div>
  );
}
