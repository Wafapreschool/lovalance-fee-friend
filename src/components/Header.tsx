import { Button } from "@/components/ui/button";
import { GraduationCap, LogOut, User, Menu, X } from "lucide-react";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface HeaderProps {
  userType?: 'admin' | 'parent' | null;
  userName?: string;
  onLogout?: () => void;
}

export const Header = ({
  userType,
  userName,
  onLogout
}: HeaderProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              WAFA Preschool
            </h1>
            <p className="text-xs text-gray-600 hidden sm:block">Fee Management System</p>
          </div>
        </div>

        {userType && (
          <>
            {/* Desktop Menu */}
            <div className="hidden sm:flex items-center gap-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">{userName}</span>
                <span className={`text-xs px-2 py-1 rounded-full capitalize font-medium ${
                  userType === 'admin' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-green-100 text-green-700'
                }`}>
                  {userType}
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onLogout} 
                className="gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <div className="sm:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2"
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Mobile Menu */}
      {userType && isMobileMenuOpen && (
        <div className="sm:hidden border-t bg-white/95 backdrop-blur">
          <div className="container px-4 py-4 space-y-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-900">{userName}</span>
              <span className={`text-xs px-2 py-1 rounded-full capitalize font-medium ${
                userType === 'admin' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-green-100 text-green-700'
              }`}>
                {userType}
              </span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onLogout} 
              className="w-full gap-2 text-gray-600 hover:text-gray-900"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};