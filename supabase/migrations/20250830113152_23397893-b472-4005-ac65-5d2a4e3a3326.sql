-- Fix the function search path security issue
CREATE OR REPLACE FUNCTION public.setup_admin_user(admin_email text)
RETURNS void AS $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- Find the user by email
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = admin_email;
    
    IF admin_user_id IS NULL THEN
        RAISE EXCEPTION 'User with email % not found. Please sign up first.', admin_email;
    END IF;
    
    -- Insert admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Create/update profile
    INSERT INTO public.profiles (user_id, full_name)
    VALUES (admin_user_id, 'Administrator')
    ON CONFLICT (user_id) DO UPDATE SET
        full_name = 'Administrator',
        updated_at = now();
        
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;