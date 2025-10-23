import { Component, ViewEncapsulation } from '@angular/core';
import { MaterialModule } from '../../material.module';
import { AppBlogCardsComponent } from '../../components/blog-card/blog-card.component';
import { AppSalesProfitComponent } from '../../components/sales-profit/sales-profit.component';
import { AppTotalFollowersComponent } from '../../components/total-followers/total-followers.component';
import { AppTotalIncomeComponent } from '../../components/total-income/total-income.component';
import { AppPopularProductsComponent } from '../../components/popular-products/popular-products.component';
import { AppEarningReportsComponent } from '../../components/earning-reports/earning-reports.component';

@Component({
  selector: 'app-starter',
  imports: [
    MaterialModule,
    AppBlogCardsComponent,
    AppSalesProfitComponent,
    AppTotalFollowersComponent,
    AppTotalIncomeComponent,
    AppPopularProductsComponent,
    AppEarningReportsComponent
  ],
  templateUrl: './starter.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class StarterComponent { }
