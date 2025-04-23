// src/AddEditTaskDialog.js
import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Select, MenuItem, InputLabel, FormControl, Box, CircularProgress, Chip, FormHelperText,
  Typography, Autocomplete
} from '@mui/material';
import Swal from 'sweetalert2';

// Function ช่วยแปลง Date object เป็น 'YYYY-MM-DD'
const formatDateForInput = (date) => {
  if (!date) return ''; try { const d = new Date(date); const year = d.getFullYear(); const month = (`0${d.getMonth() + 1}`).slice(-2); const day = (`0${d.getDate()}`).slice(-2); return `${year}-${month}-${day}`; } catch (e) { return ''; }
};

function AddEditTaskDialog({ open, onClose, onSave, taskData, currentUserRole }) {
  const isEditMode = Boolean(taskData);
  const isUserRole = currentUserRole === 'User';

  // Form Fields State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState('Pending');
  const [tagsString, setTagsString] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [teamId, setTeamId] = useState('');

  // Loading & Error State
  const [loading, setLoading] = useState(false); // Loading ตอน Submit
  const [errors, setErrors] = useState({});

  // Users & Teams Data State
  const [usersList, setUsersList] = useState([]);
  const [teamsList, setTeamsList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [fetchError, setFetchError] = useState(null); // Error ตอนโหลด Users/Teams

  const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';
  // const baseUrl = process.env.REACT_APP_API_BASE_URL || 'https://back-takdanai.up.railway.app';
  const token = localStorage.getItem('token');

  // --- Fetch Users ---
  const fetchUsers = async () => {
    if (!token) return; setLoadingUsers(true); setFetchError(null);
    const usersApiUrl = `${baseUrl}/api/auth/users`;
    const myHeaders = new Headers({ "Authorization": `Bearer ${token}` });
    const requestOptions = { method: "GET", headers: myHeaders, redirect: "follow" };
    try { const response = await fetch(usersApiUrl, requestOptions); if (!response.ok) throw new Error(`Failed to fetch users: ${response.status}`); const data = await response.json(); setUsersList(Array.isArray(data) ? data : []);
    } catch (err) { console.error("Fetch Users Error:", err); setFetchError(`Could not load users: ${err.message}`); setUsersList([]);
    } finally { setLoadingUsers(false); }
  };

  // --- Fetch Teams ---
  const fetchTeams = async () => {
    if (!token) return; setLoadingTeams(true); setFetchError(null);
    const teamsApiUrl = `${baseUrl}/api/teams`;
    const myHeaders = new Headers({ "Authorization": `Bearer ${token}` });
    const requestOptions = { method: "GET", headers: myHeaders, redirect: "follow" };
    try { const response = await fetch(teamsApiUrl, requestOptions); if (!response.ok) throw new Error(`Failed to fetch teams: ${response.status}`); const data = await response.json(); setTeamsList(Array.isArray(data) ? data : []);
    } catch (err) { console.error("Fetch Teams Error:", err); setFetchError(`Could not load teams: ${err.message}`); setTeamsList([]);
    } finally { setLoadingTeams(false); }
  };

  // --- useEffect: Set initial state & fetch data on open ---
  useEffect(() => {
    if (open) {
      // --- Fetch เฉพาะเมื่อจำเป็น ---
       const role = localStorage.getItem('userRole'); // เช็ค Role ล่าสุด
       // ถ้าไม่ใช่ User หรือเป็นการ Edit ถึงจะโหลด Users (เพราะ User Add ไม่ต้องใช้)
       if (role !== 'User' || isEditMode) {
           // แต่การ Fetch ของ User Edit Mode อาจจะยังเจอ 403 ถ้าไม่ได้แก้ Backend
           // ถ้าจะแก้ 403 ต้องมั่นใจว่า Backend อนุญาต หรือ User ไม่ต้องเห็น Field นี้
           if (role !== 'User') { // โหลด User เฉพาะ Admin/Manager
               fetchUsers();
           }
       } else {
           setUsersList([]); // ไม่ใช่ User Role ไม่ต้องโหลด Users ตอน Add
       }
       fetchTeams(); // โหลด Teams เสมอ (อาจปรับปรุงได้ถ้า User ไม่ต้องเลือก Team)
      // -------------------------

      // ตั้งค่า Form Fields
      if (isEditMode && taskData) {
        setTitle(taskData.title || ''); setDescription(taskData.description || '');
        setDueDate(formatDateForInput(taskData.dueDate)); setStatus(taskData.status || 'Pending');
        setTagsString(Array.isArray(taskData.tags) ? taskData.tags.join(', ') : '');
        setAssigneeId(taskData.assignee_id?._id || ''); setTeamId(taskData.team_id?._id || '');
      } else {
        setTitle(''); setDescription(''); setDueDate(''); setStatus('Pending');
        setTagsString(''); setAssigneeId(''); setTeamId('');
      }
      setErrors({}); setFetchError(null);
    }
  }, [open, taskData, isEditMode]); // เอา currentUserRole ออกถ้าอ่านจาก localStorage แทน

  // --- Memoized values for Autocomplete ---
  const selectedAssignee = useMemo(() => usersList.find(user => user._id === assigneeId) || null, [usersList, assigneeId]);
  const selectedTeam = useMemo(() => teamsList.find(team => team._id === teamId) || null, [teamsList, teamId]);

  // --- Validation ---
  const validateForm = () => {
    const newErrors = {};
    if (!isUserRole || !isEditMode) { // Admin/Manager หรือ User Add Mode (ซึ่งไม่ควรเกิด) ต้อง Validate
      if (!title.trim()) newErrors.title = 'Title is required';
      if (!description.trim()) newErrors.description = 'Description is required';
      if (!dueDate) newErrors.dueDate = 'Due Date is required';
    }
    // User Edit Mode ไม่ต้อง Validate Fields อื่น (แต่ Validate Status ได้ถ้าต้องการ)
    setErrors(newErrors); return Object.keys(newErrors).length === 0;
  };

  // --- Handle Submit ---
  const handleSubmit = async (event) => {
    event.preventDefault(); if (!validateForm()) return; setLoading(true);
    let payload;
    if (isUserRole && isEditMode) { payload = { status: status }; }
    else { payload = { title: title.trim(), description: description.trim(), dueDate: dueDate, status: status, tags: tagsString.split(',').map(tag => tag.trim()).filter(tag => tag !== ''), assignee_id: assigneeId || null, team_id: teamId || null, }; }
    const apiUrl = isEditMode ? `${baseUrl}/api/tasks/${taskData._id}` : `${baseUrl}/api/tasks`;
    if (isUserRole && !isEditMode) { Swal.fire('Error', 'Users cannot create tasks.', 'error'); setLoading(false); return; } // ป้องกัน User สร้าง Task
    const method = isEditMode ? "PUT" : "POST";
    const myHeaders = new Headers({ "Content-Type": "application/json", "Authorization": `Bearer ${token}` });
    const requestOptions = { method: method, headers: myHeaders, body: JSON.stringify(payload), redirect: "follow" };
    try {
      const response = await fetch(apiUrl, requestOptions);
      if (response.status === 403) { const errResult = await response.json().catch(()=>({message: "Forbidden: Action not allowed."})); throw new Error(errResult.message || "Forbidden"); }
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || result.error || `Request failed: ${response.status}`);
      Swal.fire({ icon: 'success', title: `Task ${isEditMode ? 'updated' : 'created'} successfully!`, timer: 1500, showConfirmButton: false });
      onSave();
    } catch (error) { console.error("Save Task Error:", error); setErrors(prev => ({ ...prev, general: error.message || 'An unexpected error occurred.' }));
    } finally { setLoading(false); }
  };

  const handleClose = () => { if (loading) return; onClose(); }

  // กำหนดว่าจะ Disable Field หรือไม่
  const disableFieldsForUser = isUserRole && isEditMode;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEditMode ? (isUserRole ? 'Update Task Status' : 'Edit Task') : 'Add New Task'}</DialogTitle>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent>
           {errors.general && <Alert severity="error" sx={{ mb: 2 }}>{errors.general}</Alert>}
           {fetchError && <Alert severity="warning" sx={{ mb: 2 }}>{fetchError}</Alert>}

          <TextField required={!isUserRole} margin="dense" id="title" label="Title" fullWidth variant="outlined" value={title} onChange={(e) => setTitle(e.target.value)} error={!!errors.title} helperText={errors.title} disabled={loading || disableFieldsForUser} />
          <TextField required={!isUserRole} margin="dense" id="description" label="Description" fullWidth multiline rows={3} variant="outlined" value={description} onChange={(e) => setDescription(e.target.value)} error={!!errors.description} helperText={errors.description} disabled={loading || disableFieldsForUser} />
          <TextField required={!isUserRole} margin="dense" id="dueDate" label="Due Date" type="date" fullWidth variant="outlined" value={dueDate} onChange={(e) => setDueDate(e.target.value)} error={!!errors.dueDate} helperText={errors.dueDate} disabled={loading || disableFieldsForUser} InputLabelProps={{ shrink: true }}/>
          <FormControl fullWidth margin="dense" variant="outlined" error={!!errors.status} disabled={loading}>
            <InputLabel id="status-select-label">Status</InputLabel>
            <Select labelId="status-select-label" id="status" value={status} onChange={(e) => setStatus(e.target.value)} label="Status">
              <MenuItem value="Pending">Pending</MenuItem> <MenuItem value="In Progress">In Progress</MenuItem> <MenuItem value="Completed">Completed</MenuItem>
            </Select>
            {errors.status && <FormHelperText>{errors.status}</FormHelperText>}
          </FormControl>
          <TextField margin="dense" id="tags" label="Tags (comma-separated)" fullWidth variant="outlined" value={tagsString} onChange={(e) => setTagsString(e.target.value)} helperText="e.g., urgent, frontend, bug" disabled={loading || disableFieldsForUser} />

           {/* --- Assignee Field (แสดง/ซ่อน หรือ Disable ตาม Role) --- */}
           {/* ถ้าต้องการซ่อน ใช้: {!isUserRole && ( <Autocomplete ... /> )} */}
           <Autocomplete
                id="assignee-autocomplete"
                options={usersList}
                loading={loadingUsers}
                disabled={loading || disableFieldsForUser || isUserRole} // <<< Disable ถ้าเป็น User Role เสมอ (ป้องกัน 403 ตอน Edit)
                getOptionLabel={(option) => { // <<< แก้ไข getOptionLabel ให้ Robust
                    if (typeof option === 'string') return option;
                    const fname = option?.fname || ''; const lname = option?.lname || ''; const username = option?.username || '...';
                    const name = `${fname} ${lname}`.trim();
                    return name ? `${name} (${username})` : username;
                }}
                value={selectedAssignee}
                onChange={(event, newValue) => { setAssigneeId(newValue ? newValue._id : ''); }}
                isOptionEqualToValue={(option, value) => option?._id === value?._id} // <<< เพิ่ม ?.
                fullWidth sx={{ mt: 1, mb: 1 }}
                renderInput={(params) => (
                    <TextField {...params} label="Assignee (Optional)" variant="outlined" margin="dense"
                        InputProps={{ ...params.InputProps, endAdornment: (<>{loadingUsers ? <CircularProgress color="inherit" size={20} /> : null}{params.InputProps.endAdornment}</>) }}
                    />
                 )}
            />

           {/* --- Team Field (แสดง/ซ่อน หรือ Disable ตาม Role) --- */}
           {/* ถ้าต้องการซ่อน ใช้: {!isUserRole && ( <Autocomplete ... /> )} */}
           <Autocomplete
                id="team-autocomplete"
                options={teamsList}
                loading={loadingTeams}
                disabled={loading || disableFieldsForUser} // <<< Disable ถ้า User แก้ไข
                getOptionLabel={(option) => { // <<< แก้ไข getOptionLabel ให้ Robust
                    // console.log('Team Option:', option); // Debug
                    if (typeof option === 'string') return option;
                    return option?.name || ''; // <-- ใช้ Optional Chaining
                }}
                value={selectedTeam}
                onChange={(event, newValue) => { setTeamId(newValue ? newValue._id : ''); }}
                isOptionEqualToValue={(option, value) => option?._id === value?._id} // <<< เพิ่ม ?.
                fullWidth sx={{ mt: 1, mb: 1 }}
                renderInput={(params) => (
                    <TextField {...params} label="Team (Optional)" variant="outlined" margin="dense"
                        InputProps={{ ...params.InputProps, endAdornment: (<>{loadingTeams ? <CircularProgress color="inherit" size={20} /> : null}{params.InputProps.endAdornment}</>) }}
                    />
                 )}
            />

        </DialogContent>
        <DialogActions sx={{ padding: '16px 24px' }}>
          <Button onClick={handleClose} color="secondary" disabled={loading}> Cancel </Button>
          <Button type="submit" variant="contained" color="primary" disabled={loading} startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null} >
            {loading ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Task')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

// Alert Component (เหมือนเดิม)
const Alert = ({ severity = 'error', children, sx }) => { const severityColors = { error: { lighter: '#ffebee', light: '#e57373', darker: '#d32f2f' }, warning: { lighter: '#fff8e1', light: '#ffb74d', darker: '#f57c00' }, info: { lighter: '#e3f2fd', light: '#64b5f6', darker: '#1976d2' }, success: { lighter: '#e8f5e9', light: '#81c784', darker: '#388e3c' }, }; const colors = severityColors[severity] || severityColors.error; return ( <Box sx={{ p: 1.5, mb: 1, borderRadius: 1, backgroundColor: colors.lighter, border: `1px solid ${colors.light}`, color: colors.darker, ...sx }}><Typography variant="body2">{children}</Typography></Box>); };

export default AddEditTaskDialog;