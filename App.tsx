
import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { User, UserRole } from './types';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';

// Student Pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { StudentTasks } from './pages/student/StudentTasks';
import { StudentProjects } from './pages/student/StudentProjects';
import { StudentExams } from './pages/student/StudentExams';
import { StudentMockExams } from './pages/student/StudentMockExams';
import { StudentMockInterviews } from './pages/student/StudentMockInterviews';
import { StudentPerformance } from './pages/student/StudentPerformance';
import { StudentResearch } from './pages/student/StudentResearch';
import { StudentPlayground } from './pages/student/StudentPlayground';

// Instructor Pages
import { InstructorDashboard } from './pages/instructor/InstructorDashboard';
import { InstructorTopics } from './pages/instructor/InstructorTopics';
import { InstructorTasks } from './pages/instructor/InstructorTasks';
import { InstructorExams } from './pages/instructor/InstructorExams';
import { InstructorProjects } from './pages/instructor/InstructorProjects';
import { InstructorResearch } from './pages/instructor/InstructorResearch';

import { api } from './services/api';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<string | null>(null);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    setSessionStartTime(new Date().toISOString());
    // Start Heartbeat
    if (loggedInUser.role === UserRole.STUDENT) {
        // Send immediate heartbeat
        api.sendHeartbeat();
        // Set interval for every 1 min
        const interval = setInterval(() => {
            api.sendHeartbeat();
        }, 60000); 
        (window as any).heartbeatInterval = interval;
    }
  };

  const handleLogout = () => {
    if ((window as any).heartbeatInterval) {
        clearInterval((window as any).heartbeatInterval);
    }
    setUser(null);
    setSessionStartTime(null);
  };

  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={!user ? <Login onLogin={handleLogin} /> : <Navigate to={user.role === UserRole.STUDENT ? "/student/dashboard" : "/instructor/dashboard"} />} />
        
        {/* Student Routes */}
        <Route path="/student/*" element={
          user && user.role === UserRole.STUDENT ? (
            <Layout user={user} onLogout={handleLogout}>
              <Routes>
                <Route path="dashboard" element={<StudentDashboard user={user} sessionStartTime={sessionStartTime} />} />
                <Route path="tasks" element={<StudentTasks user={user} />} />
                <Route path="projects" element={<StudentProjects user={user} />} />
                <Route path="research" element={<StudentResearch user={user} />} />
                <Route path="exams" element={<StudentExams user={user} />} />
                <Route path="mock-exams" element={<StudentMockExams user={user} />} />
                <Route path="mock-interviews" element={<StudentMockInterviews user={user} />} />
                <Route path="playground" element={<StudentPlayground user={user} />} />
                <Route path="performance" element={<StudentPerformance user={user} />} />
                <Route path="*" element={<Navigate to="dashboard" />} />
              </Routes>
            </Layout>
          ) : <Navigate to="/login" />
        } />

        {/* Instructor Routes */}
        <Route path="/instructor/*" element={
          user && user.role === UserRole.INSTRUCTOR ? (
            <Layout user={user} onLogout={handleLogout}>
              <Routes>
                <Route path="dashboard" element={<InstructorDashboard user={user} sessionStartTime={sessionStartTime} />} />
                <Route path="topics" element={<InstructorTopics user={user} />} />
                <Route path="tasks" element={<InstructorTasks user={user} />} />
                <Route path="projects" element={<InstructorProjects user={user} />} />
                <Route path="research" element={<InstructorResearch user={user} />} />
                <Route path="exams" element={<InstructorExams user={user} />} />
                <Route path="*" element={<Navigate to="dashboard" />} />
              </Routes>
            </Layout>
          ) : <Navigate to="/login" />
        } />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
