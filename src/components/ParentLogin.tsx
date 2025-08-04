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
  return <div className="min-h-screen bg-gradient-to-br from-slate-400 to-slate-600 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm mx-auto space-y-6">
        {/* Header Section */}
        <div className="text-center">
          <div className="w-20 h-20 bg-white rounded-full mx-auto mb-4 flex items-center justify-center p-3">
            <img src="/lovable-uploads/da3b5ef5-9d2d-4940-8fb9-26e2bfc05b93.png" alt="Wafa Pre School Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-white text-xl font-bold mb-2">WAFA PRE SCHOOL</h1>
          <p className="text-white/80 text-base">FEE MANAGEMENT SYSTEM</p>
          
        </div>

        {/* Login Form */}
        <Card className="bg-white shadow-xl">
          <CardHeader className="pb-4 pt-6">
            <Button variant="ghost" size="sm" onClick={onBack} className="self-start -ml-2 mb-2 text-sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="text-center">
              <h2 className="text-xl font-semibold text-slate-700">Parent Login</h2>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4 px-6 pb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="studentId" className="text-slate-600">Student ID</Label>
                <Input id="studentId" type="text" placeholder="Student ID" value={studentId} onChange={e => setStudentId(e.target.value)} required className="h-11 bg-slate-50" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-600">Password</Label>
                <Input id="password" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="h-11 bg-slate-50" />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox id="remember" checked={rememberMe} onCheckedChange={checked => setRememberMe(checked as boolean)} />
                  <Label htmlFor="remember" className="text-slate-600 text-sm">Remember me</Label>
                </div>
                <Button variant="link" className="text-slate-600 p-0 h-auto text-sm">
                  Forget Password
                </Button>
              </div>

              <Button type="submit" className="w-full h-11 bg-slate-600 hover:bg-slate-700 text-white font-semibold" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Login"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>;
};