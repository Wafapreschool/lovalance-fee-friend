import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, LogIn, Eye, EyeOff, Lock, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";

interface LoginFormProps {
  userType: 'admin' | 'parent';
  onLogin: (userData: { id: string; name: string; type: 'admin' | 'parent' }) => void;
  onBack: () => void;
}

export const LoginForm = ({ userType, onLogin, onBack }: LoginFormProps) => {
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { signIn } = useAuth();
  const isMobile = useIsMobile();

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
        console.log('Attempting parent login with:', { studentId, password });
        
        // First, let's check if the student exists
        const { data: studentCheck, error: studentError } = await supabase
          .from('students')
          .select('*')
          .eq('student_id', studentId);

        if (studentError) {
          console.error('Student check error:', studentError);
          toast({
            title: "Database Error",
            description: "Error checking student record. Please try again.",
            variant: "destructive"
          });
          return;
        }

        console.log('Student check result:', studentCheck);

        if (!studentCheck || studentCheck.length === 0) {
          toast({
            title: "Login Failed",
            description: "Student ID not found. Please check your credentials.",
            variant: "destructive"
          });
          return;
        }

        const student = studentCheck[0];
        console.log('Found student:', student);

        // Now check the password
        if (student.password !== password) {
          toast({
            title: "Login Failed",
            description: "Invalid password. Please check your credentials.",
            variant: "destructive"
          });
          return;
        }

        // Login successful
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md mx-auto">
        {/* Logo and Brand Section */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
            <img 
              src="/lovable-uploads/da3b5ef5-9d2d-4940-8fb9-26e2bfc05b93.png" 
              alt="Wafa Pre School Logo" 
              className="w-12 h-12 sm:w-16 sm:h-16 object-contain" 
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            WAFA PRE SCHOOL
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            {userType === 'admin' ? 'ADMIN PORTAL' : 'FEE MANAGEMENT SYSTEM'}
          </p>
        </div>

        {/* Login Card */}
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-4 pb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="self-start -ml-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {isMobile ? 'Back' : 'Go Back'}
            </Button>
            <div className="text-center space-y-2">
              <CardTitle className="text-xl sm:text-2xl font-semibold text-gray-900">
                {userType === 'admin' ? 'Admin Login' : 'Parent Login'}
              </CardTitle>
              <CardDescription className="text-gray-600 text-sm sm:text-base">
                {userType === 'admin' 
                  ? 'Access the administrative dashboard'
                  : 'View your children\'s fee status and make payments'
                }
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6 px-6 pb-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="studentId" className="text-sm font-medium text-gray-700">
                  {userType === 'admin' ? 'Admin Username' : 'Student ID'}
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="studentId"
                    type="text"
                    placeholder={userType === 'admin' ? 'Enter admin username' : 'Enter student ID'}
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    required
                    className="pl-10 h-12 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 pr-10 h-12 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {userType === 'admin' && (
                <div className="text-xs text-gray-600 bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="font-medium mb-1">Demo Credentials:</p>
                  <p>Username: <span className="font-mono">admin</span></p>
                  <p>Password: <span className="font-mono">admin123</span></p>
                </div>
              )}

              {userType === 'parent' && (
                <div className="text-xs text-gray-600 bg-green-50 p-4 rounded-lg border border-green-200">
                  <p className="font-medium mb-1">Demo Credentials:</p>
                  <p>Student ID: <span className="font-mono">STU001</span></p>
                  <p>Password: <span className="font-mono">pass123</span></p>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  <>
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In
                  </>
                )}
              </Button>
            </form>

            {/* Additional Help Text */}
            <div className="text-center">
              <p className="text-xs text-gray-500">
                Need help? Contact the school administration
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};