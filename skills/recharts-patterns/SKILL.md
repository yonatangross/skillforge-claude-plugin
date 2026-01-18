---
name: recharts-patterns
description: Data visualization with Recharts 3.x including responsive charts, custom tooltips, animations, and accessibility for React applications
tags: [recharts, charts, data-visualization, react, svg, accessibility, responsive, d3]
context: fork
agent: frontend-ui-developer
version: 1.0.0
author: SkillForge
user-invocable: false
---

# Recharts Patterns

Data visualization patterns using Recharts 3.x - a composable charting library built with React and D3.

## When to Use

- Building dashboards with multiple chart types
- Creating responsive, interactive charts
- Visualizing time-series data
- Building accessible data visualizations
- Custom tooltips and legends
- Animated chart transitions

## Core Chart Types

### 1. Line Chart (Time Series)

```tsx
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const data = [
  { date: '2024-01', revenue: 4000, expenses: 2400 },
  { date: '2024-02', revenue: 3000, expenses: 1398 },
  { date: '2024-03', revenue: 2000, expenses: 9800 },
  { date: '2024-04', revenue: 2780, expenses: 3908 },
];

function RevenueChart() {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="#8884d8"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 8 }}
        />
        <Line
          type="monotone"
          dataKey="expenses"
          stroke="#82ca9d"
          strokeWidth={2}
          strokeDasharray="5 5"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

### 2. Bar Chart

```tsx
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const data = [
  { name: 'Q1', sales: 4000, target: 4500 },
  { name: 'Q2', sales: 3000, target: 3500 },
  { name: 'Q3', sales: 2000, target: 2500 },
  { name: 'Q4', sales: 2780, target: 3000 },
];

function SalesChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="sales" fill="#8884d8" radius={[4, 4, 0, 0]} />
        <Bar dataKey="target" fill="#82ca9d" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

### 3. Area Chart

```tsx
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

function TrafficChart({ data }: { data: TrafficData[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time" />
        <YAxis />
        <Tooltip />
        <Area
          type="monotone"
          dataKey="visitors"
          stroke="#8884d8"
          fill="url(#colorUv)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
```

### 4. Pie/Donut Chart

```tsx
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const data = [
  { name: 'Desktop', value: 400 },
  { name: 'Mobile', value: 300 },
  { name: 'Tablet', value: 150 },
  { name: 'Other', value: 50 },
];

function DeviceChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60} // Makes it a donut
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
```

### 5. Composed Chart (Multiple Types)

```tsx
import {
  ComposedChart,
  Line,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

function ComposedMetricsChart({ data }: { data: MetricData[] }) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis yAxisId="left" />
        <YAxis yAxisId="right" orientation="right" />
        <Tooltip />
        <Legend />
        <Area
          yAxisId="left"
          type="monotone"
          dataKey="visitors"
          fill="#8884d8"
          stroke="#8884d8"
        />
        <Bar yAxisId="left" dataKey="conversions" fill="#82ca9d" />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="revenue"
          stroke="#ff7300"
          strokeWidth={2}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
```

## Custom Tooltip

```tsx
import { TooltipProps } from 'recharts';

interface CustomPayload {
  value: number;
  name: string;
}

function CustomTooltip({
  active,
  payload,
  label,
}: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-white p-3 shadow-lg rounded-lg border">
      <p className="font-medium text-gray-900">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: {entry.value?.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

// Usage
<LineChart data={data}>
  <Tooltip content={<CustomTooltip />} />
  {/* ... */}
</LineChart>
```

## Animations

```tsx
function AnimatedChart({ data }: { data: ChartData[] }) {
  const [animationKey, setAnimationKey] = useState(0);

  const replayAnimation = () => setAnimationKey((k) => k + 1);

  return (
    <>
      <button onClick={replayAnimation}>Replay</button>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} key={animationKey}>
          <Line
            type="monotone"
            dataKey="value"
            stroke="#8884d8"
            isAnimationActive={true}
            animationDuration={2000}
            animationEasing="ease-in-out"
            animationBegin={0}
            onAnimationStart={() => console.log('Started')}
            onAnimationEnd={() => console.log('Ended')}
          />
        </LineChart>
      </ResponsiveContainer>
    </>
  );
}
```

## Accessibility (Recharts 3.x)

```tsx
// Wrap chart in accessible container with proper ARIA attributes
function AccessibleChart({ data }: { data: ChartData[] }) {
  return (
    <figure
      role="img"
      aria-label="Monthly revenue trend from January to December 2024"
    >
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <XAxis dataKey="month" />
          <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#8884d8"
            // 'name' prop used in Tooltip and Legend
            name="Monthly Revenue"
          />
        </LineChart>
      </ResponsiveContainer>
      <figcaption className="sr-only">
        Line chart showing monthly revenue from January to December
      </figcaption>
    </figure>
  );
}
```

**Note**: Recharts doesn't natively support ARIA props on chart components. Wrap in `<figure>` with `role="img"` and `aria-label` for screen readers.

## Responsive Design

```tsx
// Always use ResponsiveContainer for flexible sizing
function ResponsiveChart() {
  return (
    // Parent must have defined dimensions
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          {/* Chart contents */}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Responsive margins based on container
function ChartWithResponsiveMargins() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        margin={{
          top: 20,
          right: 20,
          left: 20,
          bottom: 20,
        }}
      >
        {/* For small screens, use minimal margins */}
      </BarChart>
    </ResponsiveContainer>
  );
}
```

## Real-Time Updates

```tsx
import { useQuery } from '@tanstack/react-query';

function RealTimeChart() {
  const { data } = useQuery({
    queryKey: ['metrics'],
    queryFn: fetchMetrics,
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  if (!data) return <ChartSkeleton />;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <Line
          type="monotone"
          dataKey="value"
          stroke="#8884d8"
          // Disable animation for real-time to prevent jank
          isAnimationActive={false}
          dot={false}
        />
        <XAxis dataKey="timestamp" />
        <YAxis domain={['auto', 'auto']} />
        <Tooltip />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

## TypeScript Types

```typescript
import type {
  CategoricalChartProps,
  TooltipProps,
} from 'recharts';

interface ChartDataPoint {
  date: string;
  value: number;
  category: string;
}

// Typed chart component
function TypedChart({ data }: { data: ChartDataPoint[] }) {
  return (
    <LineChart data={data}>
      <Line dataKey="value" />
    </LineChart>
  );
}
```

## Anti-Patterns (FORBIDDEN)

```tsx
// ❌ NEVER: ResponsiveContainer without parent dimensions
<div> {/* No height! */}
  <ResponsiveContainer width="100%" height="100%">
    {/* Chart won't render properly */}
  </ResponsiveContainer>
</div>

// ❌ NEVER: Fixed dimensions on ResponsiveContainer
<ResponsiveContainer width={800} height={400}>
  {/* Defeats the purpose of ResponsiveContainer */}
</ResponsiveContainer>

// ❌ NEVER: Animations on real-time charts
<Line isAnimationActive={true} /> // Causes jank with frequent updates

// ❌ NEVER: Missing keys in mapped data
{data.map((item) => (
  <Bar dataKey={item.key} /> // Missing key prop!
))}

// ❌ NEVER: Inline data definition in render
<LineChart data={[{x: 1, y: 2}, {x: 2, y: 3}]}> // New array every render!

// ❌ NEVER: Too many data points without virtualization
<LineChart data={dataWith10000Points}> // Performance issue!
```

## Performance Tips

```tsx
// Limit data points for smooth rendering
const MAX_POINTS = 500;
const chartData = data.slice(-MAX_POINTS);

// Use dot={false} for many data points
<Line dataKey="value" dot={false} />

// Memoize expensive calculations
const processedData = useMemo(() =>
  processChartData(rawData),
  [rawData]
);

// Debounce resize events (ResponsiveContainer handles this)
```

## Key Decisions

| Decision | Option A | Option B | Recommendation |
|----------|----------|----------|----------------|
| Chart library | Recharts | Victory/Nivo | **Recharts** for React-native feel |
| Container | Fixed size | ResponsiveContainer | **ResponsiveContainer** always |
| Animation | Enabled | Disabled | **Disabled** for real-time data |
| Tooltip | Default | Custom | **Custom** for branded UX |
| Data updates | Replace all | Append | **Sliding window** for time-series |

## Related Skills

- `dashboard-patterns` - Dashboard layouts with charts
- `tanstack-query-advanced` - Data fetching for charts
- `a11y-testing` - Testing chart accessibility

## Capability Details

### chart-types
**Keywords**: LineChart, BarChart, AreaChart, PieChart, ComposedChart
**Solves**: Which chart type for different data

### responsive-charts
**Keywords**: ResponsiveContainer, aspect ratio, resize
**Solves**: Making charts adapt to container size

### custom-tooltips
**Keywords**: Tooltip, content, formatter, custom
**Solves**: Customizing tooltip appearance and data

### animated-charts
**Keywords**: animation, duration, easing, replay
**Solves**: Adding animations to chart transitions

### chart-accessibility
**Keywords**: a11y, keyboard, screen reader, ARIA
**Solves**: Making charts accessible

## References

- `references/chart-types.md` - Chart type selection guide
- `references/accessibility.md` - Recharts a11y patterns
- `templates/responsive-line-chart.tsx` - Line chart template
- `templates/dashboard-chart-card.tsx` - Dashboard chart wrapper
