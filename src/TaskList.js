import React, { useState, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Tooltip, Typography, Box, Button, Chip, Avatar
} from '@mui/material';
import { lightBlue, grey } from '@mui/material/colors';
import PersonIcon from '@mui/icons-material/Person';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import Swal from 'sweetalert2';
import AddEditTaskDialog from './AddEditTaskDialog';

function TaskList({ tasks, refreshData, onTaskClick }) {
  const [openAddEditDialog, setOpenAddEditDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState(null);

  const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';
  // const baseUrl = process.env.REACT_APP_API_BASE_URL || 'https://back-takdanai.up.railway.app';

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    setCurrentUserRole(role);
  }, []);

  const handleDelete = (taskId, taskTitle) => {
     Swal.fire({
      title: `Delete task "${taskTitle}"?`,
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        const token = localStorage.getItem('token');
        if (!token) {
            Swal.fire('Error!', 'Authentication token not found.', 'error');
            return;
        }
        const apiUrl = `${baseUrl}/api/tasks/${taskId}`;
        const myHeaders = new Headers({ "Authorization": `Bearer ${token}` });
        const requestOptions = { method: "DELETE", headers: myHeaders, redirect: "follow" };
        fetch(apiUrl, requestOptions)
          .then(response => {
            if (!response.ok) {
              return response.json().catch(() => ({ message: `HTTP error ${response.status}` })).then(err => { throw new Error(err.message || 'Delete failed') });
            }
             return response.text().then(text => text ? JSON.parse(text) : {});
          })
          .then(deleteResult => {
            Swal.fire('Deleted!', deleteResult.message || 'Your task has been deleted.', 'success');
            refreshData();
          })
          .catch(error => {
            console.error("Delete task error:", error);
            Swal.fire('Error!', `Could not delete task: ${error.message}`, 'error');
          });
      }
    });
  };

  const handleEdit = (task) => {
    setSelectedTask(task); // กำหนด task ที่จะแก้ไข
    setOpenAddEditDialog(true); // เปิด dialog
  };

  const handleAdd = () => {
      setSelectedTask(null); // ไม่เลือก task = เพิ่มใหม่
      setOpenAddEditDialog(true); // เปิด dialog
  }

  const handleCloseDialog = () => {
      setOpenAddEditDialog(false);
      setSelectedTask(null); // เคลียร์ task ที่เลือกเมื่อปิด
  }

  // Function นี้จะถูกเรียกจาก Dialog เมื่อ Save สำเร็จ
  const handleSaveTask = () => {
      handleCloseDialog(); // ปิด Dialog
      refreshData(); // โหลดข้อมูล Task ใหม่
  }

  const formatDate = (dateString) => {
      // ... (เหมือนเดิม) ...
        if (!dateString) return 'N/A';
      try {
          return new Date(dateString).toLocaleDateString('th-TH', {
              year: 'numeric', month: 'short', day: 'numeric',
          });
      } catch (error) { return 'Invalid Date'; }
  }

  const getStatusColor = (status) => {
     // ... (เหมือนเดิม) ...
      switch (status) {
          case 'Pending': return 'warning';
          case 'In Progress': return 'info';
          case 'Completed': return 'success';
          default: return 'default';
      }
  }

  // --- Function แสดงชื่อ Assignee ---
  const renderAssignee = (assignee) => {
    if (!assignee) {
        return <Typography variant="caption" color="text.secondary">-</Typography>;
    }
    // แสดงชื่อ-นามสกุล ถ้ามี, ถ้าไม่มีใช username
    const name = `${assignee.fname || ''} ${assignee.lname || ''}`.trim();
    return (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {/* <Avatar sx={{ width: 24, height: 24, mr: 1, bgcolor: lightBlue[100], color: lightBlue[600], fontSize: '0.8rem' }}>
                 {assignee.fname ? assignee.fname[0].toUpperCase() : <PersonIcon fontSize="inherit"/>}
            </Avatar> */}
            <Typography variant="body2">
              {name || assignee.username || 'Unknown User'}
            </Typography>
        </Box>
    );
}

 // --- Function แสดงชื่อ Team ---
 const renderTeam = (team) => {
     if (!team) {
        return <Typography variant="caption" color="text.secondary">-</Typography>;
     }
     return team.name || 'Unknown Team';
 }

 const canAddTask = currentUserRole === 'Admin' || currentUserRole === 'Manager';
const canDeleteTask = currentUserRole === 'Admin' || currentUserRole === 'Manager';

 return (
    <Box>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          {canAddTask && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
                Add New Task
            </Button>
          )}
        </Box>

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 850 }} aria-label="task list table">
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 'bold' } }}>
              <TableCell sx={{ width: '25%' }}>Title</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell>Assignee</TableCell>
              <TableCell>Team</TableCell>
              <TableCell>Tags</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tasks && tasks.length > 0 ? (tasks.map((task) => (
                <TableRow hover key={task._id}onClick={() => onTaskClick(task)}sx={{ cursor: 'pointer' }}>
                  <TableCell component="th" scope="row">{task.title}</TableCell>
                  <TableCell><Chip label={task.status} color={getStatusColor(task.status)} size="small" /></TableCell>
                  <TableCell>{formatDate(task.dueDate)}</TableCell>
                  <TableCell>{renderAssignee(task.assignee_id)}</TableCell>
                  <TableCell>{renderTeam(task.team_id)}</TableCell>
                  <TableCell>{task.tags && task.tags.map((tag, index) => (<Chip key={index} label={tag} size="small" sx={{ mr: 0.5, mb: 0.5 }} />))}</TableCell>
                  <TableCell align="center">
                    {/* --- Edit Button --- */}
                    <Tooltip title="Edit Task / Update Status">
                      <IconButton 
                      size="small" 
                      color="primary" 
                      onClick={(event) => {
                        event.stopPropagation();
                        handleEdit(task);
                      }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                     {/* --- แสดงปุ่ม Delete เฉพาะ Role ที่อนุญาต --- */}
                    {canDeleteTask && (
                        <Tooltip title="Delete Task">
                            <IconButton 
                            size="small" 
                            color="error" 
                            onClick={(event) => {
                              event.stopPropagation();
                              handleDelete(task._id, task.title);
                            }}
                            >
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={7} align="center"> <Typography color="text.secondary">No tasks found.</Typography> </TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

       <AddEditTaskDialog
            open={openAddEditDialog}
            onClose={handleCloseDialog}
            onSave={handleSaveTask}
            taskData={selectedTask}
            // --- ส่ง Role ปัจจุบันไปให้ Dialog ---
            currentUserRole={currentUserRole}
       />

    </Box>
  );
}

export default TaskList;