import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import {
  Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Box, CircularProgress
} from '@mui/material';

const MySwal = withReactContent(Swal);

// Component นี้รับ props: open, onClose, onSave, team (ข้อมูลทีมที่จะแก้ไข)
function EditTeamDialog({ open, onClose, onSave, team }) {
  const [teamName, setTeamName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';
  const baseUrl = process.env.REACT_APP_API_BASE_URL || 'https://back-takdanai.up.railway.app';
  // ใช้ team.team_id หรือ team._id ขึ้นอยู่กับว่า backend ส่งอะไรมาเป็น ID หลัก
  const teamId = team ? (team.team_id || team._id) : null;
  const apiUrl = teamId ? `${baseUrl}/api/teams/${teamId}` : null;

  // --- ตั้งค่าเริ่มต้นเมื่อ team prop เปลี่ยน (ตอนเปิด Dialog) ---
  useEffect(() => {
    if (team) {
      setTeamName(team.name || '');
      // *** ตรวจสอบชื่อ field description/discription ในข้อมูล team ที่รับมา ***
      setDescription(team.description || '');
      setErrors({}); // เคลียร์ error เก่าตอนเปิด
    }
  }, [team]); // ทำงานเมื่อ team เปลี่ยน

  // --- Validate Form ---
  const validate = () => {
    let tempErrors = {};
    let isValid = true;
    if (!teamName.trim()) {
      tempErrors.teamName = "Team Name is required.";
      isValid = false;
    }
    setErrors(tempErrors);
    return isValid;
  };

  // --- Function สำหรับบันทึกการแก้ไข Team ---
  const handleUpdateTeam = async () => {
    if (!validate() || !apiUrl) {
       if (!apiUrl) console.error("API URL is not available.");
       return; // หยุดถ้า validation ไม่ผ่าน หรือไม่มี URL (ไม่มี teamId)
    }

    setLoading(true);
    setErrors({});
    const token = localStorage.getItem('token');
    if (!token) {
      MySwal.fire('Error', 'Authentication token not found. Please login again.', 'error');
      onClose();
      setLoading(false);
      return;
    }

    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Authorization", `Bearer ${token}`);

    const raw = JSON.stringify({
      name: teamName.trim(),
      // *** แก้ไข field ให้ตรงกับ Backend Model (description หรือ discription) ***
      description: description.trim()
      // หรือ discription: description.trim()
    });

    const requestOptions = {
      method: "PUT", // <<< ใช้ PUT สำหรับแก้ไข
      headers: myHeaders,
      body: raw,
      redirect: "follow"
    };

    try {
      const response = await fetch(apiUrl, requestOptions);
      const result = await response.json();

      if (!response.ok) {
         if (result.errors) {
             let backendErrors = {};
             result.errors.forEach(err => {
                 if (err.param === 'name') backendErrors.teamName = err.msg;
             });
             setErrors(backendErrors);
         }
        throw new Error(result.message || `HTTP error! status: ${response.status}`);
      }

      MySwal.fire({
        title: 'Success!',
        text: `Team "${result.name}" updated successfully.`,
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
      onSave(); // เรียก function ที่ส่งมาจาก TeamManagement เพื่อ refresh list และ ปิด dialog

    } catch (error) {
      console.error("Update team error:", error);
      MySwal.fire(
        'Error!',
        `Could not update team: ${error.message}`,
        'error'
      );
      if (error.message && error.message.toLowerCase().includes('duplicate key') && error.message.toLowerCase().includes('name')) {
           setErrors({ teamName: 'This team name already exists.' });
       }
    } finally {
      setLoading(false);
    }
  };

   // --- Function สำหรับปิด Dialog (ไม่ต้องเคลียร์ค่า เพราะอาจจะเปิดใหม่) ---
   const handleClose = () => {
      if (loading) return;
      // ไม่ต้องเคลียร์ค่าที่นี่ เพราะ useEffect จะ set ค่าใหม่เมื่อ dialog เปิดอีกครั้ง
       setErrors({}); //เคลียร์ error เก่า
      onClose();
  }

  // ถ้าไม่มีข้อมูล team (ยังโหลดไม่เสร็จ หรือ มีข้อผิดพลาด) ไม่ต้องแสดงอะไร
  if (!team) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Edit Team: {team.name}</DialogTitle> {/* แสดงชื่อทีมเดิม */}
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
            variant="outlined"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            error={!!errors.teamName}
            helperText={errors.teamName}
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
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ padding: '16px 24px' }}>
        <Button onClick={handleClose} color="secondary" disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleUpdateTeam}
          variant="contained"
          color="primary"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default EditTeamDialog;