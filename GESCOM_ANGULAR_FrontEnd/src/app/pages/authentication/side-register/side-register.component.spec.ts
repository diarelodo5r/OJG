import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppSideRegisterComponent } from './side-register.component';

describe('SideRegisterComponent', () => {
  let component: AppSideRegisterComponent;
  let fixture: ComponentFixture<AppSideRegisterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppSideRegisterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AppSideRegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
