import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { TextField, Button, Container, Box, Typography } from '@mui/material';

function Login() {
    const navigate = useNavigate()
    const MySwal = withReactContent(Swal)
    const baseUrl = process.env.REACT_APP_API_BASE_URL;
    const apiUrl = `${baseUrl}/api/auth/login`;

    const [inputs, setInputs] = useState({});

    const handleChange = (event) => {
        const name = event.target.name;
        const value = event.target.value;
        setInputs(values => ({...values, [name]: value}))
      }

      const handleSubmit = (event) => {
        event.preventDefault();
    
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
    
        const raw = JSON.stringify({
          "username": inputs.username,
          "password": inputs.password
        });
    
        const requestOptions = {
          method: "POST",
          headers: myHeaders,
          body: raw,
          redirect: "follow"
        };
    
        console.log("Attempting login for:", inputs.username); // Log เริ่มต้น
    
        fetch(apiUrl, requestOptions)
          .then((response) => { // <<< .then แรก: จัดการ Response เบื้องต้น
              console.log("Login API Response Status:", response.status);
    
              // --- ตรวจสอบ response.ok ก่อน ---
              if (!response.ok) {
                  // ถ้า response ไม่สำเร็จ (เช่น 401, 400, 500)
                  // พยายามอ่าน body เป็น text เพื่อดู error message จาก server
                  return response.text().then(text => {
                      // โยน Error ออกไปเพื่อให้ .catch ทำงาน
                      // เก็บ status ไว้ใน error message ด้วย
                      const error = new Error(`Login failed with status ${response.status}: ${text || response.statusText}`);
                      error.status = response.status; // เพิ่ม status เข้าไปใน error object (ถ้าต้องการใช้)
                      throw error;
                  });
              }
              // --- ---
    
              // ถ้า response.ok เป็น true ค่อยเรียก .json()
              return response.json();
    
          }) // <<< ปิด .then แรก
          .then((result) => { // <<< .then ที่สอง: จัดการ result ที่เป็น JSON
            console.log("Login API Result:", result);
    
            // ตรวจสอบเงื่อนไข Login สำเร็จจาก result ที่ได้
            if (result.status === 'ok' && result.accessToken) {
              console.log("Login successful, proceeding to set localStorage.");
              MySwal.fire({
                html: <i>{result.message}</i>,
                icon: 'success'
              }).then((value) => { // ทำงานหลังกดปิด Swal
                localStorage.setItem('token', result.accessToken);
                console.log("Token saved.");
    
                if (result.user && result.user.role) {
                  localStorage.setItem('userRole', result.user.role);
                  console.log('User role saved:', result.user.role);
                } else {
                  console.warn('User role not found in login response.');
                }
    
                // ตรวจสอบและบันทึก userId
                if (result.user && result.user._id) {
                    localStorage.setItem('userId', result.user._id);
                    console.log('User ID saved:', result.user._id);
                } else {
                    console.warn('User ID (_id) not found in login response.');
                }
    
                console.log("Attempting to navigate to /home..."); // Log ก่อน Navigate
                navigate('/home');
              })
            } else {
              // กรณี API ตอบกลับมา แต่ status ไม่ใช่ 'ok' หรือไม่มี accessToken
              console.log("Login failed (API response condition not met):", result.message || 'No message');
              MySwal.fire({
                html: <i>{result.message || 'Login failed'}</i>,
                icon: 'error'
              });
            }
         })
          .catch((error) => { // <<< .catch จัดการ Error จาก Network หรือที่ throw จาก .then แรก
            console.error("Login Fetch/Process Error:", error);
            MySwal.fire({
              // แสดง error message ที่ได้ หรือข้อความกลางๆ
              html: <i>เกิดข้อผิดพลาด: {error.message || 'Unknown error'}</i>,
              icon: 'error'
            });
            // พิจารณาลบ token/role ที่อาจค้าง ถ้าเกิด error
            // localStorage.removeItem('token');
            // localStorage.removeItem('userRole');
            // localStorage.removeItem('userId');
        });
      } // <--- ปิด handleSubmit

//     return (
//       <div>
//           <form onSubmit={handleSubmit}>
//           <label>Username:
//           <input
//               type="text"
//               name="username"
//               value={inputs.username || ""}
//               onChange={handleChange}
//           />
//           </label>
//           <label>password:
//               <input
//               type="password"
//               name="password"
//               value={inputs.password || ""}
//               onChange={handleChange}
//               />
//               </label>
//               <input type="submit" />
//           </form>
//       </div>
//     );
// }

return (
  <Container maxWidth="xs">
    <Box
      sx={{
        marginTop: 8,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <Typography component="h1" variant="h5">
        Login
      </Typography>
      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
        <TextField
          margin="normal"
          required
          fullWidth
          id="username"
          label="Username"
          name="username"
          autoComplete="username"
          autoFocus
          value={inputs.username || ''}
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
          autoComplete="current-password"
          value={inputs.password || ''}
          onChange={handleChange}
        />
        <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
          Login
        </Button>
        <Link to="/forgot-password" style={{ marginTop: '1px', display: 'block', textAlign: 'center' }}>
        Forgot Password?
        </Link>
      </Box>
    </Box>
  </Container>
);
}


export default Login;