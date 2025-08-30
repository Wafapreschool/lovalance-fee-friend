-- Create a test parent user account to access parent dashboard
-- Generate a unique user ID
DO $$
DECLARE
    parent_user_id UUID := gen_random_uuid();
BEGIN
    -- Insert parent user into auth.users
    INSERT INTO auth.users (
        id, 
        email, 
        encrypted_password, 
        email_confirmed_at, 
        created_at, 
        updated_at,
        raw_user_meta_data,
        aud,
        role
    ) VALUES (
        parent_user_id,
        'parent@test.com',
        crypt('parent123', gen_salt('bf')),
        now(),
        now(),
        now(),
        '{"full_name": "Test Parent"}',
        'authenticated',
        'authenticated'
    );

    -- Create user role linking this parent to student Shifna 
    INSERT INTO public.user_roles (user_id, role, student_id)
    VALUES (parent_user_id, 'student', 'f980c4e9-d361-4617-8326-d676b0644ffd'::uuid);

    -- Create profile for the parent
    INSERT INTO public.profiles (user_id, full_name)
    VALUES (parent_user_id, 'Test Parent');
END $$;