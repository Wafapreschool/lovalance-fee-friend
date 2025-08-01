-- Create students table
CREATE TABLE public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    class_name TEXT NOT NULL,
    year_joined INTEGER NOT NULL,
    parent_phone TEXT NOT NULL,
    parent_email TEXT,
    password TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create fees table
CREATE TABLE public.fees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    month TEXT NOT NULL,
    year INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status TEXT CHECK (status IN ('pending', 'paid', 'overdue')) DEFAULT 'pending',
    due_date DATE NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE,
    transaction_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(student_id, month, year)
);

-- Enable Row Level Security
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fees ENABLE ROW LEVEL SECURITY;

-- Create policies for students table
CREATE POLICY "Admins can manage all students" ON public.students
FOR ALL USING (true);

CREATE POLICY "Students can view their own data" ON public.students
FOR SELECT USING (true);

-- Create policies for fees table
CREATE POLICY "Admins can manage all fees" ON public.fees
FOR ALL USING (true);

CREATE POLICY "Students can view their own fees" ON public.fees
FOR SELECT USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_students_updated_at
    BEFORE UPDATE ON public.students
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fees_updated_at
    BEFORE UPDATE ON public.fees
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data
INSERT INTO public.students (student_id, full_name, class_name, year_joined, parent_phone, parent_email, password) VALUES
('STU001', 'Ahmed Ali Hassan', 'KG1', 2023, '+960-7777-1111', 'ahmed.ali@example.mv', 'pass123'),
('STU002', 'Mariam Mohamed', 'KG2', 2022, '+960-7777-2222', 'mariam.mohamed@example.mv', 'pass456'),
('STU003', 'Ibrahim Abdullah', 'KG1', 2023, '+960-7777-3333', 'ibrahim.abdullah@example.mv', 'pass789');

-- Insert sample fees
INSERT INTO public.fees (student_id, month, year, amount, status, due_date, payment_date, transaction_id) VALUES
((SELECT id FROM public.students WHERE student_id = 'STU001'), 'January', 2024, 3500, 'pending', '2024-01-15', NULL, NULL),
((SELECT id FROM public.students WHERE student_id = 'STU002'), 'January', 2024, 3500, 'paid', '2024-01-15', '2024-01-10 10:30:00', 'TXN001'),
((SELECT id FROM public.students WHERE student_id = 'STU003'), 'January', 2024, 3500, 'pending', '2024-01-15', NULL, NULL),
((SELECT id FROM public.students WHERE student_id = 'STU001'), 'December', 2023, 3500, 'paid', '2023-12-15', '2023-12-12 15:45:00', 'TXN002'),
((SELECT id FROM public.students WHERE student_id = 'STU002'), 'December', 2023, 3500, 'paid', '2023-12-15', '2023-12-14 09:20:00', 'TXN003'),
((SELECT id FROM public.students WHERE student_id = 'STU003'), 'December', 2023, 3500, 'overdue', '2023-12-15', NULL, NULL);