import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CalendarDays, CreditCard, Clock, CheckCircle, ExternalLink, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
interface SchoolYear {
  id: string;
  year: number;
  is_active: boolean;
}
interface SchoolMonth {
  id: string;
  school_year_id: string;
  month_name: string;
  month_number: number;
  due_date: string;
  is_active: boolean;
}
interface StudentFee {
  id: string;
  school_month_id: string;
  student_id: string;
  amount: number;
  status: 'pending' | 'paid' | 'overdue';
  payment_date: string | null;
  transaction_id: string | null;
  school_months: SchoolMonth;
}
interface Student {
  id: string;
  full_name: string;
  class_name: string;
  student_id: string;
}
interface ParentFeeViewProps {
  currentUser?: {
    id: string;
    name: string;
    type: string;
  } | null;
}
export const ParentFeeView = ({
  currentUser
}: ParentFeeViewProps = {}) => {
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
  const [schoolMonths, setSchoolMonths] = useState<SchoolMonth[]>([]);
  const [studentFees, setStudentFees] = useState<StudentFee[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchFeeData();

    // Set up real-time subscription for fee updates with multiple channels
    const feesChannel = supabase.channel('fee-updates').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'student_fees'
    }, () => {
      console.log('Student fees updated, refreshing fee data...');
      fetchFeeData();
    }).subscribe();

    const monthsChannel = supabase.channel('school-months-updates').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'school_months'
    }, () => {
      console.log('School months updated, refreshing fee data...');
      fetchFeeData();
    }).subscribe();

    const yearsChannel = supabase.channel('school-years-updates').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'school_years'
    }, () => {
      console.log('School years updated, refreshing fee data...');
      fetchFeeData();
    }).subscribe();

    const studentsChannel = supabase.channel('students-updates').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'students'
    }, () => {
      console.log('Students updated, refreshing fee data...');
      fetchFeeData();
    }).subscribe();

    return () => {
      supabase.removeChannel(feesChannel);
      supabase.removeChannel(monthsChannel);
      supabase.removeChannel(yearsChannel);
      supabase.removeChannel(studentsChannel);
    };
  }, [currentUser?.id]); // Add dependency on currentUser?.id
  const fetchFeeData = async () => {
    try {
      // Fetch school years
      const {
        data: yearsData,
        error: yearsError
      } = await supabase.from('school_years').select('*').order('year', {
        ascending: false
      });
      if (yearsError) throw yearsError;

      // Fetch school months
      const {
        data: monthsData,
        error: monthsError
      } = await supabase.from('school_months').select('*').order('month_number');
      if (monthsError) throw monthsError;

      // First, get the current student's data to find their parent phone
      const {
        data: currentStudentData,
        error: currentStudentError
      } = await supabase
        .from('students')
        .select('parent_phone')
        .eq('id', currentUser?.id)
        .single();

      if (currentStudentError || !currentStudentData) {
        console.error('Error fetching current student:', currentStudentError);
        setStudents([]);
        setLoading(false);
        return;
      }

      const parentPhone = currentStudentData.parent_phone;

      // Fetch only current user's student data - using parent_phone
      const {
        data: studentsData,
        error: studentsError
      } = await supabase.from('students').select('*').eq('parent_phone', parentPhone).order('full_name');
      
      console.log('ParentFeeView - Fetching students for parent phone:', parentPhone);
      console.log('ParentFeeView - Students found:', studentsData);
      if (studentsError) throw studentsError;

      if (!studentsData || studentsData.length === 0) {
        setStudents([]);
        setStudentFees([]);
        setLoading(false);
        return;
      }

      const studentIds = studentsData.map(s => s.id);

      // Fetch student fees with month details - only for current user's children
      const {
        data: feesData,
        error: feesError
      } = await supabase.from('student_fees').select(`
          *,
          school_months (*)
        `).in('student_id', studentIds).order('created_at', {
        ascending: false
      });
      if (feesError) throw feesError;
      setSchoolYears(yearsData || []);
      setSchoolMonths(monthsData || []);
      setStudents(studentsData || []);
      setStudentFees(feesData?.map(fee => ({
        ...fee,
        status: fee.status as 'pending' | 'paid' | 'overdue'
      })) || []);
    } catch (error) {
      console.error('Error fetching fee data:', error);
      toast.error("Failed to load fee information");
    } finally {
      setLoading(false);
    }
  };
  const getStatusBadge = (status: string, dueDate: string) => {
    const isOverdue = new Date(dueDate) < new Date() && status === 'pending';
    if (status === 'paid') {
      return <Badge variant="default" className="bg-success text-success-foreground">
        <CheckCircle className="h-3 w-3 mr-1" />
        Paid
      </Badge>;
    } else if (status === 'overdue' || isOverdue) {
      return <Badge variant="destructive">
        <AlertCircle className="h-3 w-3 mr-1" />
        Overdue
      </Badge>;
    } else {
      return <Badge variant="secondary" className="bg-warning text-warning-foreground">
        <Clock className="h-3 w-3 mr-1" />
        Pending
      </Badge>;
    }
  };
  const handlePayment = async (feeId: string, studentName: string, month: string, amount: number) => {
    try {
      // Show loading toast
      const loadingToast = toast.loading(`Redirecting to BML Gateway for ${month} payment...`);

      // In a real implementation, this would:
      // 1. Create a payment session with BML Gateway
      // 2. Include the student_fee_id in the payment reference
      // 3. Redirect to BML payment page
      // 4. Handle the webhook response to update payment status

      // For now, simulate the redirect
      setTimeout(() => {
        toast.dismiss(loadingToast);
        toast.success(`Payment gateway opened for ${studentName} - ${month} (MVR ${amount.toLocaleString()})`);
        console.log("BML Gateway integration - Fee ID:", feeId);
      }, 1500);
    } catch (error) {
      console.error('Payment error:', error);
      toast.error("Failed to initiate payment. Please try again.");
    }
  };
  const getFeesForYearAndStudent = (yearId: string, studentId: string) => {
    return studentFees.filter(fee => fee.school_months.school_year_id === yearId && fee.student_id === studentId);
  };
  const getMonthsForYear = (yearId: string) => {
    return schoolMonths.filter(month => month.school_year_id === yearId).sort((a, b) => a.month_number - b.month_number);
  };
  const getTotalPendingAmount = () => {
    const studentIds = students.map(s => s.id);
    return studentFees.filter(fee => fee.status === 'pending' && studentIds.includes(fee.student_id)).reduce((sum, fee) => sum + fee.amount, 0);
  };
  const getPaidFeesCount = () => {
    const studentIds = students.map(s => s.id);
    return studentFees.filter(fee => fee.status === 'paid' && studentIds.includes(fee.student_id)).length;
  };
  const getPendingFeesCount = () => {
    const studentIds = students.map(s => s.id);
    return studentFees.filter(fee => fee.status === 'pending' && studentIds.includes(fee.student_id)).length;
  };
  if (loading) {
    return <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-muted rounded"></div>)}
        </div>
      </div>;
  }
  return <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Fee Payment Portal</h2>
        <p className="text-muted-foreground">View and pay your children's school fees</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Children</CardTitle>
            <CalendarDays className="h-4 w-4 text-primary" />
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
            <div className="text-2xl font-bold text-warning">{getPendingFeesCount()}</div>
            <p className="text-xs text-muted-foreground">MVR {getTotalPendingAmount().toLocaleString()} total</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Fees</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{getPaidFeesCount()}</div>
            <p className="text-xs text-muted-foreground">This academic year</p>
          </CardContent>
        </Card>
      </div>

      {/* Students and Fees */}
      <div className="space-y-6">
        {students.map(student => <Card key={student.id} className="border-l-4 border-l-primary">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-3">
                    <CalendarDays className="h-5 w-5 text-primary" />
                    {student.full_name}
                  </CardTitle>
                  <CardDescription>
                    Student ID: {student.student_id} • Class: {student.class_name}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {schoolYears.map(year => {
              const studentFeesForYear = getFeesForYearAndStudent(year.id, student.id);
              const monthsForYear = getMonthsForYear(year.id);
              if (monthsForYear.length === 0) return null;
              return <AccordionItem key={year.id} value={year.id}>
                      <AccordionTrigger className="text-lg font-semibold">
                        Academic Year {year.year}
                        {year.is_active && <Badge variant="default" className="ml-2">Current</Badge>}
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="grid gap-4">
                          {monthsForYear.map(month => {
                      const fee = studentFeesForYear.find(f => f.school_month_id === month.id);
                      if (!fee) {
                        return <div key={month.id} className="p-4 border rounded-lg bg-muted/30">
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <h4 className="font-medium">{month.month_name}</h4>
                                      <p className="text-sm text-muted-foreground">
                                        No fee assigned yet
                                      </p>
                                    </div>
                                    <Badge variant="outline">Not Available</Badge>
                                  </div>
                                </div>;
                      }
                      return <div key={fee.id} className="p-4 border bg-background rounded">
                                <div className="flex justify-between items-center rounded-sm">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <h4 className="font-medium">{month.month_name}</h4>
                                      {getStatusBadge(fee.status, month.due_date)}
                                    </div>
                                    <div className="text-sm text-muted-foreground space-y-1">
                                      <p>Amount: MVR {fee.amount.toLocaleString()}</p>
                                      <p>Due Date: {new Date(month.due_date).toLocaleDateString()}</p>
                                      {fee.payment_date && <p>Paid: {new Date(fee.payment_date).toLocaleDateString()}</p>}
                                      {fee.transaction_id && <p>Transaction ID: {fee.transaction_id}</p>}
                                    </div>
                                  </div>
                                  
                                  <div className="ml-4">
                                    {fee.status === 'pending' && <Button onClick={() => handlePayment(fee.id, student.full_name, month.month_name, fee.amount)} variant="gradient" className="flex items-center gap-2">
                                        <CreditCard className="h-4 w-4" />
                                        Pay Now
                                        <ExternalLink className="h-3 w-3" />
                                      </Button>}
                                    {fee.status === 'overdue' && <Button onClick={() => handlePayment(fee.id, student.full_name, month.month_name, fee.amount)} variant="destructive" className="flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4" />
                                        Pay Overdue
                                        <ExternalLink className="h-3 w-3" />
                                      </Button>}
                                    {fee.status === 'paid' && <div className="text-success font-medium flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4" />
                                        Paid
                                      </div>}
                                  </div>
                                </div>
                              </div>;
                    })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>;
            })}
              </Accordion>
            </CardContent>
          </Card>)}
      </div>

      {students.length === 0 && <div className="text-center py-12">
          <CalendarDays className="h-16 w-16 mx-auto mb-6 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium mb-2">No Students Found</h3>
          <p className="text-muted-foreground">Contact the school to register your children</p>
        </div>}
    </div>;
};