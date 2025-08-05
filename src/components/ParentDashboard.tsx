import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudentCard, Student } from "./StudentCard";
import { ParentFeeView } from "./ParentFeeView";
import { PasswordChangeDialog } from "./PasswordChangeDialog";
import { toast } from "sonner";
import { CreditCard, Clock, CheckCircle, AlertCircle, CalendarDays, User, Key, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
interface PaymentHistory {
  month: string;
  year: number;
  amount: number;
  status: string;
  paidDate?: string;
  transactionId?: string;
}
interface ParentDashboardProps {
  currentUser?: {
    id: string;
    name: string;
    type: string;
  } | null;
}
export const ParentDashboard = ({
  currentUser
}: ParentDashboardProps = {}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect if not authenticated (use currentUser instead of Supabase auth user)
  if (!currentUser) {
    return <div className="container mx-auto py-6">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Please login as a parent to access this dashboard.</CardDescription>
          </CardHeader>
        </Card>
      </div>;
  }
  const totalDue = students.filter(s => s.currentFee.status === 'pending').reduce((sum, s) => sum + s.currentFee.amount, 0);
  const fetchStudentsData = async () => {
    try {
      // Filter by current user - only show their children
      const {
        data: studentsData,
        error: studentsError
      } = await supabase.from('students').select('*').eq('id', currentUser.id).order('created_at', {
        ascending: false
      });
      if (studentsError) {
        console.error('Error fetching students:', studentsError);
        toast.error("Failed to load students");
        return;
      }
      const {
        data: feesData,
        error: feesError
      } = await supabase.from('fees').select('*').order('created_at', {
        ascending: false
      });
      if (feesError) {
        console.error('Error fetching fees:', feesError);
        toast.error("Failed to load fees");
        return;
      }

      // Transform data to match Student interface
      const transformedStudents: Student[] = (studentsData || []).map(student => {
        const currentMonth = new Date().toLocaleString('default', {
          month: 'long'
        });
        const currentYear = new Date().getFullYear();
        const studentFee = feesData?.find(fee => fee.student_id === student.id && fee.month === currentMonth && fee.year === currentYear);
        return {
          id: student.id,
          name: student.full_name,
          class: student.class_name,
          yearJoined: student.year_joined,
          currentFee: {
            month: currentMonth,
            year: currentYear,
            amount: studentFee?.amount || 3500,
            status: studentFee?.status as "pending" | "paid" | "overdue" || "pending",
            dueDate: studentFee?.due_date || new Date(currentYear, new Date().getMonth(), 15).toISOString().split('T')[0]
          }
        };
      });

      // Transform fee history - only for current user's children
      const transformedHistory: PaymentHistory[] = (feesData || []).filter(fee => fee.status === 'paid' && fee.student_id === currentUser.id).map(fee => ({
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

    // Set up real-time subscriptions for automatic updates
    const studentsChannel = supabase.channel('students-changes').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'students'
    }, () => {
      console.log('Students updated, refreshing data...');
      fetchStudentsData();
    }).subscribe();
    const feesChannel = supabase.channel('fees-changes').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'student_fees'
    }, () => {
      console.log('Student fees updated, refreshing data...');
      fetchStudentsData();
    }).subscribe();
    const schoolMonthsChannel = supabase.channel('school-months-changes').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'school_months'
    }, () => {
      console.log('School months updated, refreshing data...');
      fetchStudentsData();
    }).subscribe();
    return () => {
      supabase.removeChannel(studentsChannel);
      supabase.removeChannel(feesChannel);
      supabase.removeChannel(schoolMonthsChannel);
    };
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
  const handleLogout = async () => {
    // Since we're using local auth, just redirect to home page
    window.location.href = '/';
    toast.success("Signed out successfully");
  };
  return <div className="container mx-auto py-6 space-y-6">
      {/* Welcome Section with Profile Actions */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          
          
        </div>
        <div className="flex gap-2">
          <PasswordChangeDialog>
            <Button variant="outline" size="sm">
              <Key className="h-4 w-4 mr-2" />
              Change Password
            </Button>
          </PasswordChangeDialog>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        

        

        
      </div>

      {/* Tabs for Overview and Fee Management */}
      <div>
  {/* Welcome Message */}
  <div className="text-center text-lg font-semibold text-gray-700 mb-4">
    Welcome to WAFA Preschool Monthly Fee Management Portal
  </div>

  {/* Tabs Component */}
  <Tabs defaultValue="overview" className="space-y-6">
    <TabsList className="grid w-full grid-cols-2 h-auto">
      <TabsTrigger 
        value="overview" 
        className="text-sm py-3 bg-blue-100 text-blue-800 hover:bg-blue-200"
      >
        Overview
      </TabsTrigger>
      <TabsTrigger 
        value="fees" 
        className="text-sm py-3 bg-blue-100 text-blue-800 hover:bg-blue-200"
      >
        <CalendarDays className="h-4 w-4 mr-2" />
        Fee Management
      </TabsTrigger>
    </TabsList>
  </Tabs>
</div>

        <TabsContent value="overview" className="space-y-4">
          {/* Student Cards */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-sm">Your Children</h2>
              {totalDue > 0}
            </div>

            {loading ? <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map(i => <div key={i} className="animate-pulse">
                    <div className="bg-muted h-48 rounded-lg"></div>
                  </div>)}
              </div> : <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {students.length > 0 ? students.map(student => <StudentCard key={student.id} student={student} onPayFee={handlePayFee} onViewDetails={handleViewHistory} isParentView={true} />) : <div className="col-span-full text-center py-8">
                    <p className="text-muted-foreground">No students found</p>
                  </div>}
              </div>}
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
                {paymentHistory.length > 0 ? paymentHistory.slice(0, 5).map((payment, index) => <div key={index} className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
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
                    </div>) : <div className="text-center py-8">
                    <p className="text-muted-foreground">No payment history found</p>
                  </div>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fees" className="space-y-4">
          <ParentFeeView currentUser={currentUser} />
        </TabsContent>
      </Tabs>
    </div>;
};