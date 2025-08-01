import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StudentCard, Student } from "./StudentCard";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Clock, CheckCircle, AlertCircle } from "lucide-react";

// Mock data for a parent's children
const mockStudentData: Student[] = [
  {
    id: "1",
    name: "Ahmed Ali",
    class: "KG1", 
    yearJoined: 2023,
    currentFee: {
      month: "January",
      year: 2024,
      amount: 3500,
      status: "pending",
      dueDate: "2024-01-15"
    }
  },
  {
    id: "2",
    name: "Aisha Ali",
    class: "KG2",
    yearJoined: 2022,
    currentFee: {
      month: "January", 
      year: 2024,
      amount: 3500,
      status: "paid",
      dueDate: "2024-01-15"
    }
  }
];

// Mock payment history
const mockPaymentHistory = [
  { month: "December", year: 2023, amount: 3500, status: "paid", paidDate: "2023-12-10", transactionId: "TXN001" },
  { month: "November", year: 2023, amount: 3500, status: "paid", paidDate: "2023-11-08", transactionId: "TXN002" },
  { month: "October", year: 2023, amount: 3500, status: "paid", paidDate: "2023-10-12", transactionId: "TXN003" },
];

export const ParentDashboard = () => {
  const [students] = useState<Student[]>(mockStudentData);
  const { toast } = useToast();

  const totalDue = students
    .filter(s => s.currentFee.status === 'pending')
    .reduce((sum, s) => sum + s.currentFee.amount, 0);

  const handlePayFee = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (student) {
      toast({
        title: "Payment Processing",
        description: `Redirecting to payment gateway for ${student.name}'s fee...`,
      });
      // Here you would integrate with BML payment gateway
      console.log("Initiating payment for student:", studentId);
    }
  };

  const handleViewHistory = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (student) {
      toast({
        title: "Payment History",
        description: `Viewing payment history for ${student.name}`,
      });
      console.log("View history for student:", studentId);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
          Welcome Back!
        </h1>
        <p className="text-muted-foreground">
          View and manage your children's monthly fee payments
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Children</CardTitle>
            <CheckCircle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
            <p className="text-xs text-muted-foreground">Enrolled students</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {students.filter(s => s.currentFee.status === 'pending').length}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Due</CardTitle>
            <CreditCard className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">MVR {totalDue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Outstanding amount</p>
          </CardContent>
        </Card>
      </div>

      {/* Student Cards */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Your Children</h2>
          {totalDue > 0 && (
            <Button variant="gradient" size="lg">
              <CreditCard className="h-4 w-4 mr-2" />
              Pay All Due (MVR {totalDue.toLocaleString()})
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {students.map((student) => (
            <StudentCard
              key={student.id}
              student={student}
              onPayFee={handlePayFee}
              onViewDetails={handleViewHistory}
              isParentView={true}
            />
          ))}
        </div>
      </div>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Payment History
          </CardTitle>
          <CardDescription>Your last few payments across all children</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockPaymentHistory.map((payment, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-success/10">
                    <CheckCircle className="h-4 w-4 text-success" />
                  </div>
                  <div>
                    <p className="font-medium">{payment.month} {payment.year}</p>
                    <p className="text-sm text-muted-foreground">Paid on {payment.paidDate}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">MVR {payment.amount}</p>
                  <p className="text-xs text-muted-foreground">{payment.transactionId}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};