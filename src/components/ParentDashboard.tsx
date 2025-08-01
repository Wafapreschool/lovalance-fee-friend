import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StudentCard, Student } from "./StudentCard";
import { toast } from "sonner";
import { CreditCard, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PaymentHistory {
  month: string;
  year: number;
  amount: number;
  status: string;
  paidDate?: string;
  transactionId?: string;
}

export const ParentDashboard = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);

  const totalDue = students
    .filter(s => s.currentFee.status === 'pending')
    .reduce((sum, s) => sum + s.currentFee.amount, 0);

  const fetchStudentsData = async () => {
    try {
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });

      if (studentsError) {
        console.error('Error fetching students:', studentsError);
        toast.error("Failed to load students");
        return;
      }

      const { data: feesData, error: feesError } = await supabase
        .from('fees')
        .select('*')
        .order('created_at', { ascending: false });

      if (feesError) {
        console.error('Error fetching fees:', feesError);
        toast.error("Failed to load fees");
        return;
      }

      // Transform data to match Student interface
      const transformedStudents: Student[] = (studentsData || []).map(student => {
        const currentMonth = new Date().toLocaleString('default', { month: 'long' });
        const currentYear = new Date().getFullYear();
        const studentFee = feesData?.find(fee => 
          fee.student_id === student.id && 
          fee.month === currentMonth && 
          fee.year === currentYear
        );
        
        return {
          id: student.id,
          name: student.full_name,
          class: student.class_name,
          yearJoined: student.year_joined,
          currentFee: {
            month: currentMonth,
            year: currentYear,
            amount: studentFee?.amount || 3500,
            status: (studentFee?.status as "pending" | "paid" | "overdue") || "pending",
            dueDate: studentFee?.due_date || new Date(currentYear, new Date().getMonth(), 15).toISOString().split('T')[0]
          }
        };
      });

      // Transform fee history
      const transformedHistory: PaymentHistory[] = (feesData || [])
        .filter(fee => fee.status === 'paid')
        .map(fee => ({
          month: fee.month,
          year: fee.year,
          amount: fee.amount,
          status: fee.status,
          paidDate: fee.payment_date ? new Date(fee.payment_date).toLocaleDateString() : undefined,
          transactionId: fee.transaction_id
        }));

      setStudents(transformedStudents);
      setPaymentHistory(transformedHistory);
    } catch (error) {
      console.error('Error:', error);
      toast.error("An error occurred while loading data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentsData();
  }, []);

  const handlePayFee = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (student) {
      toast.success(`Redirecting to payment gateway for ${student.name}'s fee...`);
      console.log("Initiating payment for student:", studentId);
    }
  };

  const handleViewHistory = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (student) {
      toast.success(`Viewing payment history for ${student.name}`);
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

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-muted h-48 rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {students.length > 0 ? (
              students.map((student) => (
                <StudentCard
                  key={student.id}
                  student={student}
                  onPayFee={handlePayFee}
                  onViewDetails={handleViewHistory}
                  isParentView={true}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-muted-foreground">No students found</p>
              </div>
            )}
          </div>
        )}
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
            {paymentHistory.length > 0 ? (
              paymentHistory.slice(0, 5).map((payment, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-success/10">
                      <CheckCircle className="h-4 w-4 text-success" />
                    </div>
                    <div>
                      <p className="font-medium">{payment.month} {payment.year}</p>
                      <p className="text-sm text-muted-foreground">
                        {payment.paidDate ? `Paid on ${payment.paidDate}` : 'Payment date not available'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">MVR {payment.amount}</p>
                    <p className="text-xs text-muted-foreground">{payment.transactionId || 'No transaction ID'}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No payment history found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};