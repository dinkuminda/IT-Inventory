import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory storage (for demo purposes, could be moved to a file or DB)
let assets = [
  { id: '1', name: 'MacBook Pro 16', type: 'Laptop', serialNumber: 'SN-982341', roles: 'IT Support', status: 'In Use', location: 'Office A', date: '2025-01-15', assignedTo: 'admin@assetflow.com', remark: 'Main dev machine', approvalStatus: 'Approved', updatedAt: new Date().toISOString() },
  { id: '2', name: 'Dell UltraSharp 27', type: 'Monitor', serialNumber: 'SN-112233', roles: 'IT Support', status: 'In Stock', location: 'Storage B', date: '2025-02-20', assignedTo: '', remark: '', approvalStatus: 'Pending', updatedAt: new Date().toISOString() }
];

let licenses = [
  { id: '1', softwareName: 'Adobe Creative Cloud', key: 'XXXX-XXXX-XXXX-XXXX', totalSeats: 10, usedSeats: 4, status: 'Active', expiryDate: '2026-12-31', updatedAt: new Date().toISOString() }
];

let users = [
  { id: '1', uid: 'admin-uid', email: 'dinkuh12@gmail.com', displayName: 'Admin User', role: 'admin' }
];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Request logging
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  // Auth Mock
  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email);
    
    // For the demo/mock, we'll accept 'admin123' as the default password
    if (user && (password === 'admin123' || email !== 'dinkuh12@gmail.com')) {
      res.json({ user, token: 'mock-token' });
    } else if (user) {
      res.status(401).json({ error: "Invalid password. Try 'admin123'" });
    } else {
      res.status(401).json({ error: "User not found" });
    }
  });

  app.post("/api/auth/register", (req, res) => {
    const { email, password, name } = req.body;
    const newUser = {
      id: String(users.length + 1),
      uid: `user-${Date.now()}`,
      email,
      displayName: name,
      role: email === 'dinkuh12@gmail.com' ? 'admin' : 'employee',
      department: 'General'
    };
    users.push(newUser);
    res.json({ user: newUser, token: 'mock-token' });
  });

  // Assets API
  app.get("/api/assets", (req, res) => res.json(assets));
  app.post("/api/assets", (req, res) => {
    const newAsset = { 
      ...req.body, 
      id: String(Date.now()), 
      approvalStatus: req.body.approvalStatus || 'Pending',
      updatedAt: new Date().toISOString() 
    };
    assets.push(newAsset);
    res.json(newAsset);
  });
  app.put("/api/assets/:id", (req, res) => {
    assets = assets.map(a => a.id === req.params.id ? { ...a, ...req.body, updatedAt: new Date().toISOString() } : a);
    res.json({ success: true });
  });
  app.delete("/api/assets/:id", (req, res) => {
    assets = assets.filter(a => a.id !== req.params.id);
    res.json({ success: true });
  });

  // Licenses API
  app.get("/api/licenses", (req, res) => res.json(licenses));
  app.post("/api/licenses", (req, res) => {
    const newLicense = { ...req.body, id: String(Date.now()), updatedAt: new Date().toISOString() };
    licenses.push(newLicense);
    res.json(newLicense);
  });
  app.put("/api/licenses/:id", (req, res) => {
    licenses = licenses.map(l => l.id === req.params.id ? { ...l, ...req.body, updatedAt: new Date().toISOString() } : l);
    res.json({ success: true });
  });
  app.delete("/api/licenses/:id", (req, res) => {
    licenses = licenses.filter(l => l.id !== req.params.id);
    res.json({ success: true });
  });

  // Users API
  app.get("/api/users", (req, res) => res.json(users));
  app.put("/api/users/:id", (req, res) => {
    users = users.map(u => u.id === req.params.id ? { ...u, ...req.body } : u);
    res.json({ success: true });
  });

  // Vite middleware for development
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
