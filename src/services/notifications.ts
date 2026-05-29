export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function notify(title: string, body: string): void {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/vite.svg' });
  }
}

export async function shareLocation(text: string, url: string): Promise<boolean> {
  if (navigator.share) {
    try {
      await navigator.share({ title: 'SaveUs — Mi ubicación', text, url });
      return true;
    } catch {
      return false;
    }
  }
  try {
    await navigator.clipboard.writeText(`${text}\n${url}`);
    notify('Ubicación copiada', 'Enlace copiado al portapapeles.');
    return true;
  } catch {
    return false;
  }
}

export function openSms(phone: string, message: string): void {
  const clean = phone.replace(/\s/g, '');
  window.open(`sms:${clean}?body=${encodeURIComponent(message)}`, '_blank');
}

export function openWhatsApp(phone: string, message: string): void {
  const clean = phone.replace(/\D/g, '');
  window.open(`https://wa.me/${clean}?text=${encodeURIComponent(message)}`, '_blank');
}

export function openTel(phone: string): void {
  window.open(`tel:${phone.replace(/\s/g, '')}`, '_blank');
}
