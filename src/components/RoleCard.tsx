import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface RoleCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
  gradient?: boolean;
}

export const RoleCard = ({ title, description, icon: Icon, onClick, gradient = false }: RoleCardProps) => {
  return (
    <Card className={`group cursor-pointer transition-all duration-300 hover:shadow-hover hover:-translate-y-1 ${
      gradient ? 'bg-gradient-card' : ''
    }`}>
      <CardHeader className="text-center space-y-4">
        <div className={`mx-auto p-4 rounded-full ${
          gradient ? 'bg-gradient-primary' : 'bg-primary'
        } transition-transform duration-300 group-hover:scale-110`}>
          <Icon className="h-8 w-8 text-white" />
        </div>
        <div>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription className="mt-2">{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={onClick} 
          className="w-full" 
          variant={gradient ? "gradient" : "default"}
        >
          Continue as {title}
        </Button>
      </CardContent>
    </Card>
  );
};