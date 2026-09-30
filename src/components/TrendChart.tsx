import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import type { DayStat } from '../lib/stats'

function TrendChart({ data }: Readonly<{ data: DayStat[] }>) {
  const chartData = data.map((d) => ({ name: d.key.slice(5), completions: d.completions }))

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={chartData}>
        <XAxis
          dataKey="name"
          tick={{ fill: '#a89a78', fontSize: 10 }}
          axisLine={{ stroke: '#2a2433' }}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: 'rgba(201,162,75,0.08)' }}
          contentStyle={{
            background: '#1d1925',
            border: '1px solid rgba(201,162,75,0.4)',
            fontSize: 12,
            borderRadius: 2,
          }}
          labelStyle={{ color: '#dabf74' }}
          itemStyle={{ color: '#f4ecd8' }}
        />
        <Bar dataKey="completions" fill="#c9a24b" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export default TrendChart
