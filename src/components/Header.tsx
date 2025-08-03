import { Button } from "@/components/ui/button";
import { GraduationCap, LogOut, User } from "lucide-react";
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
  return <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-primary">
            
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">WAFA Preschool</h1>
            <p className="text-xs text-muted-foreground">Fee Management System</p>
          </div>
        </div>

        {userType && <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="text-sm font-medium">{userName}</span>
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full capitalize">
                {userType}
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={onLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>}
      </div>
    </header>;
};