
import { 
  User, Topic, Task, TaskSubmission, Exam, ExamSubmission, UserRole, TaskStatus, AttendanceRecord, ExamCategory, ResearchSubmission, ResearchStatus, Question, MockExam
} from '../types';

const API_URL = (import.meta as any).env.VITE_API_URL || '/api';

class ApiClient {
  
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const token = localStorage.getItem('token');

    const headers: HeadersInit = { 
        'Content-Type': 'application/json' 
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        headers: { ...headers, ...options?.headers },
        ...options,
      });
      
      if (!res.ok) {
        const errorJson = await res.clone().json().catch(() => null as any);
        const errorMessage =
          errorJson && typeof errorJson === 'object' && 'message' in errorJson ? (errorJson as any).message : '';
        
        // Handle 401 User Not Found (Stale Token)
        if (
          res.status === 401 &&
          (errorMessage === 'Not authorized, user not found' || errorMessage === 'Not authorized, token failed')
        ) {
            console.warn("Session expired or user not found. Redirecting to login.");
            localStorage.removeItem('token');
            window.location.href = '/#/login'; // Force redirect
            throw new Error("Session expired. Please login again.");
        }

        if (typeof errorMessage === 'string' && errorMessage.trim()) {
          throw new Error(errorMessage.trim());
        }

        const text = await res.text().catch(() => '');
        const cleanText = String(text).replace(/\s+/g, ' ').trim();
        const snippet = cleanText ? cleanText.slice(0, 200) : '';
        const fallback = `Request failed: ${res.status} ${res.statusText}. Is the backend running on http://127.0.0.1:5001?`;

        throw new Error(snippet || fallback);
      }
      
      const json = await res.json();
      
      // Handle standard response wrapper { success: true, data: ... }
      if (json && json.success !== undefined) {
          if (json.success) {
            // If data is present, return it. If not, return the whole json (e.g. for simple success messages or flat objects)
            return json.data !== undefined ? json.data : json;
          }
          throw new Error(json.message || "API returned failure");
      }
      
      // Fallback for direct array/object returns (legacy)
      return json;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // Auth
  async login(email: string, password?: string, role?: string): Promise<User | null> {
    try {
      const data = await this.request<User & { token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, role }),
      });
      
      if (data && data.token) {
          localStorage.setItem('token', data.token);
      }
      
      return data;
    } catch (e) {
      throw e; // Throw error to be caught by UI
    }
  }

  async getProfile(): Promise<User> {
    return this.request<User>('/auth/profile');
  }

  async getHealth(): Promise<{ success: boolean; service: string; db: string; aiEnabled: boolean }> {
    return this.request<{ success: boolean; service: string; db: string; aiEnabled: boolean }>('/health');
  }

  async signup(user: Omit<User, 'id'>, password: string): Promise<User | { requiresVerification: boolean, email: string }> {
    const data = await this.request<User & { token: string; requiresVerification?: boolean; email?: string }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ ...user, password }),
    });

    if (data && data.requiresVerification) {
        return { requiresVerification: true, email: data.email || '' };
    }

    if (data && data.token) {
        localStorage.setItem('token', data.token);
    }
    
    return data;
  }

  async verifySignup(email: string, code: string): Promise<User> {
      const data = await this.request<User & { token: string }>('/auth/verify-signup', {
          method: 'POST',
          body: JSON.stringify({ email, code })
      });

      if (data && data.token) {
          localStorage.setItem('token', data.token);
      }
      return data;
  }
  
  async getStudents(): Promise<User[]> {
      return this.request<User[]>('/auth/students');
  }

  // Topics
  async getTopics(publishedOnly?: boolean): Promise<Topic[]> {
    const query = publishedOnly ? '?publishedOnly=true' : '';
    const data = await this.request<Topic[]>(`/topics${query}`);
    return data || [];
  }

  async createTopic(topic: Omit<Topic, 'id'>): Promise<Topic> {
    return this.request<Topic>('/topics', {
      method: 'POST',
      body: JSON.stringify(topic),
    });
  }

  // Tasks
  async getTasks(userId: string, role: UserRole): Promise<Task[]> {
    const data = await this.request<Task[]>(`/tasks?role=${role}&userId=${userId}`);
    return data || [];
  }

  async createTask(task: Omit<Task, 'id'>): Promise<Task> {
    return this.request<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    });
  }

  async getTaskSubmissions(taskId: string): Promise<TaskSubmission[]> {
    const data = await this.request<TaskSubmission[]>(`/submissions?taskId=${taskId}`);
    return data || [];
  }
  
  async getStudentTaskSubmission(taskId: string, studentId: string): Promise<TaskSubmission | undefined> {
    const subs = await this.request<TaskSubmission[]>(`/submissions?taskId=${taskId}&studentId=${studentId}`);
    return subs && subs.length > 0 ? subs[0] : undefined;
  }

  async submitTask(submission: Omit<TaskSubmission, 'id' | 'status' | 'submittedAt'>): Promise<TaskSubmission> {
    return this.request<TaskSubmission>('/submissions', {
      method: 'POST',
      body: JSON.stringify(submission),
    });
  }

  async submitTaskFile(taskId: string, file: File): Promise<TaskSubmission> {
      const formData = new FormData();
      formData.append('taskId', taskId);
      formData.append('file', file);
      
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/submissions`, {
          method: 'POST',
          headers: {
              'Authorization': `Bearer ${token}`
          },
          body: formData
      });
      
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((json as any).message || 'Submission failed');
      if (json && (json as any).success !== undefined) return (json as any).data;
      return json as any;
  }

  async downloadSubmission(submissionId: string, filename: string) {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/submissions/${submissionId}/download`, {
          headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error("Download failed");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
  }

  async gradeTask(submissionId: string, grade: number, feedback: string): Promise<TaskSubmission> {
    return this.request<TaskSubmission>(`/submissions/${submissionId}/grade`, {
      method: 'PUT',
      body: JSON.stringify({ grade, feedback }),
    });
  }

  // Exams & AI Generation
  async getExams(category?: ExamCategory, role?: string): Promise<Exam[]> {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (role) params.append('role', role);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    const data = await this.request<Exam[]>(`/exams${query}`);
    return data || [];
  }

  async checkExamStatus(examId: string): Promise<{ success: boolean; hasSubmitted: boolean }> {
    return this.request<{ success: boolean; hasSubmitted: boolean }>(`/exams/${examId}/status`);
  }

  async createExam(exam: Omit<Exam, 'id'>): Promise<Exam> {
    return this.request<Exam>('/exams', {
      method: 'POST',
      body: JSON.stringify(exam),
    });
  }

  async deleteExam(id: string): Promise<void> {
    return this.request<void>(`/exams/${id}`, {
      method: 'DELETE',
    });
  }

  async updateExam(id: string, updates: Partial<Exam>): Promise<Exam> {
    return this.request<Exam>(`/exams/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async generateQuestions(topic: string, count: number, difficulty: string): Promise<Question[]> {
    return this.request<Question[]>('/generate-questions', {
      method: 'POST',
      body: JSON.stringify({ topic, count, difficulty }),
    });
  }

  async submitExam(submission: Omit<ExamSubmission, 'id' | 'submittedAt' | 'isGraded'>): Promise<ExamSubmission> {
    return this.request<ExamSubmission>('/exam-submissions', {
      method: 'POST',
      body: JSON.stringify(submission),
    });
  }

  async getExamResults(studentId: string): Promise<ExamSubmission[]> {
    const data = await this.request<ExamSubmission[]>(`/exam-submissions?studentId=${studentId}`);
    return data || [];
  }

  // New: For Instructor to see all students who took a specific exam
  async getExamSubmissionsForInstructor(examId: string): Promise<(ExamSubmission & { studentName?: string })[]> {
    const data = await this.request<ExamSubmission[]>(`/exam-submissions?examId=${examId}`);
    return data || [];
  }

  async updateExamResult(id: string, updates: Partial<ExamSubmission>): Promise<ExamSubmission> {
    return this.request<ExamSubmission>(`/exam-submissions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Performance
  async getStudentPerformance(studentId: string): Promise<{ 
    average: number; 
    subjects: { id: string; label: string; score: number; color: string }[];
    weakest: { label: string; score: number } | null;
  }> {
    return this.request(`/student-performance/${studentId}`);
  }

  // Attendance
  async getAttendanceHistory(userId: string): Promise<AttendanceRecord[]> {
    return this.request<AttendanceRecord[]>(`/attendance/${userId}`);
  }

  async sendHeartbeat(): Promise<void> {
      try {
          await this.request('/attendance/heartbeat', { method: 'POST' });
      } catch (e) {
          console.error("Heartbeat failed", e);
      }
  }

  // Research
  async getResearch(): Promise<ResearchSubmission[]> {
      return this.request<ResearchSubmission[]>('/research');
  }

  async createResearch(title: string, description: string, file: File | null): Promise<ResearchSubmission> {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('abstract', description); // Controller expects 'abstract' but API arg is description. Mapping logic.
    if (file) {
        formData.append('file', file);
    }

    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/research`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
            // Content-Type is auto-set by browser for FormData
        },
        body: formData
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((json as any).message || 'Failed to create research');
    return (json as any).success !== undefined ? (json as any).data : (json as any);
  }

  async reviewResearchSubmission(id: string, status: ResearchStatus, feedback: string): Promise<ResearchSubmission> {
    return this.request<ResearchSubmission>(`/research/${id}/review`, {
      method: 'PUT',
      body: JSON.stringify({ status, feedback }),
    });
  }

  getResearchDownloadUrl(id: string): string {
      const token = localStorage.getItem('token');
      // Direct link doesn't work well with Auth header, but if we assume token is not needed for download OR handled via query param (not safe)
      // Best approach for secure download in React:
      // We will rely on window.open or a component to handle the fetch-and-blob.
      // But for now, let's just return the API URL.
      return `${API_URL}/research/${id}/download`;
  }

  async downloadResearch(id: string, filename: string) {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/research/${id}/download`, {
          headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Download failed");
      
      // If it's a redirect, the browser follows it. 
      // If it's a blob:
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'document';
      document.body.appendChild(a);
      a.click();
      a.remove();
  }

  // Forgot Password
  async forgotPassword(email: string): Promise<{ success: boolean; message?: string; mockOtp?: string }> {
      return this.request('/auth/forgot-password', {
          method: 'POST',
          body: JSON.stringify({ email })
      });
  }

  async verifyResetCode(email: string, code: string): Promise<void> {
      return this.request<void>('/auth/verify-reset-code', {
          method: 'POST',
          body: JSON.stringify({ email, code })
      });
  }

  async resetPassword(email: string, code: string, newPassword: string): Promise<void> {
      return this.request<void>('/auth/reset-password', {
          method: 'POST',
          body: JSON.stringify({ email, code, newPassword })
      });
  }
  
  // Manual Mock Exams (Records)
  async getMockExams(): Promise<MockExam[]> {
      return this.request<MockExam[]>('/mock-exams');
  }

  async createMockExam(data: Partial<MockExam>): Promise<MockExam> {
      return this.request<MockExam>('/mock-exams', {
          method: 'POST',
          body: JSON.stringify(data)
      });
  }

  async deleteMockExamEntry(id: string): Promise<void> {
      return this.request<void>(`/mock-exams/${id}`, {
          method: 'DELETE'
      });
  }

  // Dashboard Stats
  async getInstructorStats(): Promise<{ topics: number, tasks: number, projects: number, submissions: number }> {
    try {
        return await this.request('/stats');
    } catch (e) {
        return { topics: 0, tasks: 0, projects: 0, submissions: 0 };
    }
  }
}

export const api = new ApiClient();
