// server/app.ts
import express, { Router } from "express";

// server/storage.ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  increment,
  runTransaction
} from "firebase/firestore";

// server/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import fs from "fs";
import path from "path";
var firebaseApp = null;
var firestoreDb = null;
function loadFirebaseConfig() {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    try {
      const raw = fs.readFileSync(configPath, "utf-8");
      return JSON.parse(raw);
    } catch (e) {
      console.warn("Failed to parse firebase-applet-config.json:", e);
    }
  }
  return {
    projectId: process.env.FIREBASE_PROJECT_ID || "subtle-furnace-sc9s2",
    appId: process.env.FIREBASE_APP_ID || "1:915525482647:web:24f86b64a8802fdcbdd1d2",
    apiKey: process.env.FIREBASE_API_KEY || "AIzaSyAUy9_lmgelOfuWvemEJQxbCqsFC3ksqyI",
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || "subtle-furnace-sc9s2.firebaseapp.com",
    firestoreDatabaseId: process.env.FIREBASE_DATABASE_ID || "ai-studio-syncrozzlink-3409d9f0-66e7-4814-9e4e-847018e57c83",
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "subtle-furnace-sc9s2.firebasestorage.app",
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "915525482647"
  };
}
function getFirebaseApp() {
  if (!firebaseApp) {
    const config = loadFirebaseConfig();
    const apps = getApps();
    if (apps.length > 0) {
      firebaseApp = getApp();
    } else {
      firebaseApp = initializeApp({
        projectId: config.projectId,
        appId: config.appId,
        apiKey: config.apiKey,
        authDomain: config.authDomain,
        storageBucket: config.storageBucket,
        messagingSenderId: config.messagingSenderId
      });
    }
  }
  return firebaseApp;
}
function getDb() {
  if (!firestoreDb) {
    const app2 = getFirebaseApp();
    const config = loadFirebaseConfig();
    const databaseId = config.firestoreDatabaseId && config.firestoreDatabaseId !== "(default)" ? config.firestoreDatabaseId : void 0;
    if (databaseId) {
      firestoreDb = getFirestore(app2, databaseId);
    } else {
      firestoreDb = getFirestore(app2);
    }
  }
  return firestoreDb;
}

// server/storage.ts
var DEFAULT_SETTINGS = {
  displayDomain: "link.syncrozz.com",
  adminPin: "5313",
  redirectMode: "direct"
};
var SHORT_LINKS_COLLECTION = "shortLinks";
var SETTINGS_COLLECTION = "settings";
var SETTINGS_DOC_ID = "config";
var FirestoreStorageManager = class {
  /**
   * Get all links from Firestore, optionally filtered by search term.
   * Single Source of Truth: Firestore only.
   */
  async getAllLinks(search) {
    const db = getDb();
    const colRef = collection(db, SHORT_LINKS_COLLECTION);
    const snapshot = await getDocs(colRef);
    const links = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      links.push({
        id: docSnap.id,
        alias: data.alias || docSnap.id,
        destinationUrl: data.destinationUrl || "",
        label: data.label || data.notes || "",
        notes: data.notes || data.label || "",
        clickCount: typeof data.clickCount === "number" ? data.clickCount : 0,
        status: data.status === "inactive" ? "inactive" : "active",
        createdAt: data.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: data.updatedAt || (/* @__PURE__ */ new Date()).toISOString(),
        lastClickedAt: data.lastClickedAt || void 0
      });
    });
    links.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      return links.filter(
        (l) => l.alias.toLowerCase().includes(q) || l.destinationUrl.toLowerCase().includes(q) || l.notes && l.notes.toLowerCase().includes(q) || l.label && l.label.toLowerCase().includes(q)
      );
    }
    return links;
  }
  /**
   * Get single link document by alias
   */
  async getByAlias(alias) {
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
      destinationUrl: data.destinationUrl || "",
      label: data.label || data.notes || "",
      notes: data.notes || data.label || "",
      clickCount: typeof data.clickCount === "number" ? data.clickCount : 0,
      status: data.status === "inactive" ? "inactive" : "active",
      createdAt: data.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: data.updatedAt || (/* @__PURE__ */ new Date()).toISOString(),
      lastClickedAt: data.lastClickedAt || void 0
    };
  }
  /**
   * Create new short link in Firestore with authoritative uniqueness guarantee
   */
  async createLink(data) {
    const formattedAlias = data.alias.toLowerCase().trim();
    if (!formattedAlias) {
      return { success: false, error: "Sila masukkan custom alias." };
    }
    if (!/^[a-z0-9-]+$/.test(formattedAlias)) {
      return {
        success: false,
        error: "Alias hanya boleh mengandungi huruf kecil (a-z), nombor (0-9), dan tanda sempang (-)."
      };
    }
    let url = data.destinationUrl.trim();
    if (!url) {
      return { success: false, error: "Sila masukkan destination URL." };
    }
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }
    try {
      new URL(url);
    } catch {
      return { success: false, error: "URL tidak sah." };
    }
    const db = getDb();
    const docRef = doc(db, SHORT_LINKS_COLLECTION, formattedAlias);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const noteText = (data.notes || data.label || "").trim();
    const newLinkData = {
      id: formattedAlias,
      alias: formattedAlias,
      destinationUrl: url,
      label: noteText,
      notes: noteText,
      clickCount: 0,
      status: data.status === "inactive" ? "inactive" : "active",
      createdAt: now,
      updatedAt: now
    };
    try {
      await runTransaction(db, async (transaction) => {
        const docSnap = await transaction.get(docRef);
        if (docSnap.exists()) {
          throw new Error("ALIAS_ALREADY_EXISTS");
        }
        transaction.set(docRef, newLinkData);
      });
      return { success: true, link: newLinkData };
    } catch (err) {
      if (err?.message === "ALIAS_ALREADY_EXISTS") {
        return {
          success: false,
          error: "Alias ini telah digunakan. Sila gunakan alias lain."
        };
      }
      console.error("Firestore createLink error:", err);
      return {
        success: false,
        error: err.message || "Tidak dapat menyambung ke database Firestore."
      };
    }
  }
  /**
   * Update existing short link in Firestore
   */
  async updateLink(currentAlias, updates) {
    const oldAlias = currentAlias.toLowerCase().trim();
    const existing = await this.getByAlias(oldAlias);
    if (!existing) {
      return { success: false, error: "Link tidak ditemui." };
    }
    let targetAlias = oldAlias;
    if (updates.newAlias && updates.newAlias.toLowerCase().trim() !== oldAlias) {
      const newAliasFormatted = updates.newAlias.toLowerCase().trim();
      if (!/^[a-z0-9-]+$/.test(newAliasFormatted)) {
        return {
          success: false,
          error: "Alias hanya boleh mengandungi huruf kecil (a-z), nombor (0-9), dan tanda sempang (-)."
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
        return { success: false, error: "URL tidak sah." };
      }
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const noteText = updates.notes !== void 0 ? updates.notes : updates.label !== void 0 ? updates.label : existing.notes || "";
    const updatedLink = {
      ...existing,
      id: targetAlias,
      alias: targetAlias,
      destinationUrl: url,
      status: updates.status || existing.status,
      label: noteText,
      notes: noteText,
      updatedAt: now
    };
    const db = getDb();
    try {
      if (targetAlias !== oldAlias) {
        const newDocRef = doc(db, SHORT_LINKS_COLLECTION, targetAlias);
        const oldDocRef = doc(db, SHORT_LINKS_COLLECTION, oldAlias);
        await runTransaction(db, async (transaction) => {
          const newDocSnap = await transaction.get(newDocRef);
          if (newDocSnap.exists()) {
            throw new Error("ALIAS_ALREADY_EXISTS");
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
          updatedAt: updatedLink.updatedAt
        });
      }
      return { success: true, link: updatedLink };
    } catch (err) {
      if (err?.message === "ALIAS_ALREADY_EXISTS") {
        return {
          success: false,
          error: "Alias ini telah digunakan. Sila gunakan alias lain."
        };
      }
      console.error("Firestore updateLink error:", err);
      return {
        success: false,
        error: err.message || "Gagal mengemaskini data dalam Firestore."
      };
    }
  }
  /**
   * Delete short link from Firestore (Deleted = Deleted)
   */
  async deleteLink(alias) {
    const formattedAlias = alias.toLowerCase().trim();
    const existing = await this.getByAlias(formattedAlias);
    if (!existing) {
      return { success: false, error: "Link tidak ditemui." };
    }
    const db = getDb();
    const docRef = doc(db, SHORT_LINKS_COLLECTION, formattedAlias);
    try {
      await deleteDoc(docRef);
      return { success: true };
    } catch (err) {
      console.error("Firestore deleteLink error:", err);
      return {
        success: false,
        error: err.message || "Gagal memadam link dari Firestore."
      };
    }
  }
  /**
   * Atomic increment click count in Firestore
   */
  async incrementClick(alias) {
    const formattedAlias = alias.toLowerCase().trim();
    const existing = await this.getByAlias(formattedAlias);
    if (!existing) {
      return { success: false, error: "Link tidak ditemui." };
    }
    const db = getDb();
    const docRef = doc(db, SHORT_LINKS_COLLECTION, formattedAlias);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    try {
      await updateDoc(docRef, {
        clickCount: increment(1),
        lastClickedAt: now,
        updatedAt: now
      });
      const updated = {
        ...existing,
        clickCount: existing.clickCount + 1,
        lastClickedAt: now,
        updatedAt: now
      };
      return { success: true, link: updated };
    } catch (err) {
      console.error("Firestore incrementClick error:", err);
      return { success: false, error: err.message || "Gagal mengemas kini klik." };
    }
  }
  /**
   * App Settings management stored in Firestore
   */
  async getSettings() {
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
        redirectMode: data.redirectMode || DEFAULT_SETTINGS.redirectMode
      };
    } catch (err) {
      console.error("Firestore getSettings error:", err);
      return { ...DEFAULT_SETTINGS };
    }
  }
  async updateSettings(updates) {
    try {
      const current = await this.getSettings();
      const nextSettings = {
        displayDomain: updates.displayDomain !== void 0 ? updates.displayDomain : current.displayDomain,
        adminPin: updates.adminPin !== void 0 ? updates.adminPin : current.adminPin,
        redirectMode: updates.redirectMode !== void 0 ? updates.redirectMode : current.redirectMode
      };
      const db = getDb();
      const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
      await setDoc(docRef, nextSettings, { merge: true });
      return nextSettings;
    } catch (err) {
      console.error("Firestore updateSettings error:", err);
      return { ...DEFAULT_SETTINGS, ...updates };
    }
  }
  async verifyPin(pin) {
    const settings = await this.getSettings();
    return pin.trim() === settings.adminPin;
  }
  async changePin(oldPin, newPin) {
    const isOldValid = await this.verifyPin(oldPin);
    if (!isOldValid) {
      return { success: false, error: "Admin PIN lama tidak tepat." };
    }
    if (!newPin || newPin.length < 4) {
      return { success: false, error: "PIN baharu mesti sekurang-kurangnya 4 aksara." };
    }
    await this.updateSettings({ adminPin: newPin.trim() });
    return { success: true };
  }
};
var storage = new FirestoreStorageManager();

// server/app.ts
function createApp() {
  const app2 = express();
  app2.use(express.json());
  app2.use(express.urlencoded({ extended: true }));
  app2.use((req, res, next) => {
    res.setHeader("X-Powered-By", "SYNCROZZ-Link-v1.0");
    next();
  });
  const apiRouter = Router();
  apiRouter.get("/health", (req, res) => {
    res.json({
      status: "ok",
      product: "SYNCROZZ Link v1.0",
      database: "Firebase Cloud Firestore",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  apiRouter.get("/links", async (req, res) => {
    try {
      const search = (req.query.search || "").trim();
      const links = await storage.getAllLinks(search);
      const settings = await storage.getSettings();
      res.json({
        success: true,
        count: links.length,
        links,
        settings: {
          displayDomain: settings.displayDomain
        }
      });
    } catch (err) {
      console.error("API /links error:", err);
      res.status(500).json({ success: false, error: err.message || "Internal server error" });
    }
  });
  apiRouter.post("/links", async (req, res) => {
    try {
      const { alias, destinationUrl, status, notes, label } = req.body;
      const result = await storage.createLink({
        alias,
        destinationUrl,
        status,
        notes: notes || label,
        label: label || notes
      });
      if (!result.success) {
        return res.status(400).json(result);
      }
      res.status(201).json(result);
    } catch (err) {
      console.error("API POST /links error:", err);
      res.status(500).json({ success: false, error: err.message || "Internal server error" });
    }
  });
  apiRouter.get("/links/:alias", async (req, res) => {
    try {
      const alias = req.params.alias;
      const link = await storage.getByAlias(alias);
      if (!link) {
        return res.status(404).json({ success: false, error: "Link tidak ditemui." });
      }
      res.json({ success: true, link });
    } catch (err) {
      console.error(`API GET /links/${req.params.alias} error:`, err);
      res.status(500).json({ success: false, error: err.message || "Internal server error" });
    }
  });
  apiRouter.put("/links/:alias", async (req, res) => {
    try {
      const currentAlias = req.params.alias;
      const { newAlias, destinationUrl, status, notes, label } = req.body;
      const result = await storage.updateLink(currentAlias, {
        newAlias,
        destinationUrl,
        status,
        notes: notes || label,
        label: label || notes
      });
      if (!result.success) {
        return res.status(400).json(result);
      }
      res.json(result);
    } catch (err) {
      console.error(`API PUT /links/${req.params.alias} error:`, err);
      res.status(500).json({ success: false, error: err.message || "Internal server error" });
    }
  });
  apiRouter.delete("/links/:alias", async (req, res) => {
    try {
      const alias = req.params.alias;
      const result = await storage.deleteLink(alias);
      if (!result.success) {
        return res.status(404).json(result);
      }
      res.json({ success: true, message: "Link berjaya dipadam." });
    } catch (err) {
      console.error(`API DELETE /links/${req.params.alias} error:`, err);
      res.status(500).json({ success: false, error: err.message || "Internal server error" });
    }
  });
  apiRouter.post("/links/click/:alias", async (req, res) => {
    try {
      const alias = req.params.alias;
      const link = await storage.getByAlias(alias);
      if (!link) {
        return res.status(404).json({ success: false, error: "Link tidak ditemui." });
      }
      if (link.status === "inactive") {
        return res.status(403).json({ success: false, error: "Link ini tidak aktif.", link });
      }
      const result = await storage.incrementClick(alias);
      res.json({
        success: true,
        destinationUrl: link.destinationUrl,
        clickCount: result.link?.clickCount ?? link.clickCount + 1
      });
    } catch (err) {
      console.error(`API POST /links/click/${req.params.alias} error:`, err);
      res.status(500).json({ success: false, error: err.message || "Internal server error" });
    }
  });
  apiRouter.post("/auth/verify-pin", async (req, res) => {
    try {
      const { pin } = req.body;
      if (!pin) {
        return res.status(400).json({ success: false, error: "Sila masukkan PIN." });
      }
      const isValid = await storage.verifyPin(pin);
      if (!isValid) {
        return res.status(401).json({ success: false, error: "PIN admin tidak tepat." });
      }
      res.json({ success: true, message: "Admin access disahkan." });
    } catch (err) {
      console.error("API /auth/verify-pin error:", err);
      res.status(500).json({ success: false, error: err.message || "Internal server error" });
    }
  });
  apiRouter.post("/auth/change-pin", async (req, res) => {
    try {
      const { oldPin, newPin } = req.body;
      const result = await storage.changePin(oldPin, newPin);
      if (!result.success) {
        return res.status(400).json(result);
      }
      res.json({ success: true, message: "Admin PIN berjaya ditukar." });
    } catch (err) {
      console.error("API /auth/change-pin error:", err);
      res.status(500).json({ success: false, error: err.message || "Internal server error" });
    }
  });
  apiRouter.get("/settings", async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json({
        success: true,
        settings: {
          displayDomain: settings.displayDomain,
          redirectMode: settings.redirectMode
        }
      });
    } catch (err) {
      console.error("API GET /settings error:", err);
      res.status(500).json({ success: false, error: err.message || "Internal server error" });
    }
  });
  apiRouter.post("/settings", async (req, res) => {
    try {
      const { displayDomain, redirectMode, adminPin } = req.body;
      const updates = {};
      if (displayDomain !== void 0) updates.displayDomain = displayDomain.trim();
      if (redirectMode !== void 0) updates.redirectMode = redirectMode;
      if (adminPin !== void 0 && adminPin.trim().length >= 4) updates.adminPin = adminPin.trim();
      const updated = await storage.updateSettings(updates);
      res.json({
        success: true,
        settings: {
          displayDomain: updated.displayDomain,
          redirectMode: updated.redirectMode
        }
      });
    } catch (err) {
      console.error("API POST /settings error:", err);
      res.status(500).json({ success: false, error: err.message || "Internal server error" });
    }
  });
  const handleRedirect = async (req, res) => {
    const alias = req.params.alias;
    const link = await storage.getByAlias(alias);
    if (!link) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html lang="ms">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Link Tidak Ditemui | SYNCROZZ Link</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0A0A0B; color: #F4F4F5; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
            .card { background: #18181B; border: 1px solid #27272A; border-radius: 16px; padding: 36px; max-width: 440px; width: 100%; text-align: center; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.7); }
            .badge { display: inline-block; background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); padding: 4px 12px; border-radius: 9999px; font-size: 13px; font-weight: 600; margin-bottom: 16px; }
            h1 { font-size: 22px; margin: 0 0 8px 0; color: #fff; }
            p { color: #A1A1AA; font-size: 14px; line-height: 1.5; margin: 0 0 20px 0; }
            .alias-box { background: #101012; border: 1px dashed #3F3F46; padding: 10px; border-radius: 10px; font-family: monospace; color: #34D399; margin-bottom: 24px; font-size: 15px; font-weight: bold; }
            a.btn { display: inline-block; background: #10B981; color: #09090B; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 700; font-size: 14px; transition: opacity 0.2s; }
            a.btn:hover { opacity: 0.9; }
          </style>
        </head>
        <body>
          <div class="card">
            <span class="badge">404 Not Found</span>
            <h1>Link Tidak Ditemui</h1>
            <p>Pautan pendek yang anda cari tidak wujud atau telah dipadam.</p>
            <div class="alias-box">/${alias}</div>
            <a href="/" class="btn">Kembali ke SYNCROZZ Link</a>
          </div>
        </body>
        </html>
      `);
    }
    if (link.status === "inactive") {
      return res.status(403).send(`
        <!DOCTYPE html>
        <html lang="ms">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Link Tidak Aktif | SYNCROZZ Link</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0A0A0B; color: #F4F4F5; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
            .card { background: #18181B; border: 1px solid #27272A; border-radius: 16px; padding: 36px; max-width: 440px; width: 100%; text-align: center; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.7); }
            .badge { display: inline-block; background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); padding: 4px 12px; border-radius: 9999px; font-size: 13px; font-weight: 600; margin-bottom: 16px; }
            h1 { font-size: 22px; margin: 0 0 8px 0; color: #fff; }
            p { color: #A1A1AA; font-size: 14px; line-height: 1.5; margin: 0 0 20px 0; }
            .alias-box { background: #101012; border: 1px dashed #3F3F46; padding: 10px; border-radius: 10px; font-family: monospace; color: #FBBF24; margin-bottom: 24px; font-size: 15px; font-weight: bold; }
            a.btn { display: inline-block; background: #27272A; color: #F4F4F5; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 600; font-size: 14px; border: 1px solid #3F3F46; }
            a.btn:hover { background: #3F3F46; }
          </style>
        </head>
        <body>
          <div class="card">
            <span class="badge">Status: Inactive</span>
            <h1>Link Ini Tidak Aktif</h1>
            <p>Pautan pendek ini telah dinyahaktifkan oleh pentadbir sistem.</p>
            <div class="alias-box">/${alias}</div>
            <a href="/" class="btn">Kembali ke Halaman Utama</a>
          </div>
        </body>
        </html>
      `);
    }
    await storage.incrementClick(alias);
    if (req.query.preview === "1") {
      return res.send(`
        <!DOCTYPE html>
        <html lang="ms">
        <head>
          <meta charset="UTF-8">
          <meta http-equiv="refresh" content="2;url=${link.destinationUrl}">
          <title>Mengarahkan... | SYNCROZZ Link</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0A0A0B; color: #F4F4F5; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
            .card { background: #18181B; border: 1px solid #27272A; border-radius: 16px; padding: 36px; max-width: 480px; width: 100%; text-align: center; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.7); }
            .spinner { width: 38px; height: 38px; border: 3px solid rgba(16, 185, 129, 0.2); border-top-color: #10B981; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 20px auto; }
            @keyframes spin { to { transform: rotate(360deg); } }
            h1 { font-size: 20px; margin: 0 0 8px 0; color: #fff; }
            p { color: #A1A1AA; font-size: 14px; margin: 0 0 20px 0; word-break: break-all; font-family: monospace; }
            a.btn { display: inline-block; background: #10B981; color: #09090B; text-decoration: none; padding: 10px 20px; border-radius: 10px; font-weight: 700; font-size: 13px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="spinner"></div>
            <h1>Mengarahkan anda ke destinasi...</h1>
            <p>${link.destinationUrl}</p>
            <a href="${link.destinationUrl}" class="btn">Buka Segera</a>
          </div>
        </body>
        </html>
      `);
    }
    return res.redirect(302, link.destinationUrl);
  };
  app2.use("/api", apiRouter);
  app2.use("/", apiRouter);
  app2.get("/r/:alias", handleRedirect);
  return app2;
}
var app_default = createApp();

// api/index.ts
var app = createApp();
function handler(req, res) {
  return app(req, res);
}
export {
  handler as default
};
