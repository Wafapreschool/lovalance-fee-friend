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
  const [schoolMonths, setSchoolMonths] = useState<SchoolMonth[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [feeAmount, setFeeAmount] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [existingFees, setExistingFees] = useState<StudentFee[]>([]);
  const [activeMonth, setActiveMonth] = useState<string | null>(null);
  const [processingFees, setProcessingFees] = useState(false);

  const fetchInitialData = async () => {
    try {
      // Fetch school years
      const { data: yearsData, error: yearsError } = await supabase
        .from('school_years')
        .select('*')
        .order('year', { ascending: false });

      if (yearsError) throw yearsError;

      // Fetch all months with their school year info
      const { data: monthsData, error: monthsError } = await supabase
        .from('school_months')
        .select(`
          *,
          school_years!inner(year)
        `)
        .order('school_years.year', { ascending: false })
        .order('month_number', { ascending: true });

      if (monthsError) throw monthsError;

      // Fetch all students
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .order('full_name', { ascending: true });

      if (studentsError) throw studentsError;

      setSchoolYears(yearsData || []);
      setSchoolMonths(monthsData || []);
      setStudents(studentsData || []);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
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
  }, []);

  const handleMonthClick = async (monthId: string) => {
    if (activeMonth === monthId) {
      // Close if clicking the same month
      setActiveMonth(null);
      setSelectedStudents([]);
      setFeeAmount("");
      setExistingFees([]);
    } else {
      // Open new month
      setActiveMonth(monthId);
      await fetchExistingFees(monthId);
      setSelectedStudents([]);
      setFeeAmount("");
    }
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
    if (!activeMonth || selectedStudents.length === 0 || !feeAmount) {
      toast.error("Please select students and enter fee amount");
      return;
    }

    setProcessingFees(true);
    try {
      const feesToInsert = selectedStudents.map(studentId => ({
        student_id: studentId,
        school_month_id: activeMonth,
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
      
      // Refresh existing fees for active month
      await fetchExistingFees(activeMonth);
    } catch (error) {
      console.error('Error assigning fees:', error);
      toast.error("Failed to assign fees");
    } finally {
      setProcessingFees(false);
    }
  };

  const getMonthsForYear = (yearId: string) => {
    return schoolMonths.filter(month => month.school_year_id === yearId);
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
      <div>
        <h2 className="text-2xl font-bold">Monthly Fee Management</h2>
        <p className="text-muted-foreground">Manage monthly fees by academic year and assign to students</p>
      </div>

      {schoolYears.map((year) => {
        const yearMonths = getMonthsForYear(year.id);
        
        return (
          <Card key={year.id} className="bg-gradient-card">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-xl">Academic Year {year.year}</CardTitle>
                  <CardDescription>
                    {yearMonths.length} month{yearMonths.length !== 1 ? 's' : ''} configured
                  </CardDescription>
                </div>
                {year.is_active && (
                  <Badge variant="default" className="bg-success text-success-foreground">Active</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {yearMonths.length > 0 ? (
                <div className="space-y-3">
                  {yearMonths.map((month) => (
                    <div key={month.id} className="border rounded-lg p-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <h4 className="font-semibold">{month.month_name}</h4>
                          <Badge variant="outline">
                            Due: {new Date(month.due_date).toLocaleDateString()}
                          </Badge>
                          {month.is_active && (
                            <Badge variant="default" className="bg-success text-success-foreground">Active</Badge>
                          )}
                        </div>
                        <Button
                          variant={activeMonth === month.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleMonthClick(month.id)}
                          className="flex items-center gap-2"
                        >
                          <Users className="h-4 w-4" />
                          {activeMonth === month.id ? "Hide Students" : "Assign Students"}
                        </Button>
                      </div>

                      {/* Student Selection Section */}
                      {activeMonth === month.id && (
                        <div className="border-t pt-4 space-y-4">
                          <div className="flex justify-between items-center">
                            <h5 className="font-medium">Assign Students to {month.month_name}</h5>
                            <div className="flex gap-2 items-center">
                              <div className="text-right">
                                <Label htmlFor={`feeAmount-${month.id}`} className="text-sm">Fee Amount (MVR)</Label>
                                <Input
                                  id={`feeAmount-${month.id}`}
                                  type="number"
                                  placeholder="3500"
                                  value={feeAmount}
                                  onChange={(e) => setFeeAmount(e.target.value)}
                                  className="w-32"
                                />
                              </div>
                              <Button 
                                onClick={handleAssignFees}
                                disabled={selectedStudents.length === 0 || !feeAmount || processingFees}
                                className="flex items-center gap-2"
                              >
                                <Check className="h-4 w-4" />
                                {processingFees ? "Assigning..." : `Assign Fees (${selectedStudents.length})`}
                              </Button>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`selectAll-${month.id}`}
                              checked={selectedStudents.length === students.filter(s => !existingFees.some(f => f.student_id === s.id)).length && students.length > 0}
                              onCheckedChange={handleSelectAll}
                            />
                            <Label htmlFor={`selectAll-${month.id}`}>Select All Available Students</Label>
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
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No months configured for this year</p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};