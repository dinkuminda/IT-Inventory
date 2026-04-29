import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "https://wshzrohkcjgemxnwjivp.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = SUPABASE_SERVICE_ROLE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION at:', promise, 'reason:', reason);
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  console.log('Initializing IT Inventory Mgt Server...');
  
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  app.use((req, res, next) => {
    // Hidden logging to keep logs clean but available if needed
    // console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  // API Routes
  app.get("/api/health", async (req, res) => {
    res.json({ 
      status: "ok", 
      time: new Date().toISOString(),
      env: process.env.NODE_ENV
    });
  });

  // Admin Bootstrap Endpoint
  app.post("/api/admin/bootstrap", async (req, res) => {
    if (!supabaseAdmin) return res.status(500).json({ error: "Supabase Service Role Key not configured" });
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    try {
      // 1. Create or update the Auth user
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: password.trim(),
        email_confirm: true,
        user_metadata: { full_name: 'System Admin' }
      });

      let userId = userData.user?.id;

      if (userError) {
        if (userError.message.includes('already registered')) {
          // If already registered, find the user to get their ID
          const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
          const users = listData?.users || [];
          const target = users.find(u => u.email === email);
          if (target) {
            userId = target.id;
            const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, { 
              password: password.trim(),
              email_confirm: true 
            });
            if (updateError) throw updateError;
          }
        } else {
          throw userError;
        }
      }

      if (!userId) throw new Error("Could not determine user ID");

      // 2. Ensure profile exists and has admin role
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert([{
          id: userId,
          email,
          displayName: 'System Admin',
          department: 'IT Admin',
          role: 'admin',
          needsPasswordChange: false
        }]);

      if (profileError) throw profileError;

      res.json({ success: true, message: `Admin ${email} bootstrapped successfully.` });
    } catch (error: any) {
      console.error('Bootstrap error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Admin User Creation Endpoint
  app.post("/api/admin/create-user", async (req, res) => {
    if (!supabaseAdmin) return res.status(500).json({ error: "Supabase Service Role Key not configured" });
    const { email, password, fullName, department, role } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ error: "Email, password, and full name are required" });
    }

    try {
      console.log(`[Admin] Checking for existing profile for: ${email}`);
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('id, email')
        .eq('email', email)
        .single();

      if (existingProfile) {
        // If profile exists but we are creating a new user, check if the auth user exists
        const { data: { user: authUser } } = await supabaseAdmin.auth.admin.getUserById(existingProfile.id);
        if (!authUser) {
          console.log(`[Admin] Found orphaned profile for ${email}, cleaning up...`);
          await supabaseAdmin.from('profiles').delete().eq('id', existingProfile.id);
        }
      }

      console.log(`[Admin] Creating user: ${email}`);
      let authResult;
      const { data: createdData, error: createdError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: password.trim(),
        email_confirm: true,
        user_metadata: { full_name: fullName }
      });

      authResult = { data: createdData, error: createdError };

      if (createdError) {
        if (createdError.message.includes('already registered')) {
          console.log(`[Admin] User ${email} already registered, updating password and syncing profile...`);
          
          let targetId = existingProfile?.id;
          
          if (!targetId) {
            const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
            targetId = listData?.users.find(u => u.email === email)?.id;
          }

          if (targetId) {
            // Force update password for existing user and ensure they are confirmed
            const { data: updatedData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(targetId, { 
              password: password.trim(),
              email_confirm: true,
              user_metadata: { full_name: fullName }
            });
            
            if (updateError) {
              console.error(`[Admin] Failed to update existing user ${email}:`, updateError);
              return res.status(400).json({ error: `Update failed: ${updateError.message}` });
            }
            authResult = { data: updatedData, error: null };
          } else {
            return res.status(400).json({ error: "User exists in auth but could not be resolved to an ID" });
          }
        } else {
          console.error(`[Admin] Auth creation failed for ${email}:`, createdError);
          return res.status(400).json({ 
            error: `Database error creating new user: ${createdError.message}`,
            details: createdError.code || createdError.status,
            code: createdError.code
          });
        }
      }

      const userId = authResult.data.user?.id;
      if (!userId) {
        throw new Error("User creation succeeded but no user ID was found");
      }

      console.log(`[Admin] Syncing profile for: ${email} (${userId})`);
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert([{
          id: userId,
          email,
          displayName: fullName,
          department: department || 'IT Department',
          role: role || 'employee',
          needsPasswordChange: true
        }], { onConflict: 'id' });

      if (profileError) {
        console.error(`[Admin] Profile sync failed for ${email}:`, profileError);
      }

      // Sync profileId to employees table
      const { error: empError } = await supabaseAdmin
        .from('employees')
        .update({ profileId: userId })
        .eq('email', email);
      
      if (empError) {
        console.warn(`[Admin] Failed to link employee record for ${email}:`, empError);
      }

      res.json({ success: true, user: authResult.data.user });
    } catch (error: any) {
      console.error('[Admin] Unexpected error in create-user:', error);
      res.status(500).json({ 
        error: error.message || "An unexpected error occurred during user creation",
        details: error.details
      });
    }
  });

  app.post("/api/admin/update-user", async (req, res) => {
    if (!supabaseAdmin) return res.status(500).json({ error: "Supabase Service Role Key not configured" });
    const { id, fullName, department, role } = req.body;
    try {
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ displayName: fullName, department, role })
        .eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/admin/delete-user", async (req, res) => {
    if (!supabaseAdmin) return res.status(500).json({ error: "Supabase Service Role Key not configured" });
    const { id } = req.body;
    try {
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
      if (authError) throw authError;
      const { error: profileError } = await supabaseAdmin.from('profiles').delete().eq('id', id);
      if (profileError) throw profileError;
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/admin/reset-password", async (req, res) => {
    if (!supabaseAdmin) return res.status(500).json({ error: "Supabase Service Role Key not configured" });
    const { id, newPassword } = req.body;
    try {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, { 
        password: newPassword.trim(),
        email_confirm: true
      });
      if (authError) throw authError;
      const { error: profileError } = await supabaseAdmin.from('profiles').update({ needsPasswordChange: true }).eq('id', id);
      if (profileError) throw profileError;
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Asset Endpoints
  app.post("/api/assets/save", async (req, res) => {
    if (!supabaseAdmin) return res.status(500).json({ error: "Supabase Service Role Key not configured" });
    const { assetId, payload } = req.body;
    try {
      if (Array.isArray(payload)) {
        // Bulk import
        const { error } = await supabaseAdmin.from('assets').insert(payload);
        if (error) throw error;
      } else if (assetId) {
        // Update existing
        const { error } = await supabaseAdmin.from('assets').update(payload).eq('id', assetId);
        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabaseAdmin.from('assets').insert([payload]);
        if (error) throw error;
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ 
        error: error.message || "Unknown database error",
        details: error.details,
        hint: error.hint,
        code: error.code
      });
    }
  });

  app.post("/api/assets/update", async (req, res) => {
    if (!supabaseAdmin) return res.status(500).json({ error: "Supabase Service Role Key not configured" });
    const { id, updates, payload } = req.body;
    try {
      const { error } = await supabaseAdmin.from('assets').update(updates || payload).eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error updating asset:', error);
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/assets/delete", async (req, res) => {
    if (!supabaseAdmin) return res.status(500).json({ error: "Supabase Service Role Key not configured" });
    const { id } = req.body;
    try {
      const { error } = await supabaseAdmin.from('assets').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting asset:', error);
      res.status(400).json({ error: error.message });
    }
  });

  // License Endpoints
  app.post("/api/licenses/save", async (req, res) => {
    if (!supabaseAdmin) return res.status(500).json({ error: "Supabase Service Role Key not configured" });
    const { licenseId, payload } = req.body;
    try {
      if (Array.isArray(payload)) {
        // Bulk import
        const { error } = await supabaseAdmin.from('licenses').insert(payload);
        if (error) throw error;
      } else if (licenseId) {
        // Update existing
        const { error } = await supabaseAdmin.from('licenses').update(payload).eq('id', licenseId);
        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabaseAdmin.from('licenses').insert([payload]);
        if (error) throw error;
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ 
        error: error.message || "Unknown database error",
        details: error.details,
        hint: error.hint,
        code: error.code
      });
    }
  });

  app.post("/api/licenses/delete", async (req, res) => {
    if (!supabaseAdmin) return res.status(500).json({ error: "Supabase Service Role Key not configured" });
    const { id } = req.body;
    try {
      const { error } = await supabaseAdmin.from('licenses').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting license:', error);
      res.status(400).json({ error: error.message });
    }
  });

  app.use("/api", (req, res) => {
    res.status(404).json({ error: "API route not found" });
  });

  const isProduction = process.env.NODE_ENV === "production";
  const distPath = path.join(process.cwd(), 'dist');
  
  const useStatic = isProduction && fs.existsSync(path.join(distPath, 'index.html'));

  if (!useStatic) {
    console.log('Initializing Vite in middleware mode...');
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
        root: process.cwd()
      });
      app.use(vite.middlewares);
      console.log('Vite middleware mounted.');
    } catch (viteError) {
      console.error('Vite initialization failed:', viteError);
    }
  } else {
    console.log('Serving static files from:', distPath);
    app.use(express.static(distPath));
    
    // Catch-all for SPA fallback
    app.use((req, res, next) => {
      if (req.method === 'GET' && !req.path.startsWith('/api')) {
        res.sendFile(path.join(distPath, 'index.html'));
      } else {
        next();
      }
    });
  }

  // Auto-bootstrap if env vars are present
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPass = process.env.ADMIN_PASSWORD;

  if (adminEmail && adminPass && supabaseAdmin) {
    console.log(`Attempting auto-bootstrap for ${adminEmail}...`);
    try {
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
        email: adminEmail,
        password: adminPass.trim(),
        email_confirm: true,
        user_metadata: { full_name: 'Default Admin' }
      });

      let userId = userData.user?.id;

      if (userError && userError.message.includes('already registered')) {
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
        const users = listData?.users || [];
        const target = users.find(u => u.email === adminEmail);
        if (target) userId = target.id;
      } else if (userError) {
        throw userError;
      }

      if (userId) {
        await supabaseAdmin
          .from('profiles')
          .upsert([{
            id: userId,
            email: adminEmail,
            displayName: 'Default Admin',
            department: 'IT Admin',
            role: 'admin',
            needsPasswordChange: false
          }]);
        console.log(`Admin ${adminEmail} is ready.`);
      }
    } catch (err) {
      console.error('Auto-bootstrap failed:', err);
    }
  }

  // Bind to port 3000
  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server is listening on 0.0.0.0:${PORT}`);
    });
  }

  return app;
}

export const appPromise = startServer();

appPromise.catch(err => {
  console.error('FATAL SERVER STARTUP ERROR:', err);
  process.exit(1);
});
