// src/AdminRoute.js
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

function AdminRoute() {
  // 1. ดึงข้อมูล Token และ Role จาก Local Storage
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');

  // 2. ตรวจสอบว่า Login หรือยัง?
  if (!token) {
    // ถ้ายังไม่ได้ Login, ให้ Redirect ไปหน้า Login
    // replace={true} ป้องกันการกด back กลับมาหน้านี้
    return <Navigate to="/login" replace />;
  }

  // 3. ตรวจสอบว่าเป็น Admin หรือไม่?
  // *** สำคัญ: ค่า 'Admin' ตรงนี้ต้องตรงกับค่า Role ที่คุณเก็บใน localStorage เป๊ะๆ ***
  if (userRole !== 'Admin') {
    // ถ้าไม่ใช่ Admin, ให้ Redirect ไปหน้า Home (หรือหน้าอื่นที่คุณต้องการ เช่น /forbidden)
    console.warn('Access denied: User is not an Admin. Redirecting to /home.');
    return <Navigate to="/home" replace />;
  }

  // 4. ถ้าผ่านทั้ง 2 เงื่อนไข (Login แล้ว และเป็น Admin)
  // ให้ Render Component ลูก (หน้าที่ต้องการป้องกัน) ผ่าน <Outlet />
  return <Outlet />;
}

export default AdminRoute;