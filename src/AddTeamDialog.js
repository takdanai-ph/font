import React, { useState } from 'react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import {
  Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Box, CircularProgress
} from '@mui/material';

const MySwal = withReactContent(Swal);

// Component นี้รับ props: open, onClose, onSave
function AddTeamDialog({ open, onClose, onSave }) {
  const [teamName, setTeamName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({}); // State สำหรับเก็บ error ของแต่ละ field

  // const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001'; // ใช้ค่า default ถ้าไม่มี env
  const baseUrl = process.env.REACT_APP_API_BASE_URL || 'https://back-takdanai.up.railway.app';
  const apiUrl = `${baseUrl}/api/teams`;

  // --- Validate Form ---
  const validate = () => {
    let tempErrors = {};
    let isValid = true;
    if (!teamName.trim()) {
      tempErrors.teamName = "Team Name is required.";
      isValid = false;
    }
    // อาจจะเพิ่ม validation อื่นๆ เช่น ความยาวขั้นต่ำ/สูงสุด

    setErrors(tempErrors);
    return isValid;
  };


  // --- Function สำหรับบันทึก Team ใหม่ ---
  const handleCreateTeam = async () => {
    if (!validate()) {
      return; // หยุดถ้า validation ไม่ผ่าน
    }

    setLoading(true);
    setErrors({}); // เคลียร์ error เก่า
    const token = localStorage.getItem('token');
    if (!token) {
      MySwal.fire('Error', 'Authentication token not found. Please login again.', 'error');
      onClose(); // ปิด Dialog
      setLoading(false);
      // อาจจะ navigate ไปหน้า login
      return;
    }

    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Authorization", `Bearer ${token}`);

    const raw = JSON.stringify({
      name: teamName.trim(), // ส่งค่าที่ trim แล้ว
      description: description.trim() // ส่งค่าที่ trim แล้ว (Backend model อาจจะชื่อ field ไม่ตรง ต้องแก้ให้ตรง)
      // *** สำคัญ: ตรวจสอบ Backend Model `Team.js` ว่า field ชื่อ description หรือ discription ***
      // ถ้าใน Backend เป็น discription ให้แก้ตรงนี้เป็น discription: description.trim()
    });

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow"
    };

    try {
      const response = await fetch(apiUrl, requestOptions);
      const result = await response.json();

      if (!response.ok) {
        // ถ้ามี errors จาก backend ให้แสดง
        if (result.errors) {
             let backendErrors = {};
             // ตัวอย่างการ map error (ปรับตาม response จริง)
             result.errors.forEach(err => {
                 if (err.param === 'name') backendErrors.teamName = err.msg;
                 // เพิ่ม field อื่นๆ
             });
             setErrors(backendErrors);
        }
        throw new Error(result.message || `HTTP error! status: ${response.status}`);
      }

      MySwal.fire({
        title: 'Success!',
        text: `Team "${result.name}" created successfully.`, // ใช้ชื่อทีมที่ได้จาก response
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
      onSave(); // เรียก function ที่ส่งมาจาก TeamManagement เพื่อ refresh list และ ปิด dialog
      // เคลียร์ฟอร์มหลังสำเร็จ
      setTeamName('');
      setDescription('');

    } catch (error) {
      console.error("Create team error:", error);
      MySwal.fire(
        'Error!',
        `Could not create team: ${error.message}`,
        'error'
      );
       // อาจจะแสดง error ที่ field ถ้าเป็นไปได้ เช่น ชื่อซ้ำ
       if (error.message && error.message.toLowerCase().includes('duplicate key') && error.message.toLowerCase().includes('name')) {
           setErrors({ teamName: 'This team name already exists.' });
       }
    } finally {
      setLoading(false);
    }
  };

  // --- Function สำหรับปิด Dialog และเคลียร์ค่า ---
  const handleClose = () => {
      if (loading) return; // ไม่ให้ปิดตอนกำลังโหลด
      setTeamName('');
      setDescription('');
      setErrors({});
      onClose(); // เรียก function onClose ที่ได้รับจาก prop
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Create New Team</DialogTitle>
      <DialogContent>
        <Box component="form" noValidate autoComplete="off" sx={{ mt: 1 }}>
          <TextField
            autoFocus
            required
            margin="dense"
            id="teamName"
            name="teamName"
            label="Team Name"
            type="text"
            fullWidth
            variant="outlined" // เปลี่ยนเป็น outlined หรือ standard ตามต้องการ
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            error={!!errors.teamName} // แสดงกรอบแดงถ้ามี error
            helperText={errors.teamName} // แสดงข้อความ error
            disabled={loading}
          />
          <TextField
            margin="dense"
            id="description"
            name="description"
            label="Description (Optional)"
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
            // อาจจะเพิ่ม error/helperText ถ้ามี validation สำหรับ description
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ padding: '16px 24px' }}>
        <Button onClick={handleClose} color="secondary" disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleCreateTeam}
          variant="contained"
          color="primary"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {loading ? 'Creating...' : 'Create Team'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default AddTeamDialog;