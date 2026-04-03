import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { LOSS_TREND_DATA } from '../data/mockData';

export const LossChart: React.FC = () => {
  return (
    <div className="h-28 w-full mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={LOSS_TREND_DATA}>
          <defs>
            <linearGradient id="colorGold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#052e16', 
              borderColor: 'rgba(251, 191, 36, 0.4)', 
              borderRadius: '2px', 
              color: '#fff', 
              fontSize: '11px',
              fontWeight: 'bold',
              textTransform: 'uppercase'
            }}
            itemStyle={{ color: '#fbbf24' }}
          />
          <Area 
            type="stepAfter" 
            dataKey="loss" 
            stroke="#fbbf24" 
            fillOpacity={1} 
            fill="url(#colorGold)" 
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};