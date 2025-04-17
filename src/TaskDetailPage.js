// src/TaskDetailPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom'; // <<< Import useParams, useNavigate
import {
    Container, Typography, Box, Paper, Chip, CircularProgress, Alert, Grid,
    Button, Divider, Link // <<< เพิ่ม Button, Divider, Link
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
// import EditIcon from '@mui/icons-material/Edit';
import PersonIcon from '@mui/icons-material/Person';
import GroupIcon from '@mui/icons-material/Group';
import TagIcon from '@mui/icons-material/Tag';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AccessTimeFilledIcon from '@mui/icons-material/AccessTimeFilled'; // ไอคอนเวลาสร้าง/อัปเดต
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import SyncIcon from '@mui/icons-material/Sync';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

import { formatDate, isOverdue } from './utils/dateUtils';;

// Function แสดง Status พร้อมไอคอนและสี
const renderStatus = (status) => {
    let icon = <PendingIcon />;
    let color = 'warning';
    if (status === 'In Progress') { icon = <SyncIcon />; color = 'info'; }
    else if (status === 'Completed') { icon = <CheckCircleIcon />; color = 'success'; }

    return <Chip icon={icon} label={status} color={color} size="small" />;
};

function TaskDetailPage() {
    const { taskId } = useParams();
    const navigate = useNavigate();
    const [taskDetails, setTaskDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // const [userRole, setUserRole] = useState(localStorage.getItem('userRole'));

    // const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';
    const baseUrl = process.env.REACT_APP_API_BASE_URL || 'https://back-takdanai.up.railway.app';
    const token = localStorage.getItem('token');

    // --- Function ดึงข้อมูล Task Detail ---
    const fetchTaskDetails = useCallback(async () => {
        setLoading(true);
        setError(null);

        if (!token) { setError("Authentication required."); setLoading(false); return; }
        if (!taskId) { setError("Task ID not found in URL."); setLoading(false); return; }

        const apiUrl = `${baseUrl}/api/tasks/${taskId}`;
        const myHeaders = new Headers({ "Authorization": `Bearer ${token}` });
        const requestOptions = { method: "GET", headers: myHeaders, redirect: "follow" };

        try {
            const response = await fetch(apiUrl, requestOptions);
            if (!response.ok) {
                if (response.status === 404) throw new Error("Task not found.");
                if (response.status === 403) throw new Error("Forbidden: You don't have permission to view this task.");
                 const errData = await response.json().catch(() => ({}));
                 throw new Error(`Failed to fetch task: ${response.status} ${errData.message || ''}`);
            }
            const data = await response.json();
            setTaskDetails(data);
        } catch (err) {
            console.error("Fetch Task Detail Error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [baseUrl, token, taskId]);

    // --- useEffect เรียก Fetch ตอนเริ่ม หรือ taskId เปลี่ยน ---
    useEffect(() => {
        fetchTaskDetails();
    }, [fetchTaskDetails]);

    // --- แสดง Loading / Error ---
    if (loading) { /* ... Loading ... */ }
    if (error) { /* ... Error ... */ }
    if (!taskDetails) { // กรณีโหลดเสร็จแต่ไม่มีข้อมูล (อาจจะ Error หรือ 404)
        return ( <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}> <Alert severity="warning">Could not load task details.</Alert> </Container> );
    }

     // --- ตัวแปรช่วยแสดงผล ---
    const assignee = taskDetails.assignee_id;
    const team = taskDetails.team_id;
    // const canEdit = userRole === 'Admin' || userRole === 'Manager';
    const taskIsOverdue = isOverdue(taskDetails.dueDate); // <<< เรียกใช้ isOverdue ที่ Import มา

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
             {/* ปุ่มย้อนกลับ */}
             <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
                 Back
             </Button>

            <Paper sx={{ p: 3 }}>
                {/* --- ส่วนหัว: Title และ Description (ย้ายมา) --- */}
                <Box sx={{ mb: 2 }}> {/* <<< ใช้ Box ครอบ Title และ Description */}
                    <Typography variant="h4" component="h1" gutterBottom sx={{ wordBreak: 'break-word' }}>
                        {taskDetails.title}
                    </Typography>
                     {/* --- Description ย้ายมาอยู่ตรงนี้ --- */}
                    <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-wrap', color: 'text.secondary', mt: 1 }}>
                         {taskDetails.description || <Typography component="em">No description provided.</Typography>}
                    </Typography>
                     {/* --- ลบปุ่ม Edit ออกไป --- */}
                     {/* {canEdit && ( <Button ...>Edit</Button> )} */}
                </Box>

                <Divider sx={{ mb: 3 }}/> {/* <<< ย้าย Divider มาหลัง Description */}

                {/* --- ส่วนแสดงรายละเอียดอื่นๆ (ไม่ต้องใช้ Grid แล้ว) --- */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {/* Status */}
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="subtitle2" sx={{ minWidth: 100 }}>Status:</Typography>
                        {renderStatus(taskDetails.status)}
                    </Box>
                    {/* Due Date */}
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="subtitle2" sx={{ minWidth: 100 }}>Due Date:</Typography>
                        <Typography variant="body2" color={taskIsOverdue ? 'error' : 'text.primary'} sx={{ display: 'inline-flex', alignItems: 'center' }}>
                            <CalendarMonthIcon sx={{ fontSize: '1rem', mr: 0.5 }} />
                            {formatDate(taskDetails.dueDate)}
                            {taskIsOverdue && <ErrorOutlineIcon color="error" sx={{ fontSize: '1rem', ml: 0.5 }}/>}
                        </Typography>
                    </Box>
                    {/* Assignee */}
                     <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="subtitle2" sx={{ minWidth: 100 }}>Assignee:</Typography>
                        {assignee ? ( <Typography variant="body2" sx={{ display: 'inline-flex', alignItems: 'center' }}> <PersonIcon sx={{ fontSize: '1rem', mr: 0.5 }} /> {`${assignee.fname || ''} ${assignee.lname || ''}`.trim() || assignee.username} </Typography> ) : ( <Typography variant="body2" color="text.secondary">Unassigned</Typography> )}
                    </Box>
                    {/* Team */}
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="subtitle2" sx={{ minWidth: 100 }}>Team:</Typography>
                        {team ? ( <Typography variant="body2" sx={{ display: 'inline-flex', alignItems: 'center' }}> <GroupIcon sx={{ fontSize: '1rem', mr: 0.5 }} /> {team.name} </Typography> ) : ( <Typography variant="body2" color="text.secondary">No Team</Typography> )}
                    </Box>
                    {/* Tags */}
                     <Box sx={{ display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap', gap: 0.5 }}> {/* <<< ใช้ flex-start ให้ Tag เริ่มชิดบน */}
                        <Typography variant="subtitle2" sx={{ minWidth: 100, mt: 0.5 }}>Tags:</Typography> {/* <<< เพิ่ม mt ให้ตรงกับ Tag */}
                        {taskDetails.tags && taskDetails.tags.length > 0 ? (
                            // ใช้ Box ครอบ Chip เพื่อให้ Wrap ได้ดีขึ้น
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {taskDetails.tags.map((tag, index) => ( <Chip key={index} label={tag} size="small" variant="outlined" icon={<TagIcon fontSize='small'/>}/> ))}
                            </Box>
                        ) : ( <Typography variant="body2" color="text.secondary" sx={{mt: 0.5}}>No Tags</Typography> )}
                    </Box>
                    {/* Timestamps */}
                    <Divider sx={{ pt: 1 }}/>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ minWidth: 100 }}>Created:</Typography>
                        <Typography variant="caption" color="text.secondary"> <AccessTimeFilledIcon sx={{ fontSize: '0.8rem', mr: 0.5, verticalAlign: 'text-bottom' }} /> {formatDate(taskDetails.createdAt, true)} </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ minWidth: 100 }}>Updated:</Typography>
                        <Typography variant="caption" color="text.secondary"> <AccessTimeFilledIcon sx={{ fontSize: '0.8rem', mr: 0.5, verticalAlign: 'text-bottom' }} /> {formatDate(taskDetails.updatedAt, true)} </Typography>
                    </Box>
                 </Box>

            </Paper>
        </Container>
    );
}

export default TaskDetailPage;