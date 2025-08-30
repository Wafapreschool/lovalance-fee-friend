import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { RoleCard } from "@/components/RoleCard";
import { AdminLogin } from "@/components/AdminLogin";
import { ParentLogin } from "@/components/ParentLogin";
import { AdminDashboard } from "@/components/AdminDashboard";
import { ParentDashboard } from "@/components/ParentDashboard";
import { DatabaseTest } from "@/components/DatabaseTest";
import { Shield, Heart, Users, CreditCard, BarChart3, Bell } from "lucide-react";
import heroImage from "@/assets/preschool-hero.jpg";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

type UserData = {
  id: string;
  name: string;
  type: 'admin' | 'parent';
};

type AppState = 'welcome' | 'admin-login' | 'parent-login' | 'dashboard' | 'database-test';

const Index = () => {
  const [appState, setAppState] = useState<AppState>('welcome');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'parent' | null>(null);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const { user, session, loading } = useAuth();
  const isMobile = useIsMobile();

  // Check user role when authenticated
  useEffect(() => {
    if (user && session) {
      const checkUserRole = async () => {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (data && !error) {
          setUserRole(data.role);
          setCurrentUser({
            id: user.id,
            name: data.role === 'admin' ? 'Administrator' : 'Parent',
            type: data.role as 'admin' | 'parent'
          });
          setAppState('dashboard');
        }
      };
      
      checkUserRole();
    } else if (!loading) {
      // User is not authenticated, reset state
      setCurrentUser(null);
      setUserRole(null);
      if (appState === 'dashboard') {
        setAppState('welcome');
      }
    }
  }, [user, session, loading]);

  const handleRoleSelect = (role: 'admin' | 'parent') => {
    setSelectedRole(role);
    setAppState(role === 'admin' ? 'admin-login' : 'parent-login');
  };

  const handleLogin = (userData: UserData) => {
    // Login is now handled by the useEffect that watches for auth changes
    // This function is kept for compatibility with the login components
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setSelectedRole(null);
    setUserRole(null);
    setAppState('welcome');
  };

  const handleBack = async () => {
    // Sign out from Supabase if user is authenticated
    if (user) {
      await supabase.auth.signOut();
    }
    setSelectedRole(null);
    setAppState('welcome');
  };

  if (appState === 'admin-login') {
    return <AdminLogin onLogin={handleLogin} onBack={handleBack} />;
  }

  if (appState === 'parent-login') {
    return <ParentLogin onLogin={handleLogin} onBack={handleBack} />;
  }

  if (appState === 'database-test') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <Header />
        <div className="container mx-auto py-8">
          <DatabaseTest />
          <div className="mt-4 text-center">
            <button 
              onClick={() => setAppState('welcome')}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (appState === 'dashboard' && currentUser) {
    return (
      <div className="min-h-screen bg-background">
        <Header userType={currentUser.type} userName={currentUser.name} onLogout={handleLogout} />
        {currentUser.type === 'admin' ? <AdminDashboard /> : <ParentDashboard currentUser={currentUser} />}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Header />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 relative">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="space-y-6 sm:space-y-8">
              <div className="space-y-4 sm:space-y-6">
                <div className="space-y-2">
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight">
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      WAFA PRESCHOOL
                    </span>
                    <br />
                    <span className="text-gray-900 text-2xl sm:text-3xl lg:text-4xl">
                      Fee Management
                    </span>
                  </h1>
                </div>
                <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-lg leading-relaxed">
                  Streamlined fee collection for our preschool community. 
                  Parents can easily pay monthly fees while administrators 
                  manage student records efficiently.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 max-w-md sm:max-w-lg">
                <RoleCard 
                  title="Admin" 
                  description={isMobile ? "Manage students & payments" : "Manage students, track payments, and generate reports"} 
                  icon={Shield} 
                  onClick={() => handleRoleSelect('admin')} 
                  gradient={true} 
                />
                <RoleCard 
                  title="Parent" 
                  description={isMobile ? "View fees & make payments" : "View fee status and make secure payments online"} 
                  icon={Heart} 
                  onClick={() => handleRoleSelect('parent')} 
                />
              </div>

              {/* Debug Button */}
              <div className="pt-4">
                <button 
                  onClick={() => setAppState('database-test')}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Debug: Test Database Connection
                </button>
              </div>

              <div className="space-y-2 text-sm sm:text-base text-gray-600">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <p>Secure online payments via BML Gateway</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <p>Real-time payment status updates</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <p>Complete payment history tracking</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                <img 
                  src={heroImage} 
                  alt="Preschool Students" 
                  className="w-full h-64 sm:h-80 lg:h-96 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
              <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-20 blur-xl" />
              <div className="absolute -top-6 -left-6 w-32 h-32 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full opacity-20 blur-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="text-center space-y-4 mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
            Why Choose Our System?
          </h2>
          <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto">
            Experience seamless fee management with our comprehensive platform designed for modern education
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
              Student Management
            </h3>
            <p className="text-gray-600 text-sm sm:text-base">
              Comprehensive student records with easy access to academic and financial information
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <CreditCard className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
              Secure Payments
            </h3>
            <p className="text-gray-600 text-sm sm:text-base">
              Multiple payment options with real-time processing and instant confirmations
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50 sm:col-span-2 lg:col-span-1">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
              Analytics & Reports
            </h3>
            <p className="text-gray-600 text-sm sm:text-base">
              Detailed reports and analytics to track payments, outstanding fees, and financial trends
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-white py-8 sm:py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <Bell className="h-5 w-5 text-blue-400" />
              <span className="text-sm sm:text-base">Stay updated with real-time notifications</span>
            </div>
            <p className="text-gray-400 text-sm">
              © 2024 Wafa Preschool. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;