import { Chart, registerables } from "chart.js";
import { useEffect, useRef } from "react";

import { useThemeCtx } from "../context/ThemeContext.tsx";

Chart.register(...registerables);

export function RevenueChart({ data }: { data: Array<{ d: string; total: number }> }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const { dark } = useThemeCtx();

  useEffect(() => {
    if (!ref.current) return;
    const css = getComputedStyle(document.documentElement);
    const primary = css.getPropertyValue("--primary").trim() || "#1f6f54";
    const ink = css.getPropertyValue("--muted").trim() || "#5f6f64";
    const line = css.getPropertyValue("--line").trim() || "#e6dfcf";

    const ctx = ref.current.getContext("2d")!;
    const grad = ctx.createLinearGradient(0, 0, 0, 240);
    grad.addColorStop(0, primary + "55");
    grad.addColorStop(1, primary + "00");

    const chart = new Chart(ref.current, {
      type: "line",
      data: {
        labels: data.map((d) => d.d.slice(5)),
        datasets: [
          {
            data: data.map((d) => d.total),
            borderColor: primary,
            backgroundColor: grad,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: primary,
            borderWidth: 2.5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: dark ? "#1b2721" : "#1b261f",
            padding: 10,
            displayColors: false,
            callbacks: { label: (c) => `${Number(c.parsed.y).toFixed(2)} ₼` },
          },
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: ink, font: { size: 10 } } },
          y: { grid: { color: line }, ticks: { color: ink, font: { size: 10 } }, beginAtZero: true },
        },
      },
    });
    return () => chart.destroy();
  }, [data, dark]);

  return (
    <div className="h-60">
      <canvas ref={ref} />
    </div>
  );
}
