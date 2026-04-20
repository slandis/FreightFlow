import { useId, type PropsWithChildren } from "react";

interface MetricTooltipProps {
  label?: string;
  content: string;
}

export function MetricTooltip({
  children,
  content,
  label,
}: PropsWithChildren<MetricTooltipProps>) {
  const tooltipId = useId();

  return (
    <span className="metric-tooltip">
      {children}
      <span className="metric-tooltip-content" id={tooltipId} role="tooltip">
        {label ? <strong>{label}</strong> : null}
        <span>{content}</span>
      </span>
    </span>
  );
}
