
// Data is now fetched exclusively from MongoDB via the API.
import { User, Topic, Task, TaskSubmission, Exam, ExamSubmission, AttendanceRecord, ResearchSubmission } from '../types';

export const USERS: User[] = [];
export const TOPICS: Topic[] = [];
export const TASKS: Task[] = [];
export const SUBMISSIONS: TaskSubmission[] = [];
export const EXAMS: Exam[] = [];
export const EXAM_SUBMISSIONS: ExamSubmission[] = [];
export const ATTENDANCE: AttendanceRecord[] = [];
export const RESEARCH_SUBMISSIONS: ResearchSubmission[] = [];
