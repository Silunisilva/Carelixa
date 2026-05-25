import { useState, useEffect } from 'react';
import { registerChild, getAllTeachers, getAllDoctors, linkTeacherToChild, linkDoctorToChild } from '../services/dataService';

function AddChildModal({ isOpen, onClose, onChildAdded, parentId }) {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'male',
    diagnosis: '',
    teacherId: '',
    doctorId: '',
  });

  const [teachers, setTeachers] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch available teachers and doctors when modal opens
  useEffect(() => {
    if (isOpen) {
      loadTeachersAndDoctors();
    }
  }, [isOpen]);

  const loadTeachersAndDoctors = async () => {
    try {
      const [teachersList, doctorsList] = await Promise.all([
        getAllTeachers(),
        getAllDoctors(),
      ]);
      setTeachers(teachersList);
      setDoctors(doctorsList);
    } catch (err) {
      console.error('Error loading teachers and doctors:', err);
      setError('Failed to load available professionals');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!formData.name || !formData.age || !formData.diagnosis) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      // Register the child
      const newChild = await registerChild({
        name: formData.name,
        age: parseInt(formData.age),
        gender: formData.gender,
        diagnosis: formData.diagnosis,
        parentId,
        teacherId: formData.teacherId || null,
        doctorId: formData.doctorId || null,
      });

      // Link teacher if selected
      if (formData.teacherId) {
        await linkTeacherToChild(newChild.id, formData.teacherId);
      }

      // Link doctor if selected
      if (formData.doctorId) {
        await linkDoctorToChild(newChild.id, formData.doctorId);
      }

      setSuccess(`${formData.name} has been registered successfully!`);
      setFormData({
        name: '',
        age: '',
        gender: 'male',
        diagnosis: '',
        teacherId: '',
        doctorId: '',
      });

      // Call the callback to update parent dashboard
      if (onChildAdded) {
        onChildAdded(newChild);
      }

      // Close modal after 1.5 seconds
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Error registering child:', err);
      setError(err.message || 'Failed to register child. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="glass p-8 rounded-[2rem] max-w-md w-full border border-white/20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Register Child</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700">✓ {success}</p>
            <p className="text-xs text-green-600 mt-1 font-medium">Don't forget to complete the M-CHAT screening for initial risk assessment!</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Child's Name 
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., Emma Johnson"
              className="w-full px-4 py-2 rounded-lg glass border border-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age 
              </label>
              <input
                type="number"
                name="age"
                min="1"
                max="18"
                value={formData.age}
                onChange={handleInputChange}
                placeholder="4"
                className="w-full px-4 py-2 rounded-lg glass border border-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-lg glass border border-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Diagnosis/Condition 
            </label>
            <input
              type="text"
              name="diagnosis"
              value={formData.diagnosis}
              onChange={handleInputChange}
              placeholder="e.g., ASD Level 1"
              className="w-full px-4 py-2 rounded-lg glass border border-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign Teacher
            </label>
            <select
              name="teacherId"
              value={formData.teacherId}
              onChange={handleInputChange}
              className="w-full px-4 py-2 rounded-lg glass border border-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">-- Select a teacher --</option>
              {teachers.map(teacher => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name} (📧 {teacher.email})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Optional - you can add later</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign Doctor
            </label>
            <select
              name="doctorId"
              value={formData.doctorId}
              onChange={handleInputChange}
              className="w-full px-4 py-2 rounded-lg glass border border-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">-- Select a doctor --</option>
              {doctors.map(doctor => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name} (📧 {doctor.email})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Optional - you can add later</p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 px-4 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Registering...' : 'Register Child'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddChildModal;
