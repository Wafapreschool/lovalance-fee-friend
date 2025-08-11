import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Calendar, Users, Plus, Edit, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MonthFeeAssignment } from "./MonthFeeAssignment";
import { OtherPaymentAssignment } from "./OtherPaymentAssignment";

interface SchoolYear {
  id: string;
  year: number;
  is_active: boolean;
}

interface SchoolMonth {
  id: string;
  month_name: string;
  month_number: number;
  due_date: string;
  is_active: boolean;
  school_year_id: string;
}

export const EnhancedFeeManagement = () => {
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
  const [schoolMonths, setSchoolMonths] = useState<SchoolMonth[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedYears, setExpandedYears] = useState<string[]>([]);
  
  // Edit/Delete states
  const [editingYear, setEditingYear] = useState<SchoolYear | null>(null);
  const [editingMonth, setEditingMonth] = useState<SchoolMonth | null>(null);
  const [showDeleteYearDialog, setShowDeleteYearDialog] = useState(false);
  const [showDeleteMonthDialog, setShowDeleteMonthDialog] = useState(false);
  const [yearToDelete, setYearToDelete] = useState<string | null>(null);
  const [monthToDelete, setMonthToDelete] = useState<string | null>(null);
  
  // Add month states
  const [showAddMonthDialog, setShowAddMonthDialog] = useState(false);
  const [selectedYearForMonth, setSelectedYearForMonth] = useState<string | null>(null);
  const [newMonthData, setNewMonthData] = useState({
    month_name: "",
    month_number: 1,
    due_date: ""
  });

  const fetchInitialData = async () => {
    try {
      // Fetch school years
      const { data: yearsData, error: yearsError } = await supabase
        .from('school_years')
        .select('*')
        .order('year', { ascending: false });

      if (yearsError) throw yearsError;

      // Fetch all months
      const { data: monthsData, error: monthsError } = await supabase
        .from('school_months')
        .select('*')
        .order('month_number', { ascending: true });

      if (monthsError) throw monthsError;

      setSchoolYears(yearsData || []);
      setSchoolMonths(monthsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const getMonthsForYear = (yearId: string) => {
    return schoolMonths.filter(month => month.school_year_id === yearId);
  };

  const toggleYearExpanded = (yearId: string) => {
    setExpandedYears(prev => 
      prev.includes(yearId) 
        ? prev.filter(id => id !== yearId)
        : [...prev, yearId]
    );
  };

  const handleEditYear = async (year: SchoolYear, newYear: number) => {
    try {
      const { error } = await supabase
        .from('school_years')
        .update({ year: newYear })
        .eq('id', year.id);

      if (error) throw error;

      toast.success("Year updated successfully");
      fetchInitialData();
      setEditingYear(null);
    } catch (error) {
      console.error('Error updating year:', error);
      toast.error("Failed to update year");
    }
  };

  const handleDeleteYear = async () => {
    if (!yearToDelete) return;

    try {
      // Check if year has months
      const monthsForYear = getMonthsForYear(yearToDelete);
      if (monthsForYear.length > 0) {
        toast.error("Cannot delete year with existing months. Delete months first.");
        return;
      }

      const { error } = await supabase
        .from('school_years')
        .delete()
        .eq('id', yearToDelete);

      if (error) throw error;

      toast.success("Year deleted successfully");
      fetchInitialData();
    } catch (error) {
      console.error('Error deleting year:', error);
      toast.error("Failed to delete year");
    } finally {
      setShowDeleteYearDialog(false);
      setYearToDelete(null);
    }
  };

  const handleEditMonth = async (month: SchoolMonth, updatedData: Partial<SchoolMonth>) => {
    try {
      const { error } = await supabase
        .from('school_months')
        .update(updatedData)
        .eq('id', month.id);

      if (error) throw error;

      toast.success("Month updated successfully");
      fetchInitialData();
      setEditingMonth(null);
    } catch (error) {
      console.error('Error updating month:', error);
      toast.error("Failed to update month");
    }
  };

  const handleDeleteMonth = async () => {
    if (!monthToDelete) return;

    try {
      // Check if month has assigned fees
      const { data: fees, error: feesError } = await supabase
        .from('student_fees')
        .select('id')
        .eq('school_month_id', monthToDelete);

      if (feesError) throw feesError;

      if (fees && fees.length > 0) {
        toast.error("Cannot delete month with assigned fees. Remove fees first.");
        return;
      }

      const { error } = await supabase
        .from('school_months')
        .delete()
        .eq('id', monthToDelete);

      if (error) throw error;

      toast.success("Month deleted successfully");
      fetchInitialData();
    } catch (error) {
      console.error('Error deleting month:', error);
      toast.error("Failed to delete month");
    } finally {
      setShowDeleteMonthDialog(false);
      setMonthToDelete(null);
    }
  };

  const handleAddMonth = async () => {
    if (!selectedYearForMonth || !newMonthData.month_name || !newMonthData.due_date) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      const { error } = await supabase
        .from('school_months')
        .insert({
          school_year_id: selectedYearForMonth,
          month_name: newMonthData.month_name,
          month_number: newMonthData.month_number,
          due_date: newMonthData.due_date,
          is_active: true
        });

      if (error) throw error;

      toast.success("Month added successfully");
      fetchInitialData();
      setShowAddMonthDialog(false);
      setNewMonthData({ month_name: "", month_number: 1, due_date: "" });
      setSelectedYearForMonth(null);
    } catch (error) {
      console.error('Error adding month:', error);
      toast.error("Failed to add month");
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
      <div className="mobile-container">
        <h2 className="text-xl sm:text-2xl font-bold mobile-text">Fee Management</h2>
        <p className="text-sm sm:text-base text-muted-foreground mobile-text">Manage academic years, months, and assign fees to students</p>
      </div>

      {schoolYears.map((year) => {
        const yearMonths = getMonthsForYear(year.id);
        const isExpanded = expandedYears.includes(year.id);
        
        return (
          <Card key={year.id} className="bg-gradient-card">
            <CardHeader>
              <div className="flex justify-between items-center">
                 <div className="flex items-center gap-2 sm:gap-3">
                   <Button
                     variant="ghost"
                     size="sm"
                     onClick={() => toggleYearExpanded(year.id)}
                     className="p-1 h-6 w-6 sm:h-8 sm:w-8"
                   >
                     {isExpanded ? (
                       <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                     ) : (
                       <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                     )}
                   </Button>
                   <div>
                     <CardTitle className="text-lg sm:text-xl mobile-text">Academic Year {year.year}</CardTitle>
                     <CardDescription className="text-sm mobile-text">
                       {yearMonths.length} month{yearMonths.length !== 1 ? 's' : ''} configured
                     </CardDescription>
                   </div>
                 </div>
                 <div className="flex items-center gap-1 sm:gap-2">
                  {year.is_active && (
                    <Badge variant="default" className="bg-success text-success-foreground">Active</Badge>
                  )}
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={() => setEditingYear(year)}
                     className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
                   >
                     <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                     <span className="sr-only sm:not-sr-only sm:ml-1">Edit</span>
                   </Button>
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={() => {
                       setYearToDelete(year.id);
                       setShowDeleteYearDialog(true);
                     }}
                     className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
                   >
                     <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                     <span className="sr-only sm:not-sr-only sm:ml-1">Delete</span>
                   </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isExpanded && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold">Months for Year {year.year}</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedYearForMonth(year.id);
                        setShowAddMonthDialog(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Month
                    </Button>
                  </div>
                  
                  {yearMonths.length > 0 ? (
                    <div className="space-y-3">
                      {yearMonths.map((month) => (
                        <div key={month.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <h5 className="font-semibold">{month.month_name}</h5>
                              <Badge variant="outline">
                                Due: {new Date(month.due_date).toLocaleDateString()}
                              </Badge>
                              {month.is_active && (
                                <Badge variant="default" className="bg-success text-success-foreground">Active</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <MonthFeeAssignment month={month} />
                              <OtherPaymentAssignment year={year.year} />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingMonth(month)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setMonthToDelete(month.id);
                                  setShowDeleteMonthDialog(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No months configured for this year</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Edit Year Dialog */}
      <Dialog open={!!editingYear} onOpenChange={() => setEditingYear(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Academic Year</DialogTitle>
            <DialogDescription>Update the academic year details</DialogDescription>
          </DialogHeader>
          {editingYear && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="editYear">Year</Label>
                <Input
                  id="editYear"
                  type="number"
                  defaultValue={editingYear.year}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const newYear = parseInt((e.target as HTMLInputElement).value);
                      if (newYear) {
                        handleEditYear(editingYear, newYear);
                      }
                    }
                  }}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingYear(null)}>Cancel</Button>
                <Button onClick={() => {
                  const input = document.getElementById('editYear') as HTMLInputElement;
                  const newYear = parseInt(input.value);
                  if (newYear) {
                    handleEditYear(editingYear, newYear);
                  }
                }}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Month Dialog */}
      <Dialog open={!!editingMonth} onOpenChange={() => setEditingMonth(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Month</DialogTitle>
            <DialogDescription>Update the month details</DialogDescription>
          </DialogHeader>
          {editingMonth && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="editMonthName">Month Name</Label>
                <Input
                  id="editMonthName"
                  defaultValue={editingMonth.month_name}
                />
              </div>
              <div>
                <Label htmlFor="editMonthNumber">Month Number</Label>
                <Input
                  id="editMonthNumber"
                  type="number"
                  min="1"
                  max="12"
                  defaultValue={editingMonth.month_number}
                />
              </div>
              <div>
                <Label htmlFor="editDueDate">Due Date</Label>
                <Input
                  id="editDueDate"
                  type="date"
                  defaultValue={editingMonth.due_date}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingMonth(null)}>Cancel</Button>
                <Button onClick={() => {
                  const nameInput = document.getElementById('editMonthName') as HTMLInputElement;
                  const numberInput = document.getElementById('editMonthNumber') as HTMLInputElement;
                  const dateInput = document.getElementById('editDueDate') as HTMLInputElement;
                  
                  handleEditMonth(editingMonth, {
                    month_name: nameInput.value,
                    month_number: parseInt(numberInput.value),
                    due_date: dateInput.value
                  });
                }}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Month Dialog */}
      <Dialog open={showAddMonthDialog} onOpenChange={setShowAddMonthDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Month</DialogTitle>
            <DialogDescription>Add a new month to the academic year</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="monthName">Month Name</Label>
              <Input
                id="monthName"
                value={newMonthData.month_name}
                onChange={(e) => setNewMonthData(prev => ({ ...prev, month_name: e.target.value }))}
                placeholder="e.g., January"
              />
            </div>
            <div>
              <Label htmlFor="monthNumber">Month Number</Label>
              <Input
                id="monthNumber"
                type="number"
                min="1"
                max="12"
                value={newMonthData.month_number}
                onChange={(e) => setNewMonthData(prev => ({ ...prev, month_number: parseInt(e.target.value) }))}
              />
            </div>
            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={newMonthData.due_date}
                onChange={(e) => setNewMonthData(prev => ({ ...prev, due_date: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setShowAddMonthDialog(false);
                setNewMonthData({ month_name: "", month_number: 1, due_date: "" });
              }}>
                Cancel
              </Button>
              <Button onClick={handleAddMonth}>Add Month</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Year Dialog */}
      <AlertDialog open={showDeleteYearDialog} onOpenChange={setShowDeleteYearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Academic Year</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this academic year? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteYear} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Month Dialog */}
      <AlertDialog open={showDeleteMonthDialog} onOpenChange={setShowDeleteMonthDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Month</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this month? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMonth} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};