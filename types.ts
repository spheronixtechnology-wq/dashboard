
export enum UserRole {
  STUDENT = 'STUDENT',
  INSTRUCTOR = 'INSTRUCTOR',
}

export interface User {
  id: string;
  username?: string;
  name: string;
  role: UserRole;
  email: string;
}

export interface Topic {
  id: string;
  title: string;
  content: string; // Rich text or markdown
  authorId: string;
  publishDate: string; // ISO Date
  isPublished?: boolean;
  attachments?: string[];
}

export enum TaskStatus {
  PENDING = 'PENDING',
  SUBMITTED = 'SUBMITTED',
  GRADED = 'GRADED',
}

export enum TaskType {
  ASSIGNMENT = 'ASSIGNMENT',
  PROJECT = 'PROJECT',
}

export enum ProjectCategory {
  WEB_DEV = 'WEB_DEV',
  APP_DEV = 'APP_DEV',
  CLOUD = 'CLOUD',
  DATA_SCIENCE = 'DATA_SCIENCE',
  CYBER_SECURITY = 'CYBER_SECURITY'
}

export interface Task {
  id: string;
  title: string;
  description: string;
  deadline: string; // ISO Date
  assignedTo: 'ALL' | string[]; // 'ALL' or array of student IDs
  createdBy: string;
  type: TaskType;
  projectCategory?: ProjectCategory;
  isPublished?: boolean;
}

export interface TaskSubmission {
  id: string;
  taskId: string;
  studentId: string;
  studentName: string;
  fileUrl: string;
  originalFileName?: string;
  fileSize?: number;
  fileType?: string;
  code?: string; // For coding tasks
  language?: string;
  output?: string;
  submittedAt: string;
  status: TaskStatus;
  grade?: number;
  feedback?: string;
  gradedAt?: string; // ISO Date
}

export enum ExamType {
  MCQ = 'MCQ',
  DESCRIPTIVE = 'DESCRIPTIVE',
  CODING = 'CODING',
}

export enum ExamCategory {
  EXAM = 'EXAM',
  MOCK_EXAM = 'MOCK_EXAM',
  MOCK_INTERVIEW = 'MOCK_INTERVIEW',
}

export interface Question {
  id: string;
  type: ExamType;
  text: string;
  options?: string[]; // For MCQ
  correctAnswer?: string; // For MCQ
  codeLanguage?: string; // For CODING (e.g., 'javascript', 'python')
  maxMarks: number;
}

export enum ExamStatus {
  UPCOMING = 'UPCOMING',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  questions: Question[];
  createdBy: string;
  category: ExamCategory;
  status?: 'DRAFT' | 'PUBLISHED' | 'COMPLETED';
}

export interface ExamSubmission {
  id: string;
  examId: string;
  studentId: string;
  submittedAt: string;
  answers: Record<string, string>; // questionId -> answer
  score?: number;
  isGraded: boolean;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string;
  loginTime: string;
  logoutTime?: string;
  lastActiveTime?: string;
  totalActiveMinutes?: number;
  status: 'PRESENT' | 'ABSENT';
}

export enum ResearchStatus {
  PENDING = 'PENDING',
  REVIEWED = 'REVIEWED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface ResearchSubmission {
  id: string;
  studentId: string;
  studentName: string;
  title: string;
  abstract: string; // The "idea" or description
  fileUrl?: string; // Optional document
  status: ResearchStatus;
  submittedAt: string;
  instructorFeedback?: string;
}

export interface MockExam {
  id: string;
  studentId: string;
  student?: User; // Populated
  title: string;
  score: number;
  totalMarks: number;
  feedback?: string;
  date: string;
}
