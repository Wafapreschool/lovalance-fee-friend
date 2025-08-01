import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FeeRecord {
  id: string;
  student_name: string;
  student_id: string;
  class_name: string;
  month: string;
  year: number;
  amount: number;
  status: 'pending' | 'paid' | 'overdue';
  due_date: string;
  payment_date?: string;
  transaction_id?: string;
}

interface FeeManagementProps {
  onRefresh?: () => void;
}

export const FeeManagement = ({ onRefresh }: FeeManagementProps) => {
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFees = async () => {
    try {
      const { data, error } = await supabase
        .from('student_fees')
        .select(`
          *,
          students!inner(
            student_id,
            full_name,
            class_name
          ),
          school_months!inner(
            month_name,
            due_date,
            school_years!inner(year)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching fees:', error);
        toast.error("Failed to load fees");
        return;
      }

      const transformedFees: FeeRecord[] = (data || []).map(fee => ({
        id: fee.id,
        student_name: fee.students.full_name,
        student_id: fee.students.student_id,
        class_name: fee.students.class_name,
        month: fee.school_months.month_name,
        year: fee.school_months.school_years.year,
        amount: fee.amount,
        status: (fee.status as 'pending' | 'paid' | 'overdue') || 'pending',
        due_date: fee.school_months.due_date,
        payment_date: fee.payment_date,
        transaction_id: fee.transaction_id
      }));

      setFees(transformedFees);
    } catch (error) {
      console.error('Error:', error);
      toast.error("An error occurred while loading fees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFees();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="default" className="bg-success text-success-foreground">Paid</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-warning text-warning-foreground">Pending</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const markAsPaid = async (feeId: string) => {
    try {
      const { error } = await supabase
        .from('student_fees')
        .update({
          status: 'paid',
          payment_date: new Date().toISOString(),
          transaction_id: `MAN${Date.now()}`
        })
        .eq('id', feeId);

      if (error) {
        console.error('Error updating fee:', error);
        toast.error("Failed to update fee status");
        return;
      }

      toast.success("Fee marked as paid");
      fetchFees();
      onRefresh?.();
    } catch (error) {
      console.error('Error:', error);
      toast.error("An error occurred while updating fee");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fee Management</CardTitle>
        <CardDescription>Track and manage student fee payments</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fees.length > 0 ? (
                fees.map((fee) => (
                  <TableRow key={fee.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{fee.student_name}</div>
                        <div className="text-sm text-muted-foreground">{fee.student_id}</div>
                      </div>
                    </TableCell>
                    <TableCell>{fee.class_name}</TableCell>
                    <TableCell>{fee.month} {fee.year}</TableCell>
                    <TableCell>MVR {fee.amount.toLocaleString()}</TableCell>
                    <TableCell>{getStatusBadge(fee.status)}</TableCell>
                    <TableCell>{new Date(fee.due_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {fee.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => markAsPaid(fee.id)}
                        >
                          Mark Paid
                        </Button>
                      )}
                      {fee.status === 'paid' && fee.payment_date && (
                        <div className="text-sm text-muted-foreground">
                          Paid: {new Date(fee.payment_date).toLocaleDateString()}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <p className="text-muted-foreground">No fee records found</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};