import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileText, Download, TrendingUp, Users, CreditCard } from "lucide-react";

interface ReportData {
  totalStudents: number;
  totalRevenue: number;
  paidFees: number;
  pendingFees: number;
  overdueFeesCount: number;
  classWiseStats: {
    class_name: string;
    total_students: number;
    paid_fees: number;
    pending_fees: number;
    total_revenue: number;
  }[];
  monthlyStats: {
    month: string;
    year: number;
    total_amount: number;
    paid_amount: number;
    pending_amount: number;
  }[];
}

export const ReportsComponent = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReportData = async () => {
    try {
      // Fetch students data
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('*');

      if (studentsError) {
        console.error('Error fetching students:', studentsError);
        toast.error("Failed to load students data");
        return;
      }

      // Fetch fees data
      const { data: feesData, error: feesError } = await supabase
        .from('fees')
        .select(`
          *,
          students!inner(
            class_name
          )
        `);

      if (feesError) {
        console.error('Error fetching fees:', feesError);
        toast.error("Failed to load fees data");
        return;
      }

      // Calculate statistics
      const totalStudents = studentsData?.length || 0;
      const paidFees = feesData?.filter(fee => fee.status === 'paid').length || 0;
      const pendingFees = feesData?.filter(fee => fee.status === 'pending').length || 0;
      const overdueFeesCount = feesData?.filter(fee => fee.status === 'overdue').length || 0;
      const totalRevenue = feesData?.filter(fee => fee.status === 'paid')
        .reduce((sum, fee) => sum + (fee.amount || 0), 0) || 0;

      // Class-wise statistics
      const classStats = studentsData?.reduce((acc: any, student) => {
        const className = student.class_name;
        if (!acc[className]) {
          acc[className] = {
            class_name: className,
            total_students: 0,
            paid_fees: 0,
            pending_fees: 0,
            total_revenue: 0
          };
        }
        
        acc[className].total_students += 1;
        
        const studentFees = feesData?.filter(fee => fee.student_id === student.id);
        studentFees?.forEach(fee => {
          if (fee.status === 'paid') {
            acc[className].paid_fees += 1;
            acc[className].total_revenue += fee.amount;
          } else if (fee.status === 'pending') {
            acc[className].pending_fees += 1;
          }
        });
        
        return acc;
      }, {});

      const classWiseStats = Object.values(classStats || {}) as any[];

      // Monthly statistics
      const monthlyStats = feesData?.reduce((acc: any, fee) => {
        const key = `${fee.month}-${fee.year}`;
        if (!acc[key]) {
          acc[key] = {
            month: fee.month,
            year: fee.year,
            total_amount: 0,
            paid_amount: 0,
            pending_amount: 0
          };
        }
        
        acc[key].total_amount += fee.amount;
        if (fee.status === 'paid') {
          acc[key].paid_amount += fee.amount;
        } else {
          acc[key].pending_amount += fee.amount;
        }
        
        return acc;
      }, {});

      setReportData({
        totalStudents,
        totalRevenue,
        paidFees,
        pendingFees,
        overdueFeesCount,
        classWiseStats,
        monthlyStats: Object.values(monthlyStats || {}) as any[]
      });

    } catch (error) {
      console.error('Error:', error);
      toast.error("An error occurred while loading report data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  const exportReport = () => {
    toast.success("Export functionality coming soon!");
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">No data available for reports</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.totalStudents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">MVR {reportData.totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Fees</CardTitle>
            <CreditCard className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{reportData.paidFees}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending/Overdue</CardTitle>
            <FileText className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {reportData.pendingFees + reportData.overdueFeesCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Class-wise Report */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Class-wise Report</CardTitle>
              <CardDescription>Fee collection statistics by class</CardDescription>
            </div>
            <Button onClick={exportReport} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class</TableHead>
                  <TableHead>Total Students</TableHead>
                  <TableHead>Paid Fees</TableHead>
                  <TableHead>Pending Fees</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Collection Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.classWiseStats.map((classData) => {
                  const collectionRate = classData.total_students > 0 
                    ? ((classData.paid_fees / (classData.paid_fees + classData.pending_fees)) * 100) || 0
                    : 0;
                  
                  return (
                    <TableRow key={classData.class_name}>
                      <TableCell className="font-medium">{classData.class_name}</TableCell>
                      <TableCell>{classData.total_students}</TableCell>
                      <TableCell>
                        <Badge variant="default" className="bg-success text-success-foreground">
                          {classData.paid_fees}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-warning text-warning-foreground">
                          {classData.pending_fees}
                        </Badge>
                      </TableCell>
                      <TableCell>MVR {classData.total_revenue.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={collectionRate >= 80 ? "default" : collectionRate >= 60 ? "secondary" : "destructive"}>
                          {collectionRate.toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Report */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Report</CardTitle>
          <CardDescription>Fee collection by month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Paid Amount</TableHead>
                  <TableHead>Pending Amount</TableHead>
                  <TableHead>Collection %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.monthlyStats.map((monthData) => {
                  const collectionPercentage = monthData.total_amount > 0 
                    ? (monthData.paid_amount / monthData.total_amount) * 100 
                    : 0;
                  
                  return (
                    <TableRow key={`${monthData.month}-${monthData.year}`}>
                      <TableCell className="font-medium">
                        {monthData.month} {monthData.year}
                      </TableCell>
                      <TableCell>MVR {monthData.total_amount.toLocaleString()}</TableCell>
                      <TableCell className="text-success">
                        MVR {monthData.paid_amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-warning">
                        MVR {monthData.pending_amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={collectionPercentage >= 80 ? "default" : collectionPercentage >= 60 ? "secondary" : "destructive"}>
                          {collectionPercentage.toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};