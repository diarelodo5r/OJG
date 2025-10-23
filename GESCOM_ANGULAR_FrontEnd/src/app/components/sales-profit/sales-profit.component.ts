import { Component, ViewChild, OnInit } from '@angular/core';
import { MaterialModule } from '../../material.module';
import { NgIcon } from '@ng-icons/core';
import { FormControl, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { DatePipe, CommonModule } from '@angular/common';
import {
    ApexChart,
    ChartComponent,
    ApexDataLabels,
    ApexLegend,
    ApexStroke,
    ApexTooltip,
    ApexAxisChartSeries,
    ApexPlotOptions,
    NgApexchartsModule,
    ApexFill,
    ApexGrid,
    ApexXAxis,
    ApexYAxis,
    ApexMarkers,
    ApexResponsive,
} from 'ng-apexcharts';
import {MatNativeDateModule} from '@angular/material/core';

// Extend ApexChart to include style property
type CustomApexChart = ApexChart & {
  style?: {
    fontSize?: string;
  };
};

export interface SalesProfitChart {
    series: any[];
    chart: any;
    xaxis: any;
    yaxis: any;
    tooltip: any;
    colors: string[];
    dataLabels?: any;
    stroke?: any;
    grid?: any;
  
    // les champs qui posent problème
    markers?: any;
    plotOptions?: any;
    legend?: any;
    fill?: any;
    responsive?: any;
  }
  
interface MonthOption {
    value: string;
    viewValue: string;
}

@Component({
    selector: 'app-sales-profit',
    standalone: true,
    imports: [
        MaterialModule, 
        NgIcon, 
        NgApexchartsModule, 
        CommonModule, 
        ReactiveFormsModule,
        FormsModule,
        MatNativeDateModule
    ],
    templateUrl: './sales-profit.component.html',
    styleUrls: ['./sales-profit.component.scss'],
    providers: [DatePipe]
})
export class AppSalesProfitComponent implements OnInit {
    @ViewChild('chart') chart: ChartComponent | null = null;
    public salesprofitChart: SalesProfitChart = {
        series: [],
        chart: { 
            type: 'area', 
            height: 350, 
            zoom: { enabled: false },
            fontFamily: 'inherit',
            toolbar: {
                show: true,
                tools: {
                    download: true,
                    selection: false,
                    zoom: true,
                    zoomin: true,
                    zoomout: true,
                    pan: true,
                    reset: true
                }
            }
        },
        dataLabels: { enabled: false },
        stroke: { 
            curve: 'smooth', 
            width: 2,
            colors: ['#00A1FF', '#8965E5']
        },
        legend: { 
            show: true,
            position: 'top',
            horizontalAlign: 'center',
            fontSize: '14px',
            markers: {
                strokeWidth: 2
            },
            itemMargin: {
                horizontal: 10,
                vertical: 5
            }
        },
        xaxis: { 
            type: 'category',
            axisBorder: { show: false },
            axisTicks: { show: false }
        },
        yaxis: { 
            show: true,
            tickAmount: 5
        },
        grid: { 
            show: true,
            strokeDashArray: 3,
            borderColor: 'rgba(0, 0, 0, 0.1)'
        },
        fill: { 
            type: 'gradient',
            gradient: {
                shade: 'light',
                type: 'vertical',
                shadeIntensity: 0.5,
                gradientToColors: ['#00A1FF', '#8965E5'],
                inverseColors: true,
                opacityFrom: 0.7,
                opacityTo: 0.1,
                stops: [0, 100]
            }
        },
        tooltip: { 
            enabled: true,
            theme: 'light',
            x: {
                format: 'MMM yyyy'
            },
            y: {
                formatter: (val: number) => `$${val}`
            }
        },
        plotOptions: { 
            bar: { 
                horizontal: false,
                borderRadius: 4,
                columnWidth: '45%'
            }
        },
        colors: ['#00A1FF', '#8965E5'],
        markers: {
            size: 4,
            strokeWidth: 3,
            strokeColors: ['transparent', 'transparent'],
            colors: ['#5D87FF', '#49BEFF']
          },          
        responsive: [{
            breakpoint: 1024,
            options: {
                chart: {
                    height: 250
                }
            }
        }]
    };
    
    dateRange: FormGroup;
    timeRange = 'Month';
    sortDirection: 'asc' | 'desc' = 'asc';
    // Keep an immutable copy of the original XY points to rebuild buckets reliably
    private originalSeries: Array<{ name: string; type: 'area' | 'line'; data: Array<{ x: number; y: number }> }> = [];
    
    // Default date range: full 2024-01-01 .. 2025-12-31
    private defaultDateRange = {
        start: new Date(2024, 0, 1),
        end: new Date(2025, 11, 31)
    };
    
    months: MonthOption[] = [
        { value: 'mar', viewValue: 'Sep 2025' },
        { value: 'apr', viewValue: 'Oct 2025' },
        { value: 'june', viewValue: 'Nov 2025' },
    ];

    constructor(private datePipe: DatePipe) {
        // Initialize form with default values
        this.dateRange = new FormGroup({
            start: new FormControl<Date | null>(this.defaultDateRange.start),
            end: new FormControl<Date | null>(this.defaultDateRange.end),
            timeRange: new FormControl('Month')
        });
    }
    
    ngOnInit(): void {
        this.initializeChart();
        this.updateChartData();
    }
    
    onTimeRangeChange(): void {
        const today = new Date();
        let startDate: Date;
        let endDate: Date = today;
        
        const selectedRange = this.dateRange.get('timeRange')?.value;
        
        switch(selectedRange) {
            case 'Day':
                startDate = new Date(today);
                break;
            case 'Month':
                startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                break;
            case 'Year':
                startDate = new Date(today.getFullYear(), 0, 1);
                endDate = new Date(today.getFullYear(), 11, 31);
                break;
            default:
                startDate = this.defaultDateRange.start;
                endDate = this.defaultDateRange.end;
        }
        
        this.dateRange.patchValue({
            start: startDate,
            end: endDate
        }, { emitEvent: false });
        
        this.updateChartData();
    }
    
    onDateRangeChange(): void {
        if (this.dateRange.valid && this.dateRange.value.start && this.dateRange.value.end) {
            // If dates are manually changed, set timeRange to custom
            this.dateRange.get('timeRange')?.setValue('custom', { emitEvent: false });
            this.timeRange = 'custom';
            this.updateChartData();
        }
    }
    
    
    private initializeChart(): void {
        this.salesprofitChart = {
          series: [
            {
              type: "area",
              name: "This Year",
              data: [
                { x: new Date(2024, 7, 1).getTime(), y: 25 }, // Août 2024
                { x: new Date(2024, 8, 1).getTime(), y: 25 }, // Sept 2024
                { x: new Date(2024, 9, 1).getTime(), y: 10 },
                { x: new Date(2024, 10, 1).getTime(), y: 10 },
                { x: new Date(2024, 11, 1).getTime(), y: 45 },
                { x: new Date(2025, 0, 1).getTime(), y: 45 },
              ]
            },
            {
              type: "line",
              name: "Last Year",
              data: [
                { x: new Date(2024, 7, 1).getTime(), y: 50 },
                { x: new Date(2024, 8, 1).getTime(), y: 50 },
                { x: new Date(2024, 9, 1).getTime(), y: 25 },
                { x: new Date(2024, 10, 1).getTime(), y: 20 },
                { x: new Date(2024, 11, 1).getTime(), y: 20 },
                { x: new Date(2025, 0, 1).getTime(), y: 20 },
                { x: new Date(2025, 1, 1).getTime(), y: 35 },
                { x: new Date(2025, 2, 1).getTime(), y: 35 },
                { x: new Date(2025, 3, 1).getTime(), y: 60 },
              ]
            }
          ],
          chart: {
            height: 360,
            type: 'area',
            fontFamily: 'inherit',
            foreColor: "#adb0bb",
            style: { fontSize: '12px' },
            animations: { enabled: true, speed: 500 },
            toolbar: { show: true }
          },
          xaxis: {
            type: "datetime",  // 🔥 important
            labels: { format: "MMM yyyy" },
            axisBorder: { show: false },
            axisTicks: { show: false }
          },
          yaxis: { tickAmount: 3, show: true },
          tooltip: {
            enabled: true,
            theme: 'light',
            x: { format: 'MMM yyyy' }, // affichage lisible
            y: {
              formatter: (val: number) => val.toString()
            }
          },
          colors: ["#00A1FF", "#8965E5"],
          dataLabels: { enabled: false },
          stroke: { curve: "smooth", width: 2 },
          grid: { show: true, strokeDashArray: 3, borderColor: "#90A4AE50" }
        };

        // snapshot original series (xy points) for future bucket recomputations
        this.originalSeries = (this.salesprofitChart.series as any[]).map(s => ({
          name: s.name,
          type: s.type,
          data: [...(s.data as Array<{ x: number; y: number }>)]
        }));
      }
      
      public updateChartData(): void {
        if (!this.dateRange?.value?.start || !this.dateRange?.value?.end) {
          return;
        }

        const start = new Date(this.dateRange.value.start);
        const end = new Date(this.dateRange.value.end);

        // Ensure chronological order for label generation and comparisons
        const from = new Date(Math.min(start.getTime(), end.getTime()));
        const to = new Date(Math.max(start.getTime(), end.getTime()));

        const period = (this.dateRange.get('timeRange')?.value as 'Day' | 'Month' | 'Year') || 'Month';

        // Helpers to generate labels
        const makeKeyDay = (d: Date) => d.toISOString().slice(0, 10); // yyyy-MM-dd
        const makeKeyMonth = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; // yyyy-MM
        const makeKeyYear = (d: Date) => `${d.getFullYear()}`;

        const addUnit = (d: Date) => {
          const nd = new Date(d);
          if (period === 'Day') nd.setDate(nd.getDate() + 1);
          else if (period === 'Month') nd.setMonth(nd.getMonth() + 1);
          else nd.setFullYear(nd.getFullYear() + 1);
          return nd;
        };
        const keyFor = (d: Date) => period === 'Day' ? makeKeyDay(d) : period === 'Month' ? makeKeyMonth(d) : makeKeyYear(d);

        // Build labels between from..to
        const labels: string[] = [];
        let cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate());
        if (period === 'Month') cursor = new Date(from.getFullYear(), from.getMonth(), 1);
        if (period === 'Year') cursor = new Date(from.getFullYear(), 0, 1);
        while (cursor <= to) {
          labels.push(keyFor(cursor));
          cursor = addUnit(cursor);
        }
        if (this.sortDirection === 'desc') labels.reverse();

        const indexByKey = new Map(labels.map((k, i) => [k, i] as [string, number]));

        // If there is no data in the selected range, synthesize fictive demo data so the chart is not empty
        const hasAnyPointInRange = this.originalSeries.some(s =>
          (s.data || []).some(pt => {
            const d = new Date(pt.x);
            return d >= from && d <= to;
          })
        );
        if (!hasAnyPointInRange) {
          this.originalSeries = this.buildFictiveSeriesFromLabels(labels, period);
        }

        // Aggregate original series into buckets
        const bucketedSeries = this.originalSeries.map(s => {
          const buckets = new Array(labels.length).fill(0);
          (s.data || []).forEach(pt => {
            const d = new Date(pt.x);
            if (d < from || d > to) return;
            const key = keyFor(d);
            const idx = indexByKey.get(key);
            if (idx !== undefined) buckets[idx] += pt.y;
          });
          return { name: s.name, type: s.type, data: buckets } as any;
        });

        // Update Apex chart: use categories for bucket labels
        this.salesprofitChart = {
          ...this.salesprofitChart,
          xaxis: {
            ...(this.salesprofitChart.xaxis || {}),
            type: 'category',
            categories: labels,
            labels: { ...(this.salesprofitChart.xaxis?.labels || {}) }
          },
          series: bucketedSeries
        };
      }

      // Build demo data mapped to the label keys when no data is present in range
      private buildFictiveSeriesFromLabels(labels: string[], period: 'Day' | 'Month' | 'Year') {
        const parseLabelToDate = (label: string): Date => {
          if (period === 'Day') {
            // yyyy-MM-dd
            const [y, m, d] = label.split('-').map(Number);
            return new Date(y, (m || 1) - 1, d || 1);
          }
          if (period === 'Month') {
            // yyyy-MM
            const [y, m] = label.split('-').map(Number);
            return new Date(y, (m || 1) - 1, 1);
          }
          // Year
          const y = Number(label);
          return new Date(y, 0, 1);
        };

        const twoPi = 2 * Math.PI;

        const base = labels.map((lb, idx) => {
          const d = parseLabelToDate(lb);
          let y1 = 0;
          let y2 = 0;

          if (period === 'Day') {
            // Increasing trend over days with weekly seasonality (Mon..Sun)
            const dow = d.getDay(); // 0..6
            const trend = 10 + idx * 0.8; // mild upward trend
            const weekly = 8 * Math.sin(twoPi * (dow / 7));
            y1 = trend + weekly + 10; // shift up
            // Last Year slightly lower with a phase shift
            const weekly2 = 6 * Math.sin(twoPi * ((dow + 2) / 7));
            y2 = (trend * 0.8) + weekly2 + 12;
          } else if (period === 'Month') {
            // Increasing trend per month with yearly seasonality
            const trend = 20 + idx * 3; // stronger monthly growth
            const seasonal = 10 * Math.sin(twoPi * (idx / 12));
            y1 = trend + seasonal + 15;
            y2 = trend * 0.75 + 8 * Math.sin(twoPi * ((idx + 3) / 12)) + 12;
          } else {
            // Yearly: steady growth with slight multi-year cycle
            const trend = 30 + idx * 12;
            const cycle = 5 * Math.sin(twoPi * (idx / 5)); // 5-year cycle
            y1 = trend + cycle + 20;
            y2 = trend * 0.7 + 4 * Math.sin(twoPi * ((idx + 1) / 5)) + 18;
          }

          y1 = Math.max(0, Math.round(y1));
          y2 = Math.max(0, Math.round(y2));
          return { date: d, y1, y2 };
        });

        return [
          {
            name: 'This Year',
            type: 'area' as const,
            data: base.map(b => ({ x: b.date.getTime(), y: b.y1 }))
          },
          {
            name: 'Last Year',
            type: 'line' as const,
            data: base.map(b => ({ x: b.date.getTime(), y: b.y2 }))
          }
        ];
      }

      setSortDirection(direction: 'asc' | 'desc') {
        this.sortDirection = direction;
        this.updateChartData();
      }

      // Mirror the dashboard's explicit period setter, but do NOT change the chosen date range
      setTrafficPeriod(value: 'Day' | 'Month' | 'Year'): void {
        this.dateRange.get('timeRange')?.setValue(value, { emitEvent: false });
        // Keep start/end dates intact, just rebuild buckets for the new period
        this.updateChartData();
      }

      // Subtitle similar to getMainChartSubtitle from dashboard
      getMainChartSubtitle(): string {
        const start = this.dateRange?.value?.start as Date | null;
        const end = this.dateRange?.value?.end as Date | null;
        if (!start && !end) return '';
        const fmt = (d: Date | null) => d ? this.datePipe.transform(d, 'yyyy-MM-dd') : '';
        const s = fmt(start ?? null);
        const e = fmt(end ?? null);
        if (s && e) return `${s} - ${e}`;
        return s || e || '';
      }
}
