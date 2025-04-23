// src/TaskDetailPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // Link as RouterLink ไม่ได้ใช้ ลบออกได้
import {
    Container, Typography, Box, Paper, Chip, CircularProgress, Alert,
    Button, Divider, Tooltip, Stack // <<< เพิ่ม Stack สำหรับจัดกลุ่มปุ่ม
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import GroupIcon from '@mui/icons-material/Group';
import TagIcon from '@mui/icons-material/Tag';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AccessTimeFilledIcon from '@mui/icons-material/AccessTimeFilled';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import SyncIcon from '@mui/icons-material/Sync';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'; // ไอคอนรออนุมัติ

import { formatDate, isOverdue } from './utils/dateUtils'; // [cite: 1] อ้างอิง utils ที่ใช้
// import { useAuth } from './AuthContext'; // <<< สมมติว่าคุณมี Auth Context แบบนี้

// Function แสดง Status พร้อมไอคอนและสี (ปรับปรุงให้รับ task object)
const renderStatus = (task) => { // <<< รับ task ทั้ง object
    if (!task) return null; // กันพลาดถ้า task เป็น null

    const { status, needsCompletionApproval } = task; // ดึง field ที่ต้องการใช้

    let icon = <PendingIcon />;
    let color = 'default'; // สี default สำหรับ Pending
    let label = status;

    if (status === 'In Progress') {
        icon = <SyncIcon />;
        color = 'info';
    } else if (status === 'Completed') {
        if (needsCompletionApproval) { // <<< เงื่อนไขเช็คการรออนุมัติ
            icon = <HourglassEmptyIcon />;
            color = 'warning'; // สีส้มสำหรับรออนุมัติ
            label = 'Pending Approval'; // เปลี่ยน Label ให้ชัดเจน
            return ( // ใช้ Tooltip หุ้ม
                <Tooltip title="Waiting for approval from Admin/Manager">
                    <Chip icon={icon} label={label} color={color} size="small" />
                </Tooltip>
            );
        } else {
            icon = <CheckCircleIcon />;
            color = 'success'; // สีเขียวเมื่อ Approve แล้ว
        }
    } // สามารถเพิ่ม else if สำหรับ status อื่นๆ ได้

    // ถ้าไม่ใช่ Completed ที่รอ Approve ก็แสดง Chip ปกติ
    return <Chip icon={icon} label={label} color={color} size="small" />;
};


function TaskDetailPage() {
    const { taskId } = useParams();
    const navigate = useNavigate();
    const [taskDetails, setTaskDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false); // <<< State สำหรับ disable ปุ่มตอนโหลด

    // --- สมมติว่าดึงข้อมูล User และ Role มาแบบนี้ ---
    // const { user } = useAuth(); // จาก Context
    // หรืออ่านจาก localStorage ชั่วคราว (ไม่แนะนำสำหรับ Production)
    const user = { // <<< ** ใช้ข้อมูล user จริงจากระบบ auth ของคุณ **
         _id: localStorage.getItem('userId'), // สมมติว่าเก็บ userId
         role: localStorage.getItem('userRole') || 'User' // อ่าน Role, ถ้าไม่มีให้เป็น User
    };
    // ---------------------------------------------

    const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';
    // const baseUrl = process.env.REACT_APP_API_BASE_URL || 'https://back-takdanai.up.railway.app';
    const token = localStorage.getItem('token');

    // --- Function ดึงข้อมูล Task Detail (เหมือนเดิม) ---
    const fetchTaskDetails = useCallback(async () => {
        // ... (โค้ด fetchTaskDetails เดิม ไม่ต้องแก้) ... [cite: 1]
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
            // --- ตรวจสอบ Response จาก Backend ---
            if (typeof data === 'object' && data !== null) { // ตรวจสอบว่าเป็น Object
                 setTaskDetails(data.data ? data.data : data); // Backend บางทีอาจจะหุ้มด้วย { success: true, data: ... }
            } else {
                 throw new Error("Invalid data format received from server.");
            }
            // setTaskDetails(data); // แก้ไข: เช็ค data structure ก่อน
        } catch (err) {
            console.error("Fetch Task Detail Error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [baseUrl, token, taskId]);

    useEffect(() => {
        fetchTaskDetails();
    }, [fetchTaskDetails]);

    // --- Function Approve Task ---
    const handleApprove = async () => {
        if (!taskDetails || isUpdating) return;
        setIsUpdating(true);
        setError(null); // เคลียร์ Error เก่า
        const apiUrl = `${baseUrl}/api/tasks/${taskDetails._id}`;
        const myHeaders = new Headers({
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json" // ต้องใส่ Content-Type
        });

        try {
            const response = await fetch(apiUrl, {
                method: "PUT",
                headers: myHeaders,
                body: JSON.stringify({ status: 'Completed' }), // ส่ง status Completed เพื่อ Approve
                redirect: "follow"
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({ message: 'Unknown error' }));
                throw new Error(`Failed to approve task: ${response.status} ${errData.message || ''}`);
            }
            // const updatedTask = await response.json(); // รับข้อมูลที่อัปเดตแล้ว
            // setTaskDetails(updatedTask.data ? updatedTask.data : updatedTask); // อัปเดต State
            // --- หรือเรียก fetch ใหม่เพื่อข้อมูลล่าสุด ---
            await fetchTaskDetails();
            // อาจจะแสดง Success message
        } catch (err) {
            console.error("Approve Task Error:", err);
            setError(`Approval failed: ${err.message}`); // แสดง Error
        } finally {
            setIsUpdating(false);
        }
    };

    // --- Function Reject Task ---
    const handleReject = async () => {
        if (!taskDetails || isUpdating) return;
        // --- กำหนดสถานะที่จะ Reject ไป (เช่น Pending) ---
        const rejectStatus = 'Pending';
        // --------------------------------------------
        setIsUpdating(true);
        setError(null);
        const apiUrl = `${baseUrl}/api/tasks/${taskDetails._id}`;
        const myHeaders = new Headers({
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        });

        try {
            const response = await fetch(apiUrl, {
                method: "PUT",
                headers: myHeaders,
                body: JSON.stringify({ status: rejectStatus }), // ส่ง status ที่ต้องการ Reject ไป
                redirect: "follow"
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({ message: 'Unknown error' }));
                throw new Error(`Failed to reject task: ${response.status} ${errData.message || ''}`);
            }
            // const updatedTask = await response.json();
            // setTaskDetails(updatedTask.data ? updatedTask.data : updatedTask); // อัปเดต State
            // --- หรือเรียก fetch ใหม่ ---
            await fetchTaskDetails();
            // อาจจะแสดง Success message
        } catch (err) {
            console.error("Reject Task Error:", err);
            setError(`Rejection failed: ${err.message}`);
        } finally {
            setIsUpdating(false);
        }
    };


    // --- แสดง Loading / Error (เหมือนเดิม) ---
     if (loading) return ( <Container maxWidth="md" sx={{ mt: 4, mb: 4, textAlign: 'center' }}> <CircularProgress /> </Container> );
     if (error && !taskDetails) return ( <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}> <Alert severity="error">Error: {error}</Alert> </Container> );
     if (!taskDetails) return ( <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}> <Alert severity="warning">Could not load task details.</Alert> </Container> );


    // --- ตัวแปรช่วยแสดงผล (เหมือนเดิม) ---
    const assignee = taskDetails.assignee_id;
    const team = taskDetails.team_id;
    const taskIsOverdue = isOverdue(taskDetails.dueDate);


    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            {/* ปุ่มย้อนกลับ (เหมือนเดิม) */}
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
                Back
            </Button>

            {/* แสดง Error ที่อาจเกิดขึ้นระหว่าง Approve/Reject */}
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Paper sx={{ p: 3 }}>
                {/* --- ส่วนหัว: Title และ Description (เหมือนเดิม) --- */}
                <Box sx={{ mb: 2 }}>
                    <Typography variant="h4" component="h1" gutterBottom sx={{ wordBreak: 'break-word' }}>
                        {taskDetails.title}
                    </Typography>
                    <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-wrap', color: 'text.secondary', mt: 1 }}>
                         {taskDetails.description || <Typography component="em">No description provided.</Typography>}
                    </Typography>
                </Box>

                <Divider sx={{ mb: 3 }}/>

                {/* --- ส่วนแสดงรายละเอียดอื่นๆ --- */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {/* Status */}
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="subtitle2" sx={{ minWidth: 100 }}>Status:</Typography>
                        {/* <<< เรียก renderStatus ที่แก้ไขแล้ว >>> */}
                        {renderStatus(taskDetails)}
                    </Box>

                    {/* <<< ส่วนปุ่ม Approve/Reject >>> */}
                    {user && (user.role === 'Admin' || user.role === 'Manager') && taskDetails.needsCompletionApproval && (
                        <Box sx={{ pl: '100px', pt: 1 }}> {/* จัดเยื้องให้ตรงกับค่า Status */}
                             <Typography variant="caption" display="block" sx={{ mb: 1, color: 'warning.main' }}>
                                This task is awaiting your approval.
                             </Typography>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}> {/* Responsive stack */}
                                <Button
                                    variant="contained"
                                    color="success"
                                    startIcon={<CheckCircleIcon />}
                                    onClick={handleApprove}
                                    disabled={isUpdating} // Disable ตอนกำลังโหลด
                                    size="small"
                                >
                                    Approve Completion
                                </Button>
                                <Button
                                    variant="outlined"
                                    color="error"
                                     startIcon={<PendingIcon />} // ใช้ไอคอน Pending หรือ Cancel ก็ได้
                                    onClick={handleReject}
                                    disabled={isUpdating} // Disable ตอนกำลังโหลด
                                    size="small"
                                >
                                    Reject (Set to Pending)
                                </Button>
                            </Stack>
                         </Box>
                    )}
                    {/* ------------------------------ */}

                    {/* Due Date (เหมือนเดิม) */}
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                         {/* ... โค้ด Due Date เดิม ... */}
                        <Typography variant="subtitle2" sx={{ minWidth: 100 }}>Due Date:</Typography>
                        <Typography variant="body2" color={taskIsOverdue ? 'error' : 'text.primary'} sx={{ display: 'inline-flex', alignItems: 'center' }}>
                            <CalendarMonthIcon sx={{ fontSize: '1rem', mr: 0.5 }} />
                            {formatDate(taskDetails.dueDate)}
                            {taskIsOverdue && <ErrorOutlineIcon color="error" sx={{ fontSize: '1rem', ml: 0.5 }}/>}
                        </Typography>
                    </Box>
                    {/* Assignee (เหมือนเดิม) */}
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                         {/* ... โค้ด Assignee เดิม ... */}
                        <Typography variant="subtitle2" sx={{ minWidth: 100 }}>Assignee:</Typography>
                        {assignee ? ( <Typography variant="body2" sx={{ display: 'inline-flex', alignItems: 'center' }}> <PersonIcon sx={{ fontSize: '1rem', mr: 0.5 }} /> {`${assignee.fname || ''} ${assignee.lname || ''}`.trim() || assignee.username} </Typography> ) : ( <Typography variant="body2" color="text.secondary">Unassigned</Typography> )}
                    </Box>
                    {/* Team (เหมือนเดิม) */}
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {/* ... โค้ด Team เดิม ... */}
                        <Typography variant="subtitle2" sx={{ minWidth: 100 }}>Team:</Typography>
                         {team ? ( <Typography variant="body2" sx={{ display: 'inline-flex', alignItems: 'center' }}> <GroupIcon sx={{ fontSize: '1rem', mr: 0.5 }} /> {team.name} </Typography> ) : ( <Typography variant="body2" color="text.secondary">No Team</Typography> )}
                    </Box>
                    {/* Tags (เหมือนเดิม) */}
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap', gap: 0.5 }}>
                        {/* ... โค้ด Tags เดิม ... */}
                        <Typography variant="subtitle2" sx={{ minWidth: 100, mt: 0.5 }}>Tags:</Typography>
                        {taskDetails.tags && taskDetails.tags.length > 0 ? (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {taskDetails.tags.map((tag, index) => ( <Chip key={index} label={tag} size="small" variant="outlined" icon={<TagIcon fontSize='small'/>}/> ))}
                            </Box>
                        ) : ( <Typography variant="body2" color="text.secondary" sx={{mt: 0.5}}>No Tags</Typography> )}
                    </Box>
                    {/* Timestamps (เหมือนเดิม) */}
                    <Divider sx={{ pt: 1 }}/>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                         {/* ... โค้ด Timestamps เดิม ... */}
                        <Typography variant="caption" sx={{ minWidth: 100 }}>Created:</Typography>
                         <Typography variant="caption" color="text.secondary"> <AccessTimeFilledIcon sx={{ fontSize: '0.8rem', mr: 0.5, verticalAlign: 'text-bottom' }} /> {formatDate(taskDetails.createdAt, true)} </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                         {/* ... โค้ด Timestamps เดิม ... */}
                        <Typography variant="caption" sx={{ minWidth: 100 }}>Updated:</Typography>
                         <Typography variant="caption" color="text.secondary"> <AccessTimeFilledIcon sx={{ fontSize: '0.8rem', mr: 0.5, verticalAlign: 'text-bottom' }} /> {formatDate(taskDetails.updatedAt, true)} </Typography>
                    </Box>
                </Box>

            </Paper>
        </Container>
    );
}

export default TaskDetailPage;