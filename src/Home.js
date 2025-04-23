import React, { useState, useEffect, useCallback } from 'react';
import { Link as RouterLink } from 'react-router-dom'; // <<< ใช้ Link จาก Router
import {
    Container, Typography, Box, Grid, Card, CardContent, List, ListItem,
    ListItemText, Chip, CircularProgress, Alert, Link, Button, Paper
    , Tooltip, ListItemIcon, ListItemButton  // <<< เพิ่ม Link, Button
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime'; // ไอคอนเวลา
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'; // ไอคอนเสร็จ
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'; // ไอคอน Overdue
import PersonIcon from '@mui/icons-material/Person';
import GroupIcon from '@mui/icons-material/Group';

import { formatDate, isOverdue } from './utils/dateUtils';

// // Function จัดรูปแบบวันที่ (อาจจะยกไปไว้ไฟล์ utils ถ้าใช้หลายที่)
// const formatDate = (dateString) => {
//     if (!dateString) return 'N/A';
//     try {
//         const date = new Date(dateString);
//         // ถ้าเวลาเป็น 00:00:00 (มักจะมาจาก input type date) ให้แสดงแค่วันที่
//         if (date.getHours() === 0 && date.getMinutes() === 0 && date.getSeconds() === 0) {
//              return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
//         } else {
//             // ถ้ามีเวลา แสดงเวลาด้วย
//             return date.toLocaleString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
//         }
//     } catch (error) { return 'Invalid Date'; }
// }

// // Function เช็คว่าเป็น Overdue หรือไม่
// const isOverdue = (dueDateString) => {
//     if (!dueDateString) return false;
//     try {
//         const dueDate = new Date(dueDateString);
//         const now = new Date();
//         // ตั้งค่า now ให้เป็นเวลาสิ้นสุดของวันปัจจุบัน เพื่อเทียบกับ dueDate ที่อาจจะเป็นแค่วันที่
//         now.setHours(23, 59, 59, 999);
//         return dueDate < now;
//     } catch (e) {
//         return false;
//     }
// }

function Home() {
  const [myWorkData, setMyWorkData] = useState({ relevantTasks: [], counts: { pendingInProgress: 0, completed: 0 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userName, setUserName] = useState('');
  // const [currentUser, setCurrentUser] = useState(null);

  const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';
  // const baseUrl = process.env.REACT_APP_API_BASE_URL || 'https://back-takdanai.up.railway.app';
  const token = localStorage.getItem('token');

  // --- Function ดึงข้อมูล My Work และ User Name ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!token) {
      setError("Authentication token not found.");
      setLoading(false);
      return;
    }

    const myWorkUrl = `${baseUrl}/api/tasks/my-work`;
    const meUrl = `${baseUrl}/api/auth/me`; // <<< Endpoint ดึงข้อมูล User
    const myHeaders = new Headers({ "Authorization": `Bearer ${token}` });
    const requestOptions = { method: "GET", headers: myHeaders, redirect: "follow" };

    try {
       // เรียก API พร้อมกัน
      const [myWorkResponse, meResponse] = await Promise.all([
        fetch(myWorkUrl, requestOptions),
        fetch(meUrl, requestOptions) // <<< เรียก /me เพิ่ม
      ]);

      // --- ประมวลผล User Response ---
      if (!meResponse.ok) {
           console.warn("Could not fetch user details, showing default welcome message.");
           // ไม่ต้อง Throw Error แค่แสดงชื่อไม่ได้
      } else {
           const userData = await meResponse.json();
           setUserName(`${userData.fname || ''} ${userData.lname || ''}`.trim() || userData.username); // <<< ตั้งค่าชื่อ
      }

      // --- ประมวลผล My Work Response ---
      if (!myWorkResponse.ok) {
        const errData = await myWorkResponse.json().catch(() => ({}));
        throw new Error(`Failed to fetch My Work data: ${myWorkResponse.status} ${errData.message || ''}`);
      }
      const data = await myWorkResponse.json();
      setMyWorkData({
          relevantTasks: Array.isArray(data.relevantTasks) ? data.relevantTasks : [],
          counts: data.counts || { pendingInProgress: 0, completed: 0 }
      });

    } catch (err) {
      console.error("Fetch Home Data Error:", err);
      setError(err.message);
      setMyWorkData({ relevantTasks: [], counts: { pendingInProgress: 0, completed: 0 } }); // เคลียร์ข้อมูลถ้า Error
    } finally {
      setLoading(false);
    }
  }, [baseUrl, token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- ส่วนแสดงผล ---
  if (loading) {
    return ( <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}> <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}> <CircularProgress /> </Box> </Container> );
  }

  if (error) {
     return ( <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}> <Alert severity="error">{error}</Alert> </Container> );
  }

  const { relevantTasks, counts } = myWorkData;
  const currentUserId = localStorage.getItem('userId');
  // const currentUserId = currentUser?._id;
  // const currentUserTeamId = currentUser?.team_id;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* --- ส่วนหัว + สรุปส่วนตัว --- */}
      <Typography variant="h5" gutterBottom component="h2">
         My Work {userName && `for ${userName}`}
      </Typography>
       <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid xs={12} sm={6}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                <AccessTimeIcon sx={{ verticalAlign: 'bottom', mr: 0.5, fontSize: '1.1rem' }}/>
                Pending / In Progress Tasks
              </Typography>
              <Typography variant="h5" component="div">
                {counts.pendingInProgress}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid xs={12} sm={6}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                 <CheckCircleOutlineIcon sx={{ verticalAlign: 'bottom', mr: 0.5, fontSize: '1.1rem' }}/>
                 Completed Tasks
              </Typography>
              <Typography variant="h5" component="div">
                {counts.completed}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* --- ส่วนรายการ Task ที่ใกล้ถึงกำหนด / เกินกำหนด --- */}
      <Typography variant="h5" gutterBottom component="h2">
        Due Soon & Overdue Tasks
      </Typography>
      {relevantTasks.length > 0 ? (
        <Paper sx={{ p: 1 }}>
          <List dense>
            {relevantTasks.map((task) => {
              const overdue = isOverdue(task.dueDate);
              const currentUserId = localStorage.getItem('userId');
              const isAssignedToMe = task.assignee_id?._id === currentUserId;
              // const isTeamTask = task.team_id?._id === currentUserTeamId; // <<< เช็คว่าเป็น Task ของทีมเราหรือไม่
              const isTeamTask = !!task.team_id; //เช็คว่ามี team_id หรือไม่ (ถ้ามีจะเป็น true)
              const assigneeName = task.assignee_id ? `${task.assignee_id.fname || ''} ${task.assignee_id.lname || ''}`.trim() || task.assignee_id.username : null;
              // const teamName = task.team_id?.name; // อาจจะไม่ต้องแสดงชื่อทีมซ้ำซ้อน

              // --- เพิ่ม Console Log ตรงนี้ ---
              console.log('--- Task Check ---');
              console.log('Task Title:', task.title);
              console.log('Task Assignee Object:', task.assignee_id);
              console.log('Current User ID:', currentUserId);
              console.log('Is Assigned To Me:', isAssignedToMe);
              console.log('Is Team Task:', isTeamTask);
              console.log('Calculated Assignee Name:', assigneeName);
              // --- ---

              // --- สร้างส่วนแสดงผลประเภท Task และ Assignee ---
              let assignmentInfo = null;
              if (isAssignedToMe) {
                  assignmentInfo = (
                      <Chip
                          icon={<PersonIcon />}
                          label="My Task"
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ mr: 1 }}
                      />
                  );
              } else if (isTeamTask) {
                  const tooltipTitle = `Team Task${assigneeName ? ' - Assigned to ' + assigneeName : ''}`;
                  assignmentInfo = (
                    <Tooltip title={tooltipTitle}>
                        <Chip
                            icon={<GroupIcon />}
                            label="Team"
                            size="small"
                            variant="outlined"
                            color="secondary"
                            sx={{ mr: 1 }}
                        />
                    </Tooltip>
                );
              }

              return (
                <ListItemButton
                    key={task._id}
                    component={RouterLink}
                    to={`/task/${task._id}`}
                    divider 
                    sx={{ pt: 1.5, pb: 1.5 }}
                >
                  <ListItemIcon sx={{ minWidth: 'auto', mr: 1.5 }}>
                        {isAssignedToMe ? <PersonIcon color="primary"/> : <GroupIcon color="action"/>}
                  </ListItemIcon>
                  <ListItemText
                    primary={task.title}
                    secondary={
                        <Box component="span" sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', mt: 0.5, gap: 0.5 }}>
                           <Chip
                              label={task.status}
                              color={task.status === 'Pending' ? 'warning' : 'info'}
                              size="small"
                           />
                           {assignmentInfo}
                            <Typography variant="caption" color={overdue ? 'error' : 'text.secondary'} sx={{ display: 'inline-flex', alignItems: 'center' }}>
                                Due: {formatDate(task.dueDate)}
                                {overdue && <ErrorOutlineIcon color="error" sx={{ fontSize: '1rem', ml: 0.5 }}/>}
                            </Typography>
                        </Box>
                    }
                    secondaryTypographyProps={{ component: 'div' }}
                  />
                </ListItemButton>
              );
            })}
          </List>
        </Paper>
      ) : (
        <Alert severity="success">No tasks due soon or overdue. Great job!</Alert>
      )}

        {/* --- (Optional) Link ไปยัง Dashboard หลัก --- */}
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
             <Button component={RouterLink} to="/dashboard" variant="outlined">
                 View Full Dashboard
             </Button>
         </Box>

    </Container>
  );
}

export default Home;