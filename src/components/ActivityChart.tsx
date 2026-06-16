/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sale } from '../types';
import { TrendingUp } from 'lucide-react';

interface ActivityChartProps {
  sales: Sale[];
}

export default function ActivityChart({ sales }: ActivityChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Generate last 7 days up to current date (2026-05-22)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date('2026-05-22T00:00:00Z');
    d.setDate(d.getDate() - (6 - i));
    return d;
  });

  const chartData = last7Days.map((date) => {
    const dayStr = date.toISOString().split('T')[0];

    const daySales = sales.filter((s) => {
      const saleDateStr = s.timestamp.split('T')[0];
      return saleDateStr === dayStr;
    });

    const totalRevenue = daySales.reduce((sum, s) => sum + s.total, 0);
    const totalProfit = daySales.reduce((sum, s) => sum + s.profit, 0);

    return {
      date,
      dateLabel: date.toLocaleDateString('pt-MZ', { weekday: 'short', day: 'numeric' }),
      dateFull: date.toLocaleDateString('pt-MZ', { day: 'numeric', month: 'long', year: 'numeric' }),
      revenue: totalRevenue,
      profit: totalProfit,
      salesCount: daySales.length,
    };
  });

  const maxVal = Math.max(...chartData.map((d) => Math.max(d.revenue, d.profit, 100)), 300);
  const roundedMax = Math.ceil(maxVal / 100) * 100;

  const graphWidth = 600;
  const graphHeight = 220;
  const paddingX = 40;
  const paddingY = 20;

  const getPoints = (key: 'revenue' | 'profit') => {
    return chartData
      .map((d, index) => {
        const x = paddingX + (index * (graphWidth - 2 * paddingX)) / (chartData.length - 1);
        const y = graphHeight - paddingY - (d[key] / roundedMax) * (graphHeight - 2 * paddingY);
        return `${x},${y}`;
      })
      .join(' ');
  };

  const revenuePoints = getPoints('revenue');
  const profitPoints = getPoints('profit');

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' MT';
  };

  return (
    <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs" id="sales-activity-chart">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            Desempenho Diário (Últimos 7 Dias)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Fluxo de faturamento comparado com lucro líquido diário.</p>
        </div>
        
        {/* Legends */}
        <div className="flex gap-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 select-none">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 block"></span>
            <span>Faturamento Bruto</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block"></span>
            <span>Lucro Líquido</span>
          </div>
        </div>
      </div>

      <div className="relative pt-2" id="chart-canvas-wrapper">
        {/* Y Axis Grid Lines */}
        <div className="absolute inset-0 flex flex-col justify-between text-[9px] font-mono text-slate-450 pointer-events-none pb-[20px] pt-[20px]">
          <div>
            <div className="w-full border-t border-dashed border-slate-100 mb-1"></div>
            <span className="bg-white px-1 font-semibold leading-none">{formatCurrency(roundedMax)}</span>
          </div>
          <div>
            <div className="w-full border-t border-dashed border-slate-100 mb-1"></div>
            <span className="bg-white px-1 font-semibold leading-none">{formatCurrency(roundedMax * 0.66)}</span>
          </div>
          <div>
            <div className="w-full border-t border-dashed border-slate-100 mb-1"></div>
            <span className="bg-white px-1 font-semibold leading-none">{formatCurrency(roundedMax * 0.33)}</span>
          </div>
          <div>
            <div className="w-full border-t border-dashed border-slate-100 mb-1"></div>
            <span className="bg-white px-1 font-semibold leading-none">0,00 MT</span>
          </div>
        </div>

        {/* SVG Area & Lines */}
        <div className="relative z-10 h-[220px]">
          <svg viewBox={`0 0 ${graphWidth} ${graphHeight}`} className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="revenue-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f97316" stopOpacity="0.10" />
                <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="profit-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.10" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            <path
              d={`${revenuePoints ? `M ${paddingX},${graphHeight - paddingY} L ${revenuePoints} L ${graphWidth - paddingX},${graphHeight - paddingY} Z` : ''}`}
              fill="url(#revenue-grad)"
            />
            <path
              d={`${profitPoints ? `M ${paddingX},${graphHeight - paddingY} L ${profitPoints} L ${graphWidth - paddingX},${graphHeight - paddingY} Z` : ''}`}
              fill="url(#profit-grad)"
            />

            <polyline
              fill="none"
              stroke="#f97316"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={revenuePoints}
            />
            <polyline
              fill="none"
              stroke="#10b981"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={profitPoints}
            />

            {chartData.map((d, index) => {
              const x = paddingX + (index * (graphWidth - 2 * paddingX)) / (chartData.length - 1);
              const yRev = graphHeight - paddingY - (d.revenue / roundedMax) * (graphHeight - 2 * paddingY);
              const yProf = graphHeight - paddingY - (d.profit / roundedMax) * (graphHeight - 2 * paddingY);

              return (
                <g key={index} className="cursor-pointer" onMouseEnter={() => setHoveredIndex(index)} onMouseLeave={() => setHoveredIndex(null)}>
                  <rect
                    x={x - (graphWidth - 2 * paddingX) / (chartData.length - 1) / 2}
                    y={paddingY}
                    width={(graphWidth - 2 * paddingX) / (chartData.length - 1)}
                    height={graphHeight - 2 * paddingY}
                    fill="transparent"
                  />

                  {hoveredIndex === index && (
                    <line
                      x1={x}
                      y1={paddingY}
                      x2={x}
                      y2={graphHeight - paddingY}
                      stroke="#f1f5f9"
                      strokeWidth="1.5"
                      strokeDasharray="3,3"
                    />
                  )}

                  <circle
                    cx={x}
                    cy={yRev}
                    r={hoveredIndex === index ? 5.5 : 3.5}
                    fill="#f97316"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    className="transition-all duration-150"
                  />

                  <circle
                    cx={x}
                    cy={yProf}
                    r={hoveredIndex === index ? 5.5 : 3.5}
                    fill="#10b981"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    className="transition-all duration-150"
                  />
                </g>
              );
            })}
          </svg>
        </div>

        {/* X Axis Labels */}
        <div className="flex justify-between px-4 mt-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none">
          {chartData.map((d, index) => (
            <div
              key={index}
              className={`text-center w-16 transition-colors duration-150 ${hoveredIndex === index ? 'text-orange-600 font-extrabold' : ''}`}
            >
              {d.dateLabel.replace('.', '')}
            </div>
          ))}
        </div>

        {/* Hover Tooltip Overlay */}
        {hoveredIndex !== null && (
          <div
            className="absolute z-20 top-2 p-3 bg-slate-900 border border-slate-800 text-white rounded-xl shadow-xl text-xs space-y-2 min-w-[180px]"
            style={{
              left: `${Math.min(Math.max(10, (hoveredIndex / 6) * 100 - 15), 72)}%`,
            }}
            id="chart-tooltip-panel"
          >
            <p className="font-extrabold border-b border-slate-850 pb-1 text-[9px] text-slate-400 uppercase tracking-widest">
              {chartData[hoveredIndex].dateFull}
            </p>
            <div className="flex justify-between items-center gap-3">
              <span className="flex items-center gap-1.5 text-slate-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span> Faturado:
              </span>
              <span className="font-mono font-bold text-orange-400">
                {formatCurrency(chartData[hoveredIndex].revenue)}
              </span>
            </div>
            <div className="flex justify-between items-center gap-3">
              <span className="flex items-center gap-1.5 text-slate-400 font-medium font-sns">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Lucro:
              </span>
              <span className="font-mono font-bold text-emerald-400">
                {formatCurrency(chartData[hoveredIndex].profit)}
              </span>
            </div>
            <div className="flex justify-between items-center gap-3 pt-1 border-t border-slate-850 text-[10px] text-slate-500 font-medium">
              <span>Registros de vendas:</span>
              <span className="font-bold font-mono text-slate-300">{chartData[hoveredIndex].salesCount}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
