'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer
} from 'recharts'

interface ChartDatum {
  score: number
  count: number
}

interface Props {
  data: ChartDatum[]
}

export const RatingDistributionChart = ({ data }: Props) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        className="[&_.recharts-surface]:outline-0 [&_.recharts-surface]:focus-visible:outline-2 [&_.recharts-surface]:focus-visible:outline-red"
        data={data}
        margin={{ left: 4, right: 4, top: 8 }}
      >
        <defs>
          <linearGradient id="ratingBar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--heroui-warning))" />
            <stop offset="100%" stopColor="hsl(var(--heroui-warning) / 0.7)" />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="score"
          tick={{ fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          width={24}
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11 }}
        />
        <RTooltip
          formatter={(v: any) => [v, '人数']}
          labelFormatter={(l) => `评分 ${l}`}
          contentStyle={{
            backgroundColor: 'hsl(var(--heroui-content1))',
            border: '1px solid hsl(var(--heroui-border))',
            borderRadius: '0.5rem',
            color: 'hsl(var(--heroui-foreground))',
            fontSize: '0.75rem'
          }}
          labelStyle={{
            color: 'hsl(var(--heroui-foreground))',
            fontWeight: 600
          }}
          cursor={{ fill: 'hsl(var(--heroui-default-200))' }}
        />
        <Bar dataKey="count" fill="url(#ratingBar)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export default RatingDistributionChart
