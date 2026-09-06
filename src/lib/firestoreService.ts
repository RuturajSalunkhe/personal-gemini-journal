import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  getDoc
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { JournalEntry } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Recursively strips undefined fields so Firestore doesn't reject documents
 * with "Unsupported field value: undefined".
 */
export function cleanDataForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => cleanDataForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        cleaned[key] = cleanDataForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return data;
}

export function getEntriesCollection(userId: string) {
  if (!userId) throw new Error('User ID is required for isolated Firestore queries');
  return collection(db, 'users', userId, 'entries');
}

export function getEntryDoc(userId: string, entryId: string) {
  if (!userId) throw new Error('User ID is required for isolated Firestore queries');
  return doc(db, 'users', userId, 'entries', entryId);
}

/**
 * Subscribes to real-time updates for all journal entries of a specific user.
 * Strictly queries users/{userId}/entries.
 */
export function subscribeToEntries(
  userId: string,
  onUpdate: (entries: JournalEntry[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  const path = `users/${userId}/entries`;
  try {
    const q = query(getEntriesCollection(userId), orderBy('updatedAt', 'desc'));

    return onSnapshot(
      q,
      (snapshot) => {
        const entries: JournalEntry[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          entries.push({
            id: docSnap.id,
            userId: data.userId || userId,
            title: data.title || 'Untitled Thought',
            createdAt: data.createdAt || Date.now(),
            updatedAt: data.updatedAt || Date.now(),
            messages: Array.isArray(data.messages) ? data.messages : [],
            cognitivePulse: data.cognitivePulse,
            isFavorite: Boolean(data.isFavorite),
            isArchived: Boolean(data.isArchived)
          });
        });
        onUpdate(entries);
      },
      (error) => {
        console.warn('Firestore subscription error:', error);
        try {
          handleFirestoreError(error, OperationType.GET, path);
        } catch (err: any) {
          if (onError) onError(err);
        }
      }
    );
  } catch (error: any) {
    console.warn('Failed to attach Firestore snapshot listener:', error);
    try {
      handleFirestoreError(error, OperationType.GET, path);
    } catch (err: any) {
      if (onError) onError(err);
    }
    return () => {};
  }
}

/**
 * Persists or updates a journal entry into users/{userId}/entries/{entryId}
 */
export async function saveEntry(userId: string, entry: JournalEntry): Promise<void> {
  if (!userId) throw new Error('Cannot save entry: missing authenticated userId');
  
  const path = `users/${userId}/entries/${entry.id}`;
  try {
    const entryRef = getEntryDoc(userId, entry.id);
    const rawPayload = {
      ...entry,
      userId,
      updatedAt: Date.now()
    };
    const payload = cleanDataForFirestore(rawPayload);

    await setDoc(entryRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Updates specific fields of an entry
 */
export async function updateEntryFields(
  userId: string,
  entryId: string,
  fields: Partial<JournalEntry>
): Promise<void> {
  if (!userId || !entryId) return;
  const path = `users/${userId}/entries/${entryId}`;
  try {
    const entryRef = getEntryDoc(userId, entryId);
    const rawPayload = {
      ...fields,
      updatedAt: Date.now()
    };
    const payload = cleanDataForFirestore(rawPayload);
    await updateDoc(entryRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Toggles an action item completed state inside cognitivePulse
 */
export async function toggleActionItem(
  userId: string,
  entryId: string,
  actionItemId: string,
  completed: boolean
): Promise<void> {
  const path = `users/${userId}/entries/${entryId}`;
  try {
    const docRef = getEntryDoc(userId, entryId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return;

    const data = snap.data() as JournalEntry;
    if (!data.cognitivePulse || !data.cognitivePulse.actionItems) return;

    const updatedItems = data.cognitivePulse.actionItems.map((item) =>
      item.id === actionItemId ? { ...item, completed } : item
    );

    const payload = cleanDataForFirestore({
      'cognitivePulse.actionItems': updatedItems,
      updatedAt: Date.now()
    });

    await updateDoc(docRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Deletes a journal entry securely
 */
export async function deleteEntry(userId: string, entryId: string): Promise<void> {
  if (!userId || !entryId) return;
  const path = `users/${userId}/entries/${entryId}`;
  try {
    const entryRef = getEntryDoc(userId, entryId);
    await deleteDoc(entryRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
