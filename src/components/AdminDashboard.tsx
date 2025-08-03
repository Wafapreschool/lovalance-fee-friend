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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Users, CreditCard, TrendingUp, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const AdminDashboard = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showViewDetails, setShowViewDetails] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);

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

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* Management Tabs */}
      <Tabs defaultValue="students" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="students" className="text-xs sm:text-sm py-3">Students</TabsTrigger>
          <TabsTrigger value="school-years" className="text-xs sm:text-sm py-3">Fee Management</TabsTrigger>
          <TabsTrigger value="fees" className="text-xs sm:text-sm py-3">Professional Fee System</TabsTrigger>
          <TabsTrigger value="reports" className="text-xs sm:text-sm py-3">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">Student Management</h2>
              <p className="text-sm text-muted-foreground">Manage student registrations and information</p>
            </div>
            <Button variant="gradient" onClick={() => setShowAddForm(true)} className="w-full sm:w-auto">
              Add New Student
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-muted h-48 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {students.length > 0 ? (
                students.map((student) => (
                  <StudentCard
                    key={student.id}
                    student={student}
                    onViewDetails={handleViewStudent}
                    onEditStudent={handleEditStudent}
                    onDeleteStudent={handleDeleteStudent}
                    isParentView={false}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-8">
                  <p className="text-muted-foreground">No students found. Add your first student to get started.</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="school-years" className="space-y-4">
          <SchoolYearManagement />
        </TabsContent>

        <TabsContent value="fees" className="space-y-4">
          <FeeManagement onRefresh={fetchStudents} />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <ReportsComponent />
        </TabsContent>
      </Tabs>

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