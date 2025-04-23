import React, { useState, useEffect, useCallback } from 'react'; // <<< เพิ่ม useCallback
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import {
  Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField,
  Select, MenuItem, InputLabel, FormControl,
  Box, CircularProgress, Typography // <<< เพิ่ม Box, CircularProgress, Typography
} from '@mui/material';

// const MySwal = withReactContent(Swal);

function EditUserDialog({ open, onClose, user, onSave }) {
  const MySwal = withReactContent(Swal);

  const [teams, setTeams] = useState([]);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [teamsError, setTeamsError] = useState(null);

  // <<< รวม State ของ Form ไว้ในที่เดียว และเพิ่ม team_id >>>
  const [editData, setEditData] = useState({
      fname: '',
      lname: '',
      email: '',
      role: 'User', // ค่าเริ่มต้น Role
      team_id: '' // ค่าเริ่มต้น Team ID (ใช้ '' แทน null เพื่อให้ Select ทำงานง่าย)
  });

  // const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';
  const baseUrl = process.env.REACT_APP_API_BASE_URL || 'https://back-takdanai.up.railway.app';
  const userApiUrl = `${baseUrl}/api/auth/users/${user?.id || user?._id}`; // ใช้ Optional Chaining ป้องกัน Error ถ้า user เป็น null
  const teamsApiUrl = `${baseUrl}/api/teams`; // API สำหรับดึงรายชื่อทีม

  // --- Fetch Teams when Dialog Opens ---
  const fetchTeams = useCallback(async () => {
    // ไม่ต้อง fetch ถ้า dialog ไม่ได้เปิดอยู่
    if (!open) return;

    setTeamsLoading(true);
    setTeamsError(null);
    const token = localStorage.getItem('token'); // ควรใช้ token ด้วยถ้า API Teams มีการ protect

    const myHeaders = new Headers();
    // อาจจะต้องใส่ Authorization ถ้า API Teams ต้องการ
    if (token) {
       myHeaders.append("Authorization", `Bearer ${token}`);
    }

    const requestOptions = {
        method: "GET",
        headers: myHeaders, // <<< เพิ่ม Header
        redirect: "follow"
    };

    try {
        const response = await fetch(teamsApiUrl, requestOptions);
        if (!response.ok) {
            const errData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
            throw new Error(errData.message || `HTTP error ${response.status}`);
        }
        const data = await response.json();
        // ตรวจสอบว่าเป็น Array ก่อน set (Backend อาจจะส่ง data.teams หรือ data ตรงๆ)
        setTeams(Array.isArray(data) ? data : (data.teams || []));
    } catch (error) {
        console.error("Fetch teams error:", error);
        setTeamsError(`Could not load teams: ${error.message}`);
    } finally {
        setTeamsLoading(false);
    }
  }, [open, teamsApiUrl]); // <<< ทำงานเมื่อ open หรือ teamsApiUrl เปลี่ยน

  // <<< เรียก fetchTeams เมื่อ Dialog เปิด >>>
  useEffect(() => {
      fetchTeams();
  }, [fetchTeams]); // Dependency คือ fetchTeams (ซึ่งภายในขึ้นกับ open, teamsApiUrl)


  // --- ตั้งค่าเริ่มต้นให้ form เมื่อ user prop เปลี่ยน ---
  useEffect(() => {
    if (user) {
      setEditData({
        fname: user.fname || '',
        lname: user.lname || '',
        email: user.email || '',
        role: user.role || 'User',
        // <<< ตั้งค่า team_id เริ่มต้น (ถ้าเป็น null/undefined ให้ใช้ '') >>>
        team_id: user.team_id || ''
      });
    } else {
        // เคลียร์ค่าถ้าไม่มี user (อาจจะไม่จำเป็นถ้า dialog ไม่แสดงเมื่อไม่มี user)
        setEditData({ fname: '', lname: '', email: '', role: 'User', team_id: '' });
    }
  }, [user]); // ทำงานเมื่อ user เปลี่ยน

  // --- Handler กลางสำหรับทุก Input Fields ---
  const handleChange = (event) => {
    const { name, value } = event.target;
    setEditData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  // --- บันทึกข้อมูล User ---
  const handleSave = () => {
    const token = localStorage.getItem('token');
    // <<< เพิ่มการตรวจสอบ user และ userApiUrl >>>
    if (!token || !user || !userApiUrl) {
        console.error("Missing token, user data, or API URL.");
        MySwal.fire('Error', 'Cannot save user data. Missing required information.', 'error');
      onClose();
      return;
    }

    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Authorization", `Bearer ${token}`);

    // <<< รวมข้อมูลจาก State `editData` และแปลง team_id '' เป็น null >>>
    const raw = JSON.stringify({
      fname: editData.fname,
      lname: editData.lname,
      email: editData.email,
      role: editData.role,
      // ถ้า editData.team_id เป็น '' (สตริงว่าง) ให้ส่ง null, มิฉะนั้นส่งค่า team_id
      team_id: editData.team_id === '' ? null : editData.team_id
    });

    const requestOptions = {
      method: "PUT", // <<< ใช้ PUT สำหรับแก้ไข User
      headers: myHeaders,
      body: raw,
      redirect: "follow"
    };

    // setLoading(true); // อาจจะเพิ่ม State loading สำหรับการ Save โดยเฉพาะ
    fetch(userApiUrl, requestOptions) // <<< ใช้ userApiUrl
      .then(response => {
        if (!response.ok) {
          return response.json().catch(() => ({message: `HTTP error ${response.status}`})).then(err => { throw new Error(err.message || `HTTP error ${response.status}`) });
        }
        return response.json();
      })
      .then(updatedUser => {
        console.log("Update success:", updatedUser);
        MySwal.fire({
          title: 'บันทึกสำเร็จ!',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
        onSave(); // เรียก function ที่ UserList ส่งมาเพื่อ ปิด Dialog และ refresh list
      })
      .catch(error => {
        console.error("Update user error:", error);
        MySwal.fire(
          'เกิดข้อผิดพลาด!',
          `ไม่สามารถบันทึกข้อมูลได้: ${error.message}`,
          'error'
        );
      })
      // .finally(() => setLoading(false)); // ถ้ามี state loading
  };

  // ถ้าไม่มี user (ยังไม่ถูกเลือก) ไม่ต้องแสดง Dialog
  if (!user) return null;

  return (
    // <<< เพิ่ม key เพื่อบังคับให้ re-mount เมื่อ user เปลี่ยน (ช่วยแก้ปัญหา state ค้าง) >>>
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth key={user.id || user._id}>
      <DialogTitle>Edit User: {user.username}</DialogTitle>
      <DialogContent>
        {/* ใช้ Box แทนการใช้ Fragment เปล่าๆ เพื่อให้ sx ทำงานได้ */}
        <Box component="div" sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
            autoFocus
            margin="dense"
            id="fname"
            name="fname" // สำคัญ: name ต้องตรงกับ key ใน state
            label="First Name"
            type="text"
            fullWidth
            variant="outlined" // <<< เปลี่ยนเป็น outlined
            value={editData.fname}
            onChange={handleChange}
            />
            <TextField
            margin="dense"
            id="lname"
            name="lname"
            label="Last Name"
            type="text"
            fullWidth
            variant="outlined" // <<< เปลี่ยนเป็น outlined
            value={editData.lname}
            onChange={handleChange}
            />
            <TextField
            margin="dense"
            id="email"
            name="email"
            label="Email Address"
            type="email"
            fullWidth
            variant="outlined" // <<< เปลี่ยนเป็น outlined
            value={editData.email}
            onChange={handleChange}
            />

            {/* Role Dropdown */}
            <FormControl fullWidth margin="dense" variant="outlined"> {/* <<< เปลี่ยนเป็น outlined */}
            <InputLabel id="edit-role-label">Role</InputLabel>
            <Select
                labelId="edit-role-label"
                id="role"
                name="role" // <<< ต้องมี name attribute
                value={editData.role} // <<< ใช้ค่าจาก state
                onChange={handleChange} // <<< ใช้ handler กลาง
                label="Role" // <<< ต้องมี label prop เมื่อใช้ variant="outlined"
            >
                <MenuItem value="User">User</MenuItem>
                <MenuItem value="Manager">Manager</MenuItem>
                <MenuItem value="Admin">Admin</MenuItem>
            </Select>
            </FormControl>
             
        </Box>


      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">Cancel</Button>
        <Button onClick={handleSave} variant="contained" color="primary">Save</Button>
      </DialogActions>
    </Dialog>
  );
}

export default EditUserDialog;