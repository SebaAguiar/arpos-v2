import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Theme } from "@radix-ui/themes";
import { SalesBarChart, type ChartPoint, computeLabelStep } from "@/components/reports/SalesBarChart";

function makePoints(n: number): ChartPoint[] {
  return Array.from({ length: n }, (_, i) => ({
    label: `L${i}`,
    value: i,
    fullLabel: `label-${i}`,
  }));
}

describe("computeLabelStep (X axis sampling)", () => {
  it("steps every point when data fits within the max label budget", () => {
    expect(computeLabelStep(0)).toBe(1);
    expect(computeLabelStep(1)).toBe(1);
    expect(computeLabelStep(14)).toBe(1);
  });

  it("subsamples once data exceeds the max label budget", () => {
    // 30 points, 14-max budget → ceil(30/14) = 3 → 10 visible labels.
    expect(computeLabelStep(30)).toBe(3);
    // 31 points → ceil(31/14) = 3 → 11 visible labels (still ≤ 14).
    expect(computeLabelStep(31)).toBe(3);
    // 100 points → ceil(100/14) = 8 → 13 visible labels (≤ 14).
    expect(computeLabelStep(100)).toBe(8);
  });

  it("never renders more than the max label budget visible labels", () => {
    for (const n of [7, 14, 15, 20, 30, 31, 50, 100, 365]) {
      const step = computeLabelStep(n);
      const visible = Array.from({ length: n }, (_, i) => i).filter(
        (i) => i % step === 0,
      ).length;
      expect(visible).toBeLessThanOrEqual(14);
    }
  });
});

describe("SalesBarChart", () => {
  it("renders all bars and the first sampled label for a 30-point period", () => {
    const { container } = render(
      <Theme>
        <SalesBarChart data={makePoints(30)} maxVal={29} />
      </Theme>,
    );
    // Smoke: renders without throwing and shows the first day's label.
    expect(container.textContent).toContain("L0");
  });
});
