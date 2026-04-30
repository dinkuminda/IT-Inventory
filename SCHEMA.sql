-- INITIAL SCHEMA FOR IT INVENTORY APP
-- Run this in your Supabase SQL Editor

-- 1. Create PROFILES table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  "displayName" TEXT,
  department TEXT,
  role TEXT DEFAULT 'employee',
  "needsPasswordChange" BOOLEAN DEFAULT FALSE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create ASSETS table
CREATE TABLE IF NOT EXISTS public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  "serialNumber" TEXT,
  status TEXT DEFAULT 'In Stock',
  "assignedTo" TEXT,
  roles TEXT,
  location TEXT,
  date TEXT,
  remark TEXT,
  notes TEXT,
  "approvalStatus" TEXT DEFAULT 'Pending',
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create LICENSES table
CREATE TABLE IF NOT EXISTS public.licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  vendor TEXT,
  type TEXT,
  "key" TEXT,
  seats INTEGER DEFAULT 1,
  "usedSeats" INTEGER DEFAULT 0,
  status TEXT DEFAULT 'Active',
  "assignedTo" TEXT,
  department TEXT,
  "expiryDate" TEXT,
  notes TEXT,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create MAINTENANCE table
CREATE TABLE IF NOT EXISTS public.maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "assetId" UUID REFERENCES public.assets(id) ON DELETE CASCADE,
  "issueDescription" TEXT NOT NULL,
  "actionTaken" TEXT,
  "performedBy" TEXT,
  "cost" DECIMAL(10,2) DEFAULT 0,
  "status" TEXT DEFAULT 'Completed',
  "date" DATE DEFAULT CURRENT_DATE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create AUDIT_LOGS table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT,
  "details" JSONB,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Create EMPLOYEES table (for general staff tracking)
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "employeeId" TEXT UNIQUE,
  "fullName" TEXT NOT NULL,
  email TEXT UNIQUE,
  department TEXT,
  position TEXT,
  "joinDate" DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'Active',
  "profileId" UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- 8. Create Functions & Policies

-- Helper function to check if the current user is an admin
-- SECURITY DEFINER bypasses RLS for the internal check to prevent recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- 1. Check if the user is authenticated at all
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  -- 2. Check by email override (Primary for initial setup)
  -- The JWT email is the most reliable check for a specific user ID
  user_email := auth.jwt() ->> 'email';
  IF user_email = 'dinkuh12@gmail.com' THEN
    RETURN TRUE;
  END IF;

  -- 3. Check by profile role (For database-managed permissions)
  IF EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup existing policies to avoid "already exists" errors
DROP POLICY IF EXISTS "Allow public read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow individual update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow admin write profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public read assets" ON public.assets;
DROP POLICY IF EXISTS "Allow user update assigned assets" ON public.assets;
DROP POLICY IF EXISTS "Allow admin all assets" ON public.assets;
DROP POLICY IF EXISTS "Allow public read licenses" ON public.licenses;
DROP POLICY IF EXISTS "Allow admin all licenses" ON public.licenses;
DROP POLICY IF EXISTS "Allow admin all maintenance" ON public.maintenance;
DROP POLICY IF EXISTS "Allow public read maintenance" ON public.maintenance;
DROP POLICY IF EXISTS "Allow admin read audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Allow any to insert audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Allow public read employees" ON public.employees;
DROP POLICY IF EXISTS "Allow admin all employees" ON public.employees;

-- Profiles: Users can read all profiles, but only update their own
CREATE POLICY "Allow public read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow individual update profiles" ON public.profiles FOR UPDATE USING (auth.uid() = id);
-- Admin policy fixed to use the non-recursive function
CREATE POLICY "Allow admin write profiles" ON public.profiles FOR ALL USING (is_admin());

-- Assets: Users can read all assets, but only admins can modify them
CREATE POLICY "Allow public read assets" ON public.assets FOR SELECT USING (true);
CREATE POLICY "Allow user update assigned assets" ON public.assets FOR UPDATE USING ("assignedTo" = (SELECT email FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Allow admin all assets" ON public.assets FOR ALL USING (is_admin());

-- Licenses: Similar to assets
CREATE POLICY "Allow public read licenses" ON public.licenses FOR SELECT USING (true);
CREATE POLICY "Allow admin all licenses" ON public.licenses FOR ALL USING (is_admin());

-- Maintenance: Only admins can manage, public can view
CREATE POLICY "Allow public read maintenance" ON public.maintenance FOR SELECT USING (true);
CREATE POLICY "Allow admin all maintenance" ON public.maintenance FOR ALL USING (is_admin());

-- Audit Logs: Anyone signed in can insert, only admins can view
CREATE POLICY "Allow any to insert audit_logs" ON public.audit_logs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow admin read audit_logs" ON public.audit_logs FOR SELECT USING (is_admin());

-- 9. Automatic Profile Creation on Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. Ensure profile exists - using UPSERT logic
  IF EXISTS (SELECT 1 FROM public.profiles WHERE email = new.email AND id != new.id) THEN
    DELETE FROM public.profiles WHERE email = new.email;
  END IF;

  INSERT INTO public.profiles (id, email, "displayName", role, "needsPasswordChange")
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    CASE WHEN new.email = 'dinkuh12@gmail.com' THEN 'admin' ELSE 'employee' END,
    FALSE
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    "displayName" = COALESCE(public.profiles."displayName", EXCLUDED."displayName");

  -- 2. Sync with employees table
  BEGIN
    IF EXISTS (SELECT 1 FROM public.employees WHERE email = new.email) THEN
      UPDATE public.employees 
      SET status = 'Active',
          "fullName" = COALESCE(public.employees."fullName", new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
          "profileId" = new.id
      WHERE email = new.email;
    ELSE
      INSERT INTO public.employees ("fullName", email, status, department, "profileId")
      VALUES (
        COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        new.email,
        'Active',
        'IT Department',
        new.id
      );
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Ignore employee sync errors in trigger
    NULL;
  END;

  RETURN new;
EXCEPTION WHEN OTHERS THEN
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Employees: Public can view, admins can manage
CREATE POLICY "Allow public read employees" ON public.employees FOR SELECT USING (true);
CREATE POLICY "Allow admin all employees" ON public.employees FOR ALL 
  USING (is_admin()) 
  WITH CHECK (is_admin());

-- 9. Storage (Optional for images/QR)
-- insert into storage.buckets (id, name, public) values ('assets', 'assets', true);
