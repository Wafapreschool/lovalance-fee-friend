import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Plus, Users, DollarSign, Edit, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SchoolYear {
  id: string;
  year: number;
  is_active: boolean;
}

interface SchoolMonth {
  id: string;
  school_year_id: string;
  month_name: string;
  month_number: number;
  due_date: string;
  is_active: boolean;
}

interface Student {
  id: string;
  full_name: string;
  class_name: string;
  student_id: string;
}

export const SchoolYearManagement = () => {
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
  const [schoolMonths, setSchoolMonths] = useState<SchoolMonth[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [newYear, setNewYear] = useState<number>(new Date().getFullYear());
  const [showYearDialog, setShowYearDialog] = useState(false);
  const [showMonthDialog, setShowMonthDialog] = useState(false);
  const [showStudentDialog, setShowStudentDialog] = useState(false);
  const [selectedYearId, setSelectedYearId] = useState<string>("");
  const [selectedMonthId, setSelectedMonthId] = useState<string>("");
  const [editingYear, setEditingYear] = useState<SchoolYear | null>(null);
  const [editingMonth, setEditingMonth] = useState<SchoolMonth | null>(null);
  const [monthForm, setMonthForm] = useState({
    month_name: "",
    month_number: 1,
    due_date: ""
  });
  const [feeAmount, setFeeAmount] = useState<number>(3500);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch school years
      const { data: yearsData, error: yearsError } = await supabase
        .from('school_years')
        .select('*')
        .order('year', { ascending: false });

      if (yearsError) throw yearsError;

      // Fetch school months
      const { data: monthsData, error: monthsError } = await supabase
        .from('school_months')
        .select('*')
        .order('month_number');

      if (monthsError) throw monthsError;

      // Fetch students
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('id, full_name, class_name, student_id')
        .order('full_name');

      if (studentsError) throw studentsError;

      setSchoolYears(yearsData || []);
      setSchoolMonths(monthsData || []);
      setStudents(studentsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const createSchoolYear = async () => {
    try {
      const { error } = await supabase
        .from('school_years')
        .insert({ year: newYear });

      if (error) throw error;

      toast.success("School year created successfully");
      setShowYearDialog(false);
      setNewYear(new Date().getFullYear() + 1);
      fetchData();
    } catch (error: any) {
      console.error('Error creating school year:', error);
      if (error.code === '23505') {
        toast.error("This year already exists");
      } else {
        toast.error("Failed to create school year");
      }
    }
  };

  const updateSchoolYear = async () => {
    if (!editingYear) return;
    
    try {
      const { error } = await supabase
        .from('school_years')
        .update({ year: newYear })
        .eq('id', editingYear.id);

      if (error) throw error;

      toast.success("School year updated successfully");
      setShowYearDialog(false);
      setEditingYear(null);
      setNewYear(new Date().getFullYear());
      fetchData();
    } catch (error: any) {
      console.error('Error updating school year:', error);
      if (error.code === '23505') {
        toast.error("This year already exists");
      } else {
        toast.error("Failed to update school year");
      }
    }
  };

  const deleteSchoolYear = async (yearId: string) => {
    try {
      const { error } = await supabase
        .from('school_years')
        .delete()
        .eq('id', yearId);

      if (error) throw error;

      toast.success("School year deleted successfully");
      fetchData();
    } catch (error) {
      console.error('Error deleting school year:', error);
      toast.error("Failed to delete school year");
    }
  };

  const createSchoolMonth = async () => {
    if (!selectedYearId || !monthForm.month_name || !monthForm.due_date) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      const { error } = await supabase
        .from('school_months')
        .insert({
          school_year_id: selectedYearId,
          month_name: monthForm.month_name,
          month_number: monthForm.month_number,
          due_date: monthForm.due_date
        });

      if (error) throw error;

      toast.success("Month added successfully");
      setShowMonthDialog(false);
      setMonthForm({ month_name: "", month_number: 1, due_date: "" });
      fetchData();
    } catch (error: any) {
      console.error('Error creating month:', error);
      if (error.code === '23505') {
        toast.error("This month already exists for the selected year");
      } else {
        toast.error("Failed to add month");
      }
    }
  };

  const updateSchoolMonth = async () => {
    if (!editingMonth) return;
    
    try {
      const { error } = await supabase
        .from('school_months')
        .update({
          month_name: monthForm.month_name,
          month_number: monthForm.month_number,
          due_date: monthForm.due_date
        })
        .eq('id', editingMonth.id);

      if (error) throw error;

      toast.success("Month updated successfully");
      setShowMonthDialog(false);
      setEditingMonth(null);
      setMonthForm({ month_name: "", month_number: 1, due_date: "" });
      fetchData();
    } catch (error) {
      console.error('Error updating month:', error);
      toast.error("Failed to update month");
    }
  };

  const deleteSchoolMonth = async (monthId: string) => {
    try {
      const { error } = await supabase
        .from('school_months')
        .delete()
        .eq('id', monthId);

      if (error) throw error;

      toast.success("Month deleted successfully");
      fetchData();
    } catch (error) {
      console.error('Error deleting month:', error);
      toast.error("Failed to delete month");
    }
  };

  const assignFeesToStudents = async () => {
    if (!selectedMonthId || selectedStudents.length === 0 || !feeAmount) {
      toast.error("Please select students and enter fee amount");
      return;
    }

    try {
      const feeRecords = selectedStudents.map(studentId => ({
        school_month_id: selectedMonthId,
        student_id: studentId,
        amount: feeAmount
      }));

      const { error } = await supabase
        .from('student_fees')
        .insert(feeRecords);

      if (error) throw error;

      toast.success(`Fees assigned to ${selectedStudents.length} students`);
      setShowStudentDialog(false);
      setSelectedStudents([]);
      setFeeAmount(3500);
    } catch (error: any) {
      console.error('Error assigning fees:', error);
      if (error.code === '23505') {
        toast.error("Some students already have fees for this month");
      } else {
        toast.error("Failed to assign fees");
      }
    }
  };

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const toggleSelectAll = () => {
    setSelectedStudents(prev => 
      prev.length === students.length ? [] : students.map(s => s.id)
    );
  };

  const getMonthsForYear = (yearId: string) => {
    return schoolMonths.filter(month => month.school_year_id === yearId);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">School Year & Fee Management</h2>
          <p className="text-muted-foreground">Manage school years, months, and assign fees to students</p>
        </div>
        
        <Dialog open={showYearDialog} onOpenChange={setShowYearDialog}>
          <DialogTrigger asChild>
            <Button variant="gradient" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add School Year
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingYear ? 'Edit School Year' : 'Create New School Year'}</DialogTitle>
              <DialogDescription>{editingYear ? 'Update the academic year' : 'Add a new academic year to the system'}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  type="number"
                  value={newYear}
                  onChange={(e) => setNewYear(parseInt(e.target.value))}
                  min={2020}
                  max={2050}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={editingYear ? updateSchoolYear : createSchoolYear} className="flex-1">
                  {editingYear ? 'Update Year' : 'Create Year'}
                </Button>
                <Button variant="outline" onClick={() => {
                  setShowYearDialog(false);
                  setEditingYear(null);
                }}>Cancel</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* School Years List */}
      <div className="grid gap-6">
        {schoolYears.map((year) => (
          <Card key={year.id} className="border-l-4 border-l-primary">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-primary" />
                  <CardTitle>Academic Year {year.year}</CardTitle>
                  {year.is_active && <Badge variant="default">Active</Badge>}
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setEditingYear(year);
                      setNewYear(year.year);
                      setShowYearDialog(true);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete School Year</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete the {year.year} academic year? This will also delete all associated months and fees.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteSchoolYear(year.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                
                  <Dialog open={showMonthDialog} onOpenChange={setShowMonthDialog}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedYearId(year.id);
                          setEditingMonth(null);
                          setMonthForm({ month_name: "", month_number: 1, due_date: "" });
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Month
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{editingMonth ? 'Edit' : 'Add'} Month {editingMonth ? `for ${year.year}` : `to ${year.year}`}</DialogTitle>
                        <DialogDescription>Configure {editingMonth ? 'the' : 'a new'} month for fee collection</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="month">Month</Label>
                          <Select 
                            value={monthForm.month_name} 
                            onValueChange={(value) => {
                              const monthIndex = months.indexOf(value) + 1;
                              setMonthForm(prev => ({ 
                                ...prev, 
                                month_name: value, 
                                month_number: monthIndex 
                              }));
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select month" />
                            </SelectTrigger>
                            <SelectContent>
                              {months.map((month, index) => (
                                <SelectItem key={month} value={month}>
                                  {month}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="due_date">Due Date</Label>
                          <Input
                            id="due_date"
                            type="date"
                            value={monthForm.due_date}
                            onChange={(e) => setMonthForm(prev => ({ ...prev, due_date: e.target.value }))}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={editingMonth ? updateSchoolMonth : createSchoolMonth} className="flex-1">
                            {editingMonth ? 'Update Month' : 'Add Month'}
                          </Button>
                          <Button variant="outline" onClick={() => {
                            setShowMonthDialog(false);
                            setEditingMonth(null);
                          }}>Cancel</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="grid gap-4">
                {getMonthsForYear(year.id).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getMonthsForYear(year.id).map((month) => (
                      <Card key={month.id} className="bg-muted/50">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-medium">{month.month_name}</h4>
                              <p className="text-sm text-muted-foreground">
                                Due: {new Date(month.due_date).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {month.is_active && <Badge variant="secondary" className="text-xs">Active</Badge>}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingMonth(month);
                                  setMonthForm({
                                    month_name: month.month_name,
                                    month_number: month.month_number,
                                    due_date: month.due_date
                                  });
                                  setShowMonthDialog(true);
                                }}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Month</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete {month.month_name}? This will also delete all associated fees.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteSchoolMonth(month.id)}>
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                          
                          <Dialog open={showStudentDialog} onOpenChange={setShowStudentDialog}>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="w-full"
                                onClick={() => setSelectedMonthId(month.id)}
                              >
                                <Users className="h-4 w-4 mr-2" />
                                Add Students
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh]">
                              <DialogHeader>
                                <DialogTitle>Assign Fees - {month.month_name} {year.year}</DialogTitle>
                                <DialogDescription>Select students and set fee amount for this month</DialogDescription>
                              </DialogHeader>
                              
                              <div className="space-y-4 overflow-y-auto">
                                <div>
                                  <Label htmlFor="fee_amount">Fee Amount (MVR)</Label>
                                  <Input
                                    id="fee_amount"
                                    type="number"
                                    value={feeAmount}
                                    onChange={(e) => setFeeAmount(parseFloat(e.target.value) || 0)}
                                    min={0}
                                    step="0.01"
                                  />
                                </div>
                                
                                <div>
                                  <div className="flex items-center justify-between mb-3">
                                    <Label>Select Students</Label>
                                    <div className="flex items-center space-x-2">
                                      <Checkbox 
                                        id="select-all"
                                        checked={selectedStudents.length === students.length}
                                        onCheckedChange={toggleSelectAll}
                                      />
                                      <Label htmlFor="select-all" className="text-sm">Select All</Label>
                                    </div>
                                  </div>
                                  
                                  <div className="border rounded-md p-3 max-h-64 overflow-y-auto space-y-2">
                                    {students.map((student) => (
                                      <div key={student.id} className="flex items-center space-x-2 p-2 hover:bg-muted rounded">
                                        <Checkbox
                                          id={student.id}
                                          checked={selectedStudents.includes(student.id)}
                                          onCheckedChange={() => toggleStudentSelection(student.id)}
                                        />
                                        <Label htmlFor={student.id} className="flex-1 cursor-pointer">
                                          <div>
                                            <div className="font-medium">{student.full_name}</div>
                                            <div className="text-sm text-muted-foreground">
                                              {student.student_id} - {student.class_name}
                                            </div>
                                          </div>
                                        </Label>
                                      </div>
                                    ))}
                                  </div>
                                  
                                  <p className="text-sm text-muted-foreground mt-2">
                                    {selectedStudents.length} of {students.length} students selected
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex gap-2">
                                <Button onClick={assignFeesToStudents} className="flex-1">
                                  <DollarSign className="h-4 w-4 mr-2" />
                                  Assign Fees
                                </Button>
                                <Button variant="outline" onClick={() => setShowStudentDialog(false)}>
                                  Cancel
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No months added yet. Click "Add Month" to get started.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {schoolYears.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-16 w-16 mx-auto mb-6 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium mb-2">No School Years Found</h3>
          <p className="text-muted-foreground mb-6">Create your first academic year to start managing fees</p>
          <Button variant="gradient" onClick={() => setShowYearDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create First School Year
          </Button>
        </div>
      )}
    </div>
  );
};