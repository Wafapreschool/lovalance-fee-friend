import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Calendar, CreditCard, CheckCircle } from "lucide-react";

export interface Student {
  id: string;
  name: string;
  class: string;
  yearJoined: number;
  currentFee: {
    month: string;
    year: number;
    amount: number;
    status: 'pending' | 'paid' | 'overdue';
    dueDate: string;
  };
}

interface StudentCardProps {
  student: Student;
  onPayFee?: (studentId: string) => void;
  onViewDetails?: (studentId: string) => void;
  isParentView?: boolean;
}

export const StudentCard = ({ student, onPayFee, onViewDetails, isParentView = false }: StudentCardProps) => {
  const { currentFee } = student;
  const isPaid = currentFee.status === 'paid';
  const isOverdue = currentFee.status === 'overdue';

  return (
    <Card className="group transition-all duration-300 hover:shadow-card hover:-translate-y-1">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{student.name}</CardTitle>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Class {student.class} • Joined {student.yearJoined}
              </p>
            </div>
          </div>
          <Badge 
            variant={isPaid ? "default" : isOverdue ? "destructive" : "secondary"}
            className={isPaid ? "bg-success hover:bg-success/80" : isOverdue ? "" : "bg-warning text-warning-foreground"}
          >
            {isPaid ? (
              <CheckCircle className="h-3 w-3 mr-1" />
            ) : (
              <CreditCard className="h-3 w-3 mr-1" />
            )}
            {currentFee.status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Current Fee:</span>
            <span className="font-medium">{currentFee.month} {currentFee.year}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Amount:</span>
            <span className="font-semibold text-lg">MVR {currentFee.amount}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Due Date:</span>
            <span className={`font-medium ${!isPaid ? (isOverdue ? 'text-destructive' : 'text-warning') : ''}`}>
              {currentFee.dueDate}
            </span>
          </div>
        </div>

        {isParentView && (
          <div className="flex gap-2 pt-2">
            {!isPaid && (
              <Button 
                onClick={() => onPayFee?.(student.id)}
                variant={isOverdue ? "destructive" : "gradient"}
                className="flex-1"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Pay Now
              </Button>
            )}
            <Button 
              onClick={() => onViewDetails?.(student.id)}
              variant="outline"
              size={!isPaid ? "default" : "default"}
              className={!isPaid ? "flex-1" : "w-full"}
            >
              View History
            </Button>
          </div>
        )}

        {!isParentView && (
          <Button 
            onClick={() => onViewDetails?.(student.id)}
            variant="outline"
            className="w-full"
          >
            Manage Student
          </Button>
        )}
      </CardContent>
    </Card>
  );
};