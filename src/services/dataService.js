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
} from '../firebase';

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
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
    return null;
  } catch (error) {
    console.error('Error fetching user:', error);
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
    await fbUpdateDoc(docRef, updates);
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};
