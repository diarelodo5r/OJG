import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShopPayment } from './shop-payment';

describe('ShopPayment', () => {
  let component: ShopPayment;
  let fixture: ComponentFixture<ShopPayment>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShopPayment]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShopPayment);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
