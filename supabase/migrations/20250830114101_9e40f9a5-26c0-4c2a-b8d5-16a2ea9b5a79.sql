-- Insert a test parent user that links to an existing student
-- First, let's create a user role for a parent (linking to student Shifna with phone 546546)
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
    'f980c4e9-d361-4617-8326-d676b0644ffd'::uuid,
    'parent.shifna@test.com',
    crypt('parent123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"full_name": "Parent of Shifna"}',
    'authenticated',
    'authenticated'
);

-- Create user role linking this parent to the student
INSERT INTO public.user_roles (user_id, role, student_id)
VALUES ('f980c4e9-d361-4617-8326-d676b0644ffd'::uuid, 'student', 'f980c4e9-d361-4617-8326-d676b0644ffd'::uuid);

-- Create profile for the parent
INSERT INTO public.profiles (user_id, full_name)
VALUES ('f980c4e9-d361-4617-8326-d676b0644ffd'::uuid, 'Parent of Shifna');