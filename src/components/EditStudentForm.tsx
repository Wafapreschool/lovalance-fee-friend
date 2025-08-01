import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface EditStudentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStudentUpdated: () => void;
  studentId: string | null;
}

export const EditStudentForm = ({ open, onOpenChange, onStudentUpdated, studentId }: EditStudentFormProps) => {
  const [formData, setFormData] = useState({
    full_name: "",
    class_name: "",
    year_joined: new Date().getFullYear(),
    parent_phone: "",
    student_id: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);

  const generatePassword = () => {
    return Math.random().toString(36).slice(-8);
  };

  const fetchStudentData = async () => {
    if (!studentId) return;
    
    setFetchingData(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();

      if (error) {
        console.error('Error fetching student:', error);
        toast.error("Failed to load student data");
        return;
      }

      if (data) {
        setFormData({
          full_name: data.full_name,
          class_name: data.class_name,
          year_joined: data.year_joined,
          parent_phone: data.parent_phone,
          student_id: data.student_id,
          password: data.password
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error("An error occurred while loading student data");
    } finally {
      setFetchingData(false);
    }
  };

  useEffect(() => {
    if (open && studentId) {
      fetchStudentData();
    }
  }, [open, studentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.full_name || !formData.class_name || !formData.parent_phone) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!studentId) {
      toast.error("Student ID is required");
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('students')
        .update({
          full_name: formData.full_name,
          class_name: formData.class_name,
          year_joined: formData.year_joined,
          parent_phone: formData.parent_phone,
          password: formData.password || generatePassword()
        })
        .eq('id', studentId);

      if (error) {
        console.error('Error updating student:', error);
        toast.error("Failed to update student");
        return;
      }

      toast.success("Student updated successfully!");
      onStudentUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error:', error);
      toast.error("An error occurred while updating student");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Student</DialogTitle>
          <DialogDescription>
            Update student details and information.
          </DialogDescription>
        </DialogHeader>
        
        {fetchingData ? (
          <div className="space-y-4">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-10 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Enter student's full name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="student_id">Student ID</Label>
              <Input
                id="student_id"
                value={formData.student_id}
                placeholder="Student ID"
                readOnly
                disabled
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="class_name">Class *</Label>
              <Select value={formData.class_name} onValueChange={(value) => setFormData({ ...formData, class_name: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KG1">KG1</SelectItem>
                  <SelectItem value="KG2">KG2</SelectItem>
                  <SelectItem value="Nursery">Nursery</SelectItem>
                  <SelectItem value="Pre-KG">Pre-KG</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="year_joined">Year Joined</Label>
              <Input
                id="year_joined"
                type="number"
                value={formData.year_joined}
                onChange={(e) => setFormData({ ...formData, year_joined: parseInt(e.target.value) })}
                min="2020"
                max="2030"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parent_phone">Parent Phone *</Label>
              <Input
                id="parent_phone"
                value={formData.parent_phone}
                onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                placeholder="Parent's phone number"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Student password"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to generate a new password
              </p>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Updating..." : "Update Student"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};