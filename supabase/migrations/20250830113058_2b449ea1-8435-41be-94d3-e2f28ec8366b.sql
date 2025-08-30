-- Create admin user in auth.users and user_roles table
-- First, we need to create the admin user if it doesn't exist
DO $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- Insert admin user into auth.users if not exists
    INSERT INTO auth.users (
        id,
        instance_id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        recovery_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    ) VALUES (
        gen_random_uuid(),
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'admin@school.com',
        crypt('admin123', gen_salt('bf')),
        now(),
        now(),
        now(),
        '{"provider": "email", "providers": ["email"]}',
        '{}',
        now(),
        now(),
        '',
        '',
        '',
        ''
    ) ON CONFLICT (email) DO UPDATE SET
        encrypted_password = crypt('admin123', gen_salt('bf')),
        updated_at = now()
    RETURNING id INTO admin_user_id;

    -- If user already existed, get their ID
    IF admin_user_id IS NULL THEN
        SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@school.com';
    END IF;

    -- Insert or update admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;

    -- Create a profile for the admin user
    INSERT INTO public.profiles (user_id, full_name)
    VALUES (admin_user_id, 'Administrator')
    ON CONFLICT (user_id) DO UPDATE SET
        full_name = 'Administrator',
        updated_at = now();
        
END $$;