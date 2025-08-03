import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [showMonthsDialog, setShowMonthsDialog] = useState(false);
  const [showStudentsDialog, setShowStudentsDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'month' | 'fee', id: string } | null>(null);
  const [existingFees, setExistingFees] = useState<StudentFee[]>([]);

  const fetchSchoolYears = async () => {
    try {
      const { data, error } = await supabase
        .from('school_years')
        .select('*')
        .order('year', { ascending: false });

      if (error) throw error;
      setSchoolYears(data || []);
    } catch (error) {
      console.error('Error fetching school years:', error);
      toast.error("Failed to load school years");
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthsForYear = async (yearId: string) => {
    try {
      const { data, error } = await supabase
        .from('school_months')
        .select('*')
        .eq('school_year_id', yearId)
        .order('month_number', { ascending: true });

      if (error) throw error;
      setSchoolMonths(data || []);
    } catch (error) {
      console.error('Error fetching months:', error);
      toast.error("Failed to load months");
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
    fetchSchoolYears();
    fetchStudents();
  }, []);

  const handleViewMonths = async (year: SchoolYear) => {
    setSelectedYear(year);
    await fetchMonthsForYear(year.id);
    setShowMonthsDialog(true);
  };

  const handleAddMonth = async () => {
    if (!selectedYear) return;

    const monthName = prompt("Enter month name (e.g., January, February):");
    if (!monthName) return;

    const monthNumber = prompt("Enter month number (1-12):");
    if (!monthNumber) return;

    const dueDate = prompt("Enter due date (YYYY-MM-DD):");
    if (!dueDate) return;

    try {
      const { error } = await supabase
        .from('school_months')
        .insert({
          month_name: monthName,
          month_number: parseInt(monthNumber),
          due_date: dueDate,
          school_year_id: selectedYear.id,
          is_active: true
        });

      if (error) throw error;
      toast.success("Month added successfully");
      fetchMonthsForYear(selectedYear.id);
    } catch (error) {
      console.error('Error adding month:', error);
      toast.error("Failed to add month");
    }
  };

  const handleSelectStudentsForMonth = async (month: SchoolMonth) => {
    setSelectedMonth(month);
    await fetchExistingFees(month.id);
    setShowStudentsDialog(true);
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
      setShowStudentsDialog(false);
      setSelectedStudents([]);
      setFeeAmount("");
    } catch (error) {
      console.error('Error assigning fees:', error);
      toast.error("Failed to assign fees");
    }
  };

  const handleDeleteItem = (type: 'month' | 'fee', id: string) => {
    setItemToDelete({ type, id });
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      if (itemToDelete.type === 'month') {
        const { error } = await supabase
          .from('school_months')
          .delete()
          .eq('id', itemToDelete.id);

        if (error) throw error;
        toast.success("Month deleted successfully");
        if (selectedYear) {
          fetchMonthsForYear(selectedYear.id);
        }
      }
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error("Failed to delete item");
    } finally {
      setShowDeleteDialog(false);
      setItemToDelete(null);
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
          <p className="text-muted-foreground">Manage monthly fees by academic year and assign to students</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {schoolYears.map((year) => (
          <Card key={year.id} className="bg-gradient-card">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Academic Year {year.year}</CardTitle>
                {year.is_active && (
                  <Badge variant="default" className="bg-success text-success-foreground">Active</Badge>
                )}
              </div>
              <CardDescription>
                Manage monthly fees for {year.year}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                className="w-full flex items-center gap-2"
                onClick={() => handleViewMonths(year)}
              >
                <Calendar className="h-4 w-4" />
                Manage Months
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Months Dialog */}
      <Dialog open={showMonthsDialog} onOpenChange={setShowMonthsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Months - Academic Year {selectedYear?.year}
            </DialogTitle>
            <DialogDescription>
              Manage monthly fee periods for {selectedYear?.year}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                {schoolMonths.length} month{schoolMonths.length !== 1 ? 's' : ''} configured
              </div>
              <Button 
                variant="default" 
                size="sm"
                onClick={handleAddMonth}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Month
              </Button>
            </div>

            {schoolMonths.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schoolMonths.map((month) => (
                      <TableRow key={month.id}>
                        <TableCell className="font-medium">{month.month_name}</TableCell>
                        <TableCell>{new Date(month.due_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {month.is_active ? (
                            <Badge variant="default" className="bg-success text-success-foreground">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSelectStudentsForMonth(month)}
                              className="flex items-center gap-2"
                            >
                              <Users className="h-4 w-4" />
                              Assign Students
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteItem('month', month.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No months configured for this year</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Students Selection Dialog */}
      <Dialog open={showStudentsDialog} onOpenChange={setShowStudentsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Assign Students - {selectedMonth?.month_name} {selectedYear?.year}
            </DialogTitle>
            <DialogDescription>
              Select students and set fee amount for {selectedMonth?.month_name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="feeAmount">Fee Amount (MVR)</Label>
                <Input
                  id="feeAmount"
                  type="number"
                  placeholder="3500"
                  value={feeAmount}
                  onChange={(e) => setFeeAmount(e.target.value)}
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
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {itemToDelete?.type === 'month' ? 'Month' : 'Fee'}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this {itemToDelete?.type}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};