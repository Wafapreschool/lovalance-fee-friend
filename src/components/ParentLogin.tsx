import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, Eye, EyeOff, Lock, User, Heart, HelpCircle, Mail } from "lucide-react";
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
  const [email, setEmail] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
      // First verify the student credentials in the students table
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('student_id', studentId)
        .eq('password', password)
        .single();

      if (studentError || !student) {
        toast.error("Invalid student ID or password");
        setIsLoading(false);
        return;
      }

      // Create or get auth user for this student
      const authEmail = `${studentId}@parent.local`;
      
      // Try to sign in first
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: password
      });

      if (signInError && signInError.message.includes('Invalid login credentials')) {
        // User doesn't exist, create them
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: authEmail,
          password: password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: `Parent of ${student.full_name}`,
              student_id: student.id
            }
          }
        });

        if (signUpError) {
          console.error('Sign up error:', signUpError);
          toast.error("Failed to create account");
          setIsLoading(false);
          return;
        }

        // Create user role linking to student
        if (signUpData.user) {
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert({
              user_id: signUpData.user.id,
              role: 'student',
              student_id: student.id
            });

          if (roleError) {
            console.error('Role creation error:', roleError);
          }
        }

        toast.success("Account created! Please sign in again.");
        setIsLoading(false);
        return;
      }

      if (signInError) {
        console.error('Sign in error:', signInError);
        toast.error("Sign in failed");
        setIsLoading(false);
        return;
      }

      // Success! The auth state change will be handled by the useAuth hook
      toast.success(`Welcome, Parent of ${student.full_name}!`);
      
    } catch (error) {
      console.error('Login error:', error);
      toast.error("Login failed. Please try again.");
    }
    
    setIsLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !confirmPassword || !studentId) {
      toast.error("Please fill in all fields");
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Verify student exists and get their info
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('student_id', studentId)
        .single();

      if (studentError || !student) {
        toast.error("Student ID not found. Please check with school administration.");
        setIsLoading(false);
        return;
      }

      // Create auth user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: `Parent of ${student.full_name}`
          }
        }
      });

      if (signUpError) {
        console.error('Sign up error:', signUpError);
        toast.error(signUpError.message || "Failed to create account");
        setIsLoading(false);
        return;
      }

      // Create user role linking to student
      if (signUpData.user) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: signUpData.user.id,
            role: 'student',
            student_id: student.id
          });

        if (roleError) {
          console.error('Role creation error:', roleError);
        }
      }

      toast.success("Account created successfully! You can now sign in.");
      
    } catch (error) {
      console.error('Signup error:', error);
      toast.error("Signup failed. Please try again.");
    }
    
    setIsLoading(false);
  };
  return <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
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
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Create Account</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="space-y-4">
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
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleSignup} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="signupEmail" className="text-sm font-medium text-gray-700">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="signupEmail"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="pl-10 h-12 bg-gray-50 border-gray-200 focus:border-green-500 focus:ring-green-500 transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signupStudentId" className="text-sm font-medium text-gray-700">
                      Student ID
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="signupStudentId"
                        type="text"
                        placeholder="Your child's student ID"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        required
                        className="pl-10 h-12 bg-gray-50 border-gray-200 focus:border-green-500 focus:ring-green-500 transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signupPassword" className="text-sm font-medium text-gray-700">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="signupPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="pl-10 pr-10 h-12 bg-gray-50 border-gray-200 focus:border-green-500 focus:ring-green-500 transition-all duration-200"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="pl-10 h-12 bg-gray-50 border-gray-200 focus:border-green-500 focus:ring-green-500 transition-all duration-200"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating Account...
                      </div>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            {/* Demo Credentials Section */}
            <div className="text-center pt-4 border-t border-gray-200 space-y-2">
              <div className="bg-blue-50/50 rounded-lg p-3 border border-blue-200/50">
                <p className="font-medium text-blue-800 mb-1 text-sm">For Testing:</p>
                <p className="text-xs">Student ID: <span className="font-mono font-semibold">454554</span></p>
                <p className="text-xs">Password: <span className="font-mono font-semibold">xg90phxa</span></p>
                <p className="text-xs text-blue-600 mt-1">Use this to test the parent dashboard</p>
              </div>
              
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
    </div>;
};