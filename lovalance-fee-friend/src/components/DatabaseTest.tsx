import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export const DatabaseTest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const testDatabaseConnection = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Testing database connection...');
      
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .limit(10);

      if (error) {
        console.error('Database error:', error);
        setError(error.message);
        return;
      }

      console.log('Students data:', data);
      setStudents(data || []);
      
    } catch (err) {
      console.error('Test error:', err);
      setError('Failed to connect to database');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Database Connection Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={testDatabaseConnection} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Testing...' : 'Test Database Connection'}
        </Button>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-medium">Error:</p>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {students.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-medium">Students in Database:</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {students.map((student) => (
                <div key={student.id} className="p-3 bg-gray-50 rounded-lg text-sm">
                  <p><strong>ID:</strong> {student.student_id}</p>
                  <p><strong>Name:</strong> {student.full_name}</p>
                  <p><strong>Class:</strong> {student.class_name}</p>
                  <p><strong>Password:</strong> {student.password}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 