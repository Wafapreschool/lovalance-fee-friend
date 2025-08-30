-- Create a policy to allow unauthenticated users to view student fees
-- This is necessary for the parent portal which doesn't use Supabase auth
CREATE POLICY "Allow unauthenticated fee viewing" 
ON public.student_fees 
FOR SELECT 
USING (true);

-- Also allow viewing other payments for unauthenticated users
CREATE POLICY "Allow unauthenticated other payment viewing" 
ON public.other_payments 
FOR SELECT 
USING (true);