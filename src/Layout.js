// src/Layout.js
import React, { useState, useEffect, useCallback } from 'react';
// <<< ตรวจสอบ Import นี้ให้แน่ใจว่ามี Link และไม่มี as RouterLink >>>
import { Outlet, useNavigate, Link, NavLink } from 'react-router-dom';
import {
    Box, Drawer, AppBar, Toolbar, List, Typography, Divider, ListItem,
    ListItemButton, ListItemIcon, ListItemText, Button, IconButton, Badge,
    Menu, MenuItem, CircularProgress, Tooltip
} from '@mui/material';
import { formatDistanceToNowStrict } from 'date-fns'; // <<< อย่าลืม npm install date-fns

// --- Import Icons ---
import HomeIcon from '@mui/icons-material/Home';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import GroupsIcon from '@mui/icons-material/Groups';
import LogoutIcon from '@mui/icons-material/Logout';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CircleNotificationsIcon from '@mui/icons-material/CircleNotifications';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const drawerWidth = 240;

// --- Helper Functions ---
const formatNotificationTime = (dateString) => { /* ... */ try { return formatDistanceToNowStrict(new Date(dateString), { addSuffix: true }); } catch (e) { return 'Invalid date'; } };
const getNotificationIcon = (type) => { /* ... */ switch (type) { case 'task_assigned': return <TaskAltIcon fontSize="small" sx={{ mr: 1.5 }} color="primary" />; case 'task_due_soon': case 'task_overdue': return <EventBusyIcon fontSize="small" sx={{ mr: 1.5 }} color="warning"/>; default: return <CircleNotificationsIcon fontSize="small" sx={{ mr: 1.5 }} color="action"/>; } };

export default function Layout() {
  const navigate = useNavigate();
  const userRole = localStorage.getItem('userRole');
  const token = localStorage.getItem('token');
  const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';
  // const baseUrl = process.env.REACT_APP_API_BASE_URL || 'https://back-takdanai.up.railway.app';

  // --- State ---
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  // --- Functions (fetchNotifications, handle..., etc.) ---
  const fetchNotifications = useCallback(async () => {
     // --- เพิ่ม Log จุดที่ 1: บอกว่าฟังก์ชันเริ่มทำงาน ---
    // console.log("fetchNotifications: Starting fetch...");

    if (!token) {
        // console.error("fetchNotifications: No token found."); // Log เพิ่มเติมกรณีไม่มี token
        setFetchError("Authentication required."); // ควรตั้งค่า Error ด้วย
        setLoadingNotifications(false); // หยุด loading
        return;
    }
    setLoadingNotifications(true);
    setFetchError(null); // เคลียร์ error เก่าก่อนเริ่ม

    const apiUrl = `${baseUrl}/api/notifications?limit=20&sort=-createdAt`; // อาจจะเพิ่ม limit ถ้าต้องการดูมากขึ้นใน dropdown
    const myHeaders = new Headers({ "Authorization": `Bearer ${token}` });
    const requestOptions = { method: "GET", headers: myHeaders, redirect: "follow" };

    try {
        const response = await fetch(apiUrl, requestOptions);
        // --- เพิ่ม Log จุดที่ 2: ดูสถานะการตอบกลับจาก API ---
        // console.log("fetchNotifications: API Response Status:", response.status);

        if (!response.ok) {
            // ลองอ่าน text หรือ json ถ้ามี error message จาก backend
            let errorBody = await response.text();
            try { errorBody = JSON.parse(errorBody); } catch (e) {} // พยายาม parse เป็น JSON
            // console.error("fetchNotifications: API Error Response Body:", errorBody);
            throw new Error(`Failed to fetch notifications: ${response.status} - ${errorBody?.message || response.statusText}`);
        }

        const data = await response.json();

        // --- เพิ่ม Log จุดที่ 3: ดูข้อมูลที่ได้รับจาก API ---
        // console.log("fetchNotifications: Data received from API:", data);

        // ตรวจสอบโครงสร้างข้อมูลที่ได้รับก่อน set state
        if (data && Array.isArray(data.notifications)) {
             setNotifications(data.notifications);
             // ถ้า API ส่ง unreadCount มาด้วย ก็ใช้ค่านั้น
             // หาก API ไม่ได้ส่ง unreadCount มา ต้องคำนวณเอง
             const currentUnreadCount = data.unreadCount !== undefined
                 ? data.unreadCount
                 : data.notifications.filter(n => n.notification_status === 'unread').length;
             setUnreadCount(currentUnreadCount);
            //  console.log("fetchNotifications: Setting notifications count:", data.notifications.length, "Unread count:", currentUnreadCount);
        } else {
            //  console.warn("fetchNotifications: Received unexpected data structure:", data);
             setNotifications([]);
             setUnreadCount(0);
        }

    } catch (error) {
        // --- เพิ่ม Log จุดที่ 4: ดู Error ที่เกิดขึ้น ---
        // console.error("fetchNotifications: Error occurred:", error);
        setFetchError(error.message || 'An error occurred while fetching notifications.');
        // เคลียร์ข้อมูลเก่าเมื่อเกิด Error อาจจะดีกว่าปล่อยค้างไว้
        setNotifications([]);
        setUnreadCount(0);
    } finally {
        setLoadingNotifications(false);
        //  console.log("fetchNotifications: Fetch finished."); // Log บอกว่าจบการทำงาน
    }
 
  }, [baseUrl, token]);
  useEffect(() => { fetchNotifications(); const intervalId = setInterval(fetchNotifications, 10000); return () => clearInterval(intervalId); }, [fetchNotifications]);
  const handleNotificationClick = (event) => { 
      // console.log("Notification icon clicked, setting anchorEl:", event.currentTarget);
      setAnchorEl(event.currentTarget); 
      // markNotificationsAsRead();
    };
  const handleNotificationClose = () => { setAnchorEl(null); /* fetchNotifications(); */ };
  const handleMenuItemClick = async (notification) => {
    // ไม่ต้องปิดเมนูที่นี่แล้ว ถ้าจะ navigate
    // handleNotificationClose();
    if (notification.notification_status === 'unread' && token) {
        // ควรมีการ mark as read เฉพาะรายการนี้
        // await markSpecificNotificationAsRead(notification._id); // สมมติว่ามีฟังก์ชันนี้
        // แล้วค่อย fetch ใหม่ หรือ update state เอง
         fetchNotifications(); // Fetch ใหม่เพื่อ update badge count
    }
    // Navigate
    if (notification.task && notification.task._id) {
        navigate(`/task/${notification.task._id}`);
        setAnchorEl(null); // ปิดเมนูหลัง navigate
    } else if (notification.link) {
        // console.log("Navigate to link:", notification.link);
        // navigate(notification.link); // ถ้า link เป็น internal route
        setAnchorEl(null); // ปิดเมนูหลัง navigate
    } else {
        // ถ้าไม่มี link หรือ task ก็แค่ปิดเมนู
        setAnchorEl(null);
    }
 };

 const handleViewAllClick = () => {
  handleNotificationClose(); // ปิดเมนูก่อน
  navigate('/notifications'); // แล้วค่อย navigate
}

  const handleLogout = () => { localStorage.removeItem('token'); localStorage.removeItem('userRole'); navigate('/login', { replace: true }); console.log("Logged out."); };

  // --- Menu Items Array ---
  const activeStyle = { backgroundColor: 'rgba(0, 0, 0, 0.08)', };
  const menuItems = [
      { text: 'My Work', path: '/home', icon: <HomeIcon />, adminOnly: false, adminOrManagerOnly: false },
      { text: 'Dashboard', path: '/dashboard', icon: <DashboardIcon />, adminOnly: false, adminOrManagerOnly: false },
      { text: 'Your Team', path: '/your-team', icon: <GroupsIcon />, adminOnly: false, adminOrManagerOnly: false },
      { text: 'User List', path: '/user-list', icon: <PeopleIcon />, adminOnly: true, adminOrManagerOnly: false },
      { text: 'Team Management', path: '/team-management', icon: <GroupAddIcon />, adminOnly: false, adminOrManagerOnly: true }, // <<< แก้ property ซ้ำซ้อน (ถ้ายังไม่ได้แก้)
      { text: 'Create User', path: '/create-account', icon: <AddCircleOutlineIcon />, adminOnly: true, adminOrManagerOnly: false },
  ];

  const open = Boolean(anchorEl);

  // console.log("Current anchorEl state:", anchorEl); // <<< เพิ่ม log นี้ก่อน return
  // console.log("Notifications state:", notifications); // <<< เพิ่ม log นี้ด้วย
  // console.log("Is Menu open?", Boolean(anchorEl)); // <<< เพิ่ม log นี้

  return (
    <Box sx={{ display: 'flex' }}>
      {/* AppBar */}
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }} >
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}> Task Management </Typography>
          <Tooltip title="Notifications">
              <IconButton size="large" aria-label={`show ${unreadCount} new notifications`} color="inherit" onClick={handleNotificationClick} aria-controls={open ? 'notifications-menu' : undefined} aria-haspopup="true" aria-expanded={open ? 'true' : undefined} >
                <Badge badgeContent={unreadCount} color="error"> <NotificationsIcon /> </Badge>
              </IconButton>
          </Tooltip>
          <Button color="inherit" onClick={handleLogout} startIcon={<LogoutIcon />}> Logout </Button>
        </Toolbar>
      </AppBar>

      {/* Notification Menu */}
      <Menu 
        id="notifications-menu" 
        anchorEl={anchorEl} 
        open={Boolean(anchorEl)}
        onClose={handleNotificationClose} 
        MenuListProps={{ 'aria-labelledby': 'notification-button', }} 
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} 
        transformOrigin={{ vertical: 'top', horizontal: 'right' }} 
        PaperProps={{ sx: { mt: 1.5, maxHeight: 400, width: '350px', 
        overflow: 'auto', '& .MuiMenuItem-root': { whiteSpace: 'normal', 
        alignItems: 'flex-start', }, }, }} >

         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pl: 2, pr: 1, pt:1, pb:1 }}>
              <Typography variant='subtitle1' sx={{fontWeight: 'bold'}}>Notifications</Typography>

              <Button
                     component={Link} // ใช้ Link จาก react-router-dom
                     to="/notifications"
                     onClick={handleViewAllClick} // ใช้ handler แยกเพื่อปิดเมนูก่อน
                     size="small"
                     sx={{ textTransform: 'none' }} // ทำให้ตัวหนังสือไม่เป็นตัวใหญ่หมด
                 >
                     View All
                 </Button>
               {loadingNotifications && <CircularProgress size={20}/>}
               {fetchError && <Tooltip title={fetchError}><ErrorOutlineIcon color="error" fontSize="small"/></Tooltip>}
         </Box>
         <Divider/>
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <MenuItem key={notification._id} onClick={() => handleMenuItemClick(notification)} sx={{ bgcolor: notification.notification_status === 'unread' ? 'action.hover' : 'inherit', }} >
                <ListItemIcon sx={{ minWidth: 'auto' }}> {getNotificationIcon(notification.notification_type)} </ListItemIcon>
                <ListItemText primary={notification.message} secondary={formatNotificationTime(notification.createdAt)} primaryTypographyProps={{ sx: { fontWeight: notification.notification_status === 'unread' ? 'bold' : 'normal' } }} />
                 {notification.notification_status === 'unread' && ( <Box sx={{ width: 8, height: 8, bgcolor: 'primary.main', borderRadius: '50%', ml: 1, flexShrink: 0 }} /> )}
            </MenuItem>
          ))
        ) : (
           <MenuItem onClick={handleNotificationClose} disabled> <ListItemText primary="No new notifications" sx={{textAlign: 'center', color:'text.secondary'}}/> </MenuItem>
        )}
         <Divider/>
         {/* <<< แก้ไขตรงนี้ ใช้ component={Link} >>> */}
         <MenuItem component={Link} to="/notifications" onClick={handleNotificationClose}>
             <ListItemText primary="View All Notifications" sx={{textAlign: 'center'}} primaryTypographyProps={{variant: 'body2', color:'primary'}}/>
         </MenuItem>
      </Menu>

      {/* Drawer (Sidebar) */}
      <Drawer sx={{ width: drawerWidth, flexShrink: 0, '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box', }, }} variant="permanent" anchor="left" >
        <Toolbar /> <Divider />
        <List>
          {/* --- ส่วนแสดง Sidebar Menu Items --- */}
          {menuItems.map((item) => {
                let showItem = false;
                if (!item.adminOnly && !item.adminOrManagerOnly) { showItem = true; }
                else if (item.adminOnly && userRole === 'Admin') { showItem = true; }
                else if (item.adminOrManagerOnly && (userRole === 'Admin' || userRole === 'Manager')) { showItem = true; }

                // ใช้ NavLink เพื่อให้มี Active State Styling
                return showItem && (
                  <ListItem key={item.text} disablePadding>
                    <NavLink
                      to={item.path}
                      style={({ isActive }) => ({
                        textDecoration: 'none',
                        color: 'inherit',
                        display: 'block',
                        width: '100%',
                        ...(isActive ? activeStyle : undefined) // ใช้ activeStyle ที่กำหนดไว้
                      })}
                    >
                     <ListItemButton>
                       <ListItemIcon> {item.icon} </ListItemIcon>
                       <ListItemText primary={item.text} />
                      </ListItemButton>
                    </NavLink>
                  </ListItem>
                );
            })}
        </List>
        <Divider />
      </Drawer>

      {/* Content */}
      <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default', p: 3, mt: 8 }} >
        <Outlet />
      </Box>
    </Box>
  );
}