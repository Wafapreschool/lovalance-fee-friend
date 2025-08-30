-- Fix critical security vulnerability: Remove overly permissive RLS policies
-- and implement proper role-based access control

-- Create security definer function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    );
$$;

-- Create security definer function to check if user is student
CREATE OR REPLACE FUNCTION public.is_student()
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'student'
    );
$$;

-- Drop dangerous policies that allow public access
DROP POLICY IF EXISTS "Allow student management operations" ON public.students;
DROP POLICY IF EXISTS "Allow student fees management operations" ON public.student_fees;
DROP POLICY IF EXISTS "Allow user roles management operations" ON public.user_roles;
DROP POLICY IF EXISTS "Allow other payments management operations" ON public.other_payments;
DROP POLICY IF EXISTS "Allow notifications management operations" ON public.notifications;

-- STUDENTS table: Secure policies
-- Only admins can manage all student data
CREATE POLICY "Admins can manage all students" 
ON public.students 
FOR ALL 
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Students can only view their own data when authenticated
CREATE POLICY "Students can view own data" 
ON public.students 
FOR SELECT 
TO authenticated
USING (id = public.get_user_student_id(auth.uid()) AND public.is_student());

-- STUDENT_FEES table: Secure policies
-- Only admins can manage all student fees
CREATE POLICY "Admins can manage all student fees" 
ON public.student_fees 
FOR ALL 
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Students can only view their own fees when authenticated
CREATE POLICY "Students can view own fees" 
ON public.student_fees 
FOR SELECT 
TO authenticated
USING (student_id = public.get_user_student_id(auth.uid()) AND public.is_student());

-- OTHER_PAYMENTS table: Secure policies
-- Only admins can manage all other payments
CREATE POLICY "Admins can manage all other payments" 
ON public.other_payments 
FOR ALL 
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Students can only view their own other payments when authenticated
CREATE POLICY "Students can view own other payments" 
ON public.other_payments 
FOR SELECT 
TO authenticated
USING (student_id = public.get_user_student_id(auth.uid()) AND public.is_student());

-- NOTIFICATIONS table: Secure policies
-- Only admins can manage all notifications
CREATE POLICY "Admins can manage all notifications" 
ON public.notifications 
FOR ALL 
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Students can only view their own notifications when authenticated
CREATE POLICY "Students can view own notifications" 
ON public.notifications 
FOR SELECT 
TO authenticated
USING (student_id = public.get_user_student_id(auth.uid()) AND public.is_student());

-- USER_ROLES table: Secure policies
-- Only admins can manage user roles
CREATE POLICY "Admins can manage all user roles" 
ON public.user_roles 
FOR ALL 
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Users can still view their own role when authenticated
CREATE POLICY "Users can view own role" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

-- Create default admin user if not exists
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) 
SELECT 
    '00000000-0000-0000-0000-000000000000'::uuid,
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@school.com',
    crypt('admin123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "System Administrator"}',
    false,
    '',
    '',
    '',
    ''
WHERE NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'admin@school.com'
);

-- Create admin role for the default admin user
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'
FROM auth.users u
WHERE u.email = 'admin@school.com'
AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = u.id AND ur.role = 'admin'
);