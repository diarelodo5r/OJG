import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShopView } from './shop-view';

describe('ShopView', () => {
  let component: ShopView;
  let fixture: ComponentFixture<ShopView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShopView]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShopView);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
