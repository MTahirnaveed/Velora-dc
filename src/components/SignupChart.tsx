import React from 'react';
import { TrendingUp } from 'lucide-react';
import { SignupStat } from '../types';

interface SignupChartProps {
  signupsOverTime?: SignupStat[];
}

export const SignupChart: React.FC<SignupChartProps> = React.memo(({ signupsOverTime }) => {
  return (
    <div className="lg:col-span-7 bg-slate-900/60 backdrop-blur-md border border-slate-800 p-5 rounded-2xl text-left" id="analytics_chart">
      <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono mb-4 flex items-center gap-1.5">
        <TrendingUp className="h-4 w-4 text-indigo-400" /> Daily Signup Influx (Last 7 Days)
      </h3>

      {signupsOverTime && signupsOverTime.length > 0 ? (
        <div className="relative">
          {/* Svg chart container */}
          <svg className="w-full h-44 overflow-visible" viewBox="0 0 500 150">
            {/* Grid lines */}
            <line x1="40" y1="20" x2="480" y2="20" stroke="#1e293b" strokeWidth="1" strokeDasharray="3" />
            <line x1="40" y1="60" x2="480" y2="60" stroke="#1e293b" strokeWidth="1" strokeDasharray="3" />
            <line x1="40" y1="100" x2="480" y2="100" stroke="#1e293b" strokeWidth="1" strokeDasharray="3" />
            <line x1="40" y1="130" x2="480" y2="130" stroke="#334155" strokeWidth="1" />

            {/* Compile points coordinates dynamically */}
            {(() => {
              const maxVal = Math.max(...signupsOverTime.map(p => p.count), 5);
              const stepX = 420 / 6;
              
              const coords = signupsOverTime.map((p, idx) => {
                const x = 40 + idx * stepX;
                const y = 130 - (p.count / maxVal) * 100;
                return { x, y, count: p.count, label: p.date };
              });

              // Compile line path
              const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
              const areaPath = `${linePath} L ${coords[coords.length-1].x} 130 L ${coords[0].x} 130 Z`;

              return (
                <>
                  {/* Area Gradient */}
                  <path d={areaPath} fill="url(#indigoGrad)" opacity="0.15" />
                  {/* Trendline */}
                  <path d={linePath} fill="none" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  
                  {/* Point Markers and values */}
                  {coords.map((c, idx) => (
                    <g key={idx}>
                      <circle cx={c.x} cy={c.y} r="4" fill="#818cf8" stroke="#0f172a" strokeWidth="2" />
                      <text x={c.x} y={c.y - 10} textAnchor="middle" fill="#a5b4fc" className="text-[10px] font-mono font-bold">{c.count}</text>
                      <text x={c.x} y="145" textAnchor="middle" fill="#64748b" className="text-[8px] font-mono">{c.label}</text>
                    </g>
                  ))}
                  
                  <defs>
                    <linearGradient id="indigoGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </>
              );
            })()}
          </svg>
        </div>
      ) : (
        <p className="text-xs text-slate-500 text-center py-10">Signups database analytics loading...</p>
      )}
    </div>
  );
});

SignupChart.displayName = 'SignupChart';
