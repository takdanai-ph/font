// src/NotificationsPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container, Typography, Box, Paper, List, ListItem, // <<< แก้ไข: เพิ่ม ListItem เข้ามา
    ListItemText, ListItemIcon, CircularProgress, Divider,
    IconButton, Tooltip, Pagination, ListItemButton
} from '@mui/material';
import Alert from '@mui/material/Alert';
import { formatDistanceToNowStrict } from 'date-fns';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CircleNotificationsIcon from '@mui/icons-material/CircleNotifications';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import Swal from 'sweetalert2';

// --- Helper Functions ---
const formatNotificationTime = (dateString) => {
    try {
        return formatDistanceToNowStrict(new Date(dateString), { addSuffix: true });
    } catch (e) { return 'Invalid date'; }
};
const getNotificationIcon = (type) => { switch (type) { case 'task_assigned': return <TaskAltIcon fontSize="inherit" color="primary" />; case 'task_due_soon': case 'task_overdue': return <EventBusyIcon fontSize="inherit" color="warning"/>; default: return <CircleNotificationsIcon fontSize="inherit" color="action"/>; } };
// ---------------------------------------------

const NOTIFICATIONS_PER_PAGE = 15;

function NotificationsPage() {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';
    const baseUrl = process.env.REACT_APP_API_BASE_URL || 'https://back-takdanai.up.railway.app';
    const token = localStorage.getItem('token');

    // --- Function ดึง Notifications (รองรับ Pagination) ---
    const fetchNotifications = useCallback(async (currentPage = 1) => {
        if (!token) { setError("Authentication required."); setLoading(false); return; }
        setLoading(true);
        setError(null);

        const apiUrl = `${baseUrl}/api/notifications?page=${currentPage}&limit=${NOTIFICATIONS_PER_PAGE}&sort=-createdAt`;
        const myHeaders = new Headers({ "Authorization": `Bearer ${token}` });
        const requestOptions = { method: "GET", headers: myHeaders, redirect: "follow" };

        try {
            const response = await fetch(apiUrl, requestOptions);
            if (!response.ok) { throw new Error(`Failed: ${response.status}`); }
            const data = await response.json();

            if (data && Array.isArray(data.notifications)) {
                setNotifications(data.notifications);
                setPage(data.currentPage || 1);
                setTotalPages(data.totalPages || 1);
            } else {
                setNotifications([]); setPage(1); setTotalPages(1);
            }
        } catch (fetchError) {
            console.error("Fetch notifications page error:", fetchError);
            setError(fetchError.message);
            setNotifications([]); setPage(1); setTotalPages(1);
        } finally {
            setLoading(false);
        }
    }, [baseUrl, token]);

    // --- useEffect: โหลดข้อมูลเมื่อ Page เปลี่ยน ---
    useEffect(() => {
        fetchNotifications(page);
    }, [page, fetchNotifications]);

    // --- Handler: เปลี่ยนหน้า Pagination ---
    const handlePageChange = (event, value) => {
        setPage(value);
    };

    // --- Handler: Mark as Read ---
    const handleMarkAsRead = useCallback(async (notificationId) => { // <<< ใส่ useCallback
        if (!token) return;
        const markReadUrl = `${baseUrl}/api/notifications/${notificationId}/read`;
        // ใช้ PATCH หรือ PUT ตามที่ Backend กำหนด (ใน routes คือ PATCH)
        const patchHeaders = new Headers({ "Authorization": `Bearer ${token}` });
        const patchOptions = { method: "PATCH", headers: patchHeaders };
        try {
            const res = await fetch(markReadUrl, patchOptions);
            if (!res.ok) throw new Error('Failed to mark as read');
            // อัปเดต State ทันทีเพื่อ UI ที่ดีขึ้น (Optional แต่แนะนำ)
            setNotifications(prev => prev.map(n =>
                n._id === notificationId ? { ...n, notification_status: 'read' } : n
            ));
            // อาจจะไม่ต้อง fetch ใหม่ ถ้า update state แล้ว
            // fetchNotifications(page);
        } catch (err) {
            console.error("Error marking notification as read:", err);
        }
    }, [baseUrl, token, page]); // <<< เพิ่ม page ใน dependencies ถ้า fetch ใหม่

    // --- Handler: Delete Notification ---
    const handleDeleteNotification = useCallback((notificationId, message) => { // <<< ใส่ useCallback
        Swal.fire({
            title: 'Delete Notification?',
            text: `"${message}" will be permanently deleted.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        }).then(async (result) => {
            if (result.isConfirmed && token) {
                const deleteUrl = `${baseUrl}/api/notifications/${notificationId}`;
                const deleteHeaders = new Headers({ "Authorization": `Bearer ${token}` });
                const deleteOptions = { method: "DELETE", headers: deleteHeaders };
                try {
                     const res = await fetch(deleteUrl, deleteOptions);
                    if (!res.ok) throw new Error('Failed to delete');
                    Swal.fire('Deleted!', 'Notification has been deleted.', 'success');
                    // โหลดข้อมูลใหม่เพื่อให้ Pagination ถูกต้องเสมอหลังการลบ
                    fetchNotifications(page);
                } catch (err) {
                     console.error("Error deleting notification:", err);
                     Swal.fire('Error!', 'Could not delete notification.', 'error');
                }
            }
        });
    }, [baseUrl, token, page, fetchNotifications]); // <<< เพิ่ม dependencies

    // --- Handler: คลิกที่ Notification Item ---
    const handleNotificationClick = useCallback((notification) => {
        // Mark as read ก่อน ถ้ายังไม่อ่าน
        if (notification.notification_status === 'unread') {
            handleMarkAsRead(notification._id); // เรียกใช้ handler ที่สร้างไว้
        }
        // Navigate ถ้ามี link
        if (notification.task && notification.task._id) {
            navigate(`/task/${notification.task._id}`);
        } else if (notification.link) {
            // อาจจะต้องจัดการ link ภายนอก หรือ path อื่นๆ เพิ่มเติม
             console.log("Navigate to link (implement navigation):", notification.link);
             // ตัวอย่าง: navigate(notification.link); (ถ้า link เป็น internal path)
        }
    }, [navigate, handleMarkAsRead]); // <<< เพิ่ม dependencies


    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <NotificationsIcon sx={{ mr: 1.5, fontSize: '2rem', color: 'primary.main' }} />
                <Typography variant="h4" component="h1">All Notifications</Typography>
            </Box>

            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}> <CircularProgress /> </Box>
            )}
            {error && !loading && (
                <Alert severity="error" sx={{ mb: 2 }}>Error loading notifications: {error}</Alert>
            )}
            {!loading && !error && notifications.length === 0 && (
                <Alert severity="info" sx={{ mb: 2 }}>You have no notifications.</Alert>
            )}

            {!loading && !error && notifications.length > 0 && (
                <Paper sx={{ mb: 3 }}>
                    <List disablePadding>
                        {notifications.map((notification, index) => (
                            <React.Fragment key={notification._id}>
                            <ListItem
                                disablePadding
                                secondaryAction={
                                    <Box>
                                        {notification.notification_status === 'unread' && (
                                            <Tooltip title="Mark as Read">
                                                <IconButton edge="end" aria-label="mark as read" onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notification._id); }}>
                                                    <CheckCircleIcon fontSize='small' />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                        <Tooltip title="Delete">
                                            <IconButton edge="end" aria-label="delete" sx={{ ml: notification.notification_status === 'unread' ? 1 : 0 }} onClick={(e) => { e.stopPropagation(); handleDeleteNotification(notification._id, notification.message); }}>
                                                 <DeleteIcon fontSize='small' color='error'/>
                                             </IconButton>
                                         </Tooltip>
                                     </Box>
                                }
                                sx={{ bgcolor: notification.notification_status === 'unread' ? 'action.hover' : 'inherit' }}
                            >
                                <ListItemButton
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <ListItemIcon sx={{ minWidth: 'auto', mr: 1.5, alignSelf: 'flex-start', mt: 1 }}>
                                        {getNotificationIcon(notification.notification_type)}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={notification.message}
                                        secondary={formatNotificationTime(notification.createdAt)}
                                        primaryTypographyProps={{ sx: { fontWeight: notification.notification_status === 'unread' ? 'bold' : 'normal' } }}
                                    />
                                </ListItemButton>
                            </ListItem>
                            {/* Divider อยู่ภายใน Fragment แต่เป็นพี่น้องกับ ListItem */}
                            {index < notifications.length - 1 && <Divider component="li" />} {/* เพิ่ม component="li" ให้ Divider ถ้าต้องการ Semantic ที่ดีขึ้นใน List */}
                        </React.Fragment> // <<< ปิด Fragment >>>
                    ))}
                    </List>
                </Paper>
            )}

            {/* --- Pagination --- */}
            {totalPages > 1 && !loading && (
                 <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                    <Pagination
                        count={totalPages}
                        page={page}
                        onChange={handlePageChange}
                        color="primary"
                    />
                </Box>
            )}

        </Container>
    );
}

export default NotificationsPage;