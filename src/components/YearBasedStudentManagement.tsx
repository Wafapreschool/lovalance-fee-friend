import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Users, Eye, Edit, Trash2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AddStudentForm } from "./AddStudentForm";
import { EditStudentForm } from "./EditStudentForm";
import { ViewStudentDetails } from "./ViewStudentDetails";

interface Student {
  id: string;
  student_id: string;
  full_name: string;
  class_name: string;
  parent_phone: string;
  parent_email?: string;
  year_joined: number;
  created_at: string;
}

interface SchoolYear {
  id: string;
  year: number;
  is_active: boolean;
  created_at: string;
}

export const YearBasedStudentManagement = () => {
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
  const [selectedYear, setSelectedYear] = useState<SchoolYear | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [showStudentsDialog, setShowStudentsDialog] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showViewDetails, setShowViewDetails] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);
  const [showAddYearDialog, setShowAddYearDialog] = useState(false);
  const [newYear, setNewYear] = useState<string>("");

  const fetchSchoolYears = async () => {
    try {
      const { data, error } = await supabase
        .from('school_years')
        .select('*')
        .order('year', { ascending: false });

      if (error) {
        console.error('Error fetching school years:', error);
        toast.error("Failed to load school years");
        return;
      }

      setSchoolYears(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error("An error occurred while loading school years");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsForYear = async (year: number) => {
    setStudentsLoading(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('year_joined', year)
        .order('full_name', { ascending: true });

      if (error) {
        console.error('Error fetching students:', error);
        toast.error("Failed to load students");
        return;
      }

      setStudents(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error("An error occurred while loading students");
    } finally {
      setStudentsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchoolYears();
  }, []);

  const handleViewStudents = (schoolYear: SchoolYear) => {
    setSelectedYear(schoolYear);
    fetchStudentsForYear(schoolYear.year);
    setShowStudentsDialog(true);
  };

  const handleViewStudent = (studentId: string) => {
    setSelectedStudentId(studentId);
    setShowViewDetails(true);
  };

  const handleEditStudent = (studentId: string) => {
    setSelectedStudentId(studentId);
    setShowEditForm(true);
  };

  const handleDeleteStudent = (studentId: string) => {
    setStudentToDelete(studentId);
    setShowDeleteDialog(true);
  };

  const confirmDeleteStudent = async () => {
    if (!studentToDelete) return;

    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', studentToDelete);

      if (error) {
        console.error('Error deleting student:', error);
        toast.error("Failed to delete student");
        return;
      }

      toast.success("Student deleted successfully");
      if (selectedYear) {
        fetchStudentsForYear(selectedYear.year);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error("An error occurred while deleting student");
    } finally {
      setShowDeleteDialog(false);
      setStudentToDelete(null);
    }
  };

  const handleStudentAdded = () => {
    if (selectedYear) {
      fetchStudentsForYear(selectedYear.year);
    }
    fetchSchoolYears();
  };

  const handleAddYear = async () => {
    if (!newYear || isNaN(parseInt(newYear))) {
      toast.error("Please enter a valid year");
      return;
    }

    const yearNumber = parseInt(newYear);
    const currentYear = new Date().getFullYear();
    
    if (yearNumber < 2020 || yearNumber > currentYear + 10) {
      toast.error("Please enter a year between 2020 and " + (currentYear + 10));
      return;
    }

    try {
      // Check if year already exists
      const { data: existingYear } = await supabase
        .from('school_years')
        .select('id')
        .eq('year', yearNumber)
        .single();

      if (existingYear) {
        toast.error("This academic year already exists");
        return;
      }

      const { error } = await supabase
        .from('school_years')
        .insert({
          year: yearNumber,
          is_active: true
        });

      if (error) {
        console.error('Error adding year:', error);
        toast.error("Failed to add academic year");
        return;
      }

      toast.success(`Academic Year ${yearNumber} added successfully`);
      setNewYear("");
      setShowAddYearDialog(false);
      fetchSchoolYears();
    } catch (error) {
      console.error('Error:', error);
      toast.error("An error occurred while adding academic year");
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
            <h2 className="text-2xl font-bold">Student Management by Academic Year</h2>
            <p className="text-muted-foreground">View and manage students organized by their joining year</p>
          </div>
          <Button 
            variant="default" 
            onClick={() => setShowAddYearDialog(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Year
          </Button>
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
                Students who joined in {year.year}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                className="w-full flex items-center gap-2"
                onClick={() => handleViewStudents(year)}
              >
                <Users className="h-4 w-4" />
                View Students
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showStudentsDialog} onOpenChange={setShowStudentsDialog}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Students - Academic Year {selectedYear?.year}
            </DialogTitle>
            <DialogDescription>
              Manage students who joined in {selectedYear?.year}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                {students.length} student{students.length !== 1 ? 's' : ''} found
              </div>
              <Button 
                variant="default" 
                size="sm"
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Student
              </Button>
            </div>

            {studentsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
                ))}
              </div>
            ) : students.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Parent Phone</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.student_id}</TableCell>
                        <TableCell>{student.full_name}</TableCell>
                        <TableCell>{student.class_name}</TableCell>
                        <TableCell>{student.parent_phone}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewStudent(student.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditStudent(student.id)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteStudent(student.id)}
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
                <p className="text-muted-foreground">No students found for this year</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AddStudentForm
        open={showAddForm}
        onOpenChange={setShowAddForm}
        onStudentAdded={handleStudentAdded}
        defaultYear={selectedYear?.year}
      />

      <EditStudentForm
        open={showEditForm}
        onOpenChange={setShowEditForm}
        onStudentUpdated={handleStudentAdded}
        studentId={selectedStudentId}
      />

      <ViewStudentDetails
        open={showViewDetails}
        onOpenChange={setShowViewDetails}
        onStudentUpdated={handleStudentAdded}
        studentId={selectedStudentId}
      />

      <Dialog open={showAddYearDialog} onOpenChange={setShowAddYearDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Academic Year</DialogTitle>
            <DialogDescription>
              Enter the year for the new academic period (e.g., 2025)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newYear">Academic Year</Label>
              <Input
                id="newYear"
                type="number"
                placeholder="2025"
                value={newYear}
                onChange={(e) => setNewYear(e.target.value)}
                min="2020"
                max={new Date().getFullYear() + 10}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowAddYearDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddYear}>
                Add Year
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Student</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this student? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteStudent} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};