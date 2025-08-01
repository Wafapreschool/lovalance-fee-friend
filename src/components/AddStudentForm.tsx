import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AddStudentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStudentAdded: () => void;
}

export const AddStudentForm = ({ open, onOpenChange, onStudentAdded }: AddStudentFormProps) => {
  const [formData, setFormData] = useState({
    full_name: "",
    class_name: "",
    year_joined: new Date().getFullYear(),
    parent_phone: "",
    student_id: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);

  const generateStudentId = (fullName: string) => {
    const names = fullName.trim().split(' ');
    const secondName = names.length > 1 ? names[1] : names[0];
    const timestamp = Date.now().toString().slice(-4);
    return `${secondName.toLowerCase()}${timestamp}`;
  };

  const generatePassword = () => {
    return Math.random().toString(36).slice(-8);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.full_name || !formData.class_name || !formData.parent_phone) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    
    try {
      const studentId = formData.student_id || generateStudentId(formData.full_name);
      const password = formData.password || generatePassword();

      const { error } = await supabase
        .from('students')
        .insert([{
          student_id: studentId,
          full_name: formData.full_name,
          class_name: formData.class_name,
          year_joined: formData.year_joined,
          parent_phone: formData.parent_phone,
          password: password
        }]);

      if (error) {
        console.error('Error adding student:', error);
        toast.error("Failed to add student");
        return;
      }

      toast.success(`Student added successfully! ID: ${studentId}, Password: ${password}`);
      setFormData({
        full_name: "",
        class_name: "",
        year_joined: new Date().getFullYear(),
        parent_phone: "",
        student_id: "",
        password: ""
      });
      onStudentAdded();
      onOpenChange(false);
    } catch (error) {
      console.error('Error:', error);
      toast.error("An error occurred while adding student");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Student</DialogTitle>
          <DialogDescription>
            Enter student details to create a new registration.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name *</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => {
                const newName = e.target.value;
                setFormData({ 
                  ...formData, 
                  full_name: newName,
                  student_id: newName ? generateStudentId(newName) : ""
                });
              }}
              placeholder="Enter student's full name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="student_id">Student ID</Label>
            <Input
              id="student_id"
              value={formData.student_id}
              onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
              placeholder="Auto-generated from name"
              readOnly
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
            <Label htmlFor="password">Password (optional)</Label>
            <Input
              id="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Leave empty for auto-generated password"
            />
            <p className="text-xs text-muted-foreground">
              If left empty, a password will be automatically generated
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Student"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};