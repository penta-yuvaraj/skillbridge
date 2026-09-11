import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft } from 'lucide-react';
import StudentRosterTable from '../features/attendance/StudentRosterTable';
import PrimaryButton from '../shared/components/PrimaryButton';

/**
 * MarkAttendance Component
 * An intelligent interface that handles both creating new attendance records and editing past ones.
 * Demonstrates cross-microservice architecture by pulling relationships from the Academy Service
 * and hydrating them with user data from the Identity Service.
 */
export default function MarkAttendance() {
  const { blockId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Payload state passed down from the TeacherDashboard routing
  const sectionId = location.state?.sectionId;
  const savedDate = location.state?.savedDate || new Date().toISOString(); 
  const isEditMode = location.state?.isEditMode; 
  
  const [students, setStudents] = useState([]);
  
  // Dictionary holding the toggle state (key: student UUID, value: boolean)
  const [attendance, setAttendance] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Complex data fetching pipeline that resolves the class roster and pre-fills
   * historical attendance data if the teacher is in Edit Mode.
   */
  useEffect(() => {
    const fetchStudentsAndRecords = async () => {
      if (!sectionId) return;
      try {
        const token = localStorage.getItem('clutch_token');
        
        // --- STEP 1: Fetch relationships (Academy Service) ---
        const academicRes = await axios.get(`/api/v1/sections/${sectionId}/students`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const studentIds = academicRes.data;

        if (studentIds.length === 0) {
            setIsLoading(false);
            return;
        }

        // --- STEP 2: Hydrate Data (Identity Service) ---
        const identityRes = await axios.post(`/api/v1/users/batch`, studentIds, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const realStudents = identityRes.data;
        setStudents(realStudents);
        
        let initialAttendance = {};
        realStudents.forEach(s => initialAttendance[s.id] = true);

        // --- STEP 3: Edit Mode Override ---
        if (isEditMode) {
            const dateStr = new Date(savedDate).toISOString().split('T')[0]; 
            
            const recordsRes = await axios.get(`/api/v1/attendance/block/${blockId}?date=${dateStr}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            recordsRes.data.forEach(record => {
                initialAttendance[record.studentId] = record.status === "PRESENT";
            });
        }

        setAttendance(initialAttendance);

      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudentsAndRecords();
  }, [sectionId, isEditMode, savedDate, blockId]);

  const handleToggle = (studentId) => {
    setAttendance((prev) => ({ ...prev, [studentId]: !prev[studentId] }));
  };

  /**
   * Packages the local dictionary state into a DTO and submits it as a bulk save operation.
   */
  const handleSubmit = async () => {
    setIsSubmitting(true);
    const token = localStorage.getItem('clutch_token');

    try {
      
      const formattedDate = new Date(savedDate).toISOString().split('T')[0];

      const batchPayload = {
        blockId: blockId,
        date: formattedDate, 
        records: students.map(student => ({
          studentId: student.id,
          status: attendance[student.id] ? "PRESENT" : "ABSENT"
        }))
      };

      // Ensure your backend endpoint in AcademyAdminController is actually mapped to POST /api/v1/attendance
      await axios.post('/api/v1/attendance/', batchPayload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert(isEditMode ? "Attendance updated successfully!" : "Batch attendance saved successfully!");
      
      // Route teacher back to the dashboard, passing the date so they don't lose their place in the calendar
      navigate('/dashboard', { state: { savedDate } }); 

    } catch (error) {
      console.error("Failed to save batch attendance:", error);
      
      // Better error handling to catch our custom InvalidDateException from the backend!
      const errorMsg = error.response?.data?.message || "Error saving attendance. Check your console.";
      alert(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!sectionId) return <div className="p-8 text-center text-red-500">Error: Section ID missing. Please go back.</div>;

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <button onClick={() => navigate('/dashboard', { state: { savedDate } })} className="flex items-center gap-2 text-slate-500 hover:text-clutch-600 mb-6 font-medium transition-colors">
        <ArrowLeft size={18} /> Back to Schedule
      </button>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-clutch-900">{isEditMode ? "Edit Attendance" : "Mark Attendance"}</h1>
          <p className="text-slate-500 mt-1">Verify and submit the roster below.</p>
        </div>
        <div className="w-full md:w-auto">
          <PrimaryButton text={isEditMode ? "Update Database" : "Submit to Database"} onClick={handleSubmit} isLoading={isSubmitting} />
        </div>
      </div>

      {isLoading ? (
          <div className="text-center p-8 text-slate-500">Fetching live student data...</div>
      ) : students.length === 0 ? (
          <div className="text-center p-8 text-slate-500 bg-surface rounded-xl border border-dashed">No students enrolled in this section yet.</div>
      ) : (
          <StudentRosterTable students={students} attendanceState={attendance} handleToggle={handleToggle} />
      )}
    </div>
  );
}