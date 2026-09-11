import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Clock, MapPin, BookOpen, Calendar as CalendarIcon, User } from 'lucide-react';

export default function StudentTimetable() {
  const [schedule, setSchedule] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  

  const daysOfWeek = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY'
];
  
  const todayIndex = new Date().getDay() - 1; 
  const currentDay = todayIndex >= 0 && todayIndex <= 4 ? daysOfWeek[todayIndex] : 'MONDAY';
  const [selectedDay, setSelectedDay] = useState(currentDay);

  useEffect(() => {
    fetchTimetable();
  }, []);

  const fetchTimetable = async () => {
    setIsLoading(true);
    try {
      const studentId = localStorage.getItem('clutch_userId');
      const token = localStorage.getItem('clutch_token');
      
      const response = await axios.get(`/api/v1/blocks/student/${studentId}/timetable`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSchedule(response.data);
    } catch (error) {
      console.error("Error fetching timetable:", error);
    } finally {
      setIsLoading(false);
    }
  };

  
  const dailyClasses = schedule
  .filter(cls => cls.dayOfWeek?.toUpperCase() === selectedDay)
  .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const formattedHour = h % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="mb-8 flex items-center gap-4">
        <div className="bg-clutch-100 p-3.5 rounded-2xl text-clutch-600 shadow-sm border border-clutch-200">
          <CalendarIcon size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Schedule</h1>
          <p className="text-slate-500 mt-1">Your daily classes and lectures.</p>
        </div>
      </div>

      {/* DAY SELECTOR TABS */}
      <div className="flex overflow-x-auto gap-2 mb-8 pb-2 hide-scrollbar">
        {daysOfWeek.map(day => {
          const isActive = selectedDay === day;
          return (
           <button
  key={day}
  onClick={() => setSelectedDay(day)}
  className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap border ${
    isActive 
      ? 'bg-slate-900 text-white border-slate-900 shadow-md' // 🚨 FIXED: Dark slate background with white text
      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-800' // Inactive: White bg, grey text
  }`}
>
  {day.charAt(0) + day.slice(1).toLowerCase()}
</button>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
        {isLoading ? (
          <div className="text-center text-slate-500 font-medium py-8">Loading schedule...</div>
        ) : dailyClasses.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock size={24} className="text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-700">No Classes</h3>
            <p className="text-slate-500 mt-1">You have a free schedule on {selectedDay.toLowerCase()}!</p>
          </div>
        ) : (
          <div className="relative border-l-2 border-slate-100 ml-4 md:ml-6 space-y-8">
            {dailyClasses.map((cls, index) => (
              <div key={index} className="relative pl-8 md:pl-10">
                <div className="absolute -left-[9px] top-1.5 w-4 h-4 bg-clutch-500 border-4 border-white rounded-full shadow-sm"></div>
                
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
                    <h3 className="text-xl font-bold text-slate-800">{cls.subject?.name}</h3>
                    <div className="flex items-center gap-1.5 text-clutch-600 font-bold text-sm bg-clutch-50 px-3 py-1 rounded-lg w-fit">
                      <Clock size={16} />
                      {formatTime(cls.startTime)} - {formatTime(cls.endTime)}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <BookOpen size={16} className="text-slate-400" />
                      Section {cls.section?.name || cls.sectionName}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin size={16} className="text-slate-400" />
                      Room {cls.roomNumber || 'TBA'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}