import { Component, OnInit } from '@angular/core';
import { CoreService } from '../../../services/core.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-branding',
  imports: [RouterModule],
  template: `
    <a [routerLink]="['/']">
      <!-- Light and dark logos; visibility controlled via global theme classes -->
      <img
        src="./assets/images/logos/SCS-Stock_White.png"
        class="align-middle m-2 logo-light"
        alt="logo"
      />
      <img
        src="./assets/images/logos/SCS-Stock_Black.png"
        class="align-middle m-2 logo-dark"
        alt="logo"
      />
      <!-- Mini sidebar variants (shown only in sidebar-mini mode) -->
      <img
        src="./assets/images/logos/SCS-Logo_White.png"
        class="align-middle m-2 logo-mini-light"
        alt="logo"
      />
      <img
        src="./assets/images/logos/SCS-Logo_Dark.png"
        class="align-middle m-2 logo-mini-dark"
        alt="logo"
      />
    </a>
  `,
})
export class BrandingComponent implements OnInit {
  options!: any;
  constructor(private settings: CoreService) {}
  
  ngOnInit() {
    this.options = this.settings.getOptions();
  }
}
