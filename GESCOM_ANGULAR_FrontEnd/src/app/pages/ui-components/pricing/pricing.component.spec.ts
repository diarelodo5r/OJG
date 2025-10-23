import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppPricingComponent } from './pricing.component';

describe('AppPricingComponent', () => {
  let component: AppPricingComponent;
  let fixture: ComponentFixture<AppPricingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppPricingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AppPricingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
