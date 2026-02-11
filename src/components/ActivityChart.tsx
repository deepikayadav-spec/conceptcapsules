import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ActivityTimelinePoint {
  time: string;
  activeUsers: number;
}

interface ActivityChartProps {
  data: ActivityTimelinePoint[];
}

const TIME_RANGES = [
  { label: '6h', hours: 6 },
  { label: '12h', hours: 12 },
  { label: '24h', hours: 24 },
  { label: '7d', hours: 168 },
] as const;

export function ActivityChart({ data }: ActivityChartProps) {
  const [range, setRange] = useState('24h');

  const filteredData = useMemo(() => {
    const hours = TIME_RANGES.find(r => r.label === range)?.hours || 24;
    const cutoff = Date.now() - hours * 60 * 60 * 1000;
    return data
      .filter(d => new Date(d.time).getTime() >= cutoff)
      .map(d => ({
        ...d,
        label: range === '7d'
          ? new Date(d.time).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
          : new Date(d.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }));
  }, [data, range]);

  const isEmpty = filteredData.length === 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">Active Users Over Time</CardTitle>
        <ToggleGroup type="single" value={range} onValueChange={v => v && setRange(v)} size="sm">
          {TIME_RANGES.map(r => (
            <ToggleGroupItem key={r.label} value={r.label} className="text-xs px-2.5">
              {r.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">
            No activity data yet. The graph will populate as users visit.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={filteredData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="activeUsersGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11 }}
                className="fill-muted-foreground"
                interval="preserveStartEnd"
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11 }}
                className="fill-muted-foreground"
                width={30}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Area
                type="monotone"
                dataKey="activeUsers"
                name="Active Users"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#activeUsersGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
