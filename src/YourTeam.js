import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Typography, Box, Paper, List, ListItem, ListItemText, ListItemIcon,
  Chip, CircularProgress, Alert, Divider
} from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import PersonIcon from '@mui/icons-material/Person';
import StarIcon from '@mui/icons-material/Star';

function YourTeam() {
  const [currentUserData, setCurrentUserData] = useState(null); // <<< State เก็บข้อมูล User ที่ได้จาก /me
  const [teamDetails, setTeamDetails] = useState(null);
  const [members, setMembers] = useState([]);
  const [loadingUser, setLoadingUser] = useState(true); // <<< Loading สำหรับ /me
  const [loadingTeam, setLoadingTeam] = useState(false); // <<< Loading สำหรับ Team/Members (จะเริ่มหลังได้ User)
  const [error, setError] = useState(null);

  // const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';
  const baseUrl = process.env.REACT_APP_API_BASE_URL || 'https://back-takdanai.up.railway.app';
  const token = localStorage.getItem('token');

  const fetchCurrentUser = useCallback(async () => {
    setLoadingUser(true);
    setError(null);

    if (!token) {
      setError("Authentication token not found.");
      setLoadingUser(false);
      return;
    }

    const meApiUrl = `${baseUrl}/api/auth/me`;
    const myHeaders = new Headers({ "Authorization": `Bearer ${token}` });
    const requestOptions = { method: "GET", headers: myHeaders, redirect: "follow" };

    try {
      const response = await fetch(meApiUrl, requestOptions);
      if (!response.ok) {
          if (response.status === 401) { // Token อาจจะหมดอายุ หรือไม่ถูกต้อง
              localStorage.removeItem('token'); // ลบ token ที่อาจมีปัญหา
              // อาจจะ redirect ไปหน้า login: navigate('/login');
              throw new Error("Unauthorized. Please login again.");
          }
          const errData = await response.json().catch(() => ({}));
          throw new Error(`Failed to fetch user data: ${response.status} ${errData.message || ''}`);
      }
      const userData = await response.json();
      setCurrentUserData(userData); // <<< เก็บข้อมูล User ทั้งหมด
      // ไม่มี setError ที่นี่ถ้าสำเร็จ

    } catch (err) {
      console.error("Fetch Current User Error:", err);
      setError(err.message);
      setCurrentUserData(null); // เคลียร์ข้อมูลถ้า Error
    } finally {
      setLoadingUser(false);
    }
  }, [baseUrl, token]); // Dependency

  // --- Function ดึงข้อมูล Team และ Members ---
  const fetchTeamData = useCallback(async (teamId) => {
    if (!token || !teamId) { // ตรวจสอบ teamId ด้วย
        // setError("Cannot fetch team data without a Team ID."); // อาจจะไม่ต้องแสดงซ้ำซ้อน
        setLoadingTeam(false); // หยุด Loading ถ้าไม่มี teamId
        return;
    }

    setLoadingTeam(true); // <<< ใช้ Loading แยก
    setError(null); // เคลียร์ Error เก่า

    const teamApiUrl = `${baseUrl}/api/teams/${teamId}`;
    const membersApiUrl = `${baseUrl}/api/teams/${teamId}/members`;
    const myHeaders = new Headers({ "Authorization": `Bearer ${token}` });
    const requestOptions = { method: "GET", headers: myHeaders, redirect: "follow" };

    try {
      const [teamResponse, membersResponse] = await Promise.all([
        fetch(teamApiUrl, requestOptions),
        fetch(membersApiUrl, requestOptions)
      ]);

      // --- ประมวลผล Team Response ---
      if (!teamResponse.ok) { /* ... (เหมือนเดิม) ... */ const errData = await teamResponse.json().catch(() => ({})); throw new Error(`Failed to fetch team details: ${teamResponse.status} ${errData.message || ''}`); }
      const teamData = await teamResponse.json();
      setTeamDetails(teamData);

      // --- ประมวลผล Members Response ---
      if (!membersResponse.ok) { /* ... (เหมือนเดิม) ... */ const errData = await membersResponse.json().catch(() => ({})); throw new Error(`Failed to fetch team members: ${membersResponse.status} ${errData.message || ''}`); }
      const membersData = await membersResponse.json();
      setMembers(Array.isArray(membersData) ? membersData : []);

      // เคลียร์ Error ถ้าโหลดสำเร็จหมด
      // setError(null); // อาจจะไม่ต้องเคลียร์ที่นี่ ให้เคลียร์ตอนเริ่ม Fetch ดีกว่า

    } catch (err) {
      console.error("Fetch Team Data Error:", err);
      setError(prev => `${prev ? prev + '; ' : ''}Team/Members: ${err.message}`); // ต่อ Error ได้
      setTeamDetails(null);
      setMembers([]);
    } finally {
      setLoadingTeam(false); // <<< ใช้ Loading แยก
    }
  }, [baseUrl, token]); // Dependencies

  // --- useEffect (1): เรียก fetchCurrentUser เมื่อ Component โหลด ---
  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]); // ทำงานครั้งเดียวตอน Mount

  // --- useEffect (2): เรียก fetchTeamData เมื่อได้ข้อมูล User และมี team_id ---
  useEffect(() => {
    // ทำงานเมื่อ loadingUser เสร็จสิ้น และได้ข้อมูล currentUserData
    if (!loadingUser && currentUserData) {
        if (currentUserData.team_id) {
             fetchTeamData(currentUserData.team_id);
        } else {
             // User คนนี้ไม่มีทีม
             setError("You are not currently assigned to a team.");
             setLoadingTeam(false); // ไม่ต้องโหลดข้อมูลทีม
        }
    } else if (!loadingUser && !currentUserData && !error) {
        // กรณี fetchCurrentUser เสร็จ แต่ไม่ได้ข้อมูล (อาจจะเกิดจาก backend /me มีปัญหา)
         setError("Could not retrieve user information.");
    }
  }, [loadingUser, currentUserData, fetchTeamData, error]); // ทำงานเมื่อ loadingUser, currentUserData, หรือ error เปลี่ยน

  // --- ส่วนแสดงผล Loading / Error / ไม่มีทีม ---
  // แสดง Loading หลัก ถ้ากำลังโหลดข้อมูล User
  if (loadingUser) {
    return ( <Container maxWidth="md" sx={{ mt: 4 }}> <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}> <CircularProgress /> </Box> </Container> );
  }

  // แสดง Error ถ้ามี Error เกิดขึ้น (ไม่ว่าจะตอนโหลด User หรือ Team)
  if (error) {
    return ( <Container maxWidth="md" sx={{ mt: 4 }}> <Alert severity={error.includes("Unauthorized") ? "warning" : "error"}>{error}</Alert> </Container> );
  }

  // ถ้าโหลด User เสร็จแล้ว แต่ User ไม่มีทีม (เช็คจาก currentUserData อีกครั้ง)
  if (!currentUserData?.team_id) {
      return ( <Container maxWidth="md" sx={{ mt: 4 }}> <Alert severity="info">You are not currently assigned to a team.</Alert> </Container> );
  }

  // ถ้าโหลด User เสร็จ, มี team_id แต่กำลังโหลด Team/Members
  if (loadingTeam) {
      return ( <Container maxWidth="md" sx={{ mt: 4 }}> <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}> <CircularProgress /> </Box> </Container> );
  }

  // ถ้าโหลด Team/Members เสร็จ แต่ไม่พบข้อมูลทีม (อาจเกิดจาก teamId ไม่ถูกต้อง)
   if (!teamDetails && !loadingTeam) {
     return ( <Container maxWidth="md" sx={{ mt: 4 }}> <Alert severity="warning">Could not load details for your assigned team (ID: {currentUserData?.team_id}). It might have been deleted.</Alert> </Container> );
   }


  // --- แสดงผลข้อมูลทีม (เมื่อทุกอย่างพร้อม) ---
  const leader = teamDetails?.leader_id; // ใช้ Optional Chaining

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <GroupIcon sx={{ mr: 1.5, fontSize: '2rem', color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
             {/* แสดงชื่อทีม หรือ 'Loading...' ถ้า teamDetails ยังไม่มี */}
             Team: {teamDetails?.name ?? 'Loading...'}
          </Typography>
        </Box>
        {teamDetails?.description && (
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                {teamDetails.description}
            </Typography>
        )}
        <Divider sx={{ mb: 3 }}/>

        {/* --- ส่วนแสดง Leader --- */}
        <Typography variant="h6" gutterBottom>Team Leader</Typography>
        {leader ? (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, pl: 2 }}>
             <StarIcon sx={{ color: 'gold', mr: 1 }} />
             <ListItemText
                primary={`${leader.fname || ''} ${leader.lname || ''}`.trim() || leader.username}
                secondary={leader.email}
              />
          </Box>
        ) : (
          <Typography color="text.secondary" sx={{ mb: 3, pl: 2 }}>(No leader assigned)</Typography>
        )}

        {/* --- ส่วนแสดง Members --- */}
        <Typography variant="h6" gutterBottom>Members ({members.length})</Typography>
        <List>
          {members.map((member) => (
            <ListItem key={member._id} divider>
              <ListItemIcon>
                {leader && member._id === leader._id ? ( <StarIcon sx={{ color: 'gold' }} /> ) : ( <PersonIcon /> )}
              </ListItemIcon>
              <ListItemText
                primary={`${member.fname || ''} ${member.lname || ''}`.trim() || member.username}
                secondary={member.email}
              />
               {leader && member._id === leader._id && ( <Chip label="Leader" size="small" color="warning" variant="outlined" sx={{ ml: 2 }}/> )}
            </ListItem>
          ))}
          {members.length === 0 && !loadingTeam && ( // <<< เช็ค loadingTeam ด้วย
            <ListItem> <ListItemText primary="No members found in this team." sx={{ color: 'text.secondary', textAlign: 'center' }}/> </ListItem>
          )}
        </List>
      </Paper>
    </Container>
  );
}

export default YourTeam;