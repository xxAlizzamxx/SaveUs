import type { EmergencyContact, EvidenceRecord, RoutePoint } from '../types';

const DB_NAME = 'auraguard';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('contacts')) {
        db.createObjectStore('contacts', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('evidence')) {
        db.createObjectStore('evidence', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('route')) {
        db.createObjectStore('route', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

function txStore<T>(
  storeName: string,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T> | void
): Promise<T | void> {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, mode);
        const store = tx.objectStore(storeName);
        const result = fn(store);
        tx.oncomplete = () => resolve(result instanceof IDBRequest ? result.result : undefined);
        tx.onerror = () => reject(tx.error);
      })
  );
}

const DEFAULT_CONTACTS: EmergencyContact[] = [
  { id: '1', name: 'Contacto 1', relation: 'Emergencias', phone: '+57 319 215 2335', initials: 'C1' },
  { id: '2', name: 'Contacto 2', relation: 'Emergencias', phone: '+57 315 048 9702', initials: 'C2' },
  { id: '3', name: 'Contacto 3', relation: 'Emergencias', phone: '+57 301 405 9823', initials: 'C3' },
  { id: '4', name: 'Contacto 4', relation: 'Emergencias', phone: '+57 324 404 6468', initials: 'C4' },
];

// Version de los contactos por defecto. Sube este numero cuando cambien los
// contactos para forzar que se vuelvan a sembrar en navegadores ya usados.
const CONTACTS_SEED_VERSION = '2';
const SEED_KEY = 'saveus_contacts_seed';

async function clearContacts(): Promise<void> {
  await txStore('contacts', 'readwrite', (s) => s.clear());
}

export async function getContacts(): Promise<EmergencyContact[]> {
  // Migracion automatica: si los contactos por defecto cambiaron de version,
  // reemplazamos los que estaban guardados en el navegador (una sola vez).
  if (localStorage.getItem(SEED_KEY) !== CONTACTS_SEED_VERSION) {
    await clearContacts();
    for (const c of DEFAULT_CONTACTS) await saveContact(c);
    localStorage.setItem(SEED_KEY, CONTACTS_SEED_VERSION);
    return DEFAULT_CONTACTS;
  }

  const contacts = await txStore<EmergencyContact[]>('contacts', 'readonly', (s) => s.getAll());
  if (!contacts || (contacts as EmergencyContact[]).length === 0) {
    for (const c of DEFAULT_CONTACTS) await saveContact(c);
    return DEFAULT_CONTACTS;
  }
  return contacts as EmergencyContact[];
}

export async function saveContact(contact: EmergencyContact): Promise<void> {
  await txStore('contacts', 'readwrite', (s) => s.put(contact));
}

export async function deleteContact(id: string): Promise<void> {
  await txStore('contacts', 'readwrite', (s) => s.delete(id));
}

interface StoredEvidence {
  id: string;
  title: string;
  date: string;
  duration: number;
  type: 'video' | 'audio' | 'photo';
  blob: Blob;
  size: number;
}

export async function saveEvidence(
  blob: Blob,
  type: 'video' | 'audio' | 'photo',
  title: string,
  duration: number
): Promise<EvidenceRecord> {
  const record: StoredEvidence = {
    id: crypto.randomUUID(),
    title,
    date: new Date().toLocaleString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    duration,
    type,
    blob,
    size: blob.size,
  };
  await txStore('evidence', 'readwrite', (s) => s.put(record));
  return toEvidenceRecord(record);
}

export async function getEvidenceList(): Promise<EvidenceRecord[]> {
  const items = (await txStore<StoredEvidence[]>('evidence', 'readonly', (s) => s.getAll())) as StoredEvidence[];
  return (items ?? []).map(toEvidenceRecord).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export async function getEvidenceBlob(id: string): Promise<Blob | null> {
  const item = (await txStore<StoredEvidence>('evidence', 'readonly', (s) => s.get(id))) as StoredEvidence | undefined;
  return item?.blob ?? null;
}

export async function deleteEvidence(id: string): Promise<void> {
  await txStore('evidence', 'readwrite', (s) => s.delete(id));
}

function toEvidenceRecord(item: StoredEvidence): EvidenceRecord {
  return {
    id: item.id,
    title: item.title,
    date: item.date,
    duration: item.duration,
    type: item.type,
    blobUrl: URL.createObjectURL(item.blob),
    size: item.size,
  };
}

export async function addRoutePoint(point: RoutePoint): Promise<void> {
  await txStore('route', 'readwrite', (s) => s.add(point));
}

export async function getRoutePoints(): Promise<RoutePoint[]> {
  const points = (await txStore<RoutePoint[]>('route', 'readonly', (s) => s.getAll())) as RoutePoint[];
  return points ?? [];
}

export async function clearRoute(): Promise<void> {
  await txStore('route', 'readwrite', (s) => s.clear());
}

export function getPin(): string | null {
  return localStorage.getItem('auraguard_pin');
}

export function setPin(pin: string): void {
  localStorage.setItem('auraguard_pin', pin);
}

export function verifyPin(pin: string): boolean {
  return localStorage.getItem('auraguard_pin') === pin;
}
