import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Upload, FileSpreadsheet, Check, X, AlertCircle, Download } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from 'xlsx';

interface ExcelStudentImportProps {
  onStudentsImported: () => void;
  defaultYear?: number;
}

interface ParsedStudent {
  full_name: string;
  student_id: string;
  class_name: string;
  year_joined: number;
  parent_phone: string;
  password: string;
  isValid: boolean;
  errors: string[];
}

interface ColumnMapping {
  [key: string]: string;
}

export const ExcelStudentImport = ({ onStudentsImported, defaultYear }: ExcelStudentImportProps) => {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [excelData, setExcelData] = useState<any[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [parsedStudents, setParsedStudents] = useState<ParsedStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const requiredFields = {
    full_name: 'Full Name',
    student_id: 'Student ID',
    class_name: 'Class',
    parent_phone: 'Parent Phone'
  };

  const optionalFields = {
    year_joined: 'Year Joined',
    password: 'Password'
  };

  const classOptions = ['KG1', 'KG2', 'Nursery', 'Pre-KG'];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    if (!uploadedFile.name.match(/\.(xlsx|xls)$/)) {
      toast.error("Please upload an Excel file (.xlsx or .xls)");
      return;
    }

    setFile(uploadedFile);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length < 2) {
          toast.error("Excel file must have at least a header row and one data row");
          return;
        }

        // Extract headers and data
        const headers = jsonData[0] as string[];
        const dataRows = jsonData.slice(1);
        
        // Convert to array of objects
        const processedData = dataRows.map((row: any) => {
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = row[index] || '';
          });
          return obj;
        });

        setExcelData(processedData);
        setStep('mapping');
        
        // Auto-detect column mappings based on common header names
        const autoMapping: ColumnMapping = {};
        headers.forEach(header => {
          const lowerHeader = header.toLowerCase().trim();
          if (lowerHeader.includes('name') && lowerHeader.includes('full')) {
            autoMapping.full_name = header;
          } else if (lowerHeader.includes('student') && lowerHeader.includes('id')) {
            autoMapping.student_id = header;
          } else if (lowerHeader.includes('class')) {
            autoMapping.class_name = header;
          } else if (lowerHeader.includes('phone') && lowerHeader.includes('parent')) {
            autoMapping.parent_phone = header;
          } else if (lowerHeader.includes('year')) {
            autoMapping.year_joined = header;
          } else if (lowerHeader.includes('password')) {
            autoMapping.password = header;
          }
        });
        setColumnMapping(autoMapping);
        
      } catch (error) {
        console.error('Error reading Excel file:', error);
        toast.error("Failed to read Excel file");
      }
    };
    reader.readAsArrayBuffer(uploadedFile);
  };

  const generateStudentId = (name: string, year: number) => {
    const namePart = name.split(' ')[0].toLowerCase();
    return `${namePart}${year}${Math.random().toString(36).substr(2, 4)}`;
  };

  const generatePassword = () => {
    return Math.random().toString(36).slice(-8);
  };

  const validateAndParseStudents = () => {
    const students: ParsedStudent[] = excelData.map((row, index) => {
      const student: ParsedStudent = {
        full_name: '',
        student_id: '',
        class_name: '',
        year_joined: defaultYear || new Date().getFullYear(),
        parent_phone: '',
        password: '',
        isValid: true,
        errors: []
      };

        Object.entries(columnMapping).forEach(([field, excelColumn]) => {
          if (excelColumn && row[excelColumn]) {
            if (field === 'year_joined') {
              student[field] = parseInt(row[excelColumn]) || defaultYear || new Date().getFullYear();
            } else {
              (student as any)[field] = row[excelColumn].toString().trim();
            }
          }
        });

      // Generate missing fields
      if (!student.student_id && student.full_name) {
        student.student_id = generateStudentId(student.full_name, student.year_joined);
      }
      if (!student.password) {
        student.password = generatePassword();
      }

      // Validate required fields
      if (!student.full_name) {
        student.errors.push('Full name is required');
        student.isValid = false;
      }
      if (!student.student_id) {
        student.errors.push('Student ID is required');
        student.isValid = false;
      }
      if (!student.class_name) {
        student.errors.push('Class is required');
        student.isValid = false;
      } else if (!classOptions.includes(student.class_name)) {
        student.errors.push(`Class must be one of: ${classOptions.join(', ')}`);
        student.isValid = false;
      }
      if (!student.parent_phone) {
        student.errors.push('Parent phone is required');
        student.isValid = false;
      }

      return student;
    });

    setParsedStudents(students);
    setStep('preview');
  };

  const handleImportStudents = async () => {
    const validStudents = parsedStudents.filter(s => s.isValid);
    
    if (validStudents.length === 0) {
      toast.error("No valid students to import");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('students')
        .insert(validStudents.map(student => ({
          student_id: student.student_id,
          full_name: student.full_name,
          class_name: student.class_name,
          year_joined: student.year_joined,
          parent_phone: student.parent_phone,
          password: student.password
        })));

      if (error) {
        console.error('Error importing students:', error);
        toast.error("Failed to import students");
        return;
      }

      toast.success(`Successfully imported ${validStudents.length} students`);
      onStudentsImported();
      resetForm();
      setOpen(false);
    } catch (error) {
      console.error('Error:', error);
      toast.error("An error occurred while importing students");
    } finally {
      setLoading(false);
      setShowConfirmDialog(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setExcelData([]);
    setColumnMapping({});
    setParsedStudents([]);
    setStep('upload');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadTemplate = () => {
    const template = [
      ['Full Name', 'Student ID', 'Class', 'Year Joined', 'Parent Phone', 'Password'],
      ['John Doe', 'john2024abc', 'KG1', '2024', '9876543210', 'password123'],
      ['Jane Smith', 'jane2024xyz', 'KG2', '2024', '9876543211', 'password456']
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
    XLSX.writeFile(workbook, 'student_import_template.xlsx');
  };

  const validStudentsCount = parsedStudents.filter(s => s.isValid).length;
  const invalidStudentsCount = parsedStudents.filter(s => !s.isValid).length;

  return (
    <>
      <Dialog open={open} onOpenChange={(newOpen) => {
        setOpen(newOpen);
        if (!newOpen) resetForm();
      }}>
        <DialogTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Import from Excel
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Import Students from Excel
            </DialogTitle>
            <DialogDescription>
              Upload an Excel file to bulk import student data
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            {step === 'upload' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Step 1: Upload Excel File</CardTitle>
                    <CardDescription>
                      Select an Excel file (.xlsx or .xls) containing student information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="excel-file">Excel File</Label>
                      <Input
                        ref={fileInputRef}
                        id="excel-file"
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileUpload}
                        className="mt-2"
                      />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={downloadTemplate}
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Download Template
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Download a sample Excel template to see the expected format
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {step === 'mapping' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Step 2: Map Columns</CardTitle>
                    <CardDescription>
                      Map the columns from your Excel file to the student fields
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Required Fields */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm">Required Fields</h4>
                        {Object.entries(requiredFields).map(([field, label]) => (
                          <div key={field}>
                            <Label className="text-sm">{label} *</Label>
                            <Select
                              value={columnMapping[field] || ''}
                              onValueChange={(value) => setColumnMapping(prev => ({ ...prev, [field]: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select column" />
                              </SelectTrigger>
                              <SelectContent>
                                {excelData.length > 0 && Object.keys(excelData[0]).filter(column => column && column.trim()).map(column => (
                                  <SelectItem key={column} value={column}>{column}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ))}
                      </div>

                      {/* Optional Fields */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm">Optional Fields</h4>
                        {Object.entries(optionalFields).map(([field, label]) => (
                          <div key={field}>
                            <Label className="text-sm">{label}</Label>
                            <Select
                              value={columnMapping[field] || ''}
                              onValueChange={(value) => setColumnMapping(prev => ({ ...prev, [field]: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select column (optional)" />
                              </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="">None</SelectItem>
                                  {excelData.length > 0 && Object.keys(excelData[0]).filter(column => column && column.trim()).map(column => (
                                    <SelectItem key={column} value={column}>{column}</SelectItem>
                                  ))}
                                </SelectContent>
                            </Select>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between pt-4">
                      <Button variant="outline" onClick={() => setStep('upload')}>
                        Back
                      </Button>
                      <Button 
                        onClick={validateAndParseStudents}
                        disabled={!Object.values(requiredFields).every(field => 
                          Object.entries(requiredFields).find(([key, label]) => label === field)?.[0] && 
                          columnMapping[Object.entries(requiredFields).find(([key, label]) => label === field)?.[0] || '']
                        )}
                      >
                        Next: Preview Data
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {step === 'preview' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Step 3: Preview & Import</CardTitle>
                    <CardDescription>
                      Review the parsed student data before importing
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-4">
                      <Badge variant="default" className="bg-success text-success-foreground">
                        {validStudentsCount} Valid Students
                      </Badge>
                      {invalidStudentsCount > 0 && (
                        <Badge variant="destructive">
                          {invalidStudentsCount} Invalid Students
                        </Badge>
                      )}
                    </div>

                    <div className="rounded-md border max-h-[400px] overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Status</TableHead>
                            <TableHead>Full Name</TableHead>
                            <TableHead>Student ID</TableHead>
                            <TableHead>Class</TableHead>
                            <TableHead>Year</TableHead>
                            <TableHead>Parent Phone</TableHead>
                            <TableHead>Errors</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {parsedStudents.map((student, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                {student.isValid ? (
                                  <Check className="h-4 w-4 text-success" />
                                ) : (
                                  <X className="h-4 w-4 text-destructive" />
                                )}
                              </TableCell>
                              <TableCell>{student.full_name}</TableCell>
                              <TableCell>{student.student_id}</TableCell>
                              <TableCell>{student.class_name}</TableCell>
                              <TableCell>{student.year_joined}</TableCell>
                              <TableCell>{student.parent_phone}</TableCell>
                              <TableCell>
                                {student.errors.length > 0 && (
                                  <div className="text-sm text-destructive">
                                    {student.errors.join(', ')}
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="flex justify-between pt-4">
                      <Button variant="outline" onClick={() => setStep('mapping')}>
                        Back
                      </Button>
                      <Button
                        onClick={() => setShowConfirmDialog(true)}
                        disabled={validStudentsCount === 0}
                        className="bg-primary hover:bg-primary/90"
                      >
                        Import {validStudentsCount} Students
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Confirm Import
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to import {validStudentsCount} students? 
              {invalidStudentsCount > 0 && ` ${invalidStudentsCount} invalid entries will be skipped.`}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleImportStudents}
              disabled={loading}
              className="bg-primary hover:bg-primary/90"
            >
              {loading ? "Importing..." : "Confirm Import"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};