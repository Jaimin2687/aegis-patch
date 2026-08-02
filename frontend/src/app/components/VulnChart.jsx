'use client';

import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip);

export default function VulnChart({ severityCounts }) {
  const counts = [
    severityCounts.CRITICAL || 0,
    severityCounts.HIGH || 0,
    severityCounts.MEDIUM || 0,
    severityCounts.LOW || 0,
  ];
  
  const totalVulns = counts.reduce((a, b) => a + b, 0);

  const chartData = {
    labels: ['Critical', 'High', 'Medium', 'Low'],
    datasets: [
      {
        data: counts,
        backgroundColor: [
          '#ef4444', // red-500
          '#f97316', // orange-500
          '#f59e0b', // amber-500
          '#3b82f6', // blue-500
        ],
        borderWidth: 0,
        hoverOffset: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '80%',
    plugins: {
      legend: {
        display: false, // Hide default legend to use custom HTML legend
      },
      tooltip: {
        backgroundColor: '#ffffff',
        titleColor: '#111827',
        bodyColor: '#4b5563',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        titleFont: { family: 'ui-sans-serif, system-ui, sans-serif', weight: 'bold' },
        bodyFont: { family: 'ui-sans-serif, system-ui, sans-serif' },
        padding: 10,
        cornerRadius: 8,
        displayColors: true,
        boxPadding: 4,
        callbacks: {
          label: (context) => ` ${context.label}: ${context.raw}`
        }
      }
    },
  };

  if (totalVulns === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-gray-50 dark:bg-gray-950 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-6">
        <svg className="w-8 h-8 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-gray-500 dark:text-gray-400 text-xs font-semibold tracking-wide uppercase">No Vulnerabilities</span>
      </div>
    );
  }

  const legendItems = [
    { label: 'Critical', count: counts[0], color: 'bg-red-500', barColor: 'bg-red-100', percentage: counts[0] ? Math.round((counts[0] / totalVulns) * 100) : 0 },
    { label: 'High', count: counts[1], color: 'bg-orange-500', barColor: 'bg-orange-100', percentage: counts[1] ? Math.round((counts[1] / totalVulns) * 100) : 0 },
    { label: 'Medium', count: counts[2], color: 'bg-amber-500', barColor: 'bg-amber-100', percentage: counts[2] ? Math.round((counts[2] / totalVulns) * 100) : 0 },
    { label: 'Low', count: counts[3], color: 'bg-blue-500', barColor: 'bg-blue-100', percentage: counts[3] ? Math.round((counts[3] / totalVulns) * 100) : 0 },
  ];

  return (
    <div className="w-full h-full flex flex-col justify-between">
      {/* Chart Area */}
      <div className="relative h-44 w-full flex justify-center items-center mt-2 mb-6">
        <Doughnut data={chartData} options={options} />
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-4xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tighter leading-none">{totalVulns}</span>
          <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mt-1">Total</span>
        </div>
      </div>

      {/* Custom High-Density Legend */}
      <div className="space-y-3 px-1">
        {legendItems.map((item, idx) => (
          <div key={idx} className="flex items-center gap-3 w-full group">
            <div className={`w-2.5 h-2.5 rounded-full ${item.color} shrink-0`} />
            
            <div className="flex-1 flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-gray-700 dark:text-gray-300">{item.label}</span>
                <span className="font-mono font-bold text-gray-900 dark:text-gray-100">{item.count}</span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${item.color} transition-all duration-500 ease-out`} 
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
