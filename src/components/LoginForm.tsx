import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, LogIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface LoginFormProps {
  userType: 'admin' | 'parent';
  onLogin: (userData: { id: string; name: string; type: 'admin' | 'parent' }) => void;
  onBack: () => void;
}

export const LoginForm = ({ userType, onLogin, onBack }: LoginFormProps) => {
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (userType === 'admin') {
        // Admin login with hardcoded credentials
        if (studentId === 'admin' && password === 'admin123') {
          onLogin({ id: 'admin', name: 'Administrator', type: 'admin' });
          toast({
            title: "Login Successful",
            description: "Welcome to the admin dashboard",
          });
        } else {
          toast({
            title: "Login Failed",
            description: "Invalid admin credentials",
            variant: "destructive",
          });
        }
      } else {
        // Parent login using student database
        const { data: student, error } = await supabase
          .from('students')
          .select('*')
          .eq('student_id', studentId)
          .eq('password', password)
          .single();

        if (error || !student) {
          toast({
            title: "Login Failed",
            description: "Invalid student ID or password. Please check your credentials.",
            variant: "destructive",
          });
        } else {
          // Create a session for the parent using student info
          onLogin({ 
            id: student.id, 
            name: `Parent of ${student.full_name}`, 
            type: 'parent' 
          });
          toast({
            title: "Login Successful",
            description: `Welcome! You can manage fees for ${student.full_name}`,
          });
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login Error",
        description: "An error occurred during login. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/50 p-4">
      <Card className="w-full max-w-md shadow-hover">
        <CardHeader className="space-y-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="self-start -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="text-center">
            <CardTitle className="text-2xl">
              {userType === 'admin' ? 'Admin Login' : 'Parent Login'}
            </CardTitle>
            <CardDescription>
              {userType === 'admin' 
                ? 'Access the administrative dashboard'
                : 'View your children\'s fee status and make payments'
              }
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="studentId">
                {userType === 'admin' ? 'Admin Username' : 'Student ID'}
              </Label>
              <Input
                id="studentId"
                type="text"
                placeholder={userType === 'admin' ? 'admin' : 'Enter student ID'}
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder={userType === 'admin' ? 'admin123' : 'Enter password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {userType === 'admin' && (
              <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                <p><strong>Demo Credentials:</strong></p>
                <p>Username: admin</p>
                <p>Password: admin123</p>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              variant="gradient"
              disabled={isLoading}
            >
              {isLoading ? (
                "Signing in..."
              ) : (
                <>
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};