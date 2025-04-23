import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

function ProtectedRoute() {
  const token = localStorage.getItem('token');

  // ถ้ามี Token ให้แสดง Component ลูก (ในที่นี้คือ <Outlet /> ซึ่งจะหมายถึง Route ที่ซ้อนอยู่ข้างใน เช่น Home)
  // ถ้าไม่มี Token ให้ Redirect ไปหน้า Login
  return token ? <Outlet /> : <Navigate to="/login" replace />;
  // การใช้ replace={true} จะทำให้หน้า Login มาแทนที่หน้าปัจจุบันใน history
  // เพื่อไม่ให้ผู้ใช้กด back กลับมาหน้าเดิมที่ต้อง Login ได้
}

export default ProtectedRoute;