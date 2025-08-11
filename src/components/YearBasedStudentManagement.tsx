import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ExcelStudentImport } from "./ExcelStudentImport";
import { Users, Eye, Edit, Trash2, Plus, CheckSquare, Square, Search } from "lucide-react";
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
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
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
  const [showEditYearDialog, setShowEditYearDialog] = useState(false);
  const [showDeleteYearDialog, setShowDeleteYearDialog] = useState(false);
  const [yearToEdit, setYearToEdit] = useState<SchoolYear | null>(null);
  const [yearToDelete, setYearToDelete] = useState<SchoolYear | null>(null);
  const [editYearValue, setEditYearValue] = useState<string>("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

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
      setFilteredStudents(data || []);
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

  // Filter students based on search term
  useEffect(() => {
    if (searchTerm) {
      const filtered = students.filter(student =>
        student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.class_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.parent_phone.includes(searchTerm)
      );
      setFilteredStudents(filtered);
    } else {
      setFilteredStudents(students);
    }
  }, [searchTerm, students]);

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
    setSelectedStudents([]);
    fetchSchoolYears();
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(s => s.id));
    }
  };

  const handleSelectStudent = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleBulkDelete = () => {
    if (selectedStudents.length === 0) {
      toast.error("Please select students to delete");
      return;
    }
    setShowBulkDeleteDialog(true);
  };

  const confirmBulkDelete = async () => {
    if (selectedStudents.length === 0) return;

    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .in('id', selectedStudents);

      if (error) {
        console.error('Error deleting students:', error);
        toast.error("Failed to delete students");
        return;
      }

      toast.success(`Successfully deleted ${selectedStudents.length} student${selectedStudents.length > 1 ? 's' : ''}`);
      setSelectedStudents([]);
      if (selectedYear) {
        fetchStudentsForYear(selectedYear.year);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error("An error occurred while deleting students");
    } finally {
      setShowBulkDeleteDialog(false);
    }
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

  const handleEditYear = (year: SchoolYear) => {
    setYearToEdit(year);
    setEditYearValue(year.year.toString());
    setShowEditYearDialog(true);
  };

  const handleDeleteYear = (year: SchoolYear) => {
    setYearToDelete(year);
    setShowDeleteYearDialog(true);
  };

  const confirmEditYear = async () => {
    if (!yearToEdit || !editYearValue || isNaN(parseInt(editYearValue))) {
      toast.error("Please enter a valid year");
      return;
    }

    const yearNumber = parseInt(editYearValue);
    const currentYear = new Date().getFullYear();
    
    if (yearNumber < 2020 || yearNumber > currentYear + 10) {
      toast.error("Please enter a year between 2020 and " + (currentYear + 10));
      return;
    }

    try {
      // Check if year already exists (excluding current year)
      const { data: existingYear } = await supabase
        .from('school_years')
        .select('id')
        .eq('year', yearNumber)
        .neq('id', yearToEdit.id)
        .maybeSingle();

      if (existingYear) {
        toast.error("This academic year already exists");
        return;
      }

      const { error } = await supabase
        .from('school_years')
        .update({ year: yearNumber })
        .eq('id', yearToEdit.id);

      if (error) {
        console.error('Error updating year:', error);
        toast.error("Failed to update academic year");
        return;
      }

      toast.success(`Academic Year updated to ${yearNumber} successfully`);
      setShowEditYearDialog(false);
      setYearToEdit(null);
      setEditYearValue("");
      fetchSchoolYears();
    } catch (error) {
      console.error('Error:', error);
      toast.error("An error occurred while updating academic year");
    }
  };

  const confirmDeleteYear = async () => {
    if (!yearToDelete) return;

    try {
      // Check if there are students in this year
      const { data: studentsInYear } = await supabase
        .from('students')
        .select('id')
        .eq('year_joined', yearToDelete.year);

      if (studentsInYear && studentsInYear.length > 0) {
        toast.error("Cannot delete year with existing students. Please remove all students first.");
        return;
      }

      const { error } = await supabase
        .from('school_years')
        .delete()
        .eq('id', yearToDelete.id);

      if (error) {
        console.error('Error deleting year:', error);
        toast.error("Failed to delete academic year");
        return;
      }

      toast.success(`Academic Year ${yearToDelete.year} deleted successfully`);
      setShowDeleteYearDialog(false);
      setYearToDelete(null);
      fetchSchoolYears();
    } catch (error) {
      console.error('Error:', error);
      toast.error("An error occurred while deleting academic year");
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
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
          <div className="mobile-container">
            <h2 className="text-xl sm:text-2xl font-bold mobile-text">Student Management by Academic Year</h2>
            <p className="text-sm sm:text-base text-muted-foreground mobile-text">View and manage students organized by their joining year</p>
          </div>
          <Button 
            variant="default" 
            onClick={() => setShowAddYearDialog(true)}
            className="flex items-center gap-2 w-full sm:w-auto"
            size="sm"
          >
            <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
            Add Year
          </Button>
        </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {schoolYears.map((year) => (
          <Card key={year.id} className="bg-gradient-card">
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-0">
                <div className="flex-1">
                  <CardTitle className="text-base sm:text-lg mobile-text">Academic Year {year.year}</CardTitle>
                  <CardDescription className="text-sm mobile-text">
                    Students who joined in {year.year}
                  </CardDescription>
                </div>
                <div className="flex flex-col gap-2 w-full sm:w-auto">
                  <div className="flex gap-1">
                    <Badge 
                      variant="outline" 
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground text-xs"
                      onClick={() => handleEditYear(year)}
                    >
                      Edit
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground text-xs"
                      onClick={() => handleDeleteYear(year)}
                    >
                      Delete
                    </Badge>
                  </div>
                  {year.is_active && (
                    <Badge variant="default" className="bg-success text-success-foreground text-xs">Active</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                className="w-full flex items-center gap-2"
                onClick={() => handleViewStudents(year)}
                size="sm"
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
              <Users className="h-4 w-4 sm:h-5 sm:w-5" />
              Students - Academic Year {selectedYear?.year}
            </DialogTitle>
            <DialogDescription className="mobile-text">
              Manage students who joined in {selectedYear?.year}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <h3 className="text-base sm:text-lg font-semibold mobile-text">Students for Year {selectedYear?.year}</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-64"
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {filteredStudents.length} of {students.length} students
                </Badge>
                <div className="flex gap-2">
                  <ExcelStudentImport 
                    onStudentsImported={handleStudentAdded}
                    defaultYear={selectedYear?.year}
                  />
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => setShowAddForm(true)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Add Student</span>
                    <span className="sm:hidden">Add</span>
                  </Button>
                </div>
              </div>
            </div>

            {studentsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
                ))}
              </div>
            ) : students.length > 0 ? (
              <>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAll}
                      className="flex items-center gap-2"
                    >
                      {selectedStudents.length === filteredStudents.length ? (
                        <CheckSquare className="h-4 w-4" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                      Select All Visible
                    </Button>
                    {selectedStudents.length > 0 && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleBulkDelete}
                        className="flex items-center gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete Selected ({selectedStudents.length})
                      </Button>
                    )}
                  </div>
                </div>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">Select</TableHead>
                        <TableHead className="min-w-[100px]">Student ID</TableHead>
                        <TableHead className="min-w-[150px]">Name</TableHead>
                        <TableHead className="min-w-[80px]">Class</TableHead>
                        <TableHead className="min-w-[120px] hidden sm:table-cell">Parent Phone</TableHead>
                        <TableHead className="min-w-[120px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSelectStudent(student.id)}
                              className="p-1"
                            >
                              {selectedStudents.includes(student.id) ? (
                                <CheckSquare className="h-4 w-4" />
                              ) : (
                                <Square className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell className="font-medium text-sm">{student.student_id}</TableCell>
                          <TableCell className="text-sm">{student.full_name}</TableCell>
                          <TableCell className="text-sm">{student.class_name}</TableCell>
                          <TableCell className="text-sm hidden sm:table-cell">{student.parent_phone}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewStudent(student.id)}
                                className="h-8 w-8 p-0"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditStudent(student.id)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteStudent(student.id)}
                                className="text-destructive hover:text-destructive h-8 w-8 p-0"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
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

      <Dialog open={showEditYearDialog} onOpenChange={setShowEditYearDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Academic Year</DialogTitle>
            <DialogDescription>
              Update the academic year value
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editYear">Academic Year</Label>
              <Input
                id="editYear"
                type="number"
                placeholder="2025"
                value={editYearValue}
                onChange={(e) => setEditYearValue(e.target.value)}
                min="2020"
                max={new Date().getFullYear() + 10}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowEditYearDialog(false)}>
                Cancel
              </Button>
              <Button onClick={confirmEditYear}>
                Update Year
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteYearDialog} onOpenChange={setShowDeleteYearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Academic Year</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete Academic Year {yearToDelete?.year}? This action cannot be undone. You can only delete years that have no students enrolled.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteYear} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Year
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Multiple Students</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedStudents.length} selected student{selectedStudents.length > 1 ? 's' : ''}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete {selectedStudents.length} Student{selectedStudents.length > 1 ? 's' : ''}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};