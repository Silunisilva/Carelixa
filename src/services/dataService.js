import {
  db,
  fbGetDocs,
  fbCollection,
  fbQuery,
  fbWhere,
  fbSetDoc,
  fbDoc,
  fbUpdateDoc,
  fbArrayUnion,
  fbArrayRemove,
  fbGetDoc,
  fbAddDoc,
  fbServerTimestamp,
  fbOrderBy,
  storage,
  fbRef,
  fbUploadBytes,
  fbGetDownloadURL,
} from '../firebase';
import { isBlockchainEnabled, verifyConsentOnChain } from './blockchainService';

// ─── Audit Trail Logger ─────────────────────────────────────────────

/**
 * Logs a critical action to the immutable audit trail
 */
export const logAuditEvent = async (actorId, actorRole, actionType, targetChildId, details = {}) => {
  try {
    const auditPayload = {
      actor_id: actorId,
      actor_role: actorRole,
      action: actionType,
      target_id: targetChildId,
      metadata: details,
      timestamp: fbServerTimestamp(),
    };
    await fbAddDoc(fbCollection(db, 'audit_logs'), auditPayload);
  } catch (error) {
    console.error('Failed to write to audit trail:', error);
    // Deliberately not throwing to prevent blocking the main user flow
  }
};

/**
 * Fetch audit logs for a specific child
 */
export const getChildAuditLogs = async (childId) => {
  try {
    const q = fbQuery(
      fbCollection(db, 'audit_logs'),
      fbWhere('target_id', '==', childId)
    );
    const snapshot = await fbGetDocs(q);
    const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Sort locally to avoid needing a Firestore Composite Index
    return logs.sort((a, b) => {
      const timeA = a.timestamp?.toMillis ? a.timestamp.toMillis() : 0;
      const timeB = b.timestamp?.toMillis ? b.timestamp.toMillis() : 0;
      return timeB - timeA; // Descending
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }
};

// ─── Children Management ───────────────────────────────────────────

/**
 * Get all children for a parent
 */
export const getParentChildren = async (parentId) => {
  try {
    const q = fbQuery(fbCollection(db, 'children'), fbWhere('parentId', '==', parentId));
    const snapshot = await fbGetDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching parent children:', error);
    return [];
  }
};

/**
 * Get a single child by ID
 */
export const getChild = async (childId) => {
  try {
    const docRef = fbDoc(db, 'children', childId);
    const snapshot = await fbGetDoc(docRef);
    if (snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() };
    }
    return null;
  } catch (error) {
    console.error('Error fetching child:', error);
    return null;
  }
};

/**
 * Register a new child
 */
export const registerChild = async (childData) => {
  try {
    const {
      name,
      age,
      gender,
      diagnosis,
      parentId,
      teacherId = null,
      doctorId = null,
    } = childData;

    const docRef = fbDoc(db, 'children', `${parentId}_${Date.now()}`);
    const childRecord = {
      name,
      age,
      gender,
      diagnosis,
      parentId,
      teacherId,
      doctorId,
      enrolledDate: new Date().toISOString().split('T')[0],
      linkedTeachers: teacherId ? [teacherId] : [],
      linkedDoctors: doctorId ? [doctorId] : [],
      createdAt: new Date(),
    };

    await fbSetDoc(docRef, childRecord);
    return { id: docRef.id, ...childRecord };
  } catch (error) {
    console.error('Error registering child:', error);
    throw error;
  }
};

/**
 * Link a teacher to a child
 */
export const linkTeacherToChild = async (childId, teacherId) => {
  try {
    const docRef = fbDoc(db, 'children', childId);
    await fbUpdateDoc(docRef, {
      linkedTeachers: fbArrayUnion(teacherId),
      teacherId: teacherId, // Also set primary teacher
    });
  } catch (error) {
    console.error('Error linking teacher to child:', error);
    throw error;
  }
};

/**
 * Link a doctor to a child
 */
export const linkDoctorToChild = async (childId, doctorId) => {
  try {
    const docRef = fbDoc(db, 'children', childId);
    await fbUpdateDoc(docRef, {
      linkedDoctors: fbArrayUnion(doctorId),
      doctorId: doctorId, // Also set primary doctor
    });
  } catch (error) {
    console.error('Error linking doctor to child:', error);
    throw error;
  }
};

/**
 * Remove a teacher from a child
 */
export const removeTeacherFromChild = async (childId, teacherId) => {
  try {
    const docRef = fbDoc(db, 'children', childId);
    await fbUpdateDoc(docRef, {
      linkedTeachers: fbArrayRemove(teacherId),
    });
  } catch (error) {
    console.error('Error removing teacher from child:', error);
    throw error;
  }
};

/**
 * Remove a doctor from a child
 */
export const removeDoctorFromChild = async (childId, doctorId) => {
  try {
    const docRef = fbDoc(db, 'children', childId);
    await fbUpdateDoc(docRef, {
      linkedDoctors: fbArrayRemove(doctorId),
    });
  } catch (error) {
    console.error('Error removing doctor from child:', error);
    throw error;
  }
};

/**
 * Update child information
 */
export const updateChild = async (childId, updates) => {
  try {
    const docRef = fbDoc(db, 'children', childId);
    await fbUpdateDoc(docRef, updates);
  } catch (error) {
    console.error('Error updating child:', error);
    throw error;
  }
};

/**
 * Save M-CHAT screening results for a child
 */
export const saveMCHATScore = async (childId, mchatData) => {
  try {
    const docRef = fbDoc(db, 'children', childId);
    await fbUpdateDoc(docRef, {
      mchatScore: mchatData.score,
      mchatRiskLevel: mchatData.riskLevel,
      mchatAnswers: mchatData.answers,
      mchatCompletedAt: new Date().toISOString(),
      mchatCompleted: true,
    });
    
    // Audit log
    await logAuditEvent('parent', 'parent', 'COMPLETED_MCHAT', childId, { 
      score: mchatData.score, 
      riskLevel: mchatData.riskLevel 
    });
  } catch (error) {
    console.error('Error saving M-CHAT score:', error);
    throw error;
  }
};

/**
 * Get M-CHAT screening results for a child
 */
export const getMCHATScore = async (childId) => {
  try {
    const child = await getChild(childId);
    if (child && child.mchatCompleted) {
      return {
        score: child.mchatScore,
        riskLevel: child.mchatRiskLevel,
        completedAt: child.mchatCompletedAt,
        answers: child.mchatAnswers || [],
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching M-CHAT score:', error);
    return null;
  }
};

// ─── Teachers Management ───────────────────────────────────────────

/**
 * Get all registered teachers
 */
export const getAllTeachers = async () => {
  try {
    const q = fbQuery(fbCollection(db, 'users'), fbWhere('role', '==', 'teacher'));
    const snapshot = await fbGetDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return [];
  }
};

/**
 * Get children assigned to a teacher
 */
export const getTeacherChildren = async (teacherId) => {
  try {
    const q = fbQuery(
      fbCollection(db, 'children'),
      fbWhere('linkedTeachers', 'array-contains', teacherId)
    );
    const snapshot = await fbGetDocs(q);
    let children = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    if (isBlockchainEnabled()) {
      const authorizedChildren = [];
      for (const child of children) {
        const hasAccess = await verifyConsentOnChain(child.id, teacherId);
        if (hasAccess) authorizedChildren.push(child);
      }
      children = authorizedChildren;
    }
    
    return children;
  } catch (error) {
    console.error('Error fetching teacher children:', error);
    return [];
  }
};

/**
 * Get primary children for a teacher (where teacher is the main teacher)
 */
export const getTeacherPrimaryChildren = async (teacherId) => {
  try {
    const q = fbQuery(
      fbCollection(db, 'children'),
      fbWhere('teacherId', '==', teacherId)
    );
    const snapshot = await fbGetDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching teacher primary children:', error);
    return [];
  }
};

// ─── Doctors Management ────────────────────────────────────────────

/**
 * Get all registered doctors
 */
export const getAllDoctors = async () => {
  try {
    const q = fbQuery(fbCollection(db, 'users'), fbWhere('role', '==', 'doctor'));
    const snapshot = await fbGetDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error fetching doctors:', error);
    return [];
  }
};

/**
 * Get children assigned to a doctor
 */
export const getDoctorChildren = async (doctorId) => {
  try {
    const q = fbQuery(
      fbCollection(db, 'children'),
      fbWhere('linkedDoctors', 'array-contains', doctorId)
    );
    const snapshot = await fbGetDocs(q);
    let children = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    if (isBlockchainEnabled()) {
      const authorizedChildren = [];
      for (const child of children) {
        const hasAccess = await verifyConsentOnChain(child.id, doctorId);
        if (hasAccess) authorizedChildren.push(child);
      }
      children = authorizedChildren;
    }
    
    return children;
  } catch (error) {
    console.error('Error fetching doctor children:', error);
    return [];
  }
};

/**
 * Get primary children for a doctor (where doctor is the main doctor)
 */
export const getDoctorPrimaryChildren = async (doctorId) => {
  try {
    const q = fbQuery(
      fbCollection(db, 'children'),
      fbWhere('doctorId', '==', doctorId)
    );
    const snapshot = await fbGetDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching doctor primary children:', error);
    return [];
  }
};

// ─── User Management ──────────────────────────────────────────────

const MOCK_USERS = {
  // Mock Parents
  parent1: { id: 'parent1', name: 'Emma\'s Mother (Jane Johnson)', email: 'jane.johnson@example.com', phone: '+1 (555) 987-6543', role: 'parent' },
  parent2: { id: 'parent2', name: 'Liam\'s Father (Robert Smith)', email: 'robert.smith@example.com', phone: '+1 (555) 876-5432', role: 'parent' },
  parent3: { id: 'parent3', name: 'Olivia\'s Mother (Emily Brown)', email: 'emily.brown@example.com', phone: '+1 (555) 765-4321', role: 'parent' },
  
  // Mock Teachers
  teacher1: { id: 'teacher1', name: 'Ms. Jennifer Lee', email: 'jennifer.lee@school.edu', role: 'teacher', specialization: 'Special Education', phone: '+1 (555) 123-4567' },
  teacher2: { id: 'teacher2', name: 'Mr. David Smith', email: 'david.smith@school.edu', role: 'teacher', specialization: 'Behavioral Therapy', phone: '+1 (555) 234-5678' },
  teacher3: { id: 'teacher3', name: 'Ms. Anna Rodriguez', email: 'anna.rodriguez@school.edu', role: 'teacher', specialization: 'Speech & Language', phone: '+1 (555) 345-6789' },

  // Mock Doctors
  doctor1: { id: 'doctor1', name: 'Dr. Sarah Miller', email: 'sarah.miller@clinic.com', role: 'doctor', specialization: 'Developmental Pediatrics', phone: '+1 (555) 456-7890', clinic: 'Autism Care Clinic' },
  doctor2: { id: 'doctor2', name: 'Dr. Michael Chen', email: 'michael.chen@clinic.com', role: 'doctor', specialization: 'Clinical Psychology', phone: '+1 (555) 567-8901', clinic: 'Behavioral Health Center' },
  doctor3: { id: 'doctor3', name: 'Dr. Lisa Thompson', email: 'lisa.thompson@clinic.com', role: 'doctor', specialization: 'Occupational Therapy', phone: '+1 (555) 678-9012', clinic: 'Autism Care Clinic' }
};

/**
 * Get a user by ID
 */
export const getUser = async (userId) => {
  try {
    const docRef = fbDoc(db, 'users', userId);
    const snapshot = await fbGetDoc(docRef);
    if (snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() };
    }
    if (MOCK_USERS[userId]) {
      return MOCK_USERS[userId];
    }
    return null;
  } catch (error) {
    console.error('Error fetching user:', error);
    if (MOCK_USERS[userId]) {
      return MOCK_USERS[userId];
    }
    return null;
  }
};

/**
 * Get users by role
 */
export const getUsersByRole = async (role) => {
  try {
    const q = fbQuery(fbCollection(db, 'users'), fbWhere('role', '==', role));
    const snapshot = await fbGetDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error fetching users by role:', error);
    return [];
  }
};

/**
 * Update user information
 */
export const updateUser = async (userId, updates) => {
  try {
    const docRef = fbDoc(db, 'users', userId);
    // Use fbSetDoc with merge: true instead of fbUpdateDoc to ensure the document is created if it doesn't exist
    await fbSetDoc(docRef, updates, { merge: true });
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

// ─── Weekly Progress Management ────────────────────────────────────

/**
 * Generate week ID: "2024-week-22"
 */
const generateWeekId = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now - start;
  const oneDay = 86400000;
  const weekNum = Math.ceil((diff + start.getDay() * oneDay) / (7 * oneDay));
  return `${now.getFullYear()}-week-${String(weekNum).padStart(2, '0')}`;
};

/**
 * Get week start and end dates
 */
const getWeekDates = () => {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const weekStart = new Date(now.setDate(diff));
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  return {
    weekStartDate: weekStart.toISOString().split('T')[0],
    weekEndDate: weekEnd.toISOString().split('T')[0],
  };
};

/**
 * Get or create weekly progress record for a child
 */
export const getOrCreateWeeklyProgress = async (childId) => {
  try {
    const weekId = generateWeekId();
    const { weekStartDate, weekEndDate } = getWeekDates();
    const weekPath = fbCollection(db, 'children', childId, 'weeklyProgress');
    const weekDocRef = fbDoc(db, 'children', childId, 'weeklyProgress', weekId);
    
    const snap = await fbGetDoc(weekDocRef);
    
    if (snap.exists()) {
      return { weekId, ...snap.data() };
    }
    
    // Create new week record
    const weekData = {
      weekId,
      weekStartDate,
      weekEndDate,
      status: 'pending',
      parentProgress: null,
      teacherProgress: null,
      doctorProgress: null,
      modelPrediction: null,
      createdAt: new Date().toISOString(),
    };
    
    await fbSetDoc(weekDocRef, weekData);
    return { weekId, ...weekData };
  } catch (error) {
    console.error('Error getting/creating weekly progress:', error);
    return null;
  }
};

/**
 * Get current week's progress
 */
export const getWeeklyProgress = async (childId) => {
  try {
    const weekId = generateWeekId();
    const weekDocRef = fbDoc(db, 'children', childId, 'weeklyProgress', weekId);
    const snap = await fbGetDoc(weekDocRef);
    
    if (snap.exists()) {
      return { weekId, ...snap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error fetching weekly progress:', error);
    return null;
  }
};

/**
 * Submit parent weekly progress
 */
export const submitParentWeeklyProgress = async (childId, progressData, parentId) => {
  try {
    const weekId = generateWeekId();
    const weekDocRef = fbDoc(db, 'children', childId, 'weeklyProgress', weekId);
    
    const snap = await fbGetDoc(weekDocRef);
    
    // Check if parent already submitted this week
    if (snap.exists() && snap.data().parentProgress) {
      throw new Error('Parent progress already submitted for this week!');
    }
    
    await fbUpdateDoc(weekDocRef, {
      parentProgress: {
        ...progressData,
        submittedAt: new Date().toISOString(),
        submittedBy: parentId,
      },
      status: await checkAndUpdateWeeklyStatus(childId, weekId),
    });

    // Audit log
    await logAuditEvent(parentId, 'parent', 'SUBMITTED_PROGRESS', childId, { weekId });


    // Generate prediction after save (async, no await to avoid delays)
    generateAndStorePrediction(childId, weekId).catch(err => 
      console.warn('Prediction generation failed:', err)
    );
    
    return { weekId, success: true };
  } catch (error) {
    console.error('Error submitting parent progress:', error);
    throw error;
  }
};

/**
 * Submit teacher weekly progress
 */
export const submitTeacherWeeklyProgress = async (childId, progressData, teacherId) => {
  try {
    const weekId = generateWeekId();
    const weekDocRef = fbDoc(db, 'children', childId, 'weeklyProgress', weekId);
    
    const snap = await fbGetDoc(weekDocRef);
    
    if (snap.exists() && snap.data().teacherProgress) {
      throw new Error('Teacher progress already submitted for this week!');
    }
    
    await fbUpdateDoc(weekDocRef, {
      teacherProgress: {
        ...progressData,
        submittedAt: new Date().toISOString(),
        submittedBy: teacherId,
      },
      status: await checkAndUpdateWeeklyStatus(childId, weekId),
    });

    // Audit log
    await logAuditEvent(teacherId, 'teacher', 'SUBMITTED_PROGRESS', childId, { weekId });


    // Generate prediction after save (async, no await to avoid delays)
    generateAndStorePrediction(childId, weekId).catch(err => 
      console.warn('Prediction generation failed:', err)
    );
    
    return { weekId, success: true };
  } catch (error) {
    console.error('Error submitting teacher progress:', error);
    throw error;
  }
};

/**
 * Submit doctor weekly progress
 */
export const submitDoctorWeeklyProgress = async (childId, progressData, doctorId) => {
  try {
    const weekId = generateWeekId();
    const weekDocRef = fbDoc(db, 'children', childId, 'weeklyProgress', weekId);
    
    const snap = await fbGetDoc(weekDocRef);
    
    if (snap.exists() && snap.data().doctorProgress) {
      throw new Error('Doctor progress already submitted for this week!');
    }
    
    await fbUpdateDoc(weekDocRef, {
      doctorProgress: {
        ...progressData,
        submittedAt: new Date().toISOString(),
        submittedBy: doctorId,
      },
      status: await checkAndUpdateWeeklyStatus(childId, weekId),
    });

    // Audit log
    await logAuditEvent(doctorId, 'doctor', 'SUBMITTED_PROGRESS', childId, { weekId });


    // Generate prediction after save (async, no await to avoid delays)
    generateAndStorePrediction(childId, weekId).catch(err => 
      console.warn('Prediction generation failed:', err)
    );
    
    return { weekId, success: true };
  } catch (error) {
    console.error('Error submitting doctor progress:', error);
    throw error;
  }
};

/**
 * Check submission status and update
 */
const checkAndUpdateWeeklyStatus = async (childId, weekId) => {
  try {
    const weekDocRef = fbDoc(db, 'children', childId, 'weeklyProgress', weekId);
    const snap = await fbGetDoc(weekDocRef);
    
    if (!snap.exists()) return 'pending';
    
    const data = snap.data();
    const hasParent = !!data.parentProgress;
    const hasTeacher = !!data.teacherProgress;
    const hasDoctor = !!data.doctorProgress;
    
    // Only trigger model if Parent and Teacher have submitted AND no prediction exists yet.
    // Doctor submissions are optional/monthly, so we don't wait for them.
    if (hasParent && hasTeacher && !data.modelPrediction) {
      console.log('✅ Parent and Teacher submitted! Triggering AI model...');
      await triggerWeeklyAIModel(childId, weekId);
      return 'complete';
    }
    
    // Count submissions
    const submittedCount = [hasParent, hasTeacher, hasDoctor].filter(Boolean).length;
    return submittedCount > 0 ? 'partial' : 'pending';
  } catch (error) {
    console.error('Error checking status:', error);
    return 'pending';
  }
};

/**
 * Trigger AI model (placeholder - replace with actual API call)
 */
const triggerWeeklyAIModel = async (childId, weekId) => {
  try {
    const weekDocRef = fbDoc(db, 'children', childId, 'weeklyProgress', weekId);
    const snap = await fbGetDoc(weekDocRef);
    const data = snap.data();
    
    // TODO: Call your AI/ML backend here
    // const prediction = await callAIPredictionAPI({ childId, weekId, ...data });
    
    // For now, use mock prediction
    const prediction = {
      score: Math.round(Math.random() * 40 + 60), // 60-100
      riskLevel: Math.random() > 0.5 ? 'Low Risk' : Math.random() > 0.5 ? 'Medium Risk' : 'High Risk',
      insights: [
        'Excellent progress in communication skills this week',
        'Consider increasing social interaction opportunities',
        'Parent feedback aligns with teacher observations'
      ],
      generatedAt: new Date().toISOString(),
    };
    
    await fbUpdateDoc(weekDocRef, {
      modelPrediction: prediction,
      status: 'complete',
    });
    
    return prediction;
  } catch (error) {
    console.error('Error triggering AI model:', error);
    throw error;
  }
};

/**
 * Get submission status for a child's current week
 */
export const getWeeklyProgressStatus = async (childId) => {
  try {
    const weekId = generateWeekId();
    const weekDocRef = fbDoc(db, 'children', childId, 'weeklyProgress', weekId);
    const snap = await fbGetDoc(weekDocRef);
    
    if (!snap.exists()) {
      return {
        weekId,
        status: 'pending',
        parentSubmitted: false,
        teacherSubmitted: false,
        doctorSubmitted: false,
        submittedCount: 0,
        prediction: null,
      };
    }
    
    const data = snap.data();
    const parentSubmitted = !!data.parentProgress;
    const teacherSubmitted = !!data.teacherProgress;
    const doctorSubmitted = !!data.doctorProgress;
    const submittedCount = [parentSubmitted, teacherSubmitted, doctorSubmitted].filter(Boolean).length;
    
    // If parent and teacher have submitted but prediction is missing or errored,
    // trigger regeneration in the background so older records can be fixed
    const prediction = data.modelPrediction || null;
    if (parentSubmitted && teacherSubmitted && (!prediction || prediction.error)) {
      // fire-and-forget regeneration to avoid blocking the UI
      generateAndStorePrediction(childId, weekId).catch((err) => {
        console.warn('[Prediction Regen] failed for', childId, weekId, err?.message || err);
      });
    }

    return {
      weekId,
      status: data.status,
      parentSubmitted,
      teacherSubmitted,
      doctorSubmitted,
      submittedCount,
      prediction: data.modelPrediction || null,
      weekStartDate: data.weekStartDate,
      weekEndDate: data.weekEndDate,
    };
  } catch (error) {
    console.error('Error getting status:', error);
    return null;
  }
};

/**
 * Get the most recent weekly progress for a child (regardless of the current week)
 */
export const getLatestWeeklyProgress = async (childId) => {
  try {
    const q = fbQuery(fbCollection(db, 'children', childId, 'weeklyProgress'));
    const snap = await fbGetDocs(q);
    
    // Sort descending (newest first)
    const weeks = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    weeks.sort((a, b) => b.id.localeCompare(a.id));
    
    if (weeks.length > 0) {
      return weeks[0];
    }
    return null;
  } catch (error) {
    console.error('Error fetching latest weekly progress:', error);
    return null;
  }
};

// ─── Activity Sheets ────────────────────────────────────────────────

/**
 * Uploads an activity sheet to Firebase Storage and saves the metadata to Firestore.
 */
export const uploadActivitySheet = async (childId, teacherId, file, title) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    // Call local Python backend
    const response = await fetch('http://localhost:5001/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed with status ${response.status}`);
    }

    const data = await response.json();
    
    // Save metadata to Firestore
    const sheetData = {
      title: title || file.name,
      fileName: data.filename,
      url: data.url, // The local URL returned by Python (e.g. http://localhost:5001/uploads/...)
      uploadedBy: teacherId,
      createdAt: fbServerTimestamp(),
      type: file.type || 'application/octet-stream',
      size: file.size,
    };
    
    const docRef = await fbAddDoc(fbCollection(db, 'children', childId, 'activity_sheets'), sheetData);
    
    // Log audit event
    await logAuditEvent(teacherId, 'teacher', 'UPLOADED_ACTIVITY_SHEET', childId, { sheetId: docRef.id });
    
    return { id: docRef.id, ...sheetData };
  } catch (error) {
    console.error('Error uploading activity sheet:', error);
    throw error;
  }
};

/**
 * Fetches all activity sheets for a child.
 */
export const getChildActivitySheets = async (childId) => {
  try {
    const q = fbQuery(
      fbCollection(db, 'children', childId, 'activity_sheets'),
      fbOrderBy('createdAt', 'desc')
    );
    const snapshot = await fbGetDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching activity sheets:', error);
    return [];
  }
};

/**
 * Get the most recent monthly progress analysis for a child (last 4 weeks of data)
 */
export const getMonthlyProgressAnalysis = async (childId) => {
  try {
    const q = fbQuery(fbCollection(db, 'children', childId, 'weeklyProgress'));
    const snap = await fbGetDocs(q);
    
    // Sort descending (newest first) and limit to last 4 weeks
    const weeks = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    weeks.sort((a, b) => b.id.localeCompare(a.id));
    const last4Weeks = weeks.slice(0, 4);
    
    if (last4Weeks.length === 0) {
      return null;
    }

    const sums = {};
    const counts = {};

    last4Weeks.forEach(week => {
      // Parent metrics
      if (week.parentProgress) {
        ['meltdowns', 'sleep', 'appetite'].forEach(k => {
          if (week.parentProgress[k] !== undefined) {
            sums[k] = (sums[k] || 0) + week.parentProgress[k];
            counts[k] = (counts[k] || 0) + 1;
          }
        });
      }
      // Teacher metrics
      if (week.teacherProgress?.metrics) {
        ['communication', 'instructions', 'focus', 'social', 'emotional'].forEach(k => {
          if (week.teacherProgress.metrics[k] !== undefined) {
            sums[k] = (sums[k] || 0) + week.teacherProgress.metrics[k];
            counts[k] = (counts[k] || 0) + 1;
          }
        });
      }
    });

    const averages = {};
    Object.keys(sums).forEach(k => {
      averages[k] = sums[k] / counts[k];
    });

    const mappedScores = [];
    if (averages.communication) mappedScores.push({ name: 'Communication', score: averages.communication });
    if (averages.instructions) mappedScores.push({ name: 'Following Instructions', score: averages.instructions });
    if (averages.focus) mappedScores.push({ name: 'Focus Duration', score: averages.focus });
    if (averages.social) mappedScores.push({ name: 'Social Interaction', score: averages.social });
    if (averages.emotional) mappedScores.push({ name: 'Emotional Regulation', score: averages.emotional });
    
    // Reverse meltdowns since lower is better (so we map it to 6 - score for ranking purposes)
    if (averages.meltdowns) mappedScores.push({ name: 'Behavior Regulation', score: 6 - averages.meltdowns });
    if (averages.sleep) mappedScores.push({ name: 'Sleep Quality', score: averages.sleep });

    mappedScores.sort((a, b) => a.score - b.score);
    
    const weakestArea = mappedScores.length > 0 ? mappedScores[0] : { name: 'Pending Data', score: 0 };
    const strongestArea = mappedScores.length > 0 ? mappedScores[mappedScores.length - 1] : { name: 'Pending Data', score: 0 };

    const engagementPercent = averages.social ? Math.round((averages.social / 5) * 100) : 0;
    const independencePercent = averages.instructions ? Math.round((averages.instructions / 5) * 100) : 0;

    return {
      weeksAnalyzed: last4Weeks.length,
      engagementPercent,
      independencePercent,
      weakestArea: weakestArea.name,
      strongestArea: strongestArea.name,
      medicalSummary: mappedScores.length > 0 
        ? `Over the past ${last4Weeks.length} week(s), the patient has demonstrated positive responses in ${strongestArea.name} (averaging ${(strongestArea.score).toFixed(1)}/5). However, ${weakestArea.name} remains a challenge (averaging ${(weakestArea.score).toFixed(1)}/5). Recommended focus for the coming cycles: targeted strategies for ${weakestArea.name}.`
        : "Insufficient progress data gathered over the last month to generate a reliable medical summary.",
      averages
    };
  } catch (error) {
    console.error('Error fetching monthly progress analysis:', error);
    return null;
  }
};

/**
 * Get the most recent doctor progress for a child, falling back to older weeks.
 */
const getLastKnownDoctorProgress = async (childId, currentWeekId) => {
  try {
    const q = fbQuery(fbCollection(db, 'children', childId, 'weeklyProgress'));
    const snap = await fbGetDocs(q);
    
    // Get all weeks and sort descending (newest first)
    const weeks = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    weeks.sort((a, b) => b.id.localeCompare(a.id));
    
    // Find the first week that is <= currentWeekId AND has doctorProgress
    for (const week of weeks) {
      if (week.id <= currentWeekId && week.doctorProgress && Object.keys(week.doctorProgress).length > 0) {
        return week.doctorProgress;
      }
    }
  } catch (error) {
    console.error('Error fetching last known doctor progress:', error);
  }
  return {};
};

/**
 * Collect all available weekly progress data and generate AI predictions
 * Called when all roles have submitted their weekly observations
 */
export const generateWeeklyPrediction = async (childId) => {
  try {
    const weekId = generateWeekId();
    const weekDocRef = fbDoc(db, 'children', childId, 'weeklyProgress', weekId);
    const snap = await fbGetDoc(weekDocRef);
    
    if (!snap.exists()) {
      return { error: 'Weekly progress not found' };
    }
    
    const data = snap.data();
    const child = await getChild(childId);
    
    // Collect all available scores (data stored directly in parentProgress, not under metrics)
    const parentMetrics = data.parentProgress || {};
    const teacherMetrics = data.teacherProgress || {};
    let doctorMetrics = data.doctorProgress || {};
    
    // If the doctor hasn't submitted this week, fallback to their last monthly submission
    if (Object.keys(doctorMetrics).length === 0) {
      doctorMetrics = await getLastKnownDoctorProgress(childId, weekId);
    }
    
    // Calculate overall scores from metrics
    const allMetrics = { ...parentMetrics, ...teacherMetrics, ...doctorMetrics };
    const metricValues = Object.values(allMetrics)
      .filter(v => typeof v === 'number' && !isNaN(v))
      .map(v => Math.min(5, Math.max(1, v))); // Clamp between 1-5
    const weeklyScore = metricValues.length > 0 
      ? metricValues.reduce((a, b) => a + b, 0) / metricValues.length 
      : 3.0;
    
    // Ensure gender is valid (default to M if missing)
    const childGender = child?.gender || 'M';
    const validGender = ['M', 'F'].includes(childGender) ? childGender : 'M';
    
    // Format data for ML API (all fields must use snake_case)
    const predictionData = {
      child_id: childId,
      age: Math.max(1, Math.min(18, child?.age || 5)), // Clamp age 1-18
      gender: validGender, // Backend converts this to gender_enc
      week: Math.max(1, parseInt(weekId.split('-')[2]) || 1),
      // Parent-observed questions
      parent_q1: Math.max(1, Math.min(5, parentMetrics.meltdowns ? 5 - parentMetrics.meltdowns : 3)),
      parent_q2: Math.max(1, Math.min(5, parentMetrics.sleep || 3)),
      parent_q3: Math.max(1, Math.min(5, parentMetrics.appetite || 3)),
      // Teacher/classroom observations
      child_q1: Math.max(1, Math.min(5, teacherMetrics.communication || 3)),
      child_q2: Math.max(1, Math.min(5, teacherMetrics.eyeContact || 3)),
      child_q3: Math.max(1, Math.min(5, teacherMetrics.social || 3)),
      child_q4: Math.max(1, Math.min(5, teacherMetrics.focus || 3)),
      child_q5: Math.max(1, Math.min(5, teacherMetrics.emotional || 3)),
      child_q6: Math.max(1, Math.min(5, teacherMetrics.following || 3)),
      // Doctor/clinical assessment (maps same as teacher for consistency)
      teacher_communication_in_class: Math.max(1, Math.min(5, doctorMetrics.communication || teacherMetrics.communication || 3)),
      teacher_participation: Math.max(1, Math.min(5, doctorMetrics.social || teacherMetrics.social || 3)),
      doctor_overall_assessment: Math.max(1, Math.min(5, doctorMetrics.overall || 3)),
      // Score tracking (use snake_case for backend)
      prev_week_score: 3.0,
      weekly_overall_score: weeklyScore,
    };
    
    console.log('🔍 Prediction data to send:', predictionData);
    
    // Call ML API
    const PredictionAPI = (await import('./predictionAPI.js')).default;
    const prediction = await PredictionAPI.predictProgress(predictionData);
    
    // Save prediction to Firestore
    // Backend returns prediction object directly if successful
    await fbUpdateDoc(weekDocRef, {
      modelPrediction: {
        ...prediction,
        generatedAt: new Date().toISOString(),
      },
      status: 'all_submitted_with_prediction',
    });
    console.log('✅ Prediction saved:', prediction);
    
    return prediction;
  } catch (error) {
    console.error('❌ Error generating prediction:', error);
    return { error: error.message };
  }
};

/**
 * Generate and store prediction for child's weekly progress.
 * Collects data from all roles and calls ML API.
 */
export const generateAndStorePrediction = async (childId, weekId) => {
  try {
    // Get child data for demographics
    const child = await getChild(childId);
    if (!child) throw new Error('Child not found');

    // Get weekly progress data for this week
    const weekDocRef = fbDoc(db, 'children', childId, 'weeklyProgress', weekId);
    const weekSnap = await fbGetDoc(weekDocRef);
    
    if (!weekSnap.exists()) {
      throw new Error('Weekly progress data not found');
    }

    const weekData = weekSnap.data();
    
    // Collect all available scores (data stored directly, not under .metrics wrapper)
    const parentMetrics = weekData.parentProgress || {};
    const teacherMetrics = weekData.teacherProgress || {};
    
    // Only generate a prediction if both Parent and Teacher have submitted for the week
    if (Object.keys(parentMetrics).length === 0 || Object.keys(teacherMetrics).length === 0) {
      console.log('⏳ Waiting for both Parent and Teacher to submit before generating prediction.');
      return null;
    }
    
    let doctorMetrics = weekData.doctorProgress || {};
    
    // If the doctor hasn't submitted this week, fallback to their last monthly submission
    if (Object.keys(doctorMetrics).length === 0) {
      doctorMetrics = await getLastKnownDoctorProgress(childId, weekId);
    }
    
    // Calculate overall scores from metrics
    const allMetrics = { ...parentMetrics, ...teacherMetrics, ...doctorMetrics };
    const metricValues = Object.values(allMetrics)
      .filter(v => typeof v === 'number' && !isNaN(v))
      .map(v => Math.min(5, Math.max(1, v))); // Clamp between 1-5
    const weeklyScore = metricValues.length > 0 
      ? metricValues.reduce((a, b) => a + b, 0) / metricValues.length 
      : 3.0;
    
    // Ensure gender is valid (default to M if missing)
    const childGender = child?.gender || 'M';
    const validGender = ['M', 'F'].includes(childGender) ? childGender : 'M';
    
    // Build combined progress data from all roles (using corrected field mapping)
    const combinedData = {
      child_id: childId,
      age: Math.max(1, Math.min(18, child?.age || 5)), // Clamp age 1-18
      gender: validGender, // Backend converts this to gender_enc
      week: Math.max(1, parseInt(weekId.split('-')[2]) || 1),
      // Parent-observed questions
      parent_q1: Math.max(1, Math.min(5, parentMetrics.meltdowns ? 5 - parentMetrics.meltdowns : 3)),
      parent_q2: Math.max(1, Math.min(5, parentMetrics.sleep || 3)),
      parent_q3: Math.max(1, Math.min(5, parentMetrics.appetite || 3)),
      // Teacher/classroom observations
      child_q1: Math.max(1, Math.min(5, teacherMetrics.communication || 3)),
      child_q2: Math.max(1, Math.min(5, teacherMetrics.eyeContact || 3)),
      child_q3: Math.max(1, Math.min(5, teacherMetrics.social || 3)),
      child_q4: Math.max(1, Math.min(5, teacherMetrics.focus || 3)),
      child_q5: Math.max(1, Math.min(5, teacherMetrics.emotional || 3)),
      child_q6: Math.max(1, Math.min(5, teacherMetrics.following || 3)),
      // Doctor/clinical assessment (maps same as teacher for consistency)
      teacher_communication_in_class: Math.max(1, Math.min(5, doctorMetrics.communication || teacherMetrics.communication || 3)),
      teacher_participation: Math.max(1, Math.min(5, doctorMetrics.social || teacherMetrics.social || 3)),
      doctor_overall_assessment: Math.max(1, Math.min(5, doctorMetrics.overall || 3)),
      // Score tracking (use snake_case for backend)
      prev_week_score: 3.0,
      weekly_overall_score: weeklyScore,
    };

    console.log('🔍 generateAndStorePrediction data:', combinedData);

    // Call prediction API
    const PredictionAPI = (await import('./predictionAPI.js')).default;
    const prediction = await PredictionAPI.predictProgress(combinedData);

    console.log('📊 Prediction response:', prediction);

    // Store prediction in Firebase
    if (prediction && !prediction.error) {
      await fbUpdateDoc(weekDocRef, {
        modelPrediction: {
          ...prediction,
          generatedAt: new Date().toISOString(),
        },
      });
      
      // Audit log
      await logAuditEvent('system', 'system', 'AI_PREDICTION_GENERATED', childId, { 
        weekId, 
        weakestArea: prediction.weakestArea 
      });
      
      console.log('✅ Prediction stored successfully');
    } else {
      console.warn('❌ Prediction contains error:', prediction?.error);
    }

    return prediction;
  } catch (error) {
    console.error('❌ Error generating prediction:', error);
    // Don't throw - predictions are optional
    return { error: error.message };
  }
};
