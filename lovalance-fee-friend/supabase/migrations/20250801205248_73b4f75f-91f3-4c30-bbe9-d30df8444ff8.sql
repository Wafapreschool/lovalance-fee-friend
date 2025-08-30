-- Add payment tracking and notification columns to student_fees table
ALTER TABLE public.student_fees 
ADD COLUMN IF NOT EXISTS bml_payment_id TEXT,
ADD COLUMN IF NOT EXISTS notification_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_overdue BOOLEAN DEFAULT FALSE;

-- Create notifications table to track all notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL, -- 'fee_assigned', 'payment_reminder', 'payment_confirmed'
  message TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for notifications table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
CREATE POLICY "Admins can manage all notifications" 
ON public.notifications 
FOR ALL 
USING (true);

-- Create trigger for updated_at on notifications
CREATE TRIGGER update_notifications_updated_at
BEFORE UPDATE ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_student_fees_payment_id ON public.student_fees(bml_payment_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON public.notifications(status);

-- Ensure students table has the correct structure and sample data
-- First, drop existing sample data to avoid conflicts
DELETE FROM public.students WHERE student_id IN ('STU001', 'STU002', 'STU003', 'WAFA001', 'WAFA002', 'WAFA003');

-- Insert fresh sample students with proper structure
INSERT INTO public.students (student_id, full_name, class_name, year_joined, parent_phone, parent_email, password) VALUES
('STU001', 'Ahmed Ali Hassan', 'KG1', 2023, '+960-7777-1111', 'ahmed.ali@example.mv', 'pass123'),
('STU002', 'Mariam Mohamed', 'KG2', 2022, '+960-7777-2222', 'mariam.mohamed@example.mv', 'pass456'),
('STU003', 'Ibrahim Abdullah', 'KG1', 2023, '+960-7777-3333', 'ibrahim.abdullah@example.mv', 'pass789'),
('STU004', 'Fatima Ali', 'KG2', 2022, '+960-7777-4444', 'fatima.ali@example.mv', 'pass101'),
('STU005', 'Omar Hassan', 'KG1', 2023, '+960-7777-5555', 'omar.hassan@example.mv', 'pass202');

-- Insert sample fees for the new students
INSERT INTO public.fees (student_id, month, year, amount, status, due_date, payment_date, transaction_id) VALUES
((SELECT id FROM public.students WHERE student_id = 'STU001'), 'January', 2024, 3500, 'pending', '2024-01-15', NULL, NULL),
((SELECT id FROM public.students WHERE student_id = 'STU002'), 'January', 2024, 3500, 'paid', '2024-01-15', '2024-01-10 10:30:00', 'TXN001'),
((SELECT id FROM public.students WHERE student_id = 'STU003'), 'January', 2024, 3500, 'pending', '2024-01-15', NULL, NULL),
((SELECT id FROM public.students WHERE student_id = 'STU004'), 'January', 2024, 3500, 'paid', '2024-01-15', '2024-01-12 14:20:00', 'TXN004'),
((SELECT id FROM public.students WHERE student_id = 'STU005'), 'January', 2024, 3500, 'overdue', '2024-01-15', NULL, NULL);