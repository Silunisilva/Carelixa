import { useState, useEffect } from 'react';
import {
  getAllTeachers,
  getAllDoctors,
  linkTeacherToChild,
  linkDoctorToChild,
  removeTeacherFromChild,
  removeDoctorFromChild,
} from '../services/dataService';

function ManageChildAssignments({ isOpen, onClose, child }) {
  const [teachers, setTeachers] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedTeachers, setSelectedTeachers] = useState([]);
  const [selectedDoctors, setSelectedDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && child) {
      loadData();
    }
  }, [isOpen, child]);

  const loadData = async () => {
    try {
      const [teachersList, doctorsList] = await Promise.all([
        getAllTeachers(),
        getAllDoctors(),
      ]);
      setTeachers(teachersList);
      setDoctors(doctorsList);
      setSelectedTeachers(child.linkedTeachers || []);
      setSelectedDoctors(child.linkedDoctors || []);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load professionals');
    }
  };

  const handleTeacherToggle = async (teacherId) => {
    try {
      setLoading(true);
      if (selectedTeachers.includes(teacherId)) {
        await removeTeacherFromChild(child.id, teacherId);
        setSelectedTeachers(prev => prev.filter(id => id !== teacherId));
      } else {
        await linkTeacherToChild(child.id, teacherId);
        setSelectedTeachers(prev => [...prev, teacherId]);
      }
      setMessage('Assignment updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Error updating teacher assignment:', err);
      setError('Failed to update assignment');
    } finally {
      setLoading(false);
    }
  };

  const handleDoctorToggle = async (doctorId) => {
    try {
      setLoading(true);
      if (selectedDoctors.includes(doctorId)) {
        await removeDoctorFromChild(child.id, doctorId);
        setSelectedDoctors(prev => prev.filter(id => id !== doctorId));
      } else {
        await linkDoctorToChild(child.id, doctorId);
        setSelectedDoctors(prev => [...prev, doctorId]);
      }
      setMessage('Assignment updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Error updating doctor assignment:', err);
      setError('Failed to update assignment');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !child) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="glass p-8 rounded-[2rem] max-w-md w-full border border-white/20 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Manage Assignments</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ✕
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Managing assignments for <span className="font-semibold">{child.name}</span>
        </p>

        {message && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-xs text-green-700">✓ {message}</p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Teachers Section */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span className="text-xl">👩‍🏫</span> Assign Teachers
            </h3>
            <div className="space-y-2">
              {teachers.length === 0 ? (
                <p className="text-sm text-gray-500">No teachers available</p>
              ) : (
                teachers.map(teacher => (
                  <label
                    key={teacher.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/40 cursor-pointer transition-all"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTeachers.includes(teacher.id)}
                      onChange={() => handleTeacherToggle(teacher.id)}
                      disabled={loading}
                      className="w-4 h-4 rounded"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{teacher.name}</p>
                      <p className="text-xs text-gray-500">{teacher.email}</p>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Doctors Section */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span className="text-xl">👨‍⚕️</span> Assign Doctors
            </h3>
            <div className="space-y-2">
              {doctors.length === 0 ? (
                <p className="text-sm text-gray-500">No doctors available</p>
              ) : (
                doctors.map(doctor => (
                  <label
                    key={doctor.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/40 cursor-pointer transition-all"
                  >
                    <input
                      type="checkbox"
                      checked={selectedDoctors.includes(doctor.id)}
                      onChange={() => handleDoctorToggle(doctor.id)}
                      disabled={loading}
                      className="w-4 h-4 rounded"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{doctor.name}</p>
                      <p className="text-xs text-gray-500">{doctor.email}</p>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-white/20">
          <button
            onClick={onClose}
            className="w-full py-2 px-4 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default ManageChildAssignments;
