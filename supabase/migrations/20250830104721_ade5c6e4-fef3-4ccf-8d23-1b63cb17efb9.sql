-- Create admin user setup for the application
-- This will allow the first admin user to be created

-- First, let's create a simple function to help with admin user creation
-- Since we can't create auth users directly via SQL, we'll create a setup table
-- that can guide the manual setup process

CREATE TABLE IF NOT EXISTS public.admin_setup (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setup_completed BOOLEAN DEFAULT false,
    admin_email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    notes TEXT
);

-- Enable RLS on admin_setup
ALTER TABLE public.admin_setup ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read the setup table (to check if setup is needed)
CREATE POLICY "Anyone can view admin setup status"
    ON public.admin_setup
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Allow authenticated users to update setup status  
CREATE POLICY "Authenticated users can update admin setup"
    ON public.admin_setup
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Insert initial setup record
INSERT INTO public.admin_setup (setup_completed, notes) 
VALUES (false, 'Admin user needs to be created in Supabase Auth')
ON CONFLICT DO NOTHING;