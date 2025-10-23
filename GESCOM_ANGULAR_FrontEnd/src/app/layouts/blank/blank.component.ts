import { Component, OnInit } from '@angular/core';
import { CoreService } from '../../services/core.service';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MaterialModule } from '../../material.module';

@Component({
  selector: 'app-blank',
  templateUrl: './blank.component.html',
  styleUrls: [],
  imports: [RouterOutlet, MaterialModule, CommonModule],
})
export class BlankComponent implements OnInit {
  private htmlElement!: HTMLHtmlElement;
  options: any;

  constructor(private settings: CoreService) {
    this.htmlElement = document.querySelector('html')!;
  }

  ngOnInit(): void {
    this.options = this.settings.getOptions();
  }
}
