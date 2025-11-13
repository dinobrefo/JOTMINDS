import { User, Assessment, Reflection, AssessmentProgress, SupervisorReviewData, ParentObservationAssessment, ChildSharingConsent } from '../types';

const STORAGE_KEYS = {
  CURRENT_USER: 'ts_current_user',
  USERS: 'ts_users',
  ASSESSMENTS: 'ts_assessments',
  REFLECTIONS: 'ts_reflections',
  ASSESSMENT_PROGRESS: 'ts_assessment_progress',
  SUPERVISOR_REVIEWS: 'ts_supervisor_reviews',
  PARENT_OBSERVATIONS: 'ts_parent_observations',
  SHARING_CONSENTS: 'ts_sharing_consents',
};

// User management
export function saveCurrentUser(user: User | null) {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
}

export function getCurrentUser(): User | null {
  const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  return data ? JSON.parse(data) : null;
}

export function getAllUsers(): User[] {
  const data = localStorage.getItem(STORAGE_KEYS.USERS);
  return data ? JSON.parse(data) : [];
}

export function saveUser(user: User) {
  const users = getAllUsers();
  const index = users.findIndex(u => u.id === user.id);
  if (index >= 0) {
    users[index] = user;
  } else {
    users.push(user);
  }
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

export function findUserByEmail(email: string): User | undefined {
  const users = getAllUsers();
  return users.find(u => u.email === email);
}

// Admin authentication - Multi-admin support
const ADMIN_CREDENTIALS = [
  {
    email: 'Alex.Attachey@gmail.com',
    password: '0248838540',
    name: 'Alex Attachey',
    id: 'admin_001'
  },
  // Add more admins here as needed
  // {
  //   email: 'admin2@example.com',
  //   password: 'password2',
  //   name: 'Admin Name 2',
  //   id: 'admin_002'
  // }
];

export function authenticateAdmin(email: string, password: string): boolean {
  return ADMIN_CREDENTIALS.some(
    admin => admin.email === email && admin.password === password
  );
}

export function createAdminUser(email: string): User {
  const adminCred = ADMIN_CREDENTIALS.find(admin => admin.email === email);
  
  if (!adminCred) {
    throw new Error('Admin credentials not found');
  }
  
  return {
    id: adminCred.id,
    email: adminCred.email,
    name: adminCred.name,
    phone: '0248838540',
    role: 'admin' as any, // Cast to bypass type checking for admin role
    createdAt: new Date().toISOString(),
  };
}

// School mapping - Get all students from a specific school
export function getStudentsBySchool(schoolName: string): User[] {
  const users = getAllUsers();
  return users.filter(u => 
    u.role === 'student' && 
    u.school && 
    u.school.toLowerCase().trim() === schoolName.toLowerCase().trim()
  );
}

// School mapping - Get all teachers from a specific school
export function getTeachersBySchool(schoolName: string): User[] {
  const users = getAllUsers();
  return users.filter(u => 
    u.role === 'teacher' && 
    u.school && 
    u.school.toLowerCase().trim() === schoolName.toLowerCase().trim()
  );
}

// School mapping - Automatically map students to a teacher's school
export function mapStudentsToTeacher(teacherId: string): User {
  const users = getAllUsers();
  const teacher = users.find(u => u.id === teacherId);
  
  if (!teacher || teacher.role !== 'teacher' || !teacher.school) {
    throw new Error('Invalid teacher or school not found');
  }
  
  // Get all students from the same school
  const schoolStudents = getStudentsBySchool(teacher.school);
  
  // Update teacher's students list
  const updatedTeacher = {
    ...teacher,
    students: schoolStudents.map(s => s.id)
  };
  
  saveUser(updatedTeacher);
  return updatedTeacher;
}

// School mapping - Get all schools with student/teacher counts
export function getAllSchools(): { name: string; studentCount: number; teacherCount: number }[] {
  const users = getAllUsers();
  const schoolMap = new Map<string, { studentCount: number; teacherCount: number }>();
  
  users.forEach(user => {
    if (user.school && (user.role === 'student' || user.role === 'teacher')) {
      const normalizedSchool = user.school.toLowerCase().trim();
      const existing = schoolMap.get(normalizedSchool) || { studentCount: 0, teacherCount: 0 };
      
      if (user.role === 'student') {
        existing.studentCount++;
      } else if (user.role === 'teacher') {
        existing.teacherCount++;
      }
      
      schoolMap.set(normalizedSchool, existing);
    }
  });
  
  return Array.from(schoolMap.entries()).map(([name, counts]) => ({
    name,
    ...counts
  }));
}

// Parent-child linking - Add a child to parent's account
export function linkChildToParent(parentId: string, childEmail: string): { success: boolean; message: string; parent?: User } {
  const users = getAllUsers();
  const parent = users.find(u => u.id === parentId);
  const child = users.find(u => u.email.toLowerCase() === childEmail.toLowerCase());
  
  if (!parent || parent.role !== 'parent') {
    return { success: false, message: 'Invalid parent account' };
  }
  
  if (!child || child.role !== 'student') {
    return { success: false, message: 'Student not found. Please check the email address.' };
  }
  
  // Check if already linked
  if (parent.students?.includes(child.id)) {
    return { success: false, message: 'This child is already linked to your account.' };
  }
  
  // Add child to parent's students list
  const updatedParent = {
    ...parent,
    students: [...(parent.students || []), child.id]
  };
  
  saveUser(updatedParent);
  return { success: true, message: 'Child successfully linked!', parent: updatedParent };
}

// Parent-child linking - Remove a child from parent's account
export function unlinkChildFromParent(parentId: string, childId: string): User {
  const users = getAllUsers();
  const parent = users.find(u => u.id === parentId);
  
  if (!parent || parent.role !== 'parent') {
    throw new Error('Invalid parent account');
  }
  
  const updatedParent = {
    ...parent,
    students: (parent.students || []).filter(id => id !== childId)
  };
  
  saveUser(updatedParent);
  return updatedParent;
}

// Parent-child linking - Get all children linked to a parent
export function getLinkedChildren(parentId: string): User[] {
  const users = getAllUsers();
  const parent = users.find(u => u.id === parentId);
  
  if (!parent || parent.role !== 'parent' || !parent.students) {
    return [];
  }
  
  return users.filter(u => parent.students!.includes(u.id) && u.role === 'student');
}

// Assessment management
export function getAllAssessments(): Assessment[] {
  const data = localStorage.getItem(STORAGE_KEYS.ASSESSMENTS);
  return data ? JSON.parse(data) : [];
}

export function saveAssessment(assessment: Assessment) {
  const assessments = getAllAssessments();
  assessments.push(assessment);
  localStorage.setItem(STORAGE_KEYS.ASSESSMENTS, JSON.stringify(assessments));
}

export function getUserAssessments(userId: string): Assessment[] {
  const assessments = getAllAssessments();
  return assessments.filter(a => a.userId === userId);
}

export function getAssessmentById(id: string): Assessment | undefined {
  const assessments = getAllAssessments();
  return assessments.find(a => a.id === id);
}

// Reflection management
export function getAllReflections(): Reflection[] {
  const data = localStorage.getItem(STORAGE_KEYS.REFLECTIONS);
  return data ? JSON.parse(data) : [];
}

export function saveReflection(reflection: Reflection) {
  const reflections = getAllReflections();
  reflections.push(reflection);
  localStorage.setItem(STORAGE_KEYS.REFLECTIONS, JSON.stringify(reflections));
}

export function getUserReflections(userId: string): Reflection[] {
  const reflections = getAllReflections();
  return reflections.filter(r => r.userId === userId);
}

export function getReflectionsByAssessment(assessmentId: string): Reflection[] {
  const reflections = getAllReflections();
  return reflections.filter(r => r.assessmentId === assessmentId);
}

// Assessment progress management
export function saveAssessmentProgress(progress: AssessmentProgress) {
  const key = `${STORAGE_KEYS.ASSESSMENT_PROGRESS}_${progress.userId}_${progress.assessmentType}_${progress.isOrganizational}`;
  try {
    const serialized = JSON.stringify(progress);
    localStorage.setItem(key, serialized);
    console.log('Saved progress to localStorage with key:', key);
    
    // Verify it was saved
    const verification = localStorage.getItem(key);
    if (!verification) {
      console.error('Failed to verify saved progress!');
    }
  } catch (error) {
    console.error('Error saving progress to localStorage:', error);
    throw error;
  }
}

export function getAssessmentProgress(
  userId: string, 
  assessmentType: 'kolb' | 'sternberg' | 'dual-process',
  isOrganizational: boolean
): AssessmentProgress | null {
  const key = `${STORAGE_KEYS.ASSESSMENT_PROGRESS}_${userId}_${assessmentType}_${isOrganizational}`;
  try {
    const data = localStorage.getItem(key);
    console.log('Getting progress from localStorage with key:', key, 'found:', !!data);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error reading progress from localStorage:', error);
    return null;
  }
}

export function clearAssessmentProgress(
  userId: string, 
  assessmentType: 'kolb' | 'sternberg' | 'dual-process',
  isOrganizational: boolean
) {
  const key = `${STORAGE_KEYS.ASSESSMENT_PROGRESS}_${userId}_${assessmentType}_${isOrganizational}`;
  localStorage.removeItem(key);
}

// Supervisor review management
export function getAllReviews(): SupervisorReviewData[] {
  const data = localStorage.getItem(STORAGE_KEYS.SUPERVISOR_REVIEWS);
  return data ? JSON.parse(data) : [];
}

export function saveReview(reviewData: Omit<SupervisorReviewData, 'id' | 'createdAt'>) {
  const reviews = getAllReviews();
  const newReview: SupervisorReviewData = {
    ...reviewData,
    id: generateId(),
    createdAt: new Date().toISOString()
  };
  reviews.push(newReview);
  localStorage.setItem(STORAGE_KEYS.SUPERVISOR_REVIEWS, JSON.stringify(reviews));
  return newReview;
}

export function getReviewsByProfessional(professionalId: string): SupervisorReviewData[] {
  const reviews = getAllReviews();
  return reviews.filter(r => r.professionalId === professionalId);
}

export function getReviewsBySupervisor(supervisorId: string): SupervisorReviewData[] {
  const reviews = getAllReviews();
  return reviews.filter(r => r.supervisorId === supervisorId);
}

export function getAssessmentsByUserId(userId: string): Assessment[] {
  return getUserAssessments(userId);
}

// Parent observation management
export function getAllParentObservations(): ParentObservationAssessment[] {
  const data = localStorage.getItem(STORAGE_KEYS.PARENT_OBSERVATIONS);
  return data ? JSON.parse(data) : [];
}

export function saveParentObservation(observation: ParentObservationAssessment) {
  const observations = getAllParentObservations();
  observations.push(observation);
  localStorage.setItem(STORAGE_KEYS.PARENT_OBSERVATIONS, JSON.stringify(observations));
}

export function getParentObservationsByParent(parentId: string): ParentObservationAssessment[] {
  const observations = getAllParentObservations();
  return observations.filter(o => o.parentId === parentId);
}

export function getParentObservationsByChild(childId: string): ParentObservationAssessment[] {
  const observations = getAllParentObservations();
  return observations.filter(o => o.childId === childId);
}

export function getParentObservationById(id: string): ParentObservationAssessment | undefined {
  const observations = getAllParentObservations();
  return observations.find(o => o.id === id);
}

// Child sharing consent management
export function getAllSharingConsents(): ChildSharingConsent[] {
  const data = localStorage.getItem(STORAGE_KEYS.SHARING_CONSENTS);
  return data ? JSON.parse(data) : [];
}

export function saveSharingConsent(consent: ChildSharingConsent) {
  const consents = getAllSharingConsents();
  // Remove existing consent for this child-parent pair
  const filtered = consents.filter(c => !(c.childId === consent.childId && c.parentId === consent.parentId));
  filtered.push(consent);
  localStorage.setItem(STORAGE_KEYS.SHARING_CONSENTS, JSON.stringify(filtered));
}

export function getSharingConsentForChild(childId: string, parentId: string): ChildSharingConsent | undefined {
  const consents = getAllSharingConsents();
  return consents.find(c => c.childId === childId && c.parentId === parentId);
}

export function hasChildGrantedAccess(childId: string, parentId: string): boolean {
  const consent = getSharingConsentForChild(childId, parentId);
  return consent?.consentGiven === true;
}

// Helper to generate unique IDs
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}