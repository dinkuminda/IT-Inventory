import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import * as admin from 'firebase-admin';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
let firebaseAdmin: admin.app.App | null = null;
const configPath = path.join(process.cwd(), 'firebase-applet-config.json');

if (fs.existsSync(configPath)) {
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    // For local dev in AI Studio, we often don't have a service account key file,
    // but the environment might be provisioned for us if we use the right project ID.
    // However, the standard way in our environment is to use the provisioned project.
    if (!admin.apps.length) {
      firebaseAdmin = admin.initializeApp({
        projectId: config.projectId,
      });
    } else {
      firebaseAdmin = admin.app();
    }
    console.log('Firebase Admin initialized for project:', config.projectId);
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  console.log('Initializing ICS IT Admin Server (Firebase)...');
  
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  app.get("/api/health", async (req, res) => {
    let firebaseStatus = "not_configured";
    let collections: string[] = [];
    
    if (firebaseAdmin) {
      try {
        const db = firebaseAdmin.firestore();
        // Check connection by listing collections (minimal read)
        firebaseStatus = "ok";
        const collectionsList = await db.listCollections();
        collections = collectionsList.map(c => c.id);
      } catch (e: any) {
        firebaseStatus = "error";
        console.error('Health check error:', e);
      }
    }

    res.json({ 
      status: "ok", 
      firebaseConfigured: !!firebaseAdmin,
      firebaseStatus,
      collections,
      env: process.env.NODE_ENV,
      time: new Date().toISOString()
    });
  });

  // Admin User Creation Endpoint
  app.post("/api/admin/create-user", async (req, res) => {
    if (!firebaseAdmin) return res.status(500).json({ error: "Firebase Admin not configured" });
    const { email, password, fullName, department } = req.body;

    try {
      const userRecord = await firebaseAdmin.auth().createUser({
        email,
        password,
        displayName: fullName,
      });

      const profileData = {
        id: userRecord.uid,
        email,
        displayName: fullName,
        department: department || 'IT Department',
        role: 'employee',
        needsPasswordChange: true,
        updatedAt: new Date().toISOString()
      };

      await firebaseAdmin.firestore().collection('profiles').doc(userRecord.uid).set(profileData);

      res.json({ success: true, user: userRecord });
    } catch (error: any) {
      console.error('Error creating user:', error);
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/admin/update-user", async (req, res) => {
    if (!firebaseAdmin) return res.status(500).json({ error: "Firebase Admin not configured" });
    const { id, fullName, department, role } = req.body;
    try {
      await firebaseAdmin.firestore().collection('profiles').doc(id).update({
        displayName: fullName,
        department,
        role,
        updatedAt: new Date().toISOString()
      });
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/admin/delete-user", async (req, res) => {
    if (!firebaseAdmin) return res.status(500).json({ error: "Firebase Admin not configured" });
    const { id } = req.body;
    try {
      await firebaseAdmin.auth().deleteUser(id);
      await firebaseAdmin.firestore().collection('profiles').doc(id).delete();
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/admin/reset-password", async (req, res) => {
    if (!firebaseAdmin) return res.status(500).json({ error: "Firebase Admin not configured" });
    const { id, newPassword } = req.body;
    try {
      await firebaseAdmin.auth().updateUser(id, { password: newPassword });
      await firebaseAdmin.firestore().collection('profiles').doc(id).update({
        needsPasswordChange: true,
        updatedAt: new Date().toISOString()
      });
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Asset Endpoints
  app.post("/api/assets/save", async (req, res) => {
    if (!firebaseAdmin) return res.status(500).json({ error: "Firebase Admin not configured" });
    const { assetId, payload } = req.body;
    console.log(`Saving asset: ID=${assetId}, Payload Keys=${Object.keys(payload || {})}`);
    try {
      const db = firebaseAdmin.firestore();
      if (Array.isArray(payload)) {
        // Bulk import
        const batch = db.batch();
        payload.forEach(item => {
          const ref = db.collection('assets').doc();
          batch.set(ref, { ...item, updatedAt: new Date().toISOString() });
        });
        await batch.commit();
      } else if (assetId) {
        // Update existing
        await db.collection('assets').doc(assetId).update({ ...payload, updatedAt: new Date().toISOString() });
      } else {
        // Create new
        const ref = db.collection('assets').doc();
        await ref.set({ ...payload, id: ref.id, updatedAt: new Date().toISOString() });
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error saving asset:', error);
      res.status(400).json({ 
        error: error.message || "Unknown database error",
        code: error.code
      });
    }
  });

  app.post("/api/assets/update", async (req, res) => {
    if (!firebaseAdmin) return res.status(500).json({ error: "Firebase Admin not configured" });
    const { id, updates, payload } = req.body;
    try {
      await firebaseAdmin.firestore().collection('assets').doc(id).update({
        ...(updates || payload),
        updatedAt: new Date().toISOString()
      });
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error updating asset:', error);
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/assets/delete", async (req, res) => {
    if (!firebaseAdmin) return res.status(500).json({ error: "Firebase Admin not configured" });
    const { id } = req.body;
    try {
      await firebaseAdmin.firestore().collection('assets').doc(id).delete();
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting asset:', error);
      res.status(400).json({ error: error.message });
    }
  });

  // License Endpoints
  app.post("/api/licenses/save", async (req, res) => {
    if (!firebaseAdmin) return res.status(500).json({ error: "Firebase Admin not configured" });
    const { licenseId, payload } = req.body;
    try {
      const db = firebaseAdmin.firestore();
      if (Array.isArray(payload)) {
        // Bulk import
        const batch = db.batch();
        payload.forEach(item => {
          const ref = db.collection('licenses').doc();
          batch.set(ref, { ...item, updatedAt: new Date().toISOString() });
        });
        await batch.commit();
      } else if (licenseId) {
        // Update existing
        await db.collection('licenses').doc(licenseId).update({ ...payload, updatedAt: new Date().toISOString() });
      } else {
        // Create new
        const ref = db.collection('licenses').doc();
        await ref.set({ ...payload, id: ref.id, updatedAt: new Date().toISOString() });
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error saving license:', error);
      res.status(400).json({ 
        error: error.message || "Unknown database error",
        code: error.code
      });
    }
  });

  app.post("/api/licenses/delete", async (req, res) => {
    if (!firebaseAdmin) return res.status(500).json({ error: "Firebase Admin not configured" });
    const { id } = req.body;
    try {
      await firebaseAdmin.firestore().collection('licenses').doc(id).delete();
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting license:', error);
      res.status(400).json({ error: error.message });
    }
  });

  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: "API route not found" });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is listening on 0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
