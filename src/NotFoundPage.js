// src/NotFound.js
import React from 'react';
import { Link } from 'react-router-dom'; // (Optional) ถ้าต้องการใส่ Link กลับหน้าหลัก

function NotFoundPage() {
  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>404 - Page Not Found</h1>
      <p>ขออภัย ไม่พบหน้าที่คุณต้องการ</p>
      {/* (Optional) ใส่ Link กลับหน้าหลักหรือหน้า Login */}
      <Link to="/home">กลับหน้าหลัก</Link>
      {/* หรือ <Link to="/login">กลับหน้า Login</Link> */}
    </div>
  );
}

export default NotFoundPage;