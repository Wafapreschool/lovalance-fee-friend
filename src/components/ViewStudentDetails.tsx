import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Copy, RefreshCw, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Student } from "./StudentCard";

interface ViewStudentDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string | null;
  onStudentUpdated: () => void;
}

export const ViewStudentDetails = ({ open, onOpenChange, studentId, onStudentUpdated }: ViewStudentDetailsProps) => {
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

  const fetchStudentDetails = async () => {
    if (!studentId) return;

    setLoading(true);
    try {
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();

      if (studentError) {
        console.error('Error fetching student:', studentError);
        toast.error("Failed to load student details");
        return;
      }

      const { data: feesData, error: feesError } = await supabase
        .from('fees')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (feesError) {
        console.error('Error fetching fees:', feesError);
      }

      setStudent({
        ...studentData,
        fees: feesData || []
      });
    } catch (error) {
      console.error('Error:', error);
      toast.error("An error occurred while loading student details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && studentId) {
      fetchStudentDetails();
    }
  }, [open, studentId]);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const generateNewPassword = () => {
    return Math.random().toString(36).slice(-8);
  };

  const resetPassword = async () => {
    if (!student) return;

    setResettingPassword(true);
    try {
      const newPassword = generateNewPassword();
      
      const { error } = await supabase
        .from('students')
        .update({ password: newPassword })
        .eq('id', student.id);

      if (error) {
        console.error('Error resetting password:', error);
        toast.error("Failed to reset password");
        return;
      }

      setStudent({ ...student, password: newPassword });
      toast.success(`Password reset successfully! New password: ${newPassword}`);
      onStudentUpdated();
    } catch (error) {
      console.error('Error:', error);
      toast.error("An error occurred while resetting password");
    } finally {
      setResettingPassword(false);
    }
  };

  if (!student && !loading) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Student Details</DialogTitle>
          <DialogDescription>
            View complete student information and manage credentials.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-4">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                    <p className="font-semibold">{student?.full_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Class</label>
                    <Badge variant="secondary">{student?.class_name}</Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Year Joined</label>
                    <p>{student?.year_joined}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Parent Phone</label>
                    <p>{student?.parent_phone}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Login Credentials */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Login Credentials</CardTitle>
                <CardDescription>Student login information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Student ID</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                      {student?.student_id}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(student?.student_id, "Student ID")}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Password</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                      {showPassword ? student?.password : "••••••••"}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(student?.password, "Password")}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={resetPassword}
                  disabled={resettingPassword}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${resettingPassword ? 'animate-spin' : ''}`} />
                  {resettingPassword ? "Resetting..." : "Reset Password"}
                </Button>
              </CardContent>
            </Card>

            {/* Fee History */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Fee History</CardTitle>
                <CardDescription>Payment records</CardDescription>
              </CardHeader>
              <CardContent>
                {student?.fees?.length > 0 ? (
                  <div className="space-y-2">
                    {student.fees.slice(0, 5).map((fee: any) => (
                      <div key={fee.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                        <div>
                          <p className="font-medium">{fee.month} {fee.year}</p>
                          <p className="text-sm text-muted-foreground">MVR {fee.amount}</p>
                        </div>
                        <Badge variant={fee.status === 'paid' ? 'default' : fee.status === 'pending' ? 'secondary' : 'destructive'}>
                          {fee.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">No fee records found</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        <div className="flex-shrink-0 flex justify-end pt-4 border-t">
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};