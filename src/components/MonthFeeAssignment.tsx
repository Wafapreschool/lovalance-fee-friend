import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Users, Check } from "lucide-react";
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
                          {hasExistingFee ? (
                            <Badge variant="default" className="bg-success text-success-foreground">
                              Fee Assigned
                            </Badge>
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
      </DialogContent>
    </Dialog>
  );
};