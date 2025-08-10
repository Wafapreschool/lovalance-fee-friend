import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudentCard, Student } from "./StudentCard";
import { ParentFeeView } from "./ParentFeeView";
import { PasswordChangeDialog } from "./PasswordChangeDialog";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardFooter } from "./DashboardFooter";
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
  const [activeTab, setActiveTab] = useState('overview');

  // Redirect if not authenticated
  if (!currentUser) {
    return (
      <div className="container mx-auto py-6">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Please login as a parent to access this dashboard.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const totalDue = students.filter(s => s.currentFee.status === 'pending').reduce((sum, s) => sum + s.currentFee.amount, 0);

  const fetchStudentsData = async () => {
    try {
      // First, get students data - assuming parent_phone matches current user identifier
      const {
        data: studentsData,
        error: studentsError
      } = await supabase
        .from('students')
        .select('*')
        .eq('parent_phone', currentUser.id) // Assuming currentUser.id contains parent phone
        .order('created_at', { ascending: false });

      if (studentsError) {
        console.error('Error fetching students:', studentsError);
        toast.error("Failed to load students");
        return;
      }

      if (!studentsData || studentsData.length === 0) {
        setStudents([]);
        setPaymentHistory([]);
        setLoading(false);
        return;
      }

      // Get student IDs for fee queries
      const studentIds = studentsData.map(s => s.id);

      // Fetch actual fees from student_fees table with related data
      const {
        data: feesData,
        error: feesError
      } = await supabase
        .from('student_fees')
        .select(`
          *,
          students!inner(
            id,
            full_name,
            class_name
          ),
          school_months!inner(
            month_name,
            due_date,
            school_years!inner(year)
          )
        `)
        .in('student_id', studentIds)
        .order('created_at', { ascending: false });

      if (feesError) {
        console.error('Error fetching fees:', feesError);
        toast.error("Failed to load fees");
        return;
      }

      // Transform students data with their actual unpaid fees
      const transformedStudents: Student[] = studentsData.map(student => {
        // Find the most recent unpaid fee for this student
        const unpaidFee = feesData?.find(fee => 
          fee.student_id === student.id && 
          (fee.status === 'pending' || fee.status === 'overdue')
        );

        if (unpaidFee) {
          return {
            id: student.id,
            name: student.full_name,
            class: student.class_name,
            yearJoined: student.year_joined,
            currentFee: {
              month: unpaidFee.school_months.month_name,
              year: unpaidFee.school_months.school_years.year,
              amount: unpaidFee.amount,
              status: unpaidFee.status as "pending" | "paid" | "overdue",
              dueDate: unpaidFee.school_months.due_date
            }
          };
        } else {
          // No unpaid fees - show as paid up
          return {
            id: student.id,
            name: student.full_name,
            class: student.class_name,
            yearJoined: student.year_joined,
            currentFee: {
              month: "All fees",
              year: new Date().getFullYear(),
              amount: 0,
              status: "paid",
              dueDate: new Date().toISOString().split('T')[0]
            }
          };
        }
      });

      // Transform fee history - only paid fees for these students
      const transformedHistory: PaymentHistory[] = (feesData || [])
        .filter(fee => fee.status === 'paid')
        .map(fee => ({
          month: fee.school_months.month_name,
          year: fee.school_months.school_years.year,
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
    window.location.href = '/';
    toast.success("Signed out successfully");
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Welcome Message */}
            <div className="text-center text-lg font-semibold text-gray-700 mb-4">
              Welcome to WAFA Preschool Monthly Fee Management Portal
            </div>

            {/* Student Cards */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="font-bold text-lg">Your Children</h2>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-muted h-48 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {students.length > 0 ? (
                    students.map(student => (
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
              <CardContent className="bg-blue-100">
                <div className="space-y-3">
                  {paymentHistory.length > 0 ? (
                    paymentHistory.slice(0, 5).map((payment, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
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
      case 'fees':
        return <ParentFeeView currentUser={currentUser} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <DashboardSidebar
        userType="parent"
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
        userName={currentUser.name}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 ml-12 lg:ml-0">
                WAFA Pre School - Parent Portal
              </h1>
              <p className="text-gray-600 ml-12 lg:ml-0">
                Monitor your children's fees and payment history
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto p-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            {renderTabContent()}
          </div>
        </div>

        {/* Footer */}
        <DashboardFooter />
      </div>
    </div>
  );
};
