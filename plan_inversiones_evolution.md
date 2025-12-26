# Plan for Adding Evolution Chart and Table to Inversiones Page

## Objective
Add the same stacked bar chart and evolution table functionality to the Inversiones page, showing investment evolution over time by category.

## Current State Analysis
- **Inversiones.tsx**: Currently shows investments only for the current campaign year
- **Data Loading**: Uses `getInvestmentsByCampaign` per campaign, stores in `investments` state
- **Categories**: tierra, mejoras, implantacion, riego, maquinaria
- **Colors**: Different color scheme than costs

## Required Changes

### 1. DataStore Modifications
**File**: `src/stores/dataStore.ts`
- Add `loadAllInvestments(projectId: number, campaigns: Campaign[])` function
- Similar to `loadAllCosts` but for investments
- Load investments from all campaigns and accumulate in state

**Interface Update**:
```typescript
loadAllInvestments: (projectId: number, campaigns: Campaign[]) => Promise<void>;
```

**Implementation**:
```typescript
loadAllInvestments: async (projectId, campaigns) => {
  try {
    const allInvestments: InvestmentRecord[] = [];
    for (const campaign of campaigns) {
      const campaignInvestments = await getInvestmentsByCampaign(projectId, campaign.id);
      const formattedInvestments = campaignInvestments.map(inv => ({
        id: inv.id.toString(),
        year: campaign.year,
        category: inv.category,
        description: inv.description,
        amount: Number(inv.total_value) || 0,
        date: new Date(inv.created_at),
        data: inv.details,
      }));
      allInvestments.push(...formattedInvestments);
    }
    set({ investments: allInvestments });
  } catch (error) {
    console.error('Error loading all investments:', error);
    throw error;
  }
},
```

### 2. Inversiones Page Updates
**File**: `src/pages/Inversiones.tsx`

**Imports to Add**:
```typescript
import { useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { cn } from "@/lib/utils";
```

**State and Logic**:
```typescript
// Calculate displayed years - only campaign years
const displayedYears = useMemo(() => {
  if (campaigns.length === 0) return [];
  const years = campaigns.map(c => c.year).sort((a, b) => a - b);
  return years;
}, [campaigns]);

// Get current year for visual differentiation
const currentYear = new Date().getFullYear();

// Get investment for a specific category and year
const getInvestmentForCategoryAndYear = (category: string, year: number): number => {
  const campaign = campaigns.find(c => c.year === year);
  if (!campaign) return 0;

  return investments
    .filter(inv => inv.year === year && inv.category === category)
    .reduce((sum, inv) => sum + inv.amount, 0);
};
```

**Data Processing for Charts**:
```typescript
// Prepare data for stacked bar chart - investments by year and category
const chartData = campaigns
  .sort((a, b) => a.year - b.year)
  .map((campaign) => {
    const year = campaign.year;
    const yearInvestments = investments.filter((inv) => inv.year === year);

    const yearData: any = { year };
    Object.keys(categoriaLabels).forEach((category) => {
      const categoryInvestments = yearInvestments.filter((inv) => inv.category === category);
      const total = categoryInvestments.reduce((sum, inv) => sum + inv.amount, 0);
      yearData[category] = total;
    });

    return yearData;
  });

// Prepare data for pie chart (current campaign only)
const inversionPorCategoria = inversionesFiltered.reduce((acc, inv) => {
  const existing = acc.find((item) => item.name === inv.category);
  if (existing) {
    existing.value += inv.amount;
  } else {
    acc.push({ name: inv.category, value: inv.amount });
  }
  return acc;
}, [] as { name: string; value: number }[]);
```

### 3. UI Components to Add

**Stacked Bar Chart** (after summary card):
```jsx
<Card className="border-border/50 shadow-md">
  <CardHeader>
    <CardTitle className="text-foreground">Evolución de Inversiones por Categoría</CardTitle>
  </CardHeader>
  <CardContent>
    {chartData.length > 0 ? (
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis />
          <Tooltip
            formatter={(value: number, name: string) => [
              `$${value.toLocaleString()}`,
              categoriaLabels[name] || name
            ]}
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
          />
          <Legend />
          {Object.keys(categoriaLabels).map((category) => (
            <Bar
              key={category}
              dataKey={category}
              stackId="a"
              fill={categoriaColors[category]?.replace('bg-', '#') || "#cccccc"}
              name={categoriaLabels[category]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    ) : (
      <div className="h-[400px] flex items-center justify-center text-muted-foreground">
        Sin datos para mostrar
      </div>
    )}
  </CardContent>
</Card>
```

**Evolution Table** (after chart):
```jsx
<Card className="border-border/50 shadow-md">
  <CardHeader>
    <CardTitle className="text-foreground">Tabla de Evolución de Inversiones</CardTitle>
  </CardHeader>
  <CardContent>
    <ScrollArea className="max-w-full">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border">
            <th className="sticky left-0 z-20 bg-card text-left p-2 sm:p-3 text-sm font-semibold text-muted-foreground border-r border-border">
              Categoría
            </th>
            {displayedYears.map((year, index) => {
              const isHistorical = year < currentYear;
              const isCurrentYear = year === currentYear;
              const nextYear = displayedYears[index + 1];

              return (
                <th
                  key={year}
                  className={cn(
                    "text-center p-2 sm:p-3 text-sm font-semibold relative",
                    isHistorical && "bg-slate-50/50",
                    isCurrentYear && "border-r-2 border-yellow-500"
                  )}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>{year}</span>
                  </div>
                  {isCurrentYear && nextYear && (
                    <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-yellow-500"></div>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {Object.entries(categoriaLabels).map(([categoryKey, categoryName]) => (
            <tr key={categoryKey} className="border-b border-border/50 hover:bg-secondary/30">
              <td className="sticky left-0 z-10 bg-card p-2 sm:p-3 border-r border-border">
                <Badge
                  className={`${categoriaColors[categoryKey]} text-white`}
                >
                  {categoryName}
                </Badge>
              </td>
              {displayedYears.map((year) => {
                const amount = getInvestmentForCategoryAndYear(categoryKey, year);
                const isHistorical = year < currentYear;

                return (
                  <td
                    key={year}
                    className={cn(
                      "text-center p-2 sm:p-3 text-sm font-semibold text-foreground",
                      isHistorical && "bg-slate-50/20"
                    )}
                  >
                    ${amount.toLocaleString()}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-border bg-primary/5">
            <td className="sticky left-0 z-20 bg-primary/5 p-3 border-r border-border">
              <div className="font-semibold text-foreground">Total</div>
            </td>
            {displayedYears.map((year) => {
              const total = Object.keys(categoriaLabels).reduce((sum, category) =>
                sum + getInvestmentForCategoryAndYear(category, year), 0);
              const isHistorical = year < currentYear;

              return (
                <td
                  key={year}
                  className={cn(
                    "text-center p-3 font-bold text-foreground",
                    isHistorical && "bg-slate-50/20"
                  )}
                >
                  ${total.toLocaleString()}
                </td>
              );
            })}
          </tr>
        </tfoot>
      </table>
    </ScrollArea>

    {campaigns.length === 0 && (
      <div className="text-center py-8 text-muted-foreground">
        No hay campañas disponibles para mostrar la evolución de inversiones.
      </div>
    )}
  </CardContent>
</Card>
```

### 4. Data Loading Update
**Replace current useEffect**:
```typescript
useEffect(() => {
  const loadInvestments = async () => {
    if (currentProjectId && campaigns.length > 0) {
      try {
        await loadAllInvestments(currentProjectId, campaigns);
      } catch (error) {
        console.error("Error loading investments:", error);
      }
    }
  };

  loadInvestments();
}, [currentProjectId, campaigns, loadAllInvestments]);
```

## Implementation Steps
1. ✅ Add loadAllInvestments to dataStore
2. ✅ Update Inversiones page imports and logic
3. ✅ Add stacked bar chart component
4. ✅ Add evolution table component
5. ✅ Update data loading to use loadAllInvestments
6. ✅ Test implementation - Build successful

## Dependencies
- Existing categoriaLabels and categoriaColors for investments
- campaigns and investments data
- UI components (ScrollArea, Badge, PieChart, BarChart, etc.)

## Success Criteria
- ✅ Stacked bar chart shows investment evolution by category over time
- ✅ Evolution table displays investments by category for all campaign years
- ✅ Total row accurately sums investments for each year
- ✅ Data matches between chart and table
- ✅ No future/projection years - only real campaign data
- ✅ Build compiles successfully