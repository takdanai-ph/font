import React, { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, List, ListItem,
  ListItemText, ListItemSecondaryAction, IconButton, Typography, Divider,
  CircularProgress, Tooltip, Autocomplete, TextField, Alert // <<< เพิ่ม Alert สำหรับ Error
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import StarIcon from '@mui/icons-material/Star'; // ไอคอนดาว (เป็น Leader)
import StarBorderIcon from '@mui/icons-material/StarBorder'; // ไอคอนดาวขอบ (ยังไม่เป็น Leader)

const MySwal = withReactContent(Swal);

// Component รับ props: open, onClose, team (ข้อมูลทีมที่เลือก)
function ManageTeamMembersDialog({ open, onClose, team }) {
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [errorMembers, setErrorMembers] = useState(null);

  const [availableUsers, setAvailableUsers] = useState([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [errorAvailable, setErrorAvailable] = useState(null);

  const [selectedUserToAdd, setSelectedUserToAdd] = useState(null); // User ที่เลือกจาก Autocomplete
  const [isAdding, setIsAdding] = useState(false);
  const [isRemoving, setIsRemoving] = useState({}); // Object เก็บสถานะการลบของแต่ละ User ID
  const [isSettingLeader, setIsSettingLeader] = useState(false);

  // const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);
  // const [userToRemove, setUserToRemove] = useState(null); 

  // เก็บ Leader ID ปัจจุบัน (จาก team prop) เพื่อใช้เปรียบเทียบ
  const currentLeaderId = team?.leader_id?._id || team?.leader_id;

  // const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';
  const baseUrl = process.env.REACT_APP_API_BASE_URL || 'https://back-takdanai.up.railway.app';
  const teamId = team?._id || team?.team_id; // ID ของทีมปัจจุบัน

  // URLs
  const membersApiUrl = teamId ? `${baseUrl}/api/teams/${teamId}/members` : null;
  const availableUsersApiUrl = `${baseUrl}/api/auth/users?assignment=unassigned`;
  const leaderApiUrl = teamId ? `${baseUrl}/api/teams/${teamId}/leader` : null;
  // URL สำหรับ Add/Remove จะสร้างตอนเรียกใช้

  const token = localStorage.getItem('token'); // ดึง Token มาเก็บไว้

  // --- Function สำหรับ Fetch สมาชิกปัจจุบัน ---
  const fetchMembers = useCallback(async () => {
    if (!open || !membersApiUrl || !token) return; // ไม่ต้อง fetch ถ้า Dialog ปิด หรือไม่มี URL/Token

    setLoadingMembers(true);
    setErrorMembers(null); // เคลียร์ error เก่า
    const myHeaders = new Headers({ "Authorization": `Bearer ${token}` });
    const requestOptions = { method: "GET", headers: myHeaders, redirect: "follow" };

    try {
      const response = await fetch(membersApiUrl, requestOptions);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setMembers(Array.isArray(data) ? data : []); // คาดหวัง array ของ members
    } catch (error) {
      console.error("Fetch members error:", error);
      setErrorMembers(`Could not load members: ${error.message}`);
    } finally {
      setLoadingMembers(false);
    }
  }, [open, membersApiUrl, token]);

  // --- Function สำหรับ Fetch User ที่ยังไม่มีทีม ---
  const fetchAvailableUsers = useCallback(async () => {
    if (!open || !availableUsersApiUrl || !token) return;

    setLoadingAvailable(true);
    setErrorAvailable(null);
    const myHeaders = new Headers({ "Authorization": `Bearer ${token}` });
    const requestOptions = { method: "GET", headers: myHeaders, redirect: "follow" };

    try {
      const response = await fetch(availableUsersApiUrl, requestOptions);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setAvailableUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Fetch available users error:", error);
      setErrorAvailable(`Could not load available users: ${error.message}`);
    } finally {
      setLoadingAvailable(false);
    }
  }, [open, availableUsersApiUrl, token]);

  // --- useEffect: เรียก fetch ทั้งสองเมื่อ Dialog เปิด หรือ teamId เปลี่ยน ---
  useEffect(() => {
    if (open && teamId) {
      fetchMembers();
      fetchAvailableUsers();
    }
    // ถ้าไม่ต้องการ reset state ตอนปิด อาจจะไม่ต้องทำอะไรใน cleanup function
    // หรือจะ reset state ที่จำเป็นก็ได้
    return () => {
        setMembers([]);
        setAvailableUsers([]);
        setSelectedUserToAdd(null);
        setErrorMembers(null);
        setErrorAvailable(null);
        // ไม่ reset loading flags เพราะมันควรจะถูกควบคุมโดย fetch functions
    }
  }, [open, teamId, fetchMembers, fetchAvailableUsers]);

  // --- Handler: เพิ่มสมาชิก ---
  const handleAddMember = async () => {
    if (!selectedUserToAdd || !teamId || !token) {
        MySwal.fire('Warning', 'Please select a user to add.', 'warning');
        return;
    }
    const addMemberUrl = `${baseUrl}/api/teams/${teamId}/members`;
    setIsAdding(true);

    const myHeaders = new Headers({
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    });
    const body = JSON.stringify({ userId: selectedUserToAdd._id });
    const requestOptions = { method: "POST", headers: myHeaders, body: body, redirect: "follow" };

    try {
        const response = await fetch(addMemberUrl, requestOptions);
        const result = await response.json(); // อ่าน response ไม่ว่าจะ success หรือ error
        if (!response.ok) throw new Error(result.message || `HTTP error! status: ${response.status}`);

        MySwal.fire('Success', result.message || 'User added successfully.', 'success');
        setSelectedUserToAdd(null); // เคลียร์ค่าที่เลือกไว้
        await fetchMembers(); // โหลดสมาชิกใหม่
        await fetchAvailableUsers(); // โหลด User ที่ว่างใหม่ (เพราะคนนี้ไม่ว่างแล้ว)
    } catch (error) {
        console.error("Add member error:", error);
        MySwal.fire('Error', `Could not add user: ${error.message}`, 'error');
    } finally {
        setIsAdding(false);
    }
  };

  // --- Handler: ลบสมาชิก ---
  const handleRemoveMember = (userIdToRemove, username) => {
    if (!teamId || !userIdToRemove || !token) return;

    MySwal.fire({
        title: `Remove ${username}?`,
        text: `Are you sure you want to remove ${username} from this team?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, remove them!',
        cancelButtonText: 'Cancel'
      }).then(async (result) => {
          if (result.isConfirmed) {
              const removeMemberUrl = `${baseUrl}/api/teams/${teamId}/members/${userIdToRemove}`;
              setIsRemoving(prev => ({ ...prev, [userIdToRemove]: true })); // ตั้ง loading เฉพาะ user นี้

              const myHeaders = new Headers({ "Authorization": `Bearer ${token}` });
              const requestOptions = { method: "DELETE", headers: myHeaders, redirect: "follow" };

              try {
                  const response = await fetch(removeMemberUrl, requestOptions);
                  const resData = await response.json(); // อ่าน response
                  if (!response.ok) throw new Error(resData.message || `HTTP error! status: ${response.status}`);

                  MySwal.fire('Removed!', resData.message || `${username} has been removed.`, 'success');
                  await fetchMembers(); // โหลดสมาชิกใหม่
                  await fetchAvailableUsers(); // โหลด User ที่ว่างใหม่ (คนนี้ว่างแล้ว)
              } catch (error) {
                  console.error("Remove member error:", error);
                  MySwal.fire('Error', `Could not remove user: ${error.message}`, 'error');
              } finally {
                  setIsRemoving(prev => ({ ...prev, [userIdToRemove]: false })); // ปิด loading เฉพาะ user นี้
              }
          }
      });
  };

  // --- Handler: ตั้งหัวหน้าทีม ---
  const handleSetLeader = async (userIdToSet) => {
    if (!leaderApiUrl || !userIdToSet || !token) return;

    setIsSettingLeader(true);
    const myHeaders = new Headers({
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    });
    const body = JSON.stringify({ leaderId: userIdToSet });
    const requestOptions = { method: "PUT", headers: myHeaders, body: body, redirect: "follow" };

    try {
        const response = await fetch(leaderApiUrl, requestOptions);
        const updatedTeam = await response.json(); // อ่าน response
        if (!response.ok) throw new Error(updatedTeam.message || `HTTP error! status: ${response.status}`);

        MySwal.fire('Success', `Set ${updatedTeam.leader_id?.fname || 'New Leader'} as team leader.`, 'success');
        // อัปเดต Leader ID ใน Component แม่ (TeamManagement) โดยการเรียก onClose ซึ่งจะ trigger fetchTeams
        // หรือจะอัปเดต State ของ Dialog นี้เลยก็ได้ แต่เรียก onClose ให้แม่โหลดใหม่จะชัวร์กว่า
        onClose(); // << ปิด Dialog แล้วให้ Component แม่โหลดข้อมูลทีมใหม่ทั้งหมด
        // ถ้าไม่ปิด Dialog ก็ต้อง fetchMembers() ใหม่อีกครั้งเพื่อ update UI ดาว
        // await fetchMembers();

    } catch (error) {
        console.error("Set leader error:", error);
        MySwal.fire('Error', `Could not set team leader: ${error.message}`, 'error');
    } finally {
        setIsSettingLeader(false);
    }
  };

  // --- Render ---
  if (!team) return null; // ไม่แสดงถ้าไม่มีข้อมูล team

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth scroll="paper">
      <DialogTitle>Manage Members: {team.name}</DialogTitle>
      <DialogContent dividers> {/* dividers เพิ่มเส้นแบ่ง */}

        {/* Section: Team Leader */}
        <Box sx={{ mb: 2, p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
           <Typography variant="subtitle1" gutterBottom>Current Leader</Typography>
           {loadingMembers ? <CircularProgress size={20} /> :
            members.find(m => m._id === currentLeaderId) ?
             <Typography>
                <StarIcon sx={{ verticalAlign: 'middle', color: 'gold', mr: 0.5 }} fontSize="small"/>
                {`${members.find(m => m._id === currentLeaderId)?.fname || ''} ${members.find(m => m._id === currentLeaderId)?.lname || ''}`.trim() || members.find(m => m._id === currentLeaderId)?.username}
             </Typography>
            : <Typography color="text.secondary">(No Leader Assigned)</Typography>
           }
        </Box>

        {/* Section: Add Member */}
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>Add New Member</Typography>
        {errorAvailable && <Alert severity="error" sx={{ mb: 1 }}>{errorAvailable}</Alert>}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Autocomplete
            options={availableUsers}
            getOptionLabel={(option) => `${option.fname || ''} ${option.lname || ''} (${option.username})`}
            value={selectedUserToAdd}
            onChange={(event, newValue) => {
              setSelectedUserToAdd(newValue);
            }}
            isOptionEqualToValue={(option, value) => option._id === value._id} // สำคัญสำหรับการเปรียบเทียบ Object
            loading={loadingAvailable}
            disabled={isAdding}
            fullWidth
            size="small"
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select User to Add"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <React.Fragment>
                      {loadingAvailable ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </React.Fragment>
                  ),
                }}
              />
            )}
          />
          <Tooltip title="Add selected user to team">
            <span> {/* Span จำเป็นสำหรับ Tooltip เมื่อ Button ถูก disabled */}
                <IconButton
                    color="primary"
                    onClick={handleAddMember}
                    disabled={!selectedUserToAdd || isAdding || loadingAvailable}
                >
                    {isAdding ? <CircularProgress size={24} /> : <AddIcon />}
                </IconButton>
            </span>
          </Tooltip>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Section: Current Members List */}
        <Typography variant="subtitle1" gutterBottom>Current Members ({members.length})</Typography>
        {errorMembers && <Alert severity="error" sx={{ mb: 1 }}>{errorMembers}</Alert>}
        {loadingMembers ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <CircularProgress />
          </Box>
        ) : members.length === 0 ? (
          <Typography color="text.secondary" sx={{ mt: 1 }}>No members in this team yet.</Typography>
        ) : (
          <List dense> {/* dense ทำให้รายการชิดกันขึ้น */}
            {members.map((member) => {
              const isLeader = member._id === currentLeaderId;
              const removing = isRemoving[member._id]; // เช็คสถานะ loading การลบของ user นี้

              return (
                <ListItem
                  key={member._id}
                  divider // เพิ่มเส้นคั่นระหว่างรายการ
                  secondaryAction={
                    <Box>
                        {/* ปุ่ม Set as Leader */}
                        <Tooltip title={isLeader ? "Current Leader" : "Set as Leader"}>
                           <span> {/* Span สำหรับ Tooltip ตอน disabled */}
                           <IconButton
                              edge="end"
                              aria-label="set-leader"
                              onClick={() => handleSetLeader(member._id)}
                              disabled={isLeader || isSettingLeader || removing} // ปิดถ้าเป็น Leader อยู่แล้ว หรือกำลังตั้งคนอื่น หรือกำลังลบคนนี้
                              color={isLeader ? "warning" : "default"} // สีเหลืองถ้าเป็น Leader
                           >
                             {/* แสดงดาวเต็มถ้าเป็น Leader หรือกำลังโหลด, มิฉะนั้นแสดงดาวขอบ */}
                              {isLeader ? <StarIcon fontSize="small"/> :
                               (isSettingLeader ? <CircularProgress size={20} /> : <StarBorderIcon fontSize="small"/>)
                              }
                           </IconButton>
                           </span>
                        </Tooltip>
                        {/* ปุ่ม Remove Member */}
                        <Tooltip title="Remove from team">
                           <span> {/* Span สำหรับ Tooltip ตอน disabled */}
                           <IconButton
                              edge="end"
                              aria-label="delete"
                              onClick={() => handleRemoveMember(member._id, member.username)}
                              disabled={isAdding || isSettingLeader || removing} // ปิด ถ้ากำลัง Add/SetLeader/Remove คนนี้
                              sx={{ ml: 1 }} // เพิ่มระยะห่างซ้าย
                           >
                              {removing ? <CircularProgress size={20} /> : <DeleteIcon fontSize="small" color="error"/>}
                           </IconButton>
                           </span>
                        </Tooltip>
                    </Box>
                  }
                >
                  <ListItemText
                    primary={`${member.fname || ''} ${member.lname || ''}`.trim() || member.username}
                    secondary={member.email}
                  />
                </ListItem>
              );
            })}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">Close</Button>
      </DialogActions>
    </Dialog>
  );
}

export default ManageTeamMembersDialog;