---
name: dashboard-patterns
description: Dashboard UI patterns with widget composition, real-time data updates, responsive grid layouts, and data tables for React applications
tags: [dashboard, widgets, data-grid, real-time, layout, admin, tanstack-table, sse]
context: fork
agent: frontend-ui-developer
version: 1.0.0
author: SkillForge
user-invocable: false
---

# Dashboard Patterns

Dashboard UI patterns for building admin panels, analytics dashboards, and data-driven interfaces with React.

## When to Use

- Building admin dashboards
- Creating analytics/metrics displays
- Implementing real-time monitoring UIs
- Building data tables with sorting/filtering
- Creating widget-based layouts
- Implementing responsive dashboard grids

## Layout Patterns

### 1. CSS Grid Dashboard Layout

```tsx
function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/40">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-10 w-64 border-r bg-background">
        <Sidebar />
      </aside>

      {/* Main content */}
      <main className="pl-64">
        {/* Header */}
        <header className="sticky top-0 z-10 border-b bg-background px-6 py-4">
          <DashboardHeader />
        </header>

        {/* Dashboard grid */}
        <div className="p-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
```

### 2. Responsive Dashboard Grid

```tsx
function DashboardGrid() {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {/* Stat cards - 1/4 width each on large screens */}
      <StatCard title="Revenue" value="$45,231" change="+12%" />
      <StatCard title="Users" value="2,350" change="+5.2%" />
      <StatCard title="Orders" value="1,245" change="+18%" />
      <StatCard title="Conversion" value="3.2%" change="-0.4%" />

      {/* Chart spanning 2 columns on large screens */}
      <div className="col-span-1 sm:col-span-2 lg:col-span-2">
        <RevenueChart />
      </div>

      {/* Chart spanning 2 columns */}
      <div className="col-span-1 sm:col-span-2 lg:col-span-2">
        <TrafficChart />
      </div>

      {/* Full-width table */}
      <div className="col-span-full">
        <RecentOrdersTable />
      </div>
    </div>
  );
}
```

## Widget Components

### 1. Stat Card Widget

```tsx
import { motion } from 'motion/react';
import { fadeIn, cardHover } from '@/lib/animations';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: React.ReactNode;
}

function StatCard({ title, value, change, changeType = 'neutral', icon }: StatCardProps) {
  return (
    <motion.div
      {...fadeIn}
      {...cardHover}
      className="rounded-xl border bg-card p-6"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <p className="text-3xl font-bold">{value}</p>
        {change && (
          <span
            className={cn(
              'flex items-center text-sm font-medium',
              changeType === 'positive' && 'text-green-600',
              changeType === 'negative' && 'text-red-600',
              changeType === 'neutral' && 'text-muted-foreground'
            )}
          >
            {changeType === 'positive' && <TrendingUp className="h-4 w-4" />}
            {changeType === 'negative' && <TrendingDown className="h-4 w-4" />}
            {change}
          </span>
        )}
      </div>
    </motion.div>
  );
}
```

### 2. Chart Card Widget

```tsx
import { Suspense, lazy } from 'react';

const LazyChart = lazy(() => import('./RevenueChart'));

function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card">
      <div className="border-b px-6 py-4">
        <h3 className="font-semibold">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="p-6">
        <Suspense fallback={<ChartSkeleton />}>
          {children}
        </Suspense>
      </div>
    </div>
  );
}

// Skeleton for loading state
function ChartSkeleton() {
  return (
    <div className="h-[300px] animate-pulse rounded bg-muted" />
  );
}
```

### 3. Widget Registry Pattern

```tsx
// Widget type definitions
type WidgetType = 'stat' | 'chart' | 'table' | 'list';

interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  span?: number; // Grid column span
  props: Record<string, unknown>;
}

// Widget registry
const widgetRegistry: Record<WidgetType, React.ComponentType<any>> = {
  stat: StatCard,
  chart: ChartCard,
  table: DataTable,
  list: ListWidget,
};

// Dynamic widget renderer
function DashboardWidget({ config }: { config: WidgetConfig }) {
  const Component = widgetRegistry[config.type];

  if (!Component) {
    console.warn(`Unknown widget type: ${config.type}`);
    return null;
  }

  return (
    <div style={{ gridColumn: config.span ? `span ${config.span}` : undefined }}>
      <Component title={config.title} {...config.props} />
    </div>
  );
}

// Dashboard with configurable widgets
function ConfigurableDashboard({ widgets }: { widgets: WidgetConfig[] }) {
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      {widgets.map((widget) => (
        <DashboardWidget key={widget.id} config={widget} />
      ))}
    </div>
  );
}
```

## Real-Time Data Patterns

### 1. TanStack Query + SSE

```tsx
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

function useRealtimeMetrics() {
  const queryClient = useQueryClient();

  // Initial data fetch
  const { data, isLoading } = useQuery({
    queryKey: ['metrics'],
    queryFn: fetchMetrics,
  });

  // SSE subscription for real-time updates
  useEffect(() => {
    const eventSource = new EventSource('/api/metrics/stream');

    eventSource.onmessage = (event) => {
      const update = JSON.parse(event.data);
      queryClient.setQueryData(['metrics'], (old: Metrics | undefined) => ({
        ...old,
        ...update,
      }));
    };

    eventSource.onerror = () => {
      eventSource.close();
      // Fallback to polling
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
    };

    return () => eventSource.close();
  }, [queryClient]);

  return { data, isLoading };
}
```

### 2. WebSocket Integration

```tsx
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

function useWebSocketMetrics(url: string) {
  const queryClient = useQueryClient();
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    ws.current = new WebSocket(url);

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'metric_update':
          queryClient.setQueryData(['metrics', data.id], data.value);
          break;
        case 'alert':
          queryClient.setQueryData(['alerts'], (old: Alert[] = []) => [
            data.alert,
            ...old,
          ]);
          break;
      }
    };

    ws.current.onclose = () => {
      // Reconnect logic
      setTimeout(() => {
        // Reconnect
      }, 3000);
    };

    return () => {
      ws.current?.close();
    };
  }, [url, queryClient]);

  return ws.current;
}
```

## Data Table Patterns (TanStack Table)

### Basic Data Table

```tsx
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { useState } from 'react';

interface Order {
  id: string;
  customer: string;
  amount: number;
  status: 'pending' | 'completed' | 'cancelled';
  date: string;
}

const columns: ColumnDef<Order>[] = [
  {
    accessorKey: 'id',
    header: 'Order ID',
  },
  {
    accessorKey: 'customer',
    header: 'Customer',
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
    cell: ({ getValue }) => `$${getValue<number>().toLocaleString()}`,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ getValue }) => <StatusBadge status={getValue<Order['status']>()} />,
  },
  {
    accessorKey: 'date',
    header: 'Date',
    cell: ({ getValue }) => formatDate(getValue<string>()),
  },
];

function OrdersTable({ data }: { data: Order[] }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div>
      {/* Search */}
      <input
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        placeholder="Search orders..."
        className="mb-4 rounded border px-3 py-2"
      />

      {/* Table */}
      <table className="w-full">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                  className="cursor-pointer px-4 py-2 text-left"
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {header.column.getIsSorted() === 'asc' && ' ↑'}
                  {header.column.getIsSorted() === 'desc' && ' ↓'}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border-t">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-2">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </button>
        <span>
          Page {table.getState().pagination.pageIndex + 1} of{' '}
          {table.getPageCount()}
        </span>
        <button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </button>
      </div>
    </div>
  );
}
```

## Skeleton Loading

```tsx
function DashboardSkeleton() {
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      {/* Stat skeletons */}
      {[...Array(4)].map((_, i) => (
        <div key={i} className="rounded-xl border bg-card p-6">
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-8 w-32 animate-pulse rounded bg-muted" />
        </div>
      ))}

      {/* Chart skeletons */}
      <div className="col-span-2 rounded-xl border bg-card p-6">
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="mt-4 h-[200px] animate-pulse rounded bg-muted" />
      </div>
      <div className="col-span-2 rounded-xl border bg-card p-6">
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="mt-4 h-[200px] animate-pulse rounded bg-muted" />
      </div>

      {/* Table skeleton */}
      <div className="col-span-full rounded-xl border bg-card p-6">
        <div className="h-4 w-48 animate-pulse rounded bg-muted" />
        <div className="mt-4 space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded bg-muted" />
          ))}
        </div>
      </div>
    </div>
  );
}
```

## Anti-Patterns (FORBIDDEN)

```tsx
// ❌ NEVER: Fetch data in every widget independently
function Widget() {
  const { data } = useQuery({ queryKey: ['allData'] }); // Duplicated!
  return <div>{data.metric}</div>;
}

// ❌ NEVER: Re-render entire dashboard on single metric change
function Dashboard() {
  const [metrics, setMetrics] = useState(allMetrics); // All in one state
  // One update triggers full re-render
}

// ❌ NEVER: Hardcoded dashboard layout
<div style={{ width: '1200px' }}> // Not responsive!

// ❌ NEVER: Polling without intervals
useEffect(() => {
  const fetch = async () => {
    await fetchData();
    fetch(); // Infinite loop!
  };
  fetch();
}, []);

// ❌ NEVER: Missing loading states
{data && <Chart data={data} />} // Flash of empty state

// ❌ NEVER: Real-time updates without debounce
ws.onmessage = (e) => {
  setData(JSON.parse(e.data)); // 100 updates/sec = 100 re-renders!
};
```

## Key Decisions

| Decision | Option A | Option B | Recommendation |
|----------|----------|----------|----------------|
| Layout | CSS Grid | Flexbox | **CSS Grid** for 2D dashboard layouts |
| Real-time | SSE | WebSocket | **SSE** for server→client, **WebSocket** for bidirectional |
| Data table | TanStack Table | Custom | **TanStack Table** for features |
| State | Per-widget | Centralized | **TanStack Query** with granular keys |
| Loading | Spinner | Skeleton | **Skeleton** for content areas |

## Related Skills

- `recharts-patterns` - Chart components for dashboards
- `tanstack-query-advanced` - Data fetching patterns
- `streaming-api-patterns` - SSE and WebSocket implementation
- `responsive-patterns` - Responsive grid layouts

## Capability Details

### dashboard-layout
**Keywords**: grid, layout, sidebar, header, responsive
**Solves**: Structuring dashboard pages

### widget-composition
**Keywords**: widget, card, reusable, registry
**Solves**: Building reusable dashboard widgets

### real-time-updates
**Keywords**: SSE, WebSocket, real-time, streaming
**Solves**: Live data updates in dashboards

### data-grid-patterns
**Keywords**: TanStack Table, sorting, filtering, pagination
**Solves**: Building feature-rich data tables

### responsive-dashboard
**Keywords**: responsive, mobile, breakpoints, col-span
**Solves**: Dashboard adaptation to screen sizes

## References

- `references/widget-composition.md` - Widget architecture
- `references/real-time-updates.md` - SSE/WebSocket patterns
- `templates/dashboard-layout.tsx` - Dashboard layout template
- `templates/widget-card.tsx` - Widget card component
