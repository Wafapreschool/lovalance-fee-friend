import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudentCard, Student } from "./StudentCard";
import { AddStudentForm } from "./AddStudentForm";
import { Users, CreditCard, TrendingUp, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const AdminDashboard = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  const totalStudents = students.length;
  const paidFees = students.filter(s => s.currentFee.status === 'paid').length;
  const pendingFees = students.filter(s => s.currentFee.status === 'pending').length;
  const totalRevenue = students
    .filter(s => s.currentFee.status === 'paid')
    .reduce((sum, s) => sum + s.currentFee.amount, 0);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching students:', error);
        toast.error("Failed to load students");
        return;
      }

      // Transform data to match Student interface
      const transformedStudents: Student[] = (data || []).map(student => ({
        id: student.id,
        name: student.full_name,
        class: student.class_name,
        yearJoined: student.year_joined,
        currentFee: {
          month: "January",
          year: 2024,
          amount: 3500,
          status: "pending",
          dueDate: "2024-01-15"
        }
      }));

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
    console.log("View student:", studentId);
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="fees">Fee Management</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Student Management</h2>
              <p className="text-muted-foreground">Manage student registrations and information</p>
            </div>
            <Button variant="gradient" onClick={() => setShowAddForm(true)}>Add New Student</Button>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {students.length > 0 ? (
                students.map((student) => (
                  <StudentCard
                    key={student.id}
                    student={student}
                    onViewDetails={handleViewStudent}
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

        <TabsContent value="fees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fee Management</CardTitle>
              <CardDescription>Set monthly fees and track payments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">Fee management interface coming soon...</p>
                <Button variant="outline" className="mt-4">Set Monthly Fees</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Financial Reports</CardTitle>
              <CardDescription>View detailed payment reports and analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">Reports dashboard coming soon...</p>
                <Button variant="outline" className="mt-4">Generate Report</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AddStudentForm
        open={showAddForm}
        onOpenChange={setShowAddForm}
        onStudentAdded={handleStudentAdded}
      />
    </div>
  );
};