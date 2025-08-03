import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileText, Download, TrendingUp, Users, CreditCard, Calendar } from "lucide-react";
import * as XLSX from 'xlsx';

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

interface StudentFeeReport {
  id: string;
  amount: number;
  status: string;
  student: {
    full_name: string;
    student_id: string;
    class_name: string;
  };
}

interface ReportData {
  totalStudents: number;
  totalRevenue: number;
  paidFees: number;
  pendingFees: number;
  overdueFeesCount: number;
  studentFees: StudentFeeReport[];
}

export const ReportsComponent = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
  const [schoolMonths, setSchoolMonths] = useState<SchoolMonth[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");

  const fetchInitialData = async () => {
    try {
      // Fetch school years
      const { data: yearsData, error: yearsError } = await supabase
        .from('school_years')
        .select('*')
        .order('year', { ascending: false });

      if (yearsError) throw yearsError;

      // Fetch school months
      const { data: monthsData, error: monthsError } = await supabase
        .from('school_months')
        .select('*')
        .order('month_number');

      if (monthsError) throw monthsError;

      setSchoolYears(yearsData || []);
      setSchoolMonths(monthsData || []);
      
      // Auto-select first year if available
      if (yearsData && yearsData.length > 0) {
        setSelectedYear(yearsData[0].id);
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error("Failed to load years and months");
    } finally {
      setLoading(false);
    }
  };

  const fetchReportData = async () => {
    if (!selectedYear) return;
    
    try {
      setLoading(true);
      
      let query = supabase
        .from('student_fees')
        .select(`
          id,
          amount,
          status,
          students!inner (
            full_name,
            student_id,
            class_name
          ),
          school_months!inner (
            school_year_id
          )
        `)
        .eq('school_months.school_year_id', selectedYear);

      // Add month filter if selected
      if (selectedMonth) {
        query = query.eq('school_month_id', selectedMonth);
      }

      const { data: studentFeesData, error: feesError } = await query;

      if (feesError) {
        console.error('Error fetching student fees:', feesError);
        toast.error("Failed to load fee data");
        return;
      }

      // Calculate statistics
      const paidFees = studentFeesData?.filter(fee => fee.status === 'paid').length || 0;
      const pendingFees = studentFeesData?.filter(fee => fee.status === 'pending').length || 0;
      const overdueFeesCount = studentFeesData?.filter(fee => fee.status === 'overdue').length || 0;
      const totalRevenue = studentFeesData?.filter(fee => fee.status === 'paid')
        .reduce((sum, fee) => sum + (fee.amount || 0), 0) || 0;

      // Transform student fees for display
      const transformedFees: StudentFeeReport[] = (studentFeesData || []).map(fee => ({
        id: fee.id,
        amount: fee.amount,
        status: fee.status,
        student: {
          full_name: fee.students.full_name,
          student_id: fee.students.student_id,
          class_name: fee.students.class_name
        }
      }));

      // Get unique students count
      const uniqueStudents = new Set(transformedFees.map(fee => fee.student.student_id));
      const totalStudents = uniqueStudents.size;

      setReportData({
        totalStudents,
        totalRevenue,
        paidFees,
        pendingFees,
        overdueFeesCount,
        studentFees: transformedFees
      });

    } catch (error) {
      console.error('Error:', error);
      toast.error("An error occurred while loading report data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedYear) {
      fetchReportData();
    }
  }, [selectedYear, selectedMonth]);

  const exportReport = () => {
    if (!reportData || reportData.studentFees.length === 0) {
      toast.error("No data available to export");
      return;
    }

    try {
      const selectedYearData = schoolYears.find(year => year.id === selectedYear);
      const selectedMonthData = selectedMonth ? getMonthsForSelectedYear().find(month => month.id === selectedMonth) : null;
      
      const exportData = reportData.studentFees.map(fee => ({
        'Student Name': fee.student.full_name,
        'Student ID': fee.student.student_id,
        'Class': fee.student.class_name,
        'Amount (MVR)': fee.amount,
        'Status': fee.status.toUpperCase()
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      
      const sheetName = selectedMonthData 
        ? `${selectedMonthData.month_name}_${selectedYearData?.year}` 
        : `Year_${selectedYearData?.year}`;
      
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      
      const fileName = selectedMonthData 
        ? `Fee_Report_${selectedMonthData.month_name}_${selectedYearData?.year}.xlsx`
        : `Fee_Report_Year_${selectedYearData?.year}.xlsx`;
      
      XLSX.writeFile(workbook, fileName);
      
      toast.success(`Report exported as ${fileName}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error("Failed to export report");
    }
  };

  const getMonthsForSelectedYear = () => {
    return schoolMonths.filter(month => month.school_year_id === selectedYear);
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
      {/* Header with Year/Month Selection */}
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Academic Reports</h2>
          <p className="text-muted-foreground">View payment reports by academic year and month</p>
        </div>
        <div className="flex gap-2">
          <div className="min-w-[180px]">
            <Label htmlFor="year-select">Academic Year</Label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger id="year-select">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {schoolYears.map((year) => (
                  <SelectItem key={year.id} value={year.id}>
                    Academic Year {year.year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-[150px]">
            <Label htmlFor="month-select">Month (Optional)</Label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger id="month-select">
                <SelectValue placeholder="All months" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Months</SelectItem>
                {getMonthsForSelectedYear().map((month) => (
                  <SelectItem key={month.id} value={month.id}>
                    {month.month_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

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

      {/* Student Fee Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Student Fee Details</CardTitle>
              <CardDescription>
                {selectedMonth 
                  ? `Fee details for ${getMonthsForSelectedYear().find(m => m.id === selectedMonth)?.month_name || 'selected month'}`
                  : `All fee details for the selected academic year`
                }
              </CardDescription>
            </div>
            <Button onClick={exportReport} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.studentFees.map((fee) => (
                  <TableRow key={fee.id}>
                    <TableCell className="font-medium">{fee.student.full_name}</TableCell>
                    <TableCell>{fee.student.student_id}</TableCell>
                    <TableCell>{fee.student.class_name}</TableCell>
                    <TableCell>MVR {fee.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          fee.status === 'paid' ? 'default' : 
                          fee.status === 'overdue' ? 'destructive' : 'secondary'
                        }
                      >
                        {fee.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};