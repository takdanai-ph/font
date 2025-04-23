import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import {
  Container, Box, Typography, Button, IconButton, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Tooltip,
  Dialog, DialogActions, DialogContent, DialogTitle, TextField // สำหรับ Add/Edit Dialog
} from '@mui/material';

import AddTeamDialog from './AddTeamDialog';
import EditTeamDialog from './EditTeamDialog';
import ManageTeamMembersDialog from './ManageTeamMembersDialog';

import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import PeopleIcon from '@mui/icons-material/People';

// --- สมมติว่าสร้าง Dialog Components แยก ---
// import AddTeamDialog from './AddTeamDialog';
// import EditTeamDialog from './EditTeamDialog';

const MySwal = withReactContent(Swal);

function TeamManagement() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- State สำหรับ Dialogs (ตัวอย่าง) ---
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentTeam, setCurrentTeam] = useState(null);

  // --- State สำหรับ Dialog จัดการสมาชิก ---
  const [manageMembersDialogOpen, setManageMembersDialogOpen] = useState(false);
  const [selectedTeamForMembers, setSelectedTeamForMembers] = useState(null); // เก็บข้อมูลทีมที่จะจัดการสมาชิก

  // --- Function สำหรับ Fetch ข้อมูล Team ---
  const fetchTeams = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('token');
    if (!token) { /* ... handle no token ... */ return; }

    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${token}`);

    const requestOptions = { method: "GET", headers: myHeaders, redirect: "follow" };

    try {
      // *** สำคัญ: Endpoint นี้คุณต้องไปสร้างใน Backend ***
      // const response = await fetch("http://localhost:3001/api/teams", requestOptions); // <<< เรียก API Teams
      const response = await fetch("https://back-takdanai.up.railway.app/api/teams", requestOptions);
      if (!response.ok) {
        const errData = await response.json().catch(() => ({ message: `HTTP error! ${response.status}`}));
        throw new Error(errData.message || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setTeams(data.teams || data); // <<< ปรับตามโครงสร้าง response จริงจาก backend
    } catch (err) {
      console.error("Fetch teams error:", err);
      setError(err.message);
      MySwal.fire('Error', `Could not fetch teams: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [navigate, MySwal]); // ใส่ MySwal ใน dependencies

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  // --- Function สำหรับลบ Team ---
  const handleDelete = useCallback((teamId, teamName) => {
    MySwal.fire({
      title: `ลบทีม ${teamName}?`,
      text: "การดำเนินการนี้ไม่สามารถย้อนกลับได้!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'ใช่, ลบเลย!',
      cancelButtonText: 'ยกเลิก'
    }).then((result) => {
      if (result.isConfirmed) {
        const token = localStorage.getItem('token');
        const myHeaders = new Headers();
        myHeaders.append("Authorization", `Bearer ${token}`);
        const requestOptions = { method: "DELETE", headers: myHeaders, redirect: "follow" };

        setLoading(true);
         // *** สำคัญ: Endpoint นี้คุณต้องไปสร้างใน Backend ***
        // fetch(`http://localhost:3001/api/teams/${teamId}`, requestOptions) // <<< เรียก API Delete Team
        fetch(`https://back-takdanai.up.railway.app/api/teams/${teamId}`, requestOptions)
          .then(response => {
             if (!response.ok) { /* ... handle error ... */ }
             return response.json(); // หรือ .text()
          })
          .then(() => {
            MySwal.fire('ลบแล้ว!', `ทีม ${teamName} ถูกลบ.`, 'success');
            fetchTeams(); // <<< โหลดข้อมูลใหม่
          })
          .catch(err => {
            MySwal.fire('เกิดข้อผิดพลาด!', `ลบทีมไม่สำเร็จ: ${err.message}`, 'error');
            setLoading(false);
          });
      }
    });
  }, [MySwal, fetchTeams]);

  // --- Handlers สำหรับเปิด/ปิด Dialogs ---
  const handleAddClick = () => setAddDialogOpen(true);
  const handleAddDialogClose = () => setAddDialogOpen(false);
  const handleEditClick = (team) => {
      setCurrentTeam(team);
      setEditDialogOpen(true);
  };
  const handleEditDialogClose = () => {
      setEditDialogOpen(false);
      setCurrentTeam(null);
  };

  // --- Function Placeholder สำหรับ Save (เรียกจาก Dialog) ---
  const handleSave = () => {
    handleAddDialogClose();
    handleEditDialogClose();
    fetchTeams();
  }

  const handleManageMembersClick = (team) => {
    setSelectedTeamForMembers(team); // เก็บข้อมูลทีมที่เลือก
    setManageMembersDialogOpen(true); // เปิด Dialog
  };

  const handleManageMembersDialogClose = () => {
    setManageMembersDialogOpen(false);
    setSelectedTeamForMembers(null); // เคลียร์ค่าเมื่อปิด
    // อาจจะต้อง fetchTeams() อีกครั้งถ้ามีการเปลี่ยนแปลงใน Dialog นั้น
    fetchTeams(); // << โหลดข้อมูลทีมใหม่เผื่อมีการเปลี่ยน Leader ใน Dialog
  };

  if (loading && teams.length === 0) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Box>;
  }
  if (error) {
    return <Typography color="error" sx={{ mt: 2, textAlign:'center' }}>Error fetching teams: {error}</Typography>;
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, mt: 2 }}>
        <Typography variant="h4" component="h1">
          Team Management
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddClick}>
          Create Team
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="team table">
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 'bold' } }}>
              <TableCell>Team Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Team Leader</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
        {teams.map((team) => (
          <TableRow hover key={team.team_id || team._id}>
            <TableCell>{team.name}</TableCell>
            <TableCell>{team.description}</TableCell>
            {/* --- แสดงชื่อหัวหน้าทีม --- */}
            <TableCell>
              {team.leader_id ? (
                // ถ้ามี leader_id ให้แสดงชื่อ (ปรับ field ตามที่ populate มา)
                `${team.leader_id.fname || ''} ${team.leader_id.lname || ''}`.trim() || team.leader_id.username
              ) : (
                // ถ้าไม่มี leader_id
                <Typography variant="caption" color="text.secondary">
                  (No Leader)
                </Typography>
              )}
            </TableCell>
            {/* --- สิ้นสุดส่วนแสดงชื่อ --- */}
            <TableCell align="center">
               <Tooltip title="Edit Team Info"> {/* <<< เปลี่ยน Tooltip */}
                <IconButton size="small" color="primary" onClick={() => handleEditClick(team)}>
                  <EditIcon fontSize="small"/>
                </IconButton>
              </Tooltip>
               {/* --- เพิ่มปุ่มจัดการสมาชิก --- */}
               <Tooltip title="Manage Members">
                  <IconButton size="small" color="secondary" onClick={() => handleManageMembersClick(team)}> {/* <<< เรียกฟังก์ชันใหม่ */}
                     <PeopleIcon fontSize="small" /> {/* <<< ใช้ไอคอนกลุ่มคน (ต้อง import) */}
                  </IconButton>
               </Tooltip>
               {/* --- สิ้นสุดปุ่มจัดการสมาชิก --- */}
              <Tooltip title="Delete Team"> {/* <<< เปลี่ยน Tooltip */}
                <IconButton size="small" color="error" onClick={() => handleDelete(team.team_id || team._id, team.name)}>
                  <DeleteIcon fontSize="small"/>
                </IconButton>
              </Tooltip>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
        </Table>
      </TableContainer>

      {/* --- Placeholder for Add/Edit Dialogs --- */}
      {/* <AddTeamDialog open={addDialogOpen} onClose={handleAddDialogClose} onSave={handleSave} /> */}
      {/* {currentTeam && <EditTeamDialog open={editDialogOpen} onClose={handleEditDialogClose} onSave={handleSave} team={currentTeam} />} */}
       {/* <Typography sx={{mt: 2, fontStyle: 'italic'}} color="text.secondary">
            (Add and Edit dialogs need to be implemented separately)
       </Typography> */}

    <AddTeamDialog
    open={addDialogOpen}
    onClose={handleAddDialogClose}
    onSave={handleSave}
    />

    {currentTeam && (
    <EditTeamDialog
      open={editDialogOpen}
      onClose={handleEditDialogClose}
      onSave={handleSave}
      team={currentTeam}
    />
    )}

    {selectedTeamForMembers && (
      <ManageTeamMembersDialog
      open={manageMembersDialogOpen}
      onClose={handleManageMembersDialogClose}
      team={selectedTeamForMembers}
      />
          // <Dialog open={manageMembersDialogOpen} onClose={handleManageMembersDialogClose}>
          //     <DialogTitle>Manage Members for: {selectedTeamForMembers.name}</DialogTitle>
          //     <DialogContent>
          //         <Typography>(Member List, Add/Remove, Set Leader UI will be here)</Typography>
          //     </DialogContent>
          //     <DialogActions>
          //         <Button onClick={handleManageMembersDialogClose}>Close</Button>
          //     </DialogActions>
          // </Dialog>
    )}

    </Container>
  );
}

export default TeamManagement;