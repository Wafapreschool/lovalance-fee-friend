-- Create profiles table for user management
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'parent')),
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create students table
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  class TEXT NOT NULL,
  year_joined INTEGER NOT NULL,
  parent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create fees table
CREATE TABLE public.fees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  year INTEGER NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'paid')) DEFAULT 'pending',
  due_date DATE NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE,
  transaction_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, month, year)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fees ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create RLS policies for students
CREATE POLICY "Admins can manage all students" 
ON public.students 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Parents can view their own students" 
ON public.students 
FOR SELECT 
USING (
  parent_id IN (
    SELECT id FROM public.profiles 
    WHERE user_id = auth.uid()
  )
);

-- Create RLS policies for fees
CREATE POLICY "Admins can manage all fees" 
ON public.fees 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Parents can view their students' fees" 
ON public.fees 
FOR SELECT 
USING (
  student_id IN (
    SELECT s.id FROM public.students s
    JOIN public.profiles p ON s.parent_id = p.id
    WHERE p.user_id = auth.uid()
  )
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fees_updated_at
  BEFORE UPDATE ON public.fees
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data for demonstration
INSERT INTO public.profiles (user_id, full_name, role, phone) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Admin User', 'admin', '+960123456789');

-- Insert sample students (will need parent_id after creating parent profiles)
INSERT INTO public.students (student_id, full_name, class, year_joined) VALUES
  ('WAFA001', 'Ahmed Ali Hassan', 'KG1', 2023),
  ('WAFA002', 'Mariam Hassan Ibrahim', 'KG2', 2022),
  ('WAFA003', 'Ibrahim Mohamed Ali', 'KG1', 2023);

-- Insert sample fees
INSERT INTO public.fees (student_id, month, year, amount, status, due_date) VALUES
  ((SELECT id FROM public.students WHERE student_id = 'WAFA001'), 'January', 2024, 3500.00, 'pending', '2024-01-15'),
  ((SELECT id FROM public.students WHERE student_id = 'WAFA002'), 'January', 2024, 3500.00, 'paid', '2024-01-15'),
  ((SELECT id FROM public.students WHERE student_id = 'WAFA003'), 'January', 2024, 3500.00, 'pending', '2024-01-15');