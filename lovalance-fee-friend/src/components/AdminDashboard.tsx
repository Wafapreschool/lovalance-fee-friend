import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudentCard, Student } from "./StudentCard";
import { AddStudentForm } from "./AddStudentForm";
import { EditStudentForm } from "./EditStudentForm";
import { ViewStudentDetails } from "./ViewStudentDetails";
import { FeeManagement } from "./FeeManagement";
import { SchoolYearManagement } from "./SchoolYearManagement";
import { ReportsComponent } from "./ReportsComponent";
import { YearBasedStudentManagement } from "./YearBasedStudentManagement";
import { EnhancedFeeManagement } from "./EnhancedFeeManagement";
import { DashboardSidebar } from "./DashboardSidebar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Users, CreditCard, TrendingUp, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DashboardFooter } from "./DashboardFooter";

export const AdminDashboard = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showViewDetails, setShowViewDetails] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('students');

  const totalStudents = students.length;
  const paidFees = students.filter(s => s.currentFee.status === 'paid').length;
  const pendingFees = students.filter(s => s.currentFee.status === 'pending').length;
  const totalRevenue = students
    .filter(s => s.currentFee.status === 'paid')
    .reduce((sum, s) => sum + s.currentFee.amount, 0);

  const fetchStudents = async () => {
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
        .select('*');

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

      setStudents(transformedStudents);
    } catch (error) {
      console.error('Error:', error);
      toast.error("An error occurred while loading students");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleViewStudent = (studentId: string) => {
    setSelectedStudentId(studentId);
    setShowViewDetails(true);
  };

  const handleEditStudent = (studentId: string) => {
    setSelectedStudentId(studentId);
    setShowEditForm(true);
  };

  const handleDeleteStudent = (studentId: string) => {
    setStudentToDelete(studentId);
    setShowDeleteDialog(true);
  };

  const confirmDeleteStudent = async () => {
    if (!studentToDelete) return;

    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', studentToDelete);

      if (error) {
        console.error('Error deleting student:', error);
        toast.error("Failed to delete student");
        return;
      }

      toast.success("Student deleted successfully");
      fetchStudents();
    } catch (error) {
      console.error('Error:', error);
      toast.error("An error occurred while deleting student");
    } finally {
      setShowDeleteDialog(false);
      setStudentToDelete(null);
    }
  };

  const handleStudentAdded = () => {
    fetchStudents();
  };

  const handleLogout = async () => {
    window.location.href = '/';
    toast.success("Signed out successfully");
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'students':
        return <YearBasedStudentManagement />;
      case 'fees':
        return <EnhancedFeeManagement />;
      case 'reports':
        return <ReportsComponent />;
      default:
        return <YearBasedStudentManagement />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <DashboardSidebar
        userType="admin"
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
        userName="Administrator"
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 ml-12 lg:ml-0">
                WAFA Pre School - Admin Dashboard
              </h1>
              <p className="text-gray-600 ml-12 lg:ml-0">
                Manage students, fees, and generate reports
              </p>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gradient-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalStudents}</div>
                <p className="text-xs text-muted-foreground">Active enrollments</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Paid Fees</CardTitle>
                <CreditCard className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">{paidFees}</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Fees</CardTitle>
                <AlertCircle className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">{pendingFees}</div>
                <p className="text-xs text-muted-foreground">Awaiting payment</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">MVR {totalRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            {renderTabContent()}
          </div>
        </div>

        {/* Footer */}
        <DashboardFooter />
      </div>

      <AddStudentForm
        open={showAddForm}
        onOpenChange={setShowAddForm}
        onStudentAdded={handleStudentAdded}
      />

      <EditStudentForm
        open={showEditForm}
        onOpenChange={setShowEditForm}
        onStudentUpdated={handleStudentAdded}
        studentId={selectedStudentId}
      />

      <ViewStudentDetails
        open={showViewDetails}
        onOpenChange={setShowViewDetails}
        onStudentUpdated={handleStudentAdded}
        studentId={selectedStudentId}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Student</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this student? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteStudent} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
