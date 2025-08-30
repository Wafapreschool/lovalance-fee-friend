-- Create school years table
CREATE TABLE public.school_years (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  year INTEGER NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create school months table
CREATE TABLE public.school_months (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_year_id UUID NOT NULL REFERENCES public.school_years(id) ON DELETE CASCADE,
  month_name TEXT NOT NULL,
  month_number INTEGER NOT NULL,
  due_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(school_year_id, month_number)
);

-- Create student fees table (replaces the existing fees table structure)
CREATE TABLE public.student_fees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_month_id UUID NOT NULL REFERENCES public.school_months(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
  payment_date TIMESTAMP WITH TIME ZONE,
  transaction_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(school_month_id, student_id)
);

-- Enable RLS
ALTER TABLE public.school_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_months ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_fees ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for school_years
CREATE POLICY "Admins can manage all school years" 
ON public.school_years 
FOR ALL 
USING (true);

CREATE POLICY "Everyone can view school years" 
ON public.school_years 
FOR SELECT 
USING (true);

-- Create RLS policies for school_months
CREATE POLICY "Admins can manage all school months" 
ON public.school_months 
FOR ALL 
USING (true);

CREATE POLICY "Everyone can view school months" 
ON public.school_months 
FOR SELECT 
USING (true);

-- Create RLS policies for student_fees
CREATE POLICY "Admins can manage all student fees" 
ON public.student_fees 
FOR ALL 
USING (true);

CREATE POLICY "Students can view their own fees" 
ON public.student_fees 
FOR SELECT 
USING (true);

-- Create triggers for updated_at
CREATE TRIGGER update_school_years_updated_at
BEFORE UPDATE ON public.school_years
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_school_months_updated_at
BEFORE UPDATE ON public.school_months
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_fees_updated_at
BEFORE UPDATE ON public.student_fees
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for all tables
ALTER TABLE public.school_years REPLICA IDENTITY FULL;
ALTER TABLE public.school_months REPLICA IDENTITY FULL;
ALTER TABLE public.student_fees REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.school_years;
ALTER PUBLICATION supabase_realtime ADD TABLE public.school_months;
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_fees;