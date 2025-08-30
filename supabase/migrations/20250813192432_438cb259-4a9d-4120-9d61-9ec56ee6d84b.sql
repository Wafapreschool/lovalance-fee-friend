-- Fix critical security vulnerability in students table RLS policies
-- Current policies allow anyone to access all student data

-- First, create a user_roles table to distinguish between admins and students
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'student')),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
    SELECT role FROM public.user_roles WHERE user_id = user_uuid;
$$;

-- Create security definer function to get student_id for authenticated user
CREATE OR REPLACE FUNCTION public.get_user_student_id(user_uuid UUID)
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
    SELECT student_id FROM public.user_roles WHERE user_id = user_uuid AND role = 'student';
$$;

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Admins can manage all students" ON public.students;
DROP POLICY IF EXISTS "Students can view their own data" ON public.students;

-- Create secure RLS policies for students table
CREATE POLICY "Authenticated admins can manage all students"
    ON public.students
    FOR ALL
    TO authenticated
    USING (public.get_user_role(auth.uid()) = 'admin')
    WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Authenticated students can view their own data"
    ON public.students
    FOR SELECT
    TO authenticated
    USING (id = public.get_user_student_id(auth.uid()));

-- Create RLS policies for user_roles table
CREATE POLICY "Users can view their own role"
    ON public.user_roles
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all user roles"
    ON public.user_roles
    FOR ALL
    TO authenticated
    USING (public.get_user_role(auth.uid()) = 'admin')
    WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

-- Update other tables with similar security issues
-- Fix student_fees table policies
DROP POLICY IF EXISTS "Students can view their own fees" ON public.student_fees;
DROP POLICY IF EXISTS "Admins can manage all student fees" ON public.student_fees;

CREATE POLICY "Authenticated admins can manage all student fees"
    ON public.student_fees
    FOR ALL
    TO authenticated
    USING (public.get_user_role(auth.uid()) = 'admin')
    WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Authenticated students can view their own fees"
    ON public.student_fees
    FOR SELECT
    TO authenticated
    USING (student_id = public.get_user_student_id(auth.uid()));

-- Fix other_payments table policies
DROP POLICY IF EXISTS "Students can view their own other payments" ON public.other_payments;
DROP POLICY IF EXISTS "Admins can manage all other payments" ON public.other_payments;

CREATE POLICY "Authenticated admins can manage all other payments"
    ON public.other_payments
    FOR ALL
    TO authenticated
    USING (public.get_user_role(auth.uid()) = 'admin')
    WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Authenticated students can view their own other payments"
    ON public.other_payments
    FOR SELECT
    TO authenticated
    USING (student_id = public.get_user_student_id(auth.uid()));

-- Fix fees table policies (legacy table)
DROP POLICY IF EXISTS "Students can view their own fees" ON public.fees;
DROP POLICY IF EXISTS "Admins can manage all fees" ON public.fees;

CREATE POLICY "Authenticated admins can manage all fees"
    ON public.fees
    FOR ALL
    TO authenticated
    USING (public.get_user_role(auth.uid()) = 'admin')
    WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Authenticated students can view their own fees"
    ON public.fees
    FOR SELECT
    TO authenticated
    USING (student_id = public.get_user_student_id(auth.uid()));

-- Fix notifications table policies
DROP POLICY IF EXISTS "Admins can manage all notifications" ON public.notifications;

CREATE POLICY "Authenticated admins can manage all notifications"
    ON public.notifications
    FOR ALL
    TO authenticated
    USING (public.get_user_role(auth.uid()) = 'admin')
    WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Authenticated students can view their own notifications"
    ON public.notifications
    FOR SELECT
    TO authenticated
    USING (student_id = public.get_user_student_id(auth.uid()));

-- Create trigger for updated_at on user_roles
CREATE TRIGGER update_user_roles_updated_at
    BEFORE UPDATE ON public.user_roles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();