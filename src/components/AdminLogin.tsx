import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Eye, EyeOff, Lock, User, Shield } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface AdminLoginProps {
  onLogin: (userData: {
    id: string;
    name: string;
    type: 'admin';
  }) => void;
  onBack: () => void;
}

export const AdminLogin = ({
  onLogin,
  onBack
}: AdminLoginProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (username === 'admin' && password === 'admin123') {
        onLogin({
          id: 'admin',
          name: 'Administrator',
          type: 'admin'
        });
        toast({
          title: "Login Successful",
          description: "Welcome to the admin dashboard"
        });
      } else {
        toast({
          title: "Login Failed",
          description: "Invalid admin credentials",
          variant: "destructive"
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-600 via-blue-600 to-indigo-700 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md mx-auto space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-full mx-auto flex items-center justify-center shadow-2xl">
            <img 
              src="/lovable-uploads/da3b5ef5-9d2d-4940-8fb9-26e2bfc05b93.png" 
              alt="Wafa Pre School Logo" 
              className="w-16 h-16 sm:w-20 sm:h-20 object-contain" 
            />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              WAFA PRE SCHOOL
            </h1>
            <p className="text-white/90 text-base sm:text-lg font-medium">
              ADMIN PORTAL
            </p>
            <div className="flex items-center justify-center space-x-2 text-white/80">
              <Shield className="h-4 w-4" />
              <span className="text-sm">Secure Administrative Access</span>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <Card className="bg-white/95 backdrop-blur-sm shadow-2xl border-0">
          <CardHeader className="pb-6 pt-8">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack} 
              className="self-start -ml-2 mb-4 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {isMobile ? 'Back' : 'Go Back'}
            </Button>
            <div className="text-center space-y-2">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
                Admin Login
              </h2>
              <p className="text-gray-600 text-sm">
                Access the administrative dashboard
              </p>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6 px-6 pb-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                  Admin Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    id="username" 
                    type="text" 
                    placeholder="Enter admin username" 
                    value={username} 
                    onChange={e => setUsername(e.target.value)} 
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
                    onChange={e => setPassword(e.target.value)} 
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

              {/* Demo Credentials */}
              <div className="text-xs text-gray-600 bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="font-medium mb-2 text-blue-800">Demo Credentials:</p>
                <div className="space-y-1">
                  <p>Username: <span className="font-mono bg-blue-100 px-2 py-1 rounded">admin</span></p>
                  <p>Password: <span className="font-mono bg-blue-100 px-2 py-1 rounded">admin123</span></p>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-slate-600 to-blue-600 hover:from-slate-700 hover:to-blue-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  "Login"
                )}
              </Button>
            </form>

            {/* Security Notice */}
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                <Shield className="inline h-3 w-3 mr-1" />
                Secure administrative access only
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};