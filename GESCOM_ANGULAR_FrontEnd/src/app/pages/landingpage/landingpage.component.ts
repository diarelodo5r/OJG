import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../material.module';
import { RouterModule } from '@angular/router';
import { TablerIconsModule } from 'angular-tabler-icons';

@Component({
  selector: 'app-landingpage',
  standalone: true,
  imports: [CommonModule, RouterModule, MaterialModule, TablerIconsModule],
  templateUrl: './landingpage.component.html',
  styleUrl: './landingpage.component.scss',
})
export class LandingpageComponent implements AfterViewInit, OnDestroy {
  private revealObserver?: IntersectionObserver;
  currentYear: number = new Date().getFullYear();

  features = [
    { icon: 'checklist', title: 'Authguard', subtitle: 'AuthGuard prevents unauthorized access to routes.' },
    { icon: 'calendar', title: 'Calendar Design', subtitle: 'A well-designed calendar is included.' },
    { icon: 'bug', title: 'Regular Updates', subtitle: 'We continuously enhance with new features.' },
    { icon: 'book', title: 'Detailed Documentation', subtitle: 'Comprehensive docs ensure ease of use.' },
    { icon: 'layout-grid', title: '80+ Page Templates', subtitle: 'Multiple demos with extensive pages.' },
    { icon: 'components', title: '50+ UI Components', subtitle: 'A wide set of reusable components.' },
    { icon: 'world', title: 'i18n', subtitle: 'Internationalization support for global apps.' },
    { icon: 'chart-bar', title: 'Charts & Tables', subtitle: 'Lots of chart and table variations.' },
  ];

  apps = [
    { title: 'Calendar', href: 'https://materialm-angular-main.netlify.app//apps/calendar', img: 'https://images.pexels.com/photos/414660/pexels-photo-414660.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=720' },
    { title: 'Chat', href: 'https://materialm-angular-main.netlify.app//apps/chat', img: 'https://images.pexels.com/photos/2764678/pexels-photo-2764678.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=720' },
    { title: 'Contacts', href: 'https://materialm-angular-main.netlify.app//apps/contacts', img: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=720' },
    { title: 'Email', href: 'https://materialm-angular-main.netlify.app//apps/email/inbox', img: 'https://images.pexels.com/photos/261628/pexels-photo-261628.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=720' },
    { title: 'Courses', href: 'https://materialm-angular-main.netlify.app//apps/courses', img: 'https://images.pexels.com/photos/4144221/pexels-photo-4144221.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=720' },
    { title: 'Employee', href: 'https://materialm-angular-main.netlify.app//apps/employee', img: 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=720' },
    { title: 'Notes', href: 'https://materialm-angular-main.netlify.app//apps/notes', img: 'https://images.pexels.com/photos/4195325/pexels-photo-4195325.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=720' },
    { title: 'Tickets', href: 'https://materialm-angular-main.netlify.app//apps/tickets', img: 'https://images.pexels.com/photos/3727450/pexels-photo-3727450.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=720' },
    { title: 'Invoice', href: 'https://materialm-angular-main.netlify.app//apps/invoice', img: 'https://images.pexels.com/photos/4386379/pexels-photo-4386379.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=720' },
    { title: 'Todo', href: 'https://materialm-angular-main.netlify.app//apps/todo', img: 'https://images.pexels.com/photos/6077129/pexels-photo-6077129.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=720' },
    { title: 'Taskboard', href: 'https://materialm-angular-main.netlify.app//apps/taskboard', img: 'https://images.pexels.com/photos/3861964/pexels-photo-3861964.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=720' },
    { title: 'Blog List', href: 'https://materialm-angular-main.netlify.app//apps/blog/post', img: 'https://images.pexels.com/photos/261662/pexels-photo-261662.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=720' },
  ];

  ngAfterViewInit(): void {
    const revealEls = document.querySelectorAll('[data-reveal]');
    if ('IntersectionObserver' in window) {
      this.revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-revealed');
              this.revealObserver?.unobserve(entry.target);
            }
          });
        },
        { root: null, rootMargin: '0px 0px -10% 0px', threshold: 0.1 }
      );
      revealEls.forEach((el) => this.revealObserver?.observe(el));
    } else {
      revealEls.forEach((el) => el.classList.add('is-revealed'));
    }
  }

  ngOnDestroy(): void {
    this.revealObserver?.disconnect();
  }
}
