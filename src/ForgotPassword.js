// src/ForgotPassword.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import {
  Container, Box, Typography, TextField, Button, CircularProgress
} from '@mui/material';

const MySwal = withReactContent(Swal);

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const baseUrl = process.env.REACT_APP_API_BASE_URL;
  const apiUrl = `${baseUrl}/api/auth/forgot-password`

  const handleChange = (event) => {
    setEmail(event.target.value);
    setError(''); // เคลียร์ error เมื่อมีการพิมพ์
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    if (!email) {
      setError('กรุณากรอกอีเมล');
      setIsSubmitting(false);
      return;
    }

    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({ email }); // ส่ง Email ที่กรอกไป

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow"
    };

    try {
      const response = await fetch(apiUrl, requestOptions);

      // ไม่ว่า Backend จะตอบกลับมาว่าสำเร็จ (เจอ email) หรือไม่เจอ email
      // เพื่อความปลอดภัย เราควรแสดงข้อความแบบเดียวกันให้ User เห็น
      // ยกเว้นกรณีเกิด Error ร้ายแรงจาก Server (เช่น 500)

      if (!response.ok && response.status !== 404) { // ถ้าไม่ใช่ OK และไม่ใช่ Not Found (อาจจะเป็น 500)
        const errData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
        throw new Error(errData.message || `HTTP error! status: ${response.status}`);
      }

      // แสดงข้อความสำเร็จ (แบบกลางๆ) เสมอ
      MySwal.fire({
        title: 'ส่งคำขอสำเร็จ',
        html: 'หากอีเมลของคุณมีอยู่ในระบบ คุณจะได้รับลิงก์สำหรับรีเซ็ตรหัสผ่านทางอีเมลในไม่ช้า',
        icon: 'success',
        timer: 5000, // แสดงนานขึ้นหน่อย
        showConfirmButton: true,
      }).then(() => {
         // อาจจะ navigate กลับหน้า Login หรืออยู่ที่เดิมก็ได้
         // navigate('/login');
      });

    } catch (err) {
      console.error("Forgot password error:", err);
      setError(err.message); // แสดงข้อผิดพลาดที่ state
      MySwal.fire({
        title: 'เกิดข้อผิดพลาด',
        html: `<i>${err.message}</i>`,
        icon: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h5">
          Forgot Password
        </Typography>
        <Typography component="p" sx={{ mt: 1, textAlign: 'center', color: 'text.secondary' }}>
          กรอกอีเมลของคุณเพื่อรับลิงก์สำหรับตั้งรหัสผ่านใหม่
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            type="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={handleChange}
            error={!!error} // แสดงกรอบสีแดงถ้ามี error
            helperText={error} // แสดงข้อความ error ใต้ช่อง input
            disabled={isSubmitting} // ปิดการใช้งานขณะส่งข้อมูล
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={isSubmitting} // ปิดการใช้งานขณะส่งข้อมูล
          >
            {isSubmitting ? <CircularProgress size={24} /> : 'Send'}
          </Button>
          <Box textAlign="center">
            <Link to="/login" style={{ textDecoration: 'none' }}>
              <Typography variant="body2">
                กลับไปหน้า Login
              </Typography>
            </Link>
          </Box>
        </Box>
      </Box>
    </Container>
  );
}

export default ForgotPassword;