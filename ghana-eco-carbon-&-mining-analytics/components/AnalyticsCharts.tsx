import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { CARBON_EMISSIONS_DATA, LAND_COVER_DATA } from '../data/mockData';

export const CarbonBarChart: React.FC = () => {
  return (
    <div className="h-32 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={CARBON_EMISSIONS_DATA}>
          <Tooltip 
            cursor={{ fill: 'rgba(251, 191, 36, 0.1)' }}
            contentStyle={{ 
              backgroundColor: '#052e16', 
              borderColor: 'rgba(251, 191, 36, 0.4)', 
              fontSize: '10px' 
            }}
          />
          <Bar dataKey="emissions" fill="#fbbf24" radius={[2, 2, 0, 0]} />
          <XAxis dataKey="month" hide />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const LandCoverPieChart: React.FC = () => {
  return (
    <div className="h-32 w-full flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={LAND_COVER_DATA}
            cx="50%"
            cy="50%"
            innerRadius={25}
            outerRadius={40}
            paddingAngle={5}
            dataKey="value"
          >
            {LAND_COVER_DATA.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#052e16', 
              borderColor: 'rgba(251, 191, 36, 0.4)', 
              fontSize: '10px' 
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-col gap-1 pr-4">
        {LAND_COVER_DATA.map((entry) => (
          <div key={entry.name} className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-[8px] font-black text-white/60 uppercase tracking-tighter">{entry.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};