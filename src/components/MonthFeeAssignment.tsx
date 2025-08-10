import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Users, Check, Edit, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

interface SchoolMonth {
  id: string;
  month_name: string;
  month_number: number;
  due_date: string;
  is_active: boolean;
  school_year_id: string;
}

interface MonthFeeAssignmentProps {
  month: SchoolMonth;
}

export const MonthFeeAssignment = ({ month }: MonthFeeAssignmentProps) => {
  const [open, setOpen] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [feeAmount, setFeeAmount] = useState<string>("");
  const [existingFees, setExistingFees] = useState<StudentFee[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingFees, setProcessingFees] = useState(false);
  const [editingFee, setEditingFee] = useState<StudentFee | null>(null);
  const [editAmount, setEditAmount] = useState<string>("");

  const fetchStudents = async () => {
    try {
      // First get the school year for this month
      const { data: monthData, error: monthError } = await supabase
        .from('school_months')
        .select('school_year_id, school_years!inner(year)')
        .eq('id', month.id)
        .single();

      if (monthError) throw monthError;

      // Then fetch only students for that year
      const yearNumber = (monthData as any).school_years.year;
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('year_joined', yearNumber)
        .order('full_name', { ascending: true });

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error("Failed to load students");
    }
  };

  const fetchExistingFees = async () => {
    try {
      const { data, error } = await supabase
        .from('student_fees')
        .select('*')
        .eq('school_month_id', month.id);

      if (error) throw error;
      setExistingFees(data || []);
    } catch (error) {
      console.error('Error fetching existing fees:', error);
      toast.error("Failed to load existing fees");
    }
  };

  useEffect(() => {
    if (open) {
      setLoading(true);
      Promise.all([fetchStudents(), fetchExistingFees()])
        .finally(() => setLoading(false));
    }
  }, [open, month.id]);

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
    if (selectedStudents.length === 0 || !feeAmount) {
      toast.error("Please select students and enter fee amount");
      return;
    }

    setProcessingFees(true);
    try {
      const feesToInsert = selectedStudents.map(studentId => ({
        student_id: studentId,
        school_month_id: month.id,
        amount: parseFloat(feeAmount),
        status: 'pending'
      }));

      const { error: insertError } = await supabase
        .from('student_fees')
        .insert(feesToInsert);

      if (insertError) throw insertError;

      // Send notifications
      try {
        await supabase.functions.invoke('notify-fee-assignment', {
          body: { 
            studentFeeIds: feesToInsert.map((_, index) => selectedStudents[index])
          }
        });
      } catch (notifyError) {
        console.error('Error sending notifications:', notifyError);
      }

      toast.success(`Fees assigned to ${selectedStudents.length} students`);
      setSelectedStudents([]);
      setFeeAmount("");
      
      // Refresh existing fees
      await fetchExistingFees();
    } catch (error) {
      console.error('Error assigning fees:', error);
      toast.error("Failed to assign fees");
    } finally {
      setProcessingFees(false);
    }
  };

  const handleEditFee = async () => {
    if (!editingFee || !editAmount) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      const { error } = await supabase
        .from('student_fees')
        .update({ amount: parseFloat(editAmount) })
        .eq('id', editingFee.id);

      if (error) throw error;

      toast.success("Fee amount updated successfully");
      setEditingFee(null);
      setEditAmount("");
      await fetchExistingFees();
    } catch (error) {
      console.error('Error updating fee:', error);
      toast.error("Failed to update fee");
    }
  };

  const handleDeleteFee = async (feeId: string) => {
    try {
      const { error } = await supabase
        .from('student_fees')
        .delete()
        .eq('id', feeId);

      if (error) throw error;

      toast.success("Fee deleted successfully");
      await fetchExistingFees();
    } catch (error) {
      console.error('Error deleting fee:', error);
      toast.error("Failed to delete fee");
    }
  };

  const startEditFee = (fee: StudentFee) => {
    setEditingFee(fee);
    setEditAmount(fee.amount.toString());
  };

  const availableStudents = students.filter(student => 
    !existingFees.some(fee => fee.student_id === student.id)
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Assign Students ({existingFees.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assign Students to {month.month_name}</DialogTitle>
          <DialogDescription>
            Select students and set the fee amount for {month.month_name}. 
            Due date: {new Date(month.due_date).toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center">Loading students...</div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div>
                  <Label htmlFor="feeAmount">Fee Amount (MVR)</Label>
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
                  disabled={selectedStudents.length === 0 || !feeAmount || processingFees}
                  className="flex items-center gap-2 mt-6"
                >
                  <Check className="h-4 w-4" />
                  {processingFees ? "Assigning..." : `Assign Fees (${selectedStudents.length})`}
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">
                {existingFees.length} already assigned, {availableStudents.length} available
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="selectAll"
                checked={selectedStudents.length === availableStudents.length && availableStudents.length > 0}
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
                    <TableHead>Year Joined</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => {
                    const existingFee = existingFees.find(fee => fee.student_id === student.id);
                    const isSelected = selectedStudents.includes(student.id);
                    
                    return (
                      <TableRow key={student.id}>
                        <TableCell>
                          {existingFee ? (
                            <Badge variant="default" className="bg-success text-success-foreground">
                              Assigned
                            </Badge>
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
                        <TableCell>{student.year_joined}</TableCell>
                        <TableCell>
                          {existingFee ? (
                            <Badge variant="default" className="bg-success text-success-foreground">
                              Fee Assigned (MVR {existingFee.amount})
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Available</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {existingFee && (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => startEditFee(existingFee)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Fee Assignment</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete the fee assignment for {student.full_name}? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteFee(existingFee.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
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

        {/* Edit Fee Dialog */}
        {editingFee && (
          <Dialog open={!!editingFee} onOpenChange={(open) => !open && setEditingFee(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Fee Amount</DialogTitle>
                <DialogDescription>
                  Update the fee amount for {students.find(s => s.id === editingFee.student_id)?.full_name}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="editAmount">Fee Amount (MVR)</Label>
                  <Input
                    id="editAmount"
                    type="number"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    placeholder="Enter new amount"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setEditingFee(null)}>
                    Cancel
                  </Button>
                  <Button onClick={handleEditFee}>
                    Update Fee
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
};