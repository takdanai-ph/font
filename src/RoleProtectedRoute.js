import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

// รับ props เป็น allowedRoles ซึ่งเป็น array ของ role ที่อนุญาตให้เข้าถึง
function RoleProtectedRoute({ allowedRoles }) {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');
  const location = useLocation(); // เก็บ location ปัจจุบัน (เผื่อใช้ redirect กลับมา)

  // 1. เช็คว่า Login หรือยัง?
  if (!token) {
    // ถ้ายังไม่ได้ Login, ให้ไปหน้า Login พร้อมจำ path เดิมไว้ (เผื่อ redirect กลับมาหลัง login)
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. เช็คว่า Role ของผู้ใช้ อยู่ในรายการ allowedRoles หรือไม่?
  // ตรวจสอบว่า allowedRoles เป็น Array และ userRole มีค่า และ role นั้นอยู่ใน allowedRoles
  if (!allowedRoles || !Array.isArray(allowedRoles) || !userRole || !allowedRoles.includes(userRole)) {
    // ถ้าไม่มีสิทธิ์ (Role ไม่ตรง), อาจจะ Redirect ไปหน้า Home หรือหน้า Forbidden (403)
    console.warn(`Access denied for role "${userRole}" to path "${location.pathname}". Required roles: ${allowedRoles.join(', ')}.`);
    // ในที่นี้ Redirect กลับไปหน้า Home
    return <Navigate to="/home" replace />;
    // หรือสร้างหน้า Forbidden: return <Navigate to="/forbidden" replace />;
  }

  // 3. ถ้าผ่านทุกเงื่อนไข (Login แล้ว และ Role ถูกต้อง) ให้แสดง Component ลูก
  return <Outlet />;
}

export default RoleProtectedRoute;