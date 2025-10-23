import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { NgIcon } from '@ng-icons/core';

@Component({
    selector: 'app-topstrip',
    imports: [NgIcon, MatButtonModule, MatMenuModule],
    templateUrl: './topstrip.component.html',
})
export class AppTopstripComponent {
    constructor() { }

}
