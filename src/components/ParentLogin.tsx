import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ArrowLeft, Eye, EyeOff, Lock, User, Heart, HelpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";

interface ParentLoginProps {
  onLogin: (userData: {
    id: string;
    name: string;
    type: 'parent';
  }) => void;
  onBack: () => void;
}

export const ParentLogin = ({
  onLogin,
  onBack
}: ParentLoginProps) => {
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isMobile = useIsMobile();
  const currentYear = new Date().getFullYear();
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!studentId || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Debug: Log the credentials being used
      console.log('Attempting login with:', { studentId, password });
      
      // Verify student credentials exactly as shown in admin dashboard
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('student_id', studentId.trim())
        .eq('password', password.trim())
        .maybeSingle();

      console.log('Database response:', { student, studentError });

      if (studentError) {
        console.error('Database error:', studentError);
        toast.error("Database error occurred");
        setIsLoading(false);
        return;
      }

      if (!student) {
        // Try to find the student to give better error message
        const { data: studentCheck } = await supabase
          .from('students')
          .select('student_id, full_name')
          .eq('student_id', studentId.trim())
          .maybeSingle();
        
        if (studentCheck) {
          toast.error("Incorrect password for this Student ID");
        } else {
          toast.error("Student ID not found");
        }
        setIsLoading(false);
        return;
      }

      // Successfully verified - call parent login directly
      onLogin({
        id: student.id,
        name: `Parent of ${student.full_name}`,
        type: 'parent'
      });

      toast.success(`Welcome, Parent of ${student.full_name}!`);
      
    } catch (error) {
      console.error('Login error:', error);
      toast.error("Login failed. Please try again.");
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md mx-auto space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-full mx-auto flex items-center justify-center shadow-2xl">
            <img src="/lovable-uploads/da3b5ef5-9d2d-4940-8fb9-26e2bfc05b93.png" alt="Wafa Pre School Logo" className="w-16 h-16 sm:w-20 sm:h-20 object-contain" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              WAFA PRE SCHOOL
            </h1>
            <p className="text-gray-700 text-base sm:text-lg font-medium">
              FEE MANAGEMENT SYSTEM
            </p>
            <div className="flex items-center justify-center space-x-2 text-gray-600">
              <Heart className="h-4 w-4" />
              <span className="text-sm">Parent Portal Access</span>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <Card className="bg-white/95 backdrop-blur-sm shadow-2xl border-0">
          <CardHeader className="pb-6 pt-8">
            <Button variant="ghost" size="sm" onClick={onBack} className="self-start -ml-2 mb-4 text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {isMobile ? 'Back' : 'Go Back'}
            </Button>
            <div className="text-center space-y-2">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
                Parent Login
              </h2>
              <p className="text-gray-600 text-sm">
                Access your child's fee information
              </p>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6 px-6 pb-8">
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="studentId" className="text-sm font-medium text-gray-700">
                  Student ID
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input id="studentId" type="text" placeholder="Enter student ID" value={studentId} onChange={e => setStudentId(e.target.value)} required className="pl-10 h-12 bg-gray-50 border-gray-200 focus:border-green-500 focus:ring-green-500 transition-all duration-200" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input id="password" type={showPassword ? "text" : "password"} placeholder="Enter password" value={password} onChange={e => setPassword(e.target.value)} required className="pl-10 pr-10 h-12 bg-gray-50 border-gray-200 focus:border-green-500 focus:ring-green-500 transition-all duration-200" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox id="remember" checked={rememberMe} onCheckedChange={checked => setRememberMe(checked as boolean)} />
                  <Label htmlFor="remember" className="text-sm text-gray-600">
                    Remember me
                  </Label>
                </div>
                <Button variant="link" className="text-green-600 hover:text-green-700 p-0 h-auto text-sm font-medium">
                  Forgot Password?
                </Button>
              </div>

              <Button type="submit" className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]" disabled={isLoading}>
                {isLoading ? <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </div> : "Sign In"}
              </Button>
            </form>

            {/* Parent Login Credentials Section */}
            <div className="text-center pt-4 border-t border-gray-200 space-y-2">
              <p className="text-xs text-gray-500">
                <HelpCircle className="inline h-3 w-3 mr-1" />
                Need help? Contact the school office
              </p>
              <p className="text-xs text-gray-400">
                Academic Year {currentYear}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};