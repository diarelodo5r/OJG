import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-blogs',
  standalone: true,
  imports: [CommonModule, RouterModule, MaterialModule, TablerIconsModule],
  templateUrl: './blogs.component.html',
  styleUrl: './blogs.component.scss',
})
export class BlogsComponent {
  cards = [
    {
      id: 2,
      image: '/assets/images/blog/blog-img2.jpg',
      user: '/assets/images/profile/user-2.jpg',
      title: 'Presented by Max Rushden with Barry Glendenning, Philippe Auclair',
      category: 'Health',
      comments: 3,
      date: 'Sun, Dec 25',
    },
    {
      id: 3,
      image: '/assets/images/blog/blog-img3.jpg',
      user: '/assets/images/profile/user-3.jpg',
      title: 'As yen tumbles, gadget-loving Japan goes for secondhand iPhones',
      category: 'Gadget',
      comments: 12,
      date: 'Sat, Dec 25',
    },
    {
      id: 4,
      image: '/assets/images/blog/blog-img4.jpg',
      user: '/assets/images/profile/user-4.jpg',
      title: 'Intel loses bid to revive antitrust case against patent foe Fortress',
      category: 'Social',
      comments: 12,
      date: 'Sat, Dec 25',
    },
    {
      id: 5,
      image: '/assets/images/blog/blog-img5.jpg',
      user: '/assets/images/profile/user-1.jpg',
      title: 'COVID outbreak deepens as more lockdowns loom in China',
      category: 'Lifestyle',
      comments: 3,
      date: 'Mon, Dec 25',
    },
    {
      id: 6,
      image: '/assets/images/blog/blog-img6.jpg',
      user: '/assets/images/profile/user-2.jpg',
      title: 'Streaming video way before it was cool, go dark tomorrow',
      category: 'Health',
      comments: 3,
      date: 'Sun, Dec 25',
    },
    {
      id: 8,
      image: '/assets/images/blog/blog-img8.jpg',
      user: '/assets/images/profile/user-3.jpg',
      title: 'Apple is apparently working on a new ‘streamlined’ accessibility iOS',
      category: 'Design',
      comments: 12,
      date: 'Sat, Dec 25',
    },
    {
      id: 9,
      image: '/assets/images/blog/blog-img9.jpg',
      user: '/assets/images/profile/user-4.jpg',
      title: 'After Twitter Staff Cuts, Survivors Face ‘Radio Silence',
      category: 'Lifestyle',
      comments: 12,
      date: 'Sat, Dec 25',
    },
    {
      id: 10,
      image: '/assets/images/blog/blog-img10.jpg',
      user: '/assets/images/profile/user-1.jpg',
      title: 'Why Figma is selling to Adobe for $20 billion',
      category: 'Design',
      comments: 3,
      date: 'Mon, Dec 25',
    },
    {
      id: 11,
      image: '/assets/images/blog/blog-img11.jpg',
      user: '/assets/images/profile/user-2.jpg',
      title: 'Garmins Instinct Crossover is a rugged hybrid smartwatch',
      category: 'Gadget',
      comments: 3,
      date: 'Sun, Dec 25',
    },
  ];
}
