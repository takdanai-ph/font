// src/ResetPassword.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import {
  Container, Box, Typography, TextField, Button, CircularProgress
} from '@mui/material';

const MySwal = withReactContent(Swal);

function ResetPassword() {
  const navigate = useNavigate();
  const { token } = useParams(); // <<< ดึง Token จาก URL parameter

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false); // สถานะเมื่อสำเร็จ
  const baseUrl = process.env.REACT_APP_API_BASE_URL; // อ่านค่าจาก Environment Variable
  const apiUrl = `${baseUrl}/api/auth/reset-password`

  useEffect(() => {
    // อาจจะมีการตรวจสอบ token เบื้องต้นที่นี่ (ถ้าต้องการ)
    if (!token) {
        setError('Invalid or missing reset token.');
        // อาจจะ redirect ไปหน้าอื่น
    }
  }, [token]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (name === 'password') {
      setPassword(value);
    } else if (name === 'confirmPassword') {
      setConfirmPassword(value);
    }
    setError(''); // เคลียร์ error เมื่อมีการพิมพ์
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!password || !confirmPassword) {
      setError('กรุณากรอกรหัสผ่านทั้งสองช่อง');
      return;
    }
    if (password !== confirmPassword) {
      setError('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }
    if (!token) {
        setError('ไม่พบ Token สำหรับรีเซ็ต');
        return;
    }

    setIsSubmitting(true);

    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    // ส่ง Token และรหัสผ่านใหม่
    const raw = JSON.stringify({ token: token, password: password });

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow"
    };

    try {
      // *** สำคัญ: Endpoint นี้คุณต้องไปสร้างใน Backend นะครับ ***
      // const response = await fetch("http://localhost:3001/api/auth/reset-password", requestOptions);
      const response = await fetch(apiUrl, requestOptions);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
        throw new Error(errData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.status === 'ok') {
          setSuccess(true);
          MySwal.fire({
            title: 'รีเซ็ตรหัสผ่านสำเร็จ!',
            text: 'คุณสามารถใช้รหัสผ่านใหม่เพื่อเข้าสู่ระบบได้แล้ว',
            icon: 'success',
            confirmButtonText: 'ไปหน้า Login'
          }).then(() => {
            navigate('/login');
          });
      } else {
          throw new Error(result.message || 'Failed to reset password.');
      }

    } catch (err) {
      console.error("Reset password error:", err);
      setError(err.message);
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
          Reset Password
        </Typography>
        {success ? (
            <Typography sx={{ mt: 2 }} color="success.main">
                รีเซ็ตรหัสผ่านสำเร็จแล้ว! คุณสามารถปิดหน้านี้และไป Login ใหม่ได้
            </Typography>
        ) : (
            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
            <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="New Password"
                type="password"
                id="password"
                autoFocus
                value={password}
                onChange={handleChange}
                disabled={isSubmitting}
                error={!!error && (error.includes('รหัสผ่าน') || error.includes('Password'))}
                helperText={error && (error.includes('รหัสผ่าน') || error.includes('Password')) ? error : ''}
            />
            <TextField
                margin="normal"
                required
                fullWidth
                name="confirmPassword"
                label="Confirm New Password"
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={handleChange}
                disabled={isSubmitting}
                error={!!error && error.includes('ไม่ตรงกัน')}
                helperText={error && error.includes('ไม่ตรงกัน') ? error : ''}
            />
            {/* แสดงข้อผิดพลาดทั่วไป */}
             {error && !(error.includes('รหัสผ่าน') || error.includes('ไม่ตรงกัน')) && (
                <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                    {error}
                </Typography>
            )}
            <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={isSubmitting || !token} // ปิดถ้ากำลังส่ง หรือไม่มี token
            >
                {isSubmitting ? <CircularProgress size={24} /> : 'Reset Password'}
            </Button>
             <Box textAlign="center">
                <Link to="/login" style={{ textDecoration: 'none' }}>
                <Typography variant="body2">
                    กลับไปหน้า Login
                </Typography>
                </Link>
            </Box>
            </Box>
        )}

      </Box>
    </Container>
  );
}

export default ResetPassword;