
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PasswordChangeDialog } from "./PasswordChangeDialog";
import { 
  Users, 
  CreditCard, 
  TrendingUp, 
  LogOut, 
  Key, 
  Menu,
  X,
  Home,
  FileText,
  Settings,
  Calendar
} from "lucide-react";

interface DashboardSidebarProps {
  userType: 'admin' | 'parent';
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  userName: string;
}

export const DashboardSidebar = ({ 
  userType, 
  activeTab, 
  onTabChange, 
  onLogout, 
  userName 
}: DashboardSidebarProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const adminMenuItems = [
    { id: 'students', label: 'Students', icon: Users },
    { id: 'fees', label: 'Fees', icon: CreditCard },
    { id: 'reports', label: 'Reports', icon: TrendingUp },
  ];

  const parentMenuItems = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'fees', label: 'Fee Management', icon: Calendar },
  ];

  const menuItems = userType === 'admin' ? adminMenuItems : parentMenuItems;

  const SidebarContent = () => (
    <>
      {/* User Profile Section */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
            <span className="text-white font-medium text-sm">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{userName}</h3>
            <p className="text-sm text-gray-500 capitalize">{userType}</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => {
                onTabChange(item.id);
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                isActive
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        {userType === 'parent' && (
          <PasswordChangeDialog>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
            >
              <Key className="h-4 w-4 mr-2" />
              Change Password
            </Button>
          </PasswordChangeDialog>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={onLogout}
          className="w-full justify-start"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-white shadow-md"
        >
          {isMobileMenuOpen ? (
            <X className="h-4 w-4" />
          ) : (
            <Menu className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 h-screen">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative w-64 h-full bg-white border-r border-gray-200 flex flex-col">
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  );
};
