/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { SensorData } from '../types';

interface SensorChartProps {
  data: { time: string; value: number }[];
  color: string;
  name: string;
}

export const SensorChart: React.FC<SensorChartProps> = ({ data, color, name }) => {
  return (
    <div className="h-24 w-full">
      <div className="mb-1 flex justify-between text-[10px] font-mono text-white/50">
        <span>{name}</span>
        <span>LIVE_TRANS</span>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <XAxis dataKey="time" hide />
          <YAxis hide domain={['auto', 'auto']} />
          <Tooltip 
            contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '4px', fontSize: '10px' }}
            itemStyle={{ color: color }}
            labelStyle={{ display: 'none' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
