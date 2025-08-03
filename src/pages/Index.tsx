import { useState } from "react";
import { Header } from "@/components/Header";
import { RoleCard } from "@/components/RoleCard";
import { LoginForm } from "@/components/LoginForm";
import { AdminDashboard } from "@/components/AdminDashboard";
import { ParentDashboard } from "@/components/ParentDashboard";
import { Shield, Heart } from "lucide-react";
import heroImage from "@/assets/preschool-hero.jpg";
type UserData = {
  id: string;
  name: string;
  type: 'admin' | 'parent';
};
type AppState = 'welcome' | 'login' | 'dashboard';
const Index = () => {
  const [appState, setAppState] = useState<AppState>('welcome');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'parent' | null>(null);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const handleRoleSelect = (role: 'admin' | 'parent') => {
    setSelectedRole(role);
    setAppState('login');
  };
  const handleLogin = (userData: UserData) => {
    setCurrentUser(userData);
    setAppState('dashboard');
  };
  const handleLogout = () => {
    setCurrentUser(null);
    setSelectedRole(null);
    setAppState('welcome');
  };
  const handleBack = () => {
    setSelectedRole(null);
    setAppState('welcome');
  };
  if (appState === 'login' && selectedRole) {
    return <LoginForm userType={selectedRole} onLogin={handleLogin} onBack={handleBack} />;
  }
  if (appState === 'dashboard' && currentUser) {
    return <div className="min-h-screen bg-background">
        <Header userType={currentUser.type} userName={currentUser.name} onLogout={handleLogout} />
        {currentUser.type === 'admin' ? <AdminDashboard /> : <ParentDashboard currentUser={currentUser} />}
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <Header />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-10" />
        <div className="container mx-auto px-4 py-16 relative rounded">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                  <span className="bg-gradient-hero bg-clip-text text-transparent text-xl font-extrabold text-justify">WAFA PRESCHOOL</span>
                  <br />
                  <span className="text-foreground text-2xl">Fee Management</span>
                </h1>
                <p className="text-lg text-muted-foreground max-w-lg">
                  Streamlined fee collection for our preschool community. 
                  Parents can easily pay monthly fees while administrators 
                  manage student records efficiently.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 max-w-md">
                <RoleCard title="Admin" description="Manage students, track payments, and generate reports" icon={Shield} onClick={() => handleRoleSelect('admin')} gradient={true} />
                <RoleCard title="Parent" description="View fee status and make secure payments online" icon={Heart} onClick={() => handleRoleSelect('parent')} />
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                <p>✓ Secure online payments via BML Gateway</p>
                <p>✓ Real-time payment status updates</p>
                <p>✓ Complete payment history tracking</p>
              </div>
            </div>

            <div className="relative">
              <div className="relative overflow-hidden rounded-2xl shadow-hover">
                
                
              </div>
              <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-gradient-primary rounded-full opacity-20 blur-xl" />
              <div className="absolute -top-6 -left-6 w-32 h-32 bg-gradient-secondary rounded-full opacity-20 blur-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-4 mb-12">
          
          
        </div>

        
      </div>
    </div>;
};
export default Index;