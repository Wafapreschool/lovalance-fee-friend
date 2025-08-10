import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { CreditCard, Check, Edit, Trash2 } from "lucide-react";
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

interface OtherPayment {
  id: string;
  student_id: string;
  payment_name: string;
  amount: number;
  status: string;
  created_at: string;
}

export const OtherPaymentAssignment = () => {
  const [open, setOpen] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [paymentName, setPaymentName] = useState<string>("");
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [existingPayments, setExistingPayments] = useState<OtherPayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingPayments, setProcessingPayments] = useState(false);
  const [editingPayment, setEditingPayment] = useState<OtherPayment | null>(null);
  const [editAmount, setEditAmount] = useState<string>("");
  const [editName, setEditName] = useState<string>("");

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

  const fetchExistingPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('other_payments')
        .select('*');

      if (error) throw error;
      setExistingPayments(data || []);
    } catch (error) {
      console.error('Error fetching existing payments:', error);
      toast.error("Failed to load existing payments");
    }
  };

  useEffect(() => {
    if (open) {
      setLoading(true);
      Promise.all([fetchStudents(), fetchExistingPayments()])
        .finally(() => setLoading(false));
    }
  }, [open]);

  const handleStudentSelection = (studentId: string, checked: boolean) => {
    if (checked) {
      setSelectedStudents(prev => [...prev, studentId]);
    } else {
      setSelectedStudents(prev => prev.filter(id => id !== studentId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStudents(students.map(s => s.id));
    } else {
      setSelectedStudents([]);
    }
  };

  const handleAssignPayments = async () => {
    if (selectedStudents.length === 0 || !paymentAmount || !paymentName) {
      toast.error("Please enter payment name, amount, and select students");
      return;
    }

    setProcessingPayments(true);
    try {
      const paymentsToInsert = selectedStudents.map(studentId => ({
        student_id: studentId,
        payment_name: paymentName,
        amount: parseFloat(paymentAmount),
        status: 'pending'
      }));

      const { error: insertError } = await supabase
        .from('other_payments')
        .insert(paymentsToInsert);

      if (insertError) throw insertError;

      toast.success(`Other payments assigned to ${selectedStudents.length} students`);
      setSelectedStudents([]);
      setPaymentAmount("");
      setPaymentName("");
      
      // Refresh existing payments
      await fetchExistingPayments();
    } catch (error) {
      console.error('Error assigning payments:', error);
      toast.error("Failed to assign payments");
    } finally {
      setProcessingPayments(false);
    }
  };

  const handleEditPayment = async () => {
    if (!editingPayment || !editAmount || !editName) {
      toast.error("Please enter valid payment name and amount");
      return;
    }

    try {
      const { error } = await supabase
        .from('other_payments')
        .update({ 
          amount: parseFloat(editAmount),
          payment_name: editName
        })
        .eq('id', editingPayment.id);

      if (error) throw error;

      toast.success("Payment updated successfully");
      setEditingPayment(null);
      setEditAmount("");
      setEditName("");
      await fetchExistingPayments();
    } catch (error) {
      console.error('Error updating payment:', error);
      toast.error("Failed to update payment");
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    try {
      const { error } = await supabase
        .from('other_payments')
        .delete()
        .eq('id', paymentId);

      if (error) throw error;

      toast.success("Payment deleted successfully");
      await fetchExistingPayments();
    } catch (error) {
      console.error('Error deleting payment:', error);
      toast.error("Failed to delete payment");
    }
  };

  const startEditPayment = (payment: OtherPayment) => {
    setEditingPayment(payment);
    setEditAmount(payment.amount.toString());
    setEditName(payment.payment_name);
  };

  const getStudentPayments = (studentId: string) => {
    return existingPayments.filter(payment => payment.student_id === studentId);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className="flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          Other Payment
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assign Other Payment</DialogTitle>
          <DialogDescription>
            Assign custom payments (Activity Fee, Uniform Fee, etc.) to students
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center">Loading students...</div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div>
                  <Label htmlFor="paymentName">Payment Name</Label>
                  <Input
                    id="paymentName"
                    type="text"
                    placeholder="e.g., Activity Fee, Uniform Fee"
                    value={paymentName}
                    onChange={(e) => setPaymentName(e.target.value)}
                    className="w-48"
                  />
                </div>
                <div>
                  <Label htmlFor="paymentAmount">Amount (MVR)</Label>
                  <Input
                    id="paymentAmount"
                    type="number"
                    placeholder="500"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-32"
                  />
                </div>
                <Button 
                  onClick={handleAssignPayments}
                  disabled={selectedStudents.length === 0 || !paymentAmount || !paymentName || processingPayments}
                  className="flex items-center gap-2 mt-6"
                >
                  <Check className="h-4 w-4" />
                  {processingPayments ? "Assigning..." : `Assign Payment (${selectedStudents.length})`}
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">
                {existingPayments.length} total payments assigned
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="selectAll"
                checked={selectedStudents.length === students.length && students.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <Label htmlFor="selectAll">Select All Students</Label>
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
                    <TableHead>Existing Payments</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => {
                    const studentPayments = getStudentPayments(student.id);
                    const isSelected = selectedStudents.includes(student.id);
                    
                    return (
                      <TableRow key={student.id}>
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleStudentSelection(student.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{student.student_id}</TableCell>
                        <TableCell>{student.full_name}</TableCell>
                        <TableCell>{student.class_name}</TableCell>
                        <TableCell>{student.year_joined}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {studentPayments.map((payment) => (
                              <Badge 
                                key={payment.id} 
                                variant={payment.status === 'paid' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {payment.payment_name}: MVR {payment.amount}
                              </Badge>
                            ))}
                            {studentPayments.length === 0 && (
                              <span className="text-muted-foreground text-sm">No payments</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {studentPayments.map((payment) => (
                              <div key={payment.id} className="flex gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => startEditPayment(payment)}
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
                                      <AlertDialogTitle>Delete Payment Assignment</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete the {payment.payment_name} assignment for {student.full_name}? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeletePayment(payment.id)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Edit Payment Dialog */}
        {editingPayment && (
          <Dialog open={!!editingPayment} onOpenChange={(open) => !open && setEditingPayment(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Payment</DialogTitle>
                <DialogDescription>
                  Update the payment details for {students.find(s => s.id === editingPayment.student_id)?.full_name}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="editName">Payment Name</Label>
                  <Input
                    id="editName"
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Enter payment name"
                  />
                </div>
                <div>
                  <Label htmlFor="editAmount">Amount (MVR)</Label>
                  <Input
                    id="editAmount"
                    type="number"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    placeholder="Enter amount"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setEditingPayment(null)}>
                    Cancel
                  </Button>
                  <Button onClick={handleEditPayment}>
                    Update Payment
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