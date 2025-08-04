import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

interface AdminLoginProps {
  onLogin: (userData: { id: string; name: string; type: 'admin' }) => void;
  onBack: () => void;
}

export const AdminLogin = ({ onLogin, onBack }: AdminLoginProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (username === 'admin' && password === 'admin123') {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-400 to-slate-600 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm mx-auto space-y-6">
        {/* Header Section */}
        <div className="text-center">
          <div className="w-20 h-20 bg-white rounded-full mx-auto mb-4 flex items-center justify-center p-3">
            <img 
              src="/lovable-uploads/da3b5ef5-9d2d-4940-8fb9-26e2bfc05b93.png" 
              alt="Wafa Pre School Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-white text-xl font-bold mb-2">WAFA PRE SCHOOL</h1>
          <p className="text-white/80 text-base">ADMIN PORTAL</p>
        </div>

        {/* Login Form */}
        <Card className="bg-white shadow-xl">
          <CardHeader className="pb-4 pt-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="self-start -ml-2 mb-2 text-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="text-center">
              <h2 className="text-xl font-semibold text-slate-700">Admin Login</h2>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4 px-6 pb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-slate-600">Admin Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter admin username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="h-11 bg-slate-50"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-600">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 bg-slate-50"
                />
              </div>

              <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                <p><strong>Demo Credentials:</strong></p>
                <p>Username: admin</p>
                <p>Password: admin123</p>
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 bg-slate-600 hover:bg-slate-700 text-white font-semibold"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Login"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};