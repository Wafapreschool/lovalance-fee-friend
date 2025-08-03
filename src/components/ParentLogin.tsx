import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const {
    toast
  } = useToast();
  const currentYear = new Date().getFullYear();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const {
        data: students,
        error
      } = await supabase.from('students').select('*').eq('student_id', studentId).eq('password', password);
      if (error) {
        console.error('Database error:', error);
        toast({
          title: "Login Error",
          description: "Database connection failed. Please try again.",
          variant: "destructive"
        });
      } else if (!students || students.length === 0) {
        toast({
          title: "Login Failed",
          description: "Invalid student ID or password. Please check your credentials.",
          variant: "destructive"
        });
      } else {
        const student = students[0];
        onLogin({
          id: student.id,
          name: `Parent of ${student.full_name}`,
          type: 'parent'
        });
        toast({
          title: "Login Successful",
          description: `Welcome! You can manage fees for ${student.full_name}`
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login Error",
        description: "An error occurred during login. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-400 to-slate-600 p-3 sm:p-4 lg:p-6">
      <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
        {/* Header */}
        <div className="text-center mb-4 sm:mb-6 md:mb-8">
          <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 bg-white rounded-full mx-auto mb-2 sm:mb-3 md:mb-4 flex items-center justify-center p-2">
            <img src="/lovable-uploads/da3b5ef5-9d2d-4940-8fb9-26e2bfc05b93.png" alt="Wafa Pre School Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-white text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-1 md:mb-2">WAFA PRE SCHOOL</h1>
          <p className="text-white/80 text-sm sm:text-base md:text-lg">FEE MANAGEMENT SYSTEM</p>
          <p className="text-white/60 text-xs sm:text-sm mt-1">Academic Year {currentYear}</p>
        </div>

        {/* Login Card */}
        <Card className="bg-white/95 backdrop-blur shadow-xl border-0">
          <CardHeader className="pb-2 px-3 sm:px-4 md:px-6 pt-4 sm:pt-6">
            <Button variant="ghost" size="sm" onClick={onBack} className="self-start -ml-2 mb-2 sm:mb-3 md:mb-4 h-8 sm:h-9 text-xs sm:text-sm">
              <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Back
            </Button>
            <div className="text-center">
              <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-slate-700 mb-2">Parent Login</h2>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-3 sm:space-y-4 md:space-y-6 px-3 sm:px-4 md:px-6 pb-4 sm:pb-6">
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="studentId" className="text-slate-600 text-xs sm:text-sm">Student ID</Label>
                <Input id="studentId" type="text" placeholder="Student ID" value={studentId} onChange={e => setStudentId(e.target.value)} required className="h-9 sm:h-10 md:h-12 bg-slate-50 text-xs sm:text-sm md:text-base" />
              </div>
              
              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="password" className="text-slate-600 text-xs sm:text-sm">Password</Label>
                <Input id="password" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="h-9 sm:h-10 md:h-12 bg-slate-50 text-xs sm:text-sm md:text-base" />
              </div>

              <div className="flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center space-x-2">
                  <Checkbox id="remember" checked={rememberMe} onCheckedChange={checked => setRememberMe(checked as boolean)} />
                  <Label htmlFor="remember" className="text-slate-600">Remember me</Label>
                </div>
                <Button variant="link" className="text-slate-600 p-0 h-auto text-xs sm:text-sm">
                  Forget Password
                </Button>
              </div>

              <Button type="submit" className="w-full h-9 sm:h-10 md:h-12 bg-slate-600 hover:bg-slate-700 text-white font-semibold text-xs sm:text-sm md:text-base mt-4 sm:mt-6" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Login"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>;
};