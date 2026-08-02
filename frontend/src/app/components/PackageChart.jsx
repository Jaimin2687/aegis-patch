'use client';

import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useTheme } from 'next-themes';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

export default function PackageChart({ vulns = [] }) {
  const { resolvedTheme } = useTheme();
  
  // Aggregate vulnerabilities by package
  const packageCounts = {};
  vulns.forEach(v => {
    const pkg = v.packageName || 'Unknown';
    packageCounts[pkg] = (packageCounts[pkg] || 0) + 1;
  });

  // Sort and take top 5
  const sortedPackages = Object.entries(packageCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (sortedPackages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 w-full bg-gray-50 dark:bg-gray-950 dark:bg-gray-950 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 dark:border-gray-700 p-6">
        <svg className="w-8 h-8 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        <span className="text-gray-500 dark:text-gray-400 dark:text-gray-400 text-xs font-semibold tracking-wide uppercase">No Packages Affected</span>
      </div>
    );
  }

  const chartData = {
    labels: sortedPackages.map(p => p[0]),
    datasets: [
      {
        data: sortedPackages.map(p => p[1]),
        backgroundColor: '#4f46e5', // indigo-600
        borderRadius: 4,
        barThickness: 16,
      },
    ],
  };

  const options = {
    indexAxis: 'y', // horizontal bar chart
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: resolvedTheme === 'dark' ? '#1f2937' : '#ffffff',
        titleColor: resolvedTheme === 'dark' ? '#f9fafb' : '#111827',
        bodyColor: resolvedTheme === 'dark' ? '#d1d5db' : '#4b5563',
        borderColor: resolvedTheme === 'dark' ? '#374151' : '#e5e7eb',
        borderWidth: 1,
        titleFont: { family: 'ui-sans-serif, system-ui, sans-serif', weight: 'bold' },
        bodyFont: { family: 'ui-sans-serif, system-ui, sans-serif' },
        padding: 10,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: (context) => ` ${context.raw} vulnerabilities`
        }
      }
    },
    scales: {
      x: {
        display: false,
        beginAtZero: true,
      },
      y: {
        grid: { display: false, drawBorder: false },
        ticks: {
          color: resolvedTheme === 'dark' ? '#9ca3af' : '#4b5563',
          font: { family: 'ui-monospace, SFMono-Regular, monospace', size: 11 },
          autoSkip: false,
        }
      }
    }
  };

  return (
    <div className="w-full h-48 flex justify-center items-center">
      <Bar data={chartData} options={options} />
    </div>
  );
}
