import React from 'react';
import { cn } from '@/lib/utils';

export default function MetricCard({ title, value, trend, trendLabel, icon, className }) {
  const isPositive = trend && trend.startsWith('+');
  const isNegative = trend && trend.startsWith('-');

  return (
    <div className={cn("bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">{title}</h3>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
      <div>
        <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 font-mono tracking-tight">{value}</div>
        {trend && (
          <div className="flex items-center gap-1.5 mt-2">
            <span
              className={cn(
                "text-xs font-semibold px-2 py-0.5 rounded-full border",
                isNegative 
                  ? "bg-red-50 text-red-700 border-red-200" 
                  : isPositive 
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800"
              )}
            >
              {trend}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{trendLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
}
