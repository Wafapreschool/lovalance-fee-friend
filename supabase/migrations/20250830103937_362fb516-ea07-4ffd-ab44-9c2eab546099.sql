-- Fix function search path security warnings
-- Functions should have explicit search_path set for security

-- Update get_user_role function with proper search_path
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $$
    SELECT role FROM public.user_roles WHERE user_id = user_uuid;
$$;

-- Update get_user_student_id function with proper search_path  
CREATE OR REPLACE FUNCTION public.get_user_student_id(user_uuid UUID)
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $$
    SELECT student_id FROM public.user_roles WHERE user_id = user_uuid AND role = 'student';
$$;