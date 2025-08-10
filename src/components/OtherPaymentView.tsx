import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Calendar, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface OtherPayment {
  id: string;
  student_id: string;
  payment_name: string;
  amount: number;
  status: string;
  created_at: string;
  payment_date?: string;
  transaction_id?: string;
}

interface OtherPaymentViewProps {
  studentId: string;
  studentName: string;
  onPayment?: (paymentId: string, studentName: string, paymentName: string, amount: number) => void;
}

export const OtherPaymentView = ({ studentId, studentName, onPayment }: OtherPaymentViewProps) => {
  const [open, setOpen] = useState(false);
  const [otherPayments, setOtherPayments] = useState<OtherPayment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchOtherPayments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('other_payments')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOtherPayments(data || []);
    } catch (error) {
      console.error('Error fetching other payments:', error);
      toast.error("Failed to load other payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchOtherPayments();
    }
  }, [open, studentId]);

  const handlePayment = (payment: OtherPayment) => {
    if (onPayment) {
      onPayment(payment.id, studentName, payment.payment_name, payment.amount);
    }
    setOpen(false);
  };

  const pendingPayments = otherPayments.filter(p => p.status === 'pending');
  const paidPayments = otherPayments.filter(p => p.status === 'paid');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          View Other Payment
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Other Payments - {studentName}
          </DialogTitle>
          <DialogDescription>
            View all other payments (activity fees, uniform fees, etc.) for this student
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center">Loading payments...</div>
        ) : (
          <div className="space-y-6">
            {/* Pending Payments */}
            {pendingPayments.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">Pending Payments</h3>
                  <Badge variant="secondary" className="bg-warning text-warning-foreground">
                    {pendingPayments.length} unpaid
                  </Badge>
                </div>
                
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Payment Name</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Assigned Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">{payment.payment_name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              MVR {payment.amount.toLocaleString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(payment.created_at).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-warning text-warning-foreground">
                              {payment.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              onClick={() => handlePayment(payment)}
                              size="sm"
                              className="flex items-center gap-2"
                            >
                              <CreditCard className="h-4 w-4" />
                              Pay Now
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Payment History */}
            {paidPayments.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">Payment History</h3>
                  <Badge variant="default" className="bg-success text-success-foreground">
                    {paidPayments.length} paid
                  </Badge>
                </div>
                
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Payment Name</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Paid Date</TableHead>
                        <TableHead>Transaction ID</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paidPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">{payment.payment_name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              MVR {payment.amount.toLocaleString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {payment.payment_date 
                                ? new Date(payment.payment_date).toLocaleDateString()
                                : 'N/A'
                              }
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="text-sm bg-muted px-2 py-1 rounded">
                              {payment.transaction_id || 'N/A'}
                            </code>
                          </TableCell>
                          <TableCell>
                            <Badge variant="default" className="bg-success text-success-foreground">
                              {payment.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* No Payments */}
            {otherPayments.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No other payments assigned for this student</p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};