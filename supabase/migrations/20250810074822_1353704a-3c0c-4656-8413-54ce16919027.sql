-- Create other_payments table for custom payments like activity fees, uniform fees, etc.
CREATE TABLE public.other_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  payment_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  payment_date TIMESTAMPTZ,
  transaction_id TEXT
);

-- Enable Row Level Security
ALTER TABLE public.other_payments ENABLE ROW LEVEL SECURITY;

-- Create policies for other payments
CREATE POLICY "Admins can manage all other payments" 
ON public.other_payments 
FOR ALL 
USING (true);

CREATE POLICY "Students can view their own other payments" 
ON public.other_payments 
FOR SELECT 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_other_payments_updated_at
BEFORE UPDATE ON public.other_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();