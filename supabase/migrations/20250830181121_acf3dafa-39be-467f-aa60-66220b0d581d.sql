-- Create a policy to allow unauthenticated users to verify login credentials
-- This is necessary for the parent login flow which doesn't use Supabase auth
CREATE POLICY "Allow unauthenticated login verification" 
ON public.students 
FOR SELECT 
USING (true);