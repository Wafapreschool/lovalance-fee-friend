import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudentCard, Student } from "./StudentCard";
import { Users, CreditCard, TrendingUp, AlertCircle } from "lucide-react";

// Mock data for demonstration
const mockStudents: Student[] = [
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
    name: "Mariam Hassan",
    class: "KG2",
    yearJoined: 2022,
    currentFee: {
      month: "January",
      year: 2024,
      amount: 3500,
      status: "paid",
      dueDate: "2024-01-15"
    }
  },
  {
    id: "3", 
    name: "Ibrahim Mohamed",
    class: "KG1",
    yearJoined: 2023,
    currentFee: {
      month: "January",
      year: 2024,
      amount: 3500,
      status: "pending",
      dueDate: "2024-01-15"
    }
  }
];

export const AdminDashboard = () => {
  const [students] = useState<Student[]>(mockStudents);

  const totalStudents = students.length;
  const paidFees = students.filter(s => s.currentFee.status === 'paid').length;
  const pendingFees = students.filter(s => s.currentFee.status === 'pending').length;
  const totalRevenue = students
    .filter(s => s.currentFee.status === 'paid')
    .reduce((sum, s) => sum + s.currentFee.amount, 0);

  const handleViewStudent = (studentId: string) => {
    console.log("View student:", studentId);
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
            <Button variant="gradient">Add New Student</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.map((student) => (
              <StudentCard
                key={student.id}
                student={student}
                onViewDetails={handleViewStudent}
                isParentView={false}
              />
            ))}
          </div>
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
    </div>
  );
};