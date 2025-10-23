import React, { useRef } from 'react';

interface ChartLoadingStateProps {
  loading: boolean;
  error: string | null;
  loadingMessage?: string;
  errorTitle?: string;
  children: React.ReactNode;
}

interface ChartWithRefProps {
  loading: boolean;
  error: string | null;
  loadingMessage?: string;
  errorTitle?: string;
  width?: string | number;
  height?: string | number;
  style?: React.CSSProperties;
  chartRef: React.RefObject<HTMLDivElement | null>;
}

// Style objects for consistent styling
const styles = {
  container: 'chart-container mt-8',
  card: 'data-card',
  centerContent: 'text-center py-8',
  loadingText: 'text-[var(--color-text)] text-lg font-medium',
  relativeCard: 'data-card relative'
};

/**
 * Reusable component for handling chart loading and error states
 * @deprecated Use ChartWithRef for charts that need refs
 */
export function ChartLoadingState({
  loading,
  error,
  loadingMessage = "Loading chart data...",
  errorTitle = "Error loading chart",
  children
}: ChartLoadingStateProps) {
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.centerContent}>
            <div className={styles.loadingText}>
              {loadingMessage}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.centerContent}>
            <div className="text-[var(--color-error)] text-lg font-medium">
              {errorTitle}
            </div>
            <p className="text-[var(--color-text)] mt-2">
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <div>{children}</div>;
}

/**
 * Chart component that provides a stable ref while handling loading/error states with overlays
 */
export function ChartWithRef({
  loading,
  error,
  loadingMessage = "Loading chart data...",
  errorTitle = "Error loading chart",
  width = "100%",
  height = 450,
  style = {},
  chartRef
}: ChartWithRefProps) {
  const defaultStyle = {
    width,
    height,
    ...style
  };

  return (
    <div className={styles.container}>
      <div className={styles.relativeCard}>
        {/* Chart div is always present to maintain ref stability */}
        <div ref={chartRef} style={defaultStyle} />
        
        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white/90 flex items-center justify-center z-10">
            <div className={styles.loadingText}>
              {loadingMessage}
            </div>
          </div>
        )}
        
        {/* Error overlay */}
        {error && (
          <div className="absolute inset-0 bg-white/90 flex items-center justify-center flex-col z-10">
            <div className="text-[var(--color-error)] text-lg font-medium">
              {errorTitle}
            </div>
            <p className="text-[var(--color-text)] mt-2 text-center px-4">
              {error}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Custom hook that provides chart ref and container component
 */
export function useChartContainer(
  loading: boolean,
  error: string | null,
  options: {
    loadingMessage?: string;
    errorTitle?: string;
    width?: string | number;
    height?: string | number;
    style?: React.CSSProperties;
  } = {}
) {
  const chartRef = useRef<HTMLDivElement | null>(null);
  
  const ChartContainer = React.useMemo(() => {
    const Container = ({}: { children?: React.ReactNode }) => (
      <ChartWithRef
        loading={loading}
        error={error}
        chartRef={chartRef}
        {...options}
      />
    );
    Container.displayName = 'ChartContainer';
    return Container;
  }, [loading, error, options]);

  return { chartRef, ChartContainer };
}
