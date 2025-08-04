import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface RoleCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
  gradient?: boolean;
}

export const RoleCard = ({ title, description, icon: Icon, onClick, gradient = false }: RoleCardProps) => {
  const isMobile = useIsMobile();

  return (
    <Card className={`group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-0 bg-white/80 backdrop-blur-sm ${
      gradient ? 'bg-gradient-to-br from-blue-50 to-indigo-50' : 'bg-white/80'
    }`}>
      <CardHeader className="text-center space-y-3 sm:space-y-4 pb-4">
        <div className={`mx-auto p-3 sm:p-4 rounded-full shadow-lg transition-transform duration-300 group-hover:scale-110 ${
          gradient 
            ? 'bg-gradient-to-r from-blue-600 to-indigo-600' 
            : 'bg-gradient-to-r from-green-600 to-emerald-600'
        }`}>
          <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
        </div>
        <div className="space-y-2">
          <CardTitle className="text-lg sm:text-xl font-semibold text-gray-900">
            {title}
          </CardTitle>
          <CardDescription className="text-sm sm:text-base text-gray-600 leading-relaxed">
            {description}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Button 
          onClick={onClick} 
          className={`w-full h-11 sm:h-12 font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02] ${
            gradient 
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white' 
              : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
          }`}
        >
          {isMobile ? `Continue as ${title}` : `Continue as ${title}`}
        </Button>
      </CardContent>
    </Card>
  );
};