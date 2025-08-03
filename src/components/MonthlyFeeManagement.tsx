import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Calendar, Users, Plus, Edit, Trash2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SchoolYear {
  id: string;
  year: number;
  is_active: boolean;
}

interface SchoolMonth {
  id: string;
  month_name: string;
  month_number: number;
  due_date: string;
  is_active: boolean;
  school_year_id: string;
}

interface Student {
  id: string;
  student_id: string;
  full_name: string;
  class_name: string;
  parent_phone: string;
  year_joined: number;
}

interface StudentFee {
  id: string;
  student_id: string;
  amount: number;
  status: string;
  created_at: string;
}

export const MonthlyFeeManagement = () => {
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
  const [selectedYear, setSelectedYear] = useState<SchoolYear | null>(null);
  const [schoolMonths, setSchoolMonths] = useState<SchoolMonth[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<SchoolMonth | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [feeAmount, setFeeAmount] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [existingFees, setExistingFees] = useState<StudentFee[]>([]);
  const [allMonths, setAllMonths] = useState<SchoolMonth[]>([]);

  const fetchInitialData = async () => {
    try {
      // Fetch school years
      const { data: yearsData, error: yearsError } = await supabase
        .from('school_years')
        .select('*')
        .order('year', { ascending: false });

      if (yearsError) throw yearsError;

      // Fetch all months across all years
      const { data: monthsData, error: monthsError } = await supabase
        .from('school_months')
        .select(`
          *,
          school_years!inner(year)
        `)
        .order('school_years.year', { ascending: false })
        .order('month_number', { ascending: true });

      if (monthsError) throw monthsError;

      setSchoolYears(yearsData || []);
      setAllMonths(monthsData || []);
      
      // Auto-select active year
      const activeYear = yearsData?.find(year => year.is_active);
      if (activeYear) {
        setSelectedYear(activeYear);
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error("Failed to load years and months");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('full_name', { ascending: true });

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error("Failed to load students");
    }
  };

  const fetchExistingFees = async (monthId: string) => {
    try {
      const { data, error } = await supabase
        .from('student_fees')
        .select('*')
        .eq('school_month_id', monthId);

      if (error) throw error;
      setExistingFees(data || []);
    } catch (error) {
      console.error('Error fetching existing fees:', error);
      toast.error("Failed to load existing fees");
    }
  };

  useEffect(() => {
    fetchInitialData();
    fetchStudents();
  }, []);

  const handleMonthSelect = async (monthId: string) => {
    const month = allMonths.find(m => m.id === monthId);
    if (!month) return;

    setSelectedMonth(month);
    await fetchExistingFees(monthId);
    setSelectedStudents([]);
    setFeeAmount("");
  };

  const handleStudentSelection = (studentId: string, checked: boolean) => {
    if (checked) {
      setSelectedStudents(prev => [...prev, studentId]);
    } else {
      setSelectedStudents(prev => prev.filter(id => id !== studentId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const availableStudents = students.filter(student => 
        !existingFees.some(fee => fee.student_id === student.id)
      );
      setSelectedStudents(availableStudents.map(s => s.id));
    } else {
      setSelectedStudents([]);
    }
  };

  const handleAssignFees = async () => {
    if (!selectedMonth || selectedStudents.length === 0 || !feeAmount) {
      toast.error("Please select students and enter fee amount");
      return;
    }

    try {
      const feesToInsert = selectedStudents.map(studentId => ({
        student_id: studentId,
        school_month_id: selectedMonth.id,
        amount: parseFloat(feeAmount),
        status: 'pending'
      }));

      const { error: insertError } = await supabase
        .from('student_fees')
        .insert(feesToInsert);

      if (insertError) throw insertError;

      // Send notifications
      const { error: notifyError } = await supabase.functions.invoke('notify-fee-assignment', {
        body: { 
          studentFeeIds: feesToInsert.map((_, index) => selectedStudents[index])
        }
      });

      if (notifyError) {
        console.error('Error sending notifications:', notifyError);
      }

      toast.success(`Fees assigned to ${selectedStudents.length} students`);
      setSelectedStudents([]);
      setFeeAmount("");
      
      // Refresh existing fees for selected month
      if (selectedMonth) {
        await fetchExistingFees(selectedMonth.id);
      }
    } catch (error) {
      console.error('Error assigning fees:', error);
      toast.error("Failed to assign fees");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Monthly Fee Management</h2>
          <p className="text-muted-foreground">Select a month and assign fees to students</p>
        </div>
      </div>

      {/* Month Selection */}
      <Card className="bg-gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Select Month for Fee Assignment
          </CardTitle>
          <CardDescription>
            Choose a month to view and assign student fees
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-sm">
            <Label htmlFor="month-select">Available Months</Label>
            <Select 
              value={selectedMonth?.id || ""} 
              onValueChange={handleMonthSelect}
            >
              <SelectTrigger className="bg-background border-input z-50">
                <SelectValue placeholder="Select a month" />
              </SelectTrigger>
              <SelectContent className="bg-background border-input shadow-lg z-50">
                {allMonths.map((month) => (
                  <SelectItem 
                    key={month.id} 
                    value={month.id}
                    className="hover:bg-accent focus:bg-accent"
                  >
                    {month.month_name} {(month as any).school_years?.year} 
                    {month.is_active && " (Active)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Student Selection */}
      {selectedMonth && (
        <Card className="bg-gradient-card">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Assign Students - {selectedMonth.month_name} {(selectedMonth as any).school_years?.year}
                </CardTitle>
                <CardDescription>
                  Select students and set fee amount for {selectedMonth.month_name}
                </CardDescription>
              </div>
              <div className="flex gap-2 items-center">
                <div className="text-right">
                  <Label htmlFor="feeAmount" className="text-sm">Fee Amount (MVR)</Label>
                  <Input
                    id="feeAmount"
                    type="number"
                    placeholder="3500"
                    value={feeAmount}
                    onChange={(e) => setFeeAmount(e.target.value)}
                    className="w-32"
                  />
                </div>
                <Button 
                  onClick={handleAssignFees}
                  disabled={selectedStudents.length === 0 || !feeAmount}
                  className="flex items-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  Assign Fees ({selectedStudents.length})
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="selectAll"
                  checked={selectedStudents.length === students.filter(s => !existingFees.some(f => f.student_id === s.id)).length && students.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <Label htmlFor="selectAll">Select All Available Students</Label>
              </div>

              <div className="rounded-md border max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Select</TableHead>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => {
                      const hasExistingFee = existingFees.some(fee => fee.student_id === student.id);
                      const isSelected = selectedStudents.includes(student.id);
                      
                      return (
                        <TableRow key={student.id}>
                          <TableCell>
                            {hasExistingFee ? (
                              <Badge variant="default" className="bg-success text-success-foreground">Already Assigned</Badge>
                            ) : (
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={(checked) => handleStudentSelection(student.id, checked as boolean)}
                              />
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{student.student_id}</TableCell>
                          <TableCell>{student.full_name}</TableCell>
                          <TableCell>{student.class_name}</TableCell>
                          <TableCell>
                            {hasExistingFee ? (
                              <Badge variant="default" className="bg-success text-success-foreground">Fee Assigned</Badge>
                            ) : (
                              <Badge variant="secondary">Available</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};