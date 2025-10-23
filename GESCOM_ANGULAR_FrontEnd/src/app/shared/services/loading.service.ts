import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface LoadingState {
  active: boolean;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private counter = 0; // supports nested/parallel show/hide calls
  private stateSubject = new BehaviorSubject<LoadingState>({ active: false });
  readonly state$: Observable<LoadingState> = this.stateSubject.asObservable();

  show(message?: string): void {
    this.counter++;
    const msg = message ?? 'Veuillez patienter...';
    this.stateSubject.next({ active: true, message: msg });
  }

  hide(): void {
    if (this.counter > 0) this.counter--;
    if (this.counter === 0) {
      // clear only when fully idle
      this.stateSubject.next({ active: false, message: undefined });
    }
  }

  // Utility to run async work with loader automatically
  async withLoader<T>(task: Promise<T>, message?: string): Promise<T> {
    this.show(message);
    try {
      return await task;
    } finally {
      this.hide();
    }
  }
}
