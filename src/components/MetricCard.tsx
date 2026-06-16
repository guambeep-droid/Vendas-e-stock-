/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtext?: string;
  subtextColor?: string;
  colorVariant?: 'emerald' | 'blue' | 'amber' | 'violet' | 'slate' | 'orange';
}

export default function MetricCard({
  title,
  value,
  icon: Icon,
  subtext,
  subtextColor = 'text-slate-400',
  colorVariant = 'slate',
}: MetricCardProps) {
  const bgStyles = {
    emerald: 'bg-emerald-500/8 text-emerald-600 border-emerald-500/20',
    blue: 'bg-sky-500/8 text-sky-600 border-sky-500/20',
    amber: 'bg-amber-500/8 text-amber-600 border-amber-500/20',
    violet: 'bg-violet-500/8 text-violet-600 border-violet-500/20',
    slate: 'bg-slate-500/8 text-slate-600 border-slate-500/20',
    orange: 'bg-orange-500/8 text-orange-600 border-orange-500/20',
  };

  const textStyles = {
    emerald: 'text-emerald-600',
    blue: 'text-sky-600',
    amber: 'text-amber-600',
    violet: 'text-violet-600',
    slate: 'text-slate-600',
    orange: 'text-orange-600',
  };

  return (
    <div 
      className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs hover:shadow-md hover:border-slate-300/40 transition-all duration-350"
      id={`metric-card-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400" id={`metric-title-${title.toLowerCase().replace(/\s+/g, '-')}`}>
            {title}
          </span>
          <h3 className="text-2xl font-extrabold font-sans tracking-tight text-slate-900" id={`metric-val-${title.toLowerCase().replace(/\s+/g, '-')}`}>
            {value}
          </h3>
        </div>
        <div className={`p-3 rounded-xl border ${bgStyles[colorVariant]}`} id={`metric-icon-wrap-${title.toLowerCase().replace(/\s+/g, '-')}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {subtext && (
        <div className="mt-4 pt-3 border-t border-slate-50 flex items-center gap-1.5" id={`metric-sub-${title.toLowerCase().replace(/\s+/g, '-')}`}>
          <span className={`text-xs font-semibold ${subtextColor}`}>
            {subtext}
          </span>
        </div>
      )}
    </div>
  );
}
