// src/Create.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Optional: ถ้าต้องการ redirect หลังสร้างสำเร็จ
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Select from '@mui/material/Select'; // เพิ่ม Select สำหรับ Role
import MenuItem from '@mui/material/MenuItem'; // เพิ่ม MenuItem สำหรับ Role
import InputLabel from '@mui/material/InputLabel'; // เพิ่ม InputLabel สำหรับ Role
import FormControl from '@mui/material/FormControl'; // เพิ่ม FormControl สำหรับ Role

function Create() {
  const navigate = useNavigate(); // Optional
  const MySwal = withReactContent(Swal);
  const baseUrl = process.env.REACT_APP_API_BASE_URL;
  const apiUrl = `${baseUrl}/api/auth/users`;

  // State สำหรับเก็บข้อมูลในฟอร์ม
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fname: '',
    lname: '',
    email: '',
    role: '' // ค่าเริ่มต้นสำหรับ role (อาจจะเป็น User หรือเลือกได้)
  });

  // Handler สำหรับอัปเดต state เมื่อมีการเปลี่ยนแปลงใน input fields
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  // Handler สำหรับการ Submit ฟอร์ม
  const handleSubmit = (event) => {
    event.preventDefault();

    const token = localStorage.getItem('token'); // ดึง Token ของ Admin

    // ตรวจสอบว่ามี Token หรือไม่ (ควรมีเพราะผ่าน AdminRoute มาแล้ว)
    if (!token) {
      MySwal.fire({
        html: <i>กรุณา Login ก่อน</i>,
        icon: 'error'
      });
      navigate('/login'); // พาไปหน้า login ถ้าไม่มี token
      return;
    }

    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Authorization", `Bearer ${token}`); // *** แนบ Token ไปใน Header ***

    const raw = JSON.stringify({
      username: formData.username,
      password: formData.password,
      fname: formData.fname,
      lname: formData.lname,
      email: formData.email,
      role: formData.role
    });

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow"
    };

    // ส่ง Request ไปยัง Backend API
    // fetch("http://localhost:3001/api/auth/users", requestOptions)
    fetch(apiUrl, requestOptions)
      .then((response) => {
        // ตรวจสอบสถานะ HTTP ก่อนแปลงเป็น JSON
        if (!response.ok) {
          // ถ้าสถานะไม่ปกติ (เช่น 400, 500) ให้โยน Error พร้อมข้อความจาก response (ถ้ามี)
          return response.json().then(errData => {
            throw new Error(errData.message || errData.error || `HTTP error! status: ${response.status}`);
          });
        }
        return response.json(); // ถ้าสถานะ OK แปลงเป็น JSON
      })
      .then((result) => {
        console.log(result);
        MySwal.fire({
          html: <i>สร้างผู้ใช้สำเร็จ!</i>,
          icon: 'success'
        });
        // Optional: เคลียร์ฟอร์ม หรือ Redirect ไปหน้าอื่น
        setFormData({ username: '', password: '', fname: '', lname: '', email: '', role: '' });
        // navigate('/user-list'); // ตัวอย่างการ Redirect
      })
      .catch((error) => {
        console.error("Create user error:", error);
        MySwal.fire({
          html: <i>เกิดข้อผิดพลาด: {error.message}</i>,
          icon: 'error'
        });
      });
  };

  return (
    <Container maxWidth="sm">
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          marginTop: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h5" sx={{ mb: 2 }}>
          Create New User
        </Typography>
        <TextField
          margin="normal"
          required
          fullWidth
          id="fname"
          label="First Name"
          name="fname"
          autoComplete="given-name"
          autoFocus
          value={formData.fname}
          onChange={handleChange}
        />
        <TextField
          margin="normal"
          required
          fullWidth
          id="lname"
          label="Last Name"
          name="lname"
          autoComplete="family-name"
          value={formData.lname}
          onChange={handleChange}
        />
        <TextField
          margin="normal"
          required
          fullWidth
          id="email"
          label="Email Address"
          name="email"
          type="email"
          autoComplete="email"
          value={formData.email}
          onChange={handleChange}
        />
        <TextField
          margin="normal"
          required
          fullWidth
          id="username"
          label="Username"
          name="username"
          autoComplete="username"
          value={formData.username}
          onChange={handleChange}
        />
        <TextField
          margin="normal"
          required
          fullWidth
          name="password"
          label="Password"
          type="password"
          id="password"
          autoComplete="new-password"
          value={formData.password}
          onChange={handleChange}
        />
        {/* Dropdown สำหรับเลือก Role */}
        <FormControl fullWidth margin="normal" required>
          <InputLabel id="role-select-label">Role</InputLabel>
          <Select
            labelId="role-select-label"
            id="role"
            name="role" // ต้องมี name attribute
            value={formData.role}
            label="Role"
            onChange={handleChange} // ใช้ handleChange เดียวกันได้
          >
            <MenuItem value="User">User</MenuItem>
            <MenuItem value="Manager">Manager</MenuItem>
            <MenuItem value="Admin">Admin</MenuItem>
          </Select>
        </FormControl>

        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
        >
          Create User
        </Button>
      </Box>
    </Container>
  );
}

export default Create;