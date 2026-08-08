import { useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { Text } from "@radix-ui/themes";

export type ChartPoint = { label: string; value: number; fullLabel?: string };

const BAR_CHART_HEIGHT = 140;
const BAR_LABEL_HEIGHT = 28;
const BAR_COLOR = "#60a5fa";
const BAR_PEAK_COLOR = "var(--accent)";
const PREV_BAR_COLOR = "#94a3b8";
const Y_AXIS_WIDTH = 52;

// Show at most this many date labels on the X axis to avoid truncation.
// Real sampling is derived from the point count so it scales to any period.
const MAX_X_LABELS = 14;

export function computeLabelStep(dataLength: number, maxLabels = MAX_X_LABELS): number {
  return Math.max(1, Math.ceil(dataLength / maxLabels));
}

function formatMoneyShort(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2).replace(/\.00$/, "")}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}k`;
  return `$${Math.round(value).toLocaleString("es-AR")}`;
}

function niceCeil(value: number): number {
  if (value <= 0) return 100;
  const pow = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / pow;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10;
  return step * pow;
}

export interface SalesBarChartProps {
  data: ChartPoint[];
  prevData?: ChartPoint[];
  maxVal: number;
}

export function SalesBarChart({ data, prevData, maxVal }: SalesBarChartProps) {
  const [hover, setHover] = useState<{ index: number; series: "current" | "prev" } | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ left: number; top: number } | null>(null);
  const plotRef = useRef<HTMLDivElement>(null);
  const barMaxHeight = BAR_CHART_HEIGHT - BAR_LABEL_HEIGHT;

  const yMax = niceCeil(maxVal);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * yMax);

  // Sample labels so they never overflow the bar width. All bars are still
  // rendered; only the textual labels are thinned out.
  const labelEvery = computeLabelStep(data.length);

  const peakIndex = data.reduce(
    (acc, d, i) => (d.value > data[acc].value ? i : acc),
    0,
  );

  const hoverPoint = hover !== null ? data[hover.index] : null;

  const handleEnter = (
    i: number,
    series: "current" | "prev",
    e: ReactMouseEvent<HTMLDivElement>,
  ) => {
    const plot = plotRef.current;
    if (!plot) return;
    const plotRect = plot.getBoundingClientRect();
    const rect = e.currentTarget.getBoundingClientRect();
    const left = rect.left - plotRect.left + rect.width / 2;
    const top = rect.top - plotRect.top;
    setTooltipPos({ left, top });
    setHover({ index: i, series });
  };

  return (
    <div style={{ display: "flex", gap: "8px" }}>
      {/* Y axis */}
      <div
        style={{
          width: Y_AXIS_WIDTH,
          height: `${BAR_CHART_HEIGHT}px`,
          position: "relative",
          flexShrink: 0,
        }}
      >
        {ticks.map((t) => (
          <Text
            key={t}
            size="1"
            color="gray"
            style={{
              position: "absolute",
              top: `${(1 - t / yMax) * barMaxHeight - 6}px`,
              right: 0,
              lineHeight: "12px",
            }}
          >
            {formatMoneyShort(t)}
          </Text>
        ))}
      </div>

      {/* Plot area */}
      <div ref={plotRef} style={{ flex: 1, minWidth: 0 }}>
        <div style={{ position: "relative", height: `${BAR_CHART_HEIGHT}px` }}>
          {/* Gridlines */}
          {ticks.map((t) => (
            <div
              key={t}
              style={{
                position: "absolute",
                top: `${(1 - t / yMax) * barMaxHeight}px`,
                left: 0,
                right: 0,
                height: "1px",
                backgroundColor: "var(--border)",
                opacity: t === 0 ? 0.6 : 0.3,
              }}
            />
          ))}

          {/* Bars */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: "3px",
              height: `${barMaxHeight}px`,
              position: "relative",
            }}
          >
            {data.map((d, i) => {
              const barPx = maxVal > 0 ? Math.round((d.value / yMax) * barMaxHeight) : 0;
              const prevPx =
                prevData && maxVal > 0
                  ? Math.round((prevData[i].value / yMax) * barMaxHeight)
                  : 0;
              const isPeak = i === peakIndex;
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "flex-end",
                    justifyContent: "center",
                    gap: "3px",
                    height: `${barMaxHeight}px`,
                  }}
                >
                  {prevData && (
                    <div
                      onMouseEnter={(e) => handleEnter(i, "prev", e)}
                      onMouseLeave={() => setHover(null)}
                      style={{
                        width: "42%",
                        height: `${Math.max(prevPx, prevPx > 0 ? 3 : 0)}px`,
                        backgroundColor: PREV_BAR_COLOR,
                        borderRadius: "3px 3px 0 0",
                        opacity: 0.85,
                        cursor: "pointer",
                      }}
                    />
                  )}
                  <div
                    onMouseEnter={(e) => handleEnter(i, "current", e)}
                    onMouseLeave={() => setHover(null)}
                    style={{
                      width: prevData ? "42%" : "80%",
                      height: `${Math.max(barPx, barPx > 0 ? 3 : 0)}px`,
                      backgroundColor: isPeak ? BAR_PEAK_COLOR : BAR_COLOR,
                      borderRadius: "3px 3px 0 0",
                      cursor: "pointer",
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Tooltip */}
          {hover !== null && hoverPoint && tooltipPos && (
            <div
              style={{
                position: "absolute",
                left: `${tooltipPos.left}px`,
                top: `${tooltipPos.top}px`,
                transform: "translate(-50%, calc(-100% - 8px))",
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                padding: "6px 10px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                pointerEvents: "none",
                zIndex: 10,
                textAlign: "center",
                whiteSpace: "nowrap",
              }}
            >
              <Text size="2" weight="bold" style={{ display: "block" }}>
                {formatMoneyShort(
                  hover.series === "prev" && prevData ? prevData[hover.index].value : hoverPoint.value,
                )}
              </Text>
              <Text size="1" color="gray" style={{ display: "block" }}>
                {hoverPoint.fullLabel ?? hoverPoint.label}
              </Text>
              {prevData && (
                <>
                  <Text
                    size="1"
                    color="gray"
                    weight={hover.series === "current" ? "bold" : "regular"}
                    style={{ display: "block", marginTop: "2px" }}
                  >
                    Este período: {formatMoneyShort(hoverPoint.value)}
                  </Text>
                  <Text
                    size="1"
                    color="gray"
                    weight={hover.series === "prev" ? "bold" : "regular"}
                    style={{ display: "block" }}
                  >
                    Anterior: {formatMoneyShort(prevData[hover.index].value)}
                  </Text>
                </>
              )}
            </div>
          )}
        </div>

        {/* X labels — sampled + single-line, never truncated */}
        <div style={{ display: "flex", gap: "3px", height: `${BAR_LABEL_HEIGHT}px`, alignItems: "center" }}>
          {data.map((d, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                minWidth: 0,
                textAlign: "center",
                overflow: "hidden",
                height: "100%",
              }}
            >
              {i % labelEvery === 0 && (
                <Text
                  size="1"
                  color="gray"
                  style={{
                    display: "block",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    width: "100%",
                  }}
                  title={d.fullLabel ?? d.label}
                >
                  {d.label}
                </Text>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
