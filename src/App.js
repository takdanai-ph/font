import React from 'react'; // ต้อง import React ด้วย
import Login from "./Login";
import Home from "./Home";
import Layout from "./Layout"; // ถ้าจะใช้ Layout ควรเอามาใช้กับ ProtectedRoute
import ProtectedRoute from './ProtectedRoute'; // Import ProtectedRoute ที่สร้างขึ้นมา
import NotFound from './NotFoundPage';
import AdminRoute from './AdminRoute';
import Create from './Create';
import Dashboard from './Dashboard';
import UserList from './UserList';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';
import RoleProtectedRoute from './RoleProtectedRoute';
import TeamManagement from './TeamManagement';
import YourTeam from './YourTeam';
import TaskDetailPage from './TaskDetailPage';
import NotificationsPage from './NotificationsPage';

import { BrowserRouter, Routes, Route } from 'react-router-dom'; // เอา Outlet, Navigate ออกไปก่อน ถ้าไม่ได้ใช้ตรงนี้

function App() {
  return (
    <div>
      <Routes>
        {/* --- Route สำหรับหน้าที่ไม่ต้อง Login --- */}
        <Route path="/" element={<Login />} />
        <Route path="login" element={<Login />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password/:token" element={<ResetPassword />} />

        {/* --- Route ที่ต้อง Login --- */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="home" element={<Home />} />
            <Route path="dashboard" element={<Dashboard />} />

            {/* === Route เฉพาะ Admin === */}
            <Route element={<AdminRoute />}>
              <Route path="create-account" element={<Create />} />
              <Route path="user-list" element={<UserList />} />
              {/* หน้า Admin อื่นๆ */}
            </Route>

            {/* === Route สำหรับ Admin และ Manager === */}
            <Route element={<RoleProtectedRoute allowedRoles={['Admin', 'Manager']} />}>
              <Route path="team-management" element={<TeamManagement />} />
              {/* หน้าอื่นๆ ที่ Admin/Manager เข้าได้ */}
            </Route>

            <Route path="your-team" element={<YourTeam />} />
            <Route path="task/:taskId" element={<TaskDetailPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
  
          </Route>
        </Route>

        {/* --- Route สำหรับ 404 Not Found --- */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;