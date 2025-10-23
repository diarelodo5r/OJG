import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../material.module';
import { NgIcon } from '@ng-icons/core';


@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule, NgIcon],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class AppChatComponent {

  search = '';
  inputMessage = '';

  contacts = [
    { id: 1, name: 'David McMichael', email: 'info@matdash.com', avatar: 'https://i.pravatar.cc/56?img=68', last: '—' },
    { id: 2, name: 'James Johnson', email: 'Hey, how are you?', avatar: 'https://i.pravatar.cc/56?img=12', last: 'Hey, how are you?' },
    { id: 3, name: 'Maria Hernandez', email: 'Lorem ipsum done', avatar: 'https://i.pravatar.cc/56?img=65', last: 'Lorem ipsum done' },
    { id: 4, name: 'David Smith', email: 'Thanks mate', avatar: 'https://i.pravatar.cc/56?img=8', last: 'Thanks mate' },
  ];

  activeContact = this.contacts[1];

  messages: Array<{ me: boolean; text: string; date: string; avatar?: string }> = [
    { me: false, text: 'Hi Luke.', date: 'Jan 5, 2025', avatar: 'https://i.pravatar.cc/40?img=12' },
    { me: true, text: 'How are you my friend?', date: 'Jan 6, 2025', avatar: 'https://i.pravatar.cc/40?img=68' },
  ];

  selectContact(c: any) {
    this.activeContact = c;
    // In a real app, load messages for the selected contact here
  }

  send() {
    const text = this.inputMessage.trim();
    if (!text) return;
    this.messages.push({ me: true, text, date: new Date().toLocaleDateString() });
    this.inputMessage = '';
  }
}
