import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../material.module';
import { MatDialog } from '@angular/material/dialog';
import { CalendarFormDialogComponent } from './calendar-form-dialog.component';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.scss'
})
export class AppCalendarComponent {
  view: 'month' | 'week' | 'day' = 'month';
  current = new Date();

  get currentLabel(): string {
    if (this.view === 'week') {
      const { start, end } = this.getWeekRange(this.current);
      const sameMonth = start.getMonth() === end.getMonth();
      const sameYear = start.getFullYear() === end.getFullYear();
      const startFmt = start.toLocaleString(undefined, { month: sameMonth ? 'long' : 'short', day: 'numeric' });
      const endFmt = end.toLocaleString(undefined, { month: 'long', day: 'numeric', year: sameYear ? undefined : 'numeric' });
      return `${startFmt} — ${endFmt}`;
    }
    if (this.view === 'day') {
      return this.current.toLocaleString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    }
    return this.current.toLocaleString(undefined, { month: 'long', year: 'numeric' });
  }

  setView(v: 'month' | 'week' | 'day') { this.view = v; }
  prev() {
    if (this.view === 'week') {
      const d = new Date(this.current);
      d.setDate(d.getDate() - 7);
      this.current = d;
    } else {
      this.current = new Date(this.current.getFullYear(), this.current.getMonth() - 1, 1);
    }
  }
  next() {
    if (this.view === 'week') {
      const d = new Date(this.current);
      d.setDate(d.getDate() + 7);
      this.current = d;
    } else {
      this.current = new Date(this.current.getFullYear(), this.current.getMonth() + 1, 1);
    }
  }
  today() { this.current = new Date(); }

  constructor(private dialog: MatDialog) {}

  openAddEvent() {
    const ref = this.dialog.open(CalendarFormDialogComponent, {
      panelClass: 'calendar-dialog-medium',
      autoFocus: true,
      maxWidth: '96vw',
      width: '640px',
      maxHeight: '90vh',
    });
    ref.afterClosed().subscribe(val => {
      if (val) {
        // TODO: integrate with events store later
        console.log('New event:', val);
      }
    });
  }

  get todayLabel(): string {
    const now = new Date();
    return now.toLocaleString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
  }

  get weekDays(): { date: Date; name: string; dateLabel: string; isToday: boolean }[] {
    const start = this.getWeekStart(this.current);
    const out: { date: Date; name: string; dateLabel: string; isToday: boolean }[] = [];
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      out.push({
        date: d,
        name: d.toLocaleString(undefined, { weekday: 'long' }),
        dateLabel: d.toLocaleString(undefined, { month: 'short', day: 'numeric' }),
        isToday: d.toDateString() === now.toDateString(),
      });
    }
    return out;
  }

  private getWeekStart(d: Date): Date {
    const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const day = copy.getDay(); // 0=Sun
    copy.setDate(copy.getDate() - day);
    copy.setHours(0, 0, 0, 0);
    return copy;
  }

  private getWeekRange(d: Date): { start: Date; end: Date } {
    const start = this.getWeekStart(d);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start, end };
  }

  // Current time marker position (percentage from top of the 24h grid)
  get nowTopPercent(): number {
    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();
    return (minutes / (24 * 60)) * 100;
  }

  // Month grid data (6 x 7 = 42 cells), starting on Sunday of the first calendar week
  get monthCells(): Date[] {
    const firstOfMonth = new Date(this.current.getFullYear(), this.current.getMonth(), 1);
    const startOffset = firstOfMonth.getDay(); // 0=Sun
    const gridStart = new Date(firstOfMonth);
    gridStart.setDate(firstOfMonth.getDate() - startOffset);
    const cells: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      cells.push(d);
    }
    return cells;
  }

  // Helpers to render month rows and today badge
  readonly monthRows = [0, 1, 2, 3, 4, 5];
  readonly weekCols = [0, 1, 2, 3, 4, 5, 6];

  isToday(date: Date): boolean {
    const now = new Date();
    return date.getFullYear() === now.getFullYear() &&
           date.getMonth() === now.getMonth() &&
           date.getDate() === now.getDate();
  }
}
