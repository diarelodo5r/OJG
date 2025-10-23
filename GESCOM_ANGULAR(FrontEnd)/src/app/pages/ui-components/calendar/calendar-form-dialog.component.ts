import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core';
import { MaterialModule } from '../../../material.module';

@Component({
  selector: 'app-calendar-form-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatDatepickerModule, MatNativeDateModule, MaterialModule],
  providers: [provideNativeDateAdapter()],
  template: `
    <div class="calendar-dialog-content modal-dark-theme" mat-dialog-content>
      <div class="d-flex align-items-center justify-content-between m-b-16 calendar-header">
        <h4 class="f-s-16 f-w-600 m-b-16 calendar-title">Add Event</h4>
        <button mat-icon-button mat-dialog-close class="calendar-close-btn">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <form [formGroup]="form" class="event-form calendar-form">
        <div class="row calendar-row">
          <div class="col-12 calendar-col">
            <mat-form-field appearance="outline" class="w-100 calendar-form-field">
              <input matInput placeholder="Add Title" formControlName="title" required class="calendar-input" />
            </mat-form-field>
          </div>

          <div class="col-12 calendar-col">
            <mat-form-field appearance="outline" class="w-100 calendar-form-field">
              <input matInput type="color" placeholder="Change Color" formControlName="color" class="calendar-input" />
            </mat-form-field>
          </div>

          <div class="col-sm-6 calendar-col">
            <mat-form-field appearance="outline" class="w-100 calendar-form-field">
              <input matInput [matDatepicker]="startPicker" placeholder="Start Date" formControlName="start" class="calendar-input" />
              <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
              <mat-datepicker #startPicker startView="month"></mat-datepicker>
              <mat-error *ngIf="form.get('start')?.hasError('required')" class="calendar-error">Start date is required</mat-error>
            </mat-form-field>
          </div>
          <div class="col-sm-6 calendar-col">
            <mat-form-field appearance="outline" class="w-100 calendar-form-field">
              <input matInput [matDatepicker]="endPicker" placeholder="End Date" formControlName="end" class="calendar-input" />
              <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
              <mat-datepicker #endPicker startView="month"></mat-datepicker>
              <mat-error *ngIf="form.get('end')?.hasError('required')" class="calendar-error">End date is required</mat-error>
              <mat-error *ngIf="form.hasError('dateRange')" class="calendar-error">End date must be on or after start date</mat-error>
            </mat-form-field>
          </div>
        </div>

        <div class="d-flex align-items-center gap-12 calendar-actions">
          <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="save()" class="calendar-save-btn">Save</button>
          <button mat-button mat-dialog-close class="bg-error text-white calendar-cancel-btn">Cancel</button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .calendar-dialog-content {
      background: var(--bs-modal-bg, #fff);
      color: var(--bs-body-color, #212529);
      border-radius: 10px;
    }
    .calendar-title { color: var(--bs-heading-color, inherit); }
    .calendar-form { color: var(--bs-body-color, #212529); }
    .calendar-input { color: var(--bs-body-color, #212529); }
    .calendar-error { color: var(--bs-danger, #dc3545); }
    .calendar-row { display: grid; grid-template-columns: 1fr; gap: 12px; }
    @media (min-width: 600px){ .calendar-row { grid-template-columns: 1fr 1fr; } .calendar-col { grid-column: 1 / -1; } }
    .w-100{ width:100%; }
    .gap-12{ gap:12px; }
    .m-b-16{ margin-bottom:16px; }
    .f-s-16{ font-size:16px; }
    .f-w-600{ font-weight:600; }
    .d-flex{ display:flex; }
    .align-items-center{ align-items:center; }
    .justify-content-between{ justify-content:space-between; }
    .bg-error{ background: var(--mat-sys-error, #b00020); }
    .text-white{ color:#fff; }
    
    /* Mode sombre spécifique */
    @media (prefers-color-scheme: dark) {
      .calendar-dialog-content {
        background: var(--bs-modal-bg, #1a1a1a);
        border: 1px solid rgba(255,255,255,0.1);
      }
      .calendar-title { color: #ffffff; }
      .calendar-form { color: #ffffff; }
      .calendar-input { color: #ffffff; }
      .calendar-error { color: #ff6b6b; }
      .calendar-close-btn mat-icon { color: #ffffff; }
      
      /* Styles pour les formulaires Material en mode sombre */
      .calendar-form-field .mat-mdc-form-field-flex {
        background-color: #2d2d2d !important;
      }
      .calendar-form-field .mat-mdc-text-field-wrapper {
        background-color: #2d2d2d !important;
      }
      .calendar-form-field .mat-mdc-form-field-underline {
        background-color: rgba(255,255,255,0.2) !important;
      }
      .calendar-form-field .mat-mdc-form-field-label {
        color: rgba(255,255,255,0.7) !important;
      }
      .calendar-form-field.mat-focused .mat-mdc-form-field-label {
        color: var(--bs-primary, #0d6efd) !important;
      }
      .calendar-form-field .mat-mdc-form-field-required-marker {
        color: var(--bs-danger, #dc3545) !important;
      }
    }
    
    /* Support pour les classes de thème Angular Material */
    .dark-theme .calendar-dialog-content {
      background: var(--bs-modal-bg, #1a1a1a) !important;
      border: 1px solid rgba(255,255,255,0.1) !important;
    }
    .dark-theme .calendar-title { color: #ffffff !important; }
    .dark-theme .calendar-form { color: #ffffff !important; }
    .dark-theme .calendar-input { color: #ffffff !important; }
    .dark-theme .calendar-error { color: #ff6b6b !important; }
    .dark-theme .calendar-close-btn mat-icon { color: #ffffff !important; }
    
    /* Styles pour les formulaires Material en mode sombre avec classe */
    .dark-theme .calendar-form-field .mat-mdc-form-field-flex {
      background-color: #2d2d2d !important;
    }
    .dark-theme .calendar-form-field .mat-mdc-text-field-wrapper {
      background-color: #2d2d2d !important;
    }
    .dark-theme .calendar-form-field .mat-mdc-form-field-underline {
      background-color: rgba(255,255,255,0.2) !important;
    }
    .dark-theme .calendar-form-field .mat-mdc-form-field-label {
      color: rgba(255,255,255,0.7) !important;
    }
    .dark-theme .calendar-form-field.mat-focused .mat-mdc-form-field-label {
      color: var(--bs-primary, #0d6efd) !important;
    }
    .dark-theme .calendar-form-field .mat-mdc-form-field-required-marker {
      color: var(--bs-danger, #dc3545) !important;
    }
  `]
})
export class CalendarFormDialogComponent {
  form: any;

  constructor(
    private fb: FormBuilder,
    private ref: MatDialogRef<CalendarFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.form = this.fb.group(
      {
        title: ['', Validators.required],
        color: ['#3f51b5'],
        start: [new Date(), Validators.required],
        end: [new Date(), Validators.required]
      },
      { validators: this.dateRangeValidator }
    );
  }

  save() {
    if (this.form.valid) {
      this.ref.close(this.form.value);
    }
  }

  private dateRangeValidator(group: AbstractControl) {
    const start = group.get('start')?.value as Date | null;
    const end = group.get('end')?.value as Date | null;
    if (!start || !end) return null;
    const valid = new Date(end).getTime() >= new Date(start).getTime();
    return valid ? null : { dateRange: true };
  }
}
