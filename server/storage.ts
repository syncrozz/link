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
  adminPin: 'admin123',
  redirectMode: 'direct',
};

const SHORT_LINKS_COLLECTION = 'shortLinks';
const SETTINGS_COLLECTION = 'settings';
const SETTINGS_DOC_ID = 'config';

class FirestoreStorageManager {
  /**
   * Get all links from Firestore, optionally filtered by search term.
   * Single Source of Truth: Firestore only.
   */
  public async getAllLinks(search?: string): Promise<ShortLink[]> {
    const db = getDb();
    const colRef = collection(db, SHORT_LINKS_COLLECTION);
    const snapshot = await getDocs(colRef);

    const links: ShortLink[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      links.push({
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
      });
    });

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

    const db = getDb();
    const docRef = doc(db, SHORT_LINKS_COLLECTION, formattedAlias);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
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

      return { success: true, link: newLinkData };
    } catch (err: any) {
      if (err?.message === 'ALIAS_ALREADY_EXISTS') {
        return {
          success: false,
          error: 'Alias ini telah digunakan. Sila gunakan alias lain.',
        };
      }
      console.error('Firestore createLink error:', err);
      return {
        success: false,
        error: err.message || 'Tidak dapat menyambung ke database Firestore.',
      };
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

      return { success: true, link: updatedLink };
    } catch (err: any) {
      if (err?.message === 'ALIAS_ALREADY_EXISTS') {
        return {
          success: false,
          error: 'Alias ini telah digunakan. Sila gunakan alias lain.',
        };
      }
      console.error('Firestore updateLink error:', err);
      return {
        success: false,
        error: err.message || 'Gagal mengemaskini data dalam Firestore.',
      };
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

    const db = getDb();
    const docRef = doc(db, SHORT_LINKS_COLLECTION, formattedAlias);

    try {
      await deleteDoc(docRef);
      return { success: true };
    } catch (err: any) {
      console.error('Firestore deleteLink error:', err);
      return {
        success: false,
        error: err.message || 'Gagal memadam link dari Firestore.',
      };
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

    const db = getDb();
    const docRef = doc(db, SHORT_LINKS_COLLECTION, formattedAlias);
    const now = new Date().toISOString();

    try {
      await updateDoc(docRef, {
        clickCount: increment(1),
        lastClickedAt: now,
        updatedAt: now,
      });

      const updated: ShortLink = {
        ...existing,
        clickCount: existing.clickCount + 1,
        lastClickedAt: now,
        updatedAt: now,
      };

      return { success: true, link: updated };
    } catch (err: any) {
      console.error('Firestore incrementClick error:', err);
      return { success: false, error: err.message || 'Gagal mengemas kini klik.' };
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
        return { ...DEFAULT_SETTINGS };
      }

      const data = docSnap.data();
      return {
        displayDomain: data.displayDomain || DEFAULT_SETTINGS.displayDomain,
        adminPin: data.adminPin || DEFAULT_SETTINGS.adminPin,
        redirectMode: data.redirectMode || DEFAULT_SETTINGS.redirectMode,
      };
    } catch (err) {
      console.error('Firestore getSettings error:', err);
      return { ...DEFAULT_SETTINGS };
    }
  }

  public async updateSettings(updates: Partial<AppSettings>): Promise<AppSettings> {
    try {
      const current = await this.getSettings();
      const nextSettings: AppSettings = {
        displayDomain: updates.displayDomain !== undefined ? updates.displayDomain : current.displayDomain,
        adminPin: updates.adminPin !== undefined ? updates.adminPin : current.adminPin,
        redirectMode: updates.redirectMode !== undefined ? updates.redirectMode : current.redirectMode,
      };

      const db = getDb();
      const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
      await setDoc(docRef, nextSettings, { merge: true });

      return nextSettings;
    } catch (err) {
      console.error('Firestore updateSettings error:', err);
      return { ...DEFAULT_SETTINGS, ...updates };
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
