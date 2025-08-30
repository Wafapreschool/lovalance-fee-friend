-- Create a default admin user if it doesn't exist
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Check if admin user exists
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'admin@school.com';
    
    -- If no admin user found, we need to create one
    -- Note: In production, this should be done through the Supabase dashboard
    -- This is just for development/demo purposes
    
    IF admin_user_id IS NULL THEN
        -- Insert a demo admin user (this requires admin privileges)
        INSERT INTO auth.users (
            instance_id,
            id,
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
            '00000000-0000-0000-0000-000000000000'::uuid,
            '3b15e89c-116b-41be-ba11-f642a213367a'::uuid,
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
        ) ON CONFLICT (id) DO NOTHING;
    END IF;
    
    -- Ensure the user_role entry exists
    INSERT INTO user_roles (user_id, role) 
    VALUES ('3b15e89c-116b-41be-ba11-f642a213367a'::uuid, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
END $$;