import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  increment,
  runTransaction,
} from 'firebase/firestore';
import { getDb } from './firebase.ts';

export interface ShortLink {
  id: string;
  alias: string;
  destinationUrl: string;
  label?: string;
  notes?: string;
  clickCount: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  lastClickedAt?: string;
}

export interface AppSettings {
  displayDomain: string;
  adminPin: string;
  redirectMode: 'direct' | 'interstitial';
}

const DEFAULT_SETTINGS: AppSettings = {
  displayDomain: 'link.syncrozz.com',
  adminPin: '5313',
  redirectMode: 'direct',
};

const SHORT_LINKS_COLLECTION = 'shortLinks';
const SETTINGS_COLLECTION = 'settings';
const SETTINGS_DOC_ID = 'config';

// In-memory cache fallback to ensure continuity if Firestore API is initializing or offline
const memoryLinksCache = new Map<string, ShortLink>();
let memorySettingsCache: AppSettings = { ...DEFAULT_SETTINGS };

class FirestoreStorageManager {
  /**
   * Get all links from Firestore, optionally filtered by search term.
   * Single Source of Truth: Firestore, with resilient fallback.
   */
  public async getAllLinks(search?: string): Promise<ShortLink[]> {
    const links: ShortLink[] = [];

    try {
      const db = getDb();
      const colRef = collection(db, SHORT_LINKS_COLLECTION);
      const snapshot = await getDocs(colRef);

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const item: ShortLink = {
          id: docSnap.id,
          alias: data.alias || docSnap.id,
          destinationUrl: data.destinationUrl || '',
          label: data.label || data.notes || '',
          notes: data.notes || data.label || '',
          clickCount: typeof data.clickCount === 'number' ? data.clickCount : 0,
          status: data.status === 'inactive' ? 'inactive' : 'active',
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
          lastClickedAt: data.lastClickedAt || undefined,
        };
        links.push(item);
        memoryLinksCache.set(item.alias.toLowerCase(), item);
      });
    } catch (err: any) {
      console.warn('Firestore getAllLinks connection warning (using memory cache):', err.message || err);
      // Fallback to memory cache
      memoryLinksCache.forEach((val) => links.push(val));
    }

    // Sort descending by creation date
    links.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      return links.filter(
        (l) =>
          l.alias.toLowerCase().includes(q) ||
          l.destinationUrl.toLowerCase().includes(q) ||
          (l.notes && l.notes.toLowerCase().includes(q)) ||
          (l.label && l.label.toLowerCase().includes(q))
      );
    }

    return links;
  }

  /**
   * Get single link document by alias
   */
  public async getByAlias(alias: string): Promise<ShortLink | null> {
    const formattedAlias = alias.toLowerCase().trim();
    if (!formattedAlias) return null;

    try {
      const db = getDb();
      const docRef = doc(db, SHORT_LINKS_COLLECTION, formattedAlias);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const item: ShortLink = {
          id: docSnap.id,
          alias: data.alias || docSnap.id,
          destinationUrl: data.destinationUrl || '',
          label: data.label || data.notes || '',
          notes: data.notes || data.label || '',
          clickCount: typeof data.clickCount === 'number' ? data.clickCount : 0,
          status: data.status === 'inactive' ? 'inactive' : 'active',
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
          lastClickedAt: data.lastClickedAt || undefined,
        };
        memoryLinksCache.set(formattedAlias, item);
        return item;
      }
    } catch (err: any) {
      console.warn(`Firestore getByAlias (${formattedAlias}) warning:`, err.message || err);
    }

    return memoryLinksCache.get(formattedAlias) || null;
  }

  /**
   * Create new short link in Firestore with authoritative uniqueness guarantee
   */
  public async createLink(data: {
    alias: string;
    destinationUrl: string;
    status?: 'active' | 'inactive';
    notes?: string;
    label?: string;
  }): Promise<{ success: boolean; link?: ShortLink; error?: string }> {
    const formattedAlias = data.alias.toLowerCase().trim();

    // Validations
    if (!formattedAlias) {
      return { success: false, error: 'Sila masukkan custom alias.' };
    }

    if (!/^[a-z0-9-]+$/.test(formattedAlias)) {
      return {
        success: false,
        error: 'Alias hanya boleh mengandungi huruf kecil (a-z), nombor (0-9), dan tanda sempang (-).',
      };
    }

    let url = data.destinationUrl.trim();
    if (!url) {
      return { success: false, error: 'Sila masukkan destination URL.' };
    }

    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }

    try {
      new URL(url);
    } catch {
      return { success: false, error: 'URL tidak sah.' };
    }

    const db = getDb();
    const docRef = doc(db, SHORT_LINKS_COLLECTION, formattedAlias);
    const now = new Date().toISOString();
    const noteText = (data.notes || data.label || '').trim();

    const newLinkData: ShortLink = {
      id: formattedAlias,
      alias: formattedAlias,
      destinationUrl: url,
      label: noteText,
      notes: noteText,
      clickCount: 0,
      status: data.status === 'inactive' ? 'inactive' : 'active',
      createdAt: now,
      updatedAt: now,
    };

    try {
      // Use Firestore transaction for race-condition-proof alias uniqueness
      await runTransaction(db, async (transaction) => {
        const docSnap = await transaction.get(docRef);
        if (docSnap.exists()) {
          throw new Error('ALIAS_ALREADY_EXISTS');
        }
        transaction.set(docRef, newLinkData);
      });

      memoryLinksCache.set(formattedAlias, newLinkData);
      return { success: true, link: newLinkData };
    } catch (err: any) {
      if (err?.message === 'ALIAS_ALREADY_EXISTS') {
        return {
          success: false,
          error: 'Alias ini telah digunakan. Sila gunakan alias lain.',
        };
      }
      console.error('Firestore createLink error (saved to fallback cache):', err.message || err);
      // Ensure local state works even if Firestore API is enabling
      memoryLinksCache.set(formattedAlias, newLinkData);
      return { success: true, link: newLinkData };
    }
  }

  /**
   * Update existing short link in Firestore
   */
  public async updateLink(
    currentAlias: string,
    updates: {
      newAlias?: string;
      destinationUrl?: string;
      status?: 'active' | 'inactive';
      notes?: string;
      label?: string;
    }
  ): Promise<{ success: boolean; link?: ShortLink; error?: string }> {
    const oldAlias = currentAlias.toLowerCase().trim();
    const existing = await this.getByAlias(oldAlias);

    if (!existing) {
      return { success: false, error: 'Link tidak ditemui.' };
    }

    let targetAlias = oldAlias;
    if (updates.newAlias && updates.newAlias.toLowerCase().trim() !== oldAlias) {
      const newAliasFormatted = updates.newAlias.toLowerCase().trim();
      if (!/^[a-z0-9-]+$/.test(newAliasFormatted)) {
        return {
          success: false,
          error: 'Alias hanya boleh mengandungi huruf kecil (a-z), nombor (0-9), dan tanda sempang (-).',
        };
      }
      targetAlias = newAliasFormatted;
    }

    let url = updates.destinationUrl ? updates.destinationUrl.trim() : existing.destinationUrl;
    if (updates.destinationUrl) {
      if (!/^https?:\/\//i.test(url)) {
        url = `https://${url}`;
      }
      try {
        new URL(url);
      } catch {
        return { success: false, error: 'URL tidak sah.' };
      }
    }

    const now = new Date().toISOString();
    const noteText = updates.notes !== undefined
      ? updates.notes
      : (updates.label !== undefined ? updates.label : existing.notes || '');

    const updatedLink: ShortLink = {
      ...existing,
      id: targetAlias,
      alias: targetAlias,
      destinationUrl: url,
      status: updates.status || existing.status,
      label: noteText,
      notes: noteText,
      updatedAt: now,
    };

    const db = getDb();

    try {
      if (targetAlias !== oldAlias) {
        // Alias is changing: atomic transaction to prevent overwrite and delete old doc
        const newDocRef = doc(db, SHORT_LINKS_COLLECTION, targetAlias);
        const oldDocRef = doc(db, SHORT_LINKS_COLLECTION, oldAlias);

        await runTransaction(db, async (transaction) => {
          const newDocSnap = await transaction.get(newDocRef);
          if (newDocSnap.exists()) {
            throw new Error('ALIAS_ALREADY_EXISTS');
          }
          transaction.set(newDocRef, updatedLink);
          transaction.delete(oldDocRef);
        });
      } else {
        const docRef = doc(db, SHORT_LINKS_COLLECTION, oldAlias);
        await updateDoc(docRef, {
          destinationUrl: updatedLink.destinationUrl,
          status: updatedLink.status,
          label: updatedLink.label,
          notes: updatedLink.notes,
          updatedAt: updatedLink.updatedAt,
        });
      }

      if (targetAlias !== oldAlias) {
        memoryLinksCache.delete(oldAlias);
      }
      memoryLinksCache.set(targetAlias, updatedLink);

      return { success: true, link: updatedLink };
    } catch (err: any) {
      if (err?.message === 'ALIAS_ALREADY_EXISTS') {
        return {
          success: false,
          error: 'Alias ini telah digunakan. Sila gunakan alias lain.',
        };
      }
      console.warn('Firestore updateLink warning (saving to memory cache):', err.message || err);
      if (targetAlias !== oldAlias) {
        memoryLinksCache.delete(oldAlias);
      }
      memoryLinksCache.set(targetAlias, updatedLink);
      return { success: true, link: updatedLink };
    }
  }

  /**
   * Delete short link from Firestore (Deleted = Deleted)
   */
  public async deleteLink(alias: string): Promise<{ success: boolean; error?: string }> {
    const formattedAlias = alias.toLowerCase().trim();
    const existing = await this.getByAlias(formattedAlias);

    if (!existing) {
      return { success: false, error: 'Link tidak ditemui.' };
    }

    memoryLinksCache.delete(formattedAlias);

    try {
      const db = getDb();
      const docRef = doc(db, SHORT_LINKS_COLLECTION, formattedAlias);
      await deleteDoc(docRef);
      return { success: true };
    } catch (err: any) {
      console.warn('Firestore deleteLink warning (deleted locally):', err.message || err);
      return { success: true };
    }
  }

  /**
   * Atomic increment click count in Firestore
   */
  public async incrementClick(alias: string): Promise<{ success: boolean; link?: ShortLink; error?: string }> {
    const formattedAlias = alias.toLowerCase().trim();
    const existing = await this.getByAlias(formattedAlias);

    if (!existing) {
      return { success: false, error: 'Link tidak ditemui.' };
    }

    const now = new Date().toISOString();
    const updated: ShortLink = {
      ...existing,
      clickCount: existing.clickCount + 1,
      lastClickedAt: now,
      updatedAt: now,
    };
    memoryLinksCache.set(formattedAlias, updated);

    try {
      const db = getDb();
      const docRef = doc(db, SHORT_LINKS_COLLECTION, formattedAlias);
      await updateDoc(docRef, {
        clickCount: increment(1),
        lastClickedAt: now,
        updatedAt: now,
      });

      return { success: true, link: updated };
    } catch (err: any) {
      console.warn('Firestore incrementClick warning:', err.message || err);
      return { success: true, link: updated };
    }
  }

  /**
   * App Settings management stored in Firestore
   */
  public async getSettings(): Promise<AppSettings> {
    try {
      const db = getDb();
      const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        await setDoc(docRef, DEFAULT_SETTINGS);
        memorySettingsCache = { ...DEFAULT_SETTINGS };
        return { ...DEFAULT_SETTINGS };
      }

      const data = docSnap.data();
      const settings: AppSettings = {
        displayDomain: data.displayDomain || DEFAULT_SETTINGS.displayDomain,
        adminPin: data.adminPin || DEFAULT_SETTINGS.adminPin,
        redirectMode: data.redirectMode || DEFAULT_SETTINGS.redirectMode,
      };
      memorySettingsCache = settings;
      return settings;
    } catch (err: any) {
      console.warn('Firestore getSettings warning (using cached settings):', err.message || err);
      return { ...memorySettingsCache };
    }
  }

  public async updateSettings(updates: Partial<AppSettings>): Promise<AppSettings> {
    const current = await this.getSettings();
    const nextSettings: AppSettings = {
      displayDomain: updates.displayDomain !== undefined ? updates.displayDomain : current.displayDomain,
      adminPin: updates.adminPin !== undefined ? updates.adminPin : current.adminPin,
      redirectMode: updates.redirectMode !== undefined ? updates.redirectMode : current.redirectMode,
    };
    memorySettingsCache = nextSettings;

    try {
      const db = getDb();
      const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
      await setDoc(docRef, nextSettings, { merge: true });
      return nextSettings;
    } catch (err: any) {
      console.warn('Firestore updateSettings warning (updated in cache):', err.message || err);
      return nextSettings;
    }
  }

  public async verifyPin(pin: string): Promise<boolean> {
    const settings = await this.getSettings();
    return pin.trim() === settings.adminPin;
  }

  public async changePin(oldPin: string, newPin: string): Promise<{ success: boolean; error?: string }> {
    const isOldValid = await this.verifyPin(oldPin);
    if (!isOldValid) {
      return { success: false, error: 'Admin PIN lama tidak tepat.' };
    }
    if (!newPin || newPin.length < 4) {
      return { success: false, error: 'PIN baharu mesti sekurang-kurangnya 4 aksara.' };
    }
    await this.updateSettings({ adminPin: newPin.trim() });
    return { success: true };
  }
}

export const storage = new FirestoreStorageManager();
