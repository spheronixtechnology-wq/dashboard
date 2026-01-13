<<<<<<< HEAD
# dashboard
=======
# Spheronix Dashboard

A full-stack MERN application (MongoDB, Express, React, Node.js) for managing instructor and student training tracks.

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js** (v16 or higher)
- **MongoDB Atlas** Account (Connection String)

### 2. Setup Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create/Update `.env` file in `backend/.env` with your credentials:
   ```env
   MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
   PORT=5001
   JWT_SECRET=your_secret_key_here
   NODE_ENV=development
   ```

4. Seed the Database (Optional):
   ```bash
   npm run seed:atlas
   ```

5. Start the Server:
   ```bash
   npm run dev
   ```
   > Server will run on `http://localhost:5001`

### 3. Setup Frontend

1. Open a new terminal and navigate to the root directory (where `package.json` and `vite.config.ts` are located):
   ```bash
   cd "Spheronix Dashboard"
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Frontend:
   ```bash
   npm run dev
   ```
   > Frontend will typically run on `http://localhost:3000` (or 3001, 3002... if busy)

## 🛠 Features

- **Authentication**: Instructor & Student Login/Signup
- **Dashboard**: Role-based views (Instructor vs Student)
- **Topics & Tasks**: Create, publish, and view assignments
- **Submissions**: File uploads (PDF/Images) and grading system
- **Exams**: Create MCQs, auto-grading, and result tracking
- **Research**: R&D proposal submission and review workflow

## 🐞 Troubleshooting "Failed to fetch"

If you see "Failed to fetch" on the login screen:
1. Ensure the **Backend** is running (`npm run dev` in `backend/` folder).
2. Check that the backend port is `5001`.
3. Check the console logs for CORS errors (we have configured CORS to allow any localhost origin).
4. Verify your `MONGO_URI` is correct and IP is whitelisted in MongoDB Atlas.
>>>>>>> b096b01 (Initial dashboard frontend and backend (secure))

# Spheronix Dashboard

Full-stack dashboard application with:
- React + TypeScript frontend
- Node.js + Express backend
- MongoDB database

Deployed using GitHub and AWS EC2.

