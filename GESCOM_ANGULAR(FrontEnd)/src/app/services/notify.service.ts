import { Injectable } from '@angular/core';
import Swal, { SweetAlertIcon } from 'sweetalert2';

@Injectable({ providedIn: 'root' })
export class NotifyService {
  success(message: string, title = 'Succès') {
    return Swal.fire({ icon: 'success', title, text: message });
  }

  successToast(message: string, title = 'Succès') {
    return Swal.fire({
      icon: 'success',
      title,
      text: message,
      timer: 1200,
      showConfirmButton: false,
      position: 'top-end',
      toast: true,
    });
  }

  error(message: string, title = 'Erreur') {
    return Swal.fire({ icon: 'error', title, text: message });
  }

  info(message: string, title = 'Info') {
    return Swal.fire({ icon: 'info', title, text: message });
  }

  confirm(options: { title: string; text?: string; confirmText?: string; cancelText?: string; icon?: SweetAlertIcon }) {
    const { title, text, confirmText = 'Oui', cancelText = 'Annuler', icon = 'warning' } = options;
    return Swal.fire({
      title,
      text,
      icon,
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
    });
  }
}
