import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppSideLoginComponent } from './side-login.component';

describe('SideLoginComponent', () => {
  let component: AppSideLoginComponent;
  let fixture: ComponentFixture<AppSideLoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppSideLoginComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AppSideLoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
