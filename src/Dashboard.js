import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
// import Swal from 'sweetalert2'; // Optional: ถ้าต้องการใช้
import {
  Container, Box, Typography, Grid, Paper, CircularProgress, Alert, Card, CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  TextField,
  Button
} from '@mui/material';

// --- Import Components ย่อย --- 
import SummaryPieChart from './SummaryPieChart'; 
import TaskList from './TaskList';
import TaskDurationChart from './TaskDurationChart';

function Dashboard() {
  const navigate = useNavigate();
  // --- State สำหรับเก็บข้อมูล ---
  const [summaryData, setSummaryData] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [taskDurationData, setTaskDurationData] = useState({ labels: [], data: [] }); // State สำหรับข้อมูล Bar Chart
  const [selectedTimeRange, setSelectedTimeRange] = useState('W'); // State สำหรับเก็บ Time Range ที่เลือก (Default: Week)

  // --- State สำหรับ Loading และ Error ---
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [loadingDurations, setLoadingDurations] = useState(true);
  const [error, setError] = useState(null); // เก็บ Error รวม

  const [filterStatus, setFilterStatus] = useState('All'); // 'All', 'Pending', 'In Progress', 'Completed'
  const [filterAssignee, setFilterAssignee] = useState(''); // เก็บ ID ของ Assignee หรือ '' ถ้าไม่เลือก
  const [filterTeam, setFilterTeam] = useState('');     // เก็บ ID ของ Team หรือ '' ถ้าไม่เลือก
  const [filterTag, setFilterTag] = useState('');     // เก็บ Tag ที่ค้นหา

  // State สำหรับเก็บข้อมูล Users/Teams เพื่อใช้ใน Dropdown/Autocomplete
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loadingFilters, setLoadingFilters] = useState(false); // Loading สำหรับ Users/Teams

  // --- API URLs ---
  // const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001'; // หรือ Port ที่คุณใช้
  const baseUrl = process.env.REACT_APP_API_BASE_URL || 'https://back-takdanai.up.railway.app';
  const summaryApiUrl = `${baseUrl}/api/tasks/summary`;
  const tasksApiUrl = `${baseUrl}/api/tasks`;
  const taskDurationApiUrl = `${baseUrl}/api/tasks/durations`; // Endpoint ใหม่

  // --- Functions สำหรับ Fetch ข้อมูล ---
  const fetchSummary = useCallback(async () => {
    // console.log("Fetching Summary...");
    setLoadingSummary(true);
    const token = localStorage.getItem('token');
    const myHeaders = new Headers({ "Authorization": `Bearer ${token}` });
    const requestOptions = { method: "GET", headers: myHeaders, redirect: "follow" };
    try {
      const response = await fetch(summaryApiUrl, requestOptions);
      // แก้ไข: เช็ค status ก่อนเรียก .json()
      if (!response.ok) {
          const errorText = await response.text(); // อ่านข้อความ error ถ้ามี
           throw new Error(`Summary fetch failed: ${response.status} ${errorText}`);
      }
      const result = await response.json();
      setSummaryData(result);
      // setError(prev => prev?.replace(/Failed to load summary data[^;]*/, '').trim().replace(/^; /, '') || null); // เคลียร์ error ส่วนนี้ถ้าสำเร็จ
    } catch (err) {
        console.error("Fetch Summary Error:", err);
        setError(prev => `${prev ? prev + '; ' : ''}Summary: ${err.message}`);
    } finally {
        setLoadingSummary(false);
    }
  }, [summaryApiUrl]);

  // const fetchTasks = useCallback(async () => {
  //   // console.log("Fetching Tasks...");
  //   setLoadingTasks(true);
  //    const token = localStorage.getItem('token');
  //    const myHeaders = new Headers({ "Authorization": `Bearer ${token}` });
  //    const requestOptions = { method: "GET", headers: myHeaders, redirect: "follow" };
  //   try {
  //     const response = await fetch(tasksApiUrl, requestOptions);
  //      if (!response.ok) {
  //         const errorText = await response.text();
  //          throw new Error(`Tasks fetch failed: ${response.status} ${errorText}`);
  //     }
  //     const result = await response.json();
  //     setTasks(Array.isArray(result) ? result : []);
  //     // setError(prev => prev?.replace(/Failed to load task list[^;]*/, '').trim().replace(/^; /, '') || null);
  //   } catch (err) {
  //       console.error("Fetch Tasks Error:", err);
  //       setError(prev => `${prev ? prev + '; ' : ''}Tasks: ${err.message}`);
  //   } finally {
  //       setLoadingTasks(false);
  //   }
  //  }, [tasksApiUrl]);
  const fetchTasks = useCallback(async (currentFilters) => { // <<< รับ currentFilters เข้ามา
    // console.log("Fetching Tasks with filters:", currentFilters); // Debugging log
    setLoadingTasks(true);
    const token = localStorage.getItem('token');
    const myHeaders = new Headers({ "Authorization": `Bearer ${token}` });
    const requestOptions = { method: "GET", headers: myHeaders, redirect: "follow" };

    // สร้าง Query String จาก Filters (ตรวจสอบว่า currentFilters ไม่ใช่ undefined ก่อน)
    const queryParams = new URLSearchParams();
    if (currentFilters) { // <<< เช็คว่า currentFilters มีค่าหรือไม่
        if (currentFilters.status && currentFilters.status !== 'All') {
            queryParams.append('status', currentFilters.status);
        }
        if (currentFilters.assigneeId) {
            queryParams.append('assigneeId', currentFilters.assigneeId);
        }
        if (currentFilters.teamId) {
            queryParams.append('teamId', currentFilters.teamId);
        }
        if (currentFilters.tag) {
            queryParams.append('tag', currentFilters.tag);
        }
        // --- เพิ่ม query params อื่นๆ ---
    }

    const url = `${tasksApiUrl}?${queryParams.toString()}`;
    // console.log("Fetching tasks from URL:", url); // Debugging log

    try {
        const response = await fetch(url, requestOptions); // <<< ใช้ URL ที่มี query string
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Tasks fetch failed: ${response.status} ${errorText}`);
        }
        const result = await response.json();
        setTasks(Array.isArray(result) ? result : []);
        // setError(prev => prev?.replace(/Failed to load task list[^;]*/, '').trim().replace(/^; /, '') || null);
    } catch (err) {
        console.error("Fetch Tasks Error:", err);
        setError(prev => `${prev ? prev + '; ' : ''}Tasks: ${err.message}`);
        setTasks([]); // เคลียร์ task ถ้า fetch ไม่สำเร็จ
    } finally {
        setLoadingTasks(false);
    }
}, [tasksApiUrl]); // dependencies

  const fetchTaskDurations = useCallback(async (timeRange) => {
    // console.log(`Workspaceing Performance (Range: ${timeRange})...`);
    setLoadingDurations(true);
     const token = localStorage.getItem('token');
     const myHeaders = new Headers({ "Authorization": `Bearer ${token}` });
     const requestOptions = { method: "GET", headers: myHeaders, redirect: "follow" };
     const urlWithQuery = `${taskDurationApiUrl}?timeRange=${timeRange}`;
     try {
      const response = await fetch(urlWithQuery, requestOptions);
      if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Task Durations fetch failed: ${response.status} ${errorText}`);
      }
      const result = await response.json(); // คาดว่าเป็น Array [{title, duration}, ...]
      setTaskDurationData(result);
  } catch (err) {
      console.error("Fetch Task Durations Error:", err);
      setTaskDurationData([]); // เคลียร์ข้อมูลถ้า Error
      setError(prev => `${prev ? prev + '; ' : ''}Durations: ${err.message}`);
  } finally {
      setLoadingDurations(false);
  }
}, [taskDurationApiUrl]);;

   // --- Function สำหรับ refresh ข้อมูลทั้งหมด ---
  //  const refreshAllData = useCallback(() => {
  //      // console.log("Refreshing all data...");
  //      setError(null); // เคลียร์ Error เก่าก่อนเริ่มโหลดใหม่
  //      fetchSummary();
  //      fetchTasks();
  //      fetchTaskDurations(selectedTimeRange); // ใช้ Time Range ปัจจุบัน
  //  }, [fetchSummary, fetchTasks, fetchTaskDurations, selectedTimeRange]);
  // ใน Dashboard.js (แก้ไขฟังก์ชันเดิม ประมาณบรรทัดที่ 111)
const refreshAllData = useCallback(() => {
  // console.log("Refreshing all data...");
  setError(null); // เคลียร์ Error เก่าก่อนเริ่มโหลดใหม่
  fetchSummary();

  // สร้าง object filter ปัจจุบันจาก state
  const currentFilters = {
      status: filterStatus,          // <<< อ่านจาก state filterStatus
      assigneeId: filterAssignee,    // <<< อ่านจาก state filterAssignee
      teamId: filterTeam,            // <<< อ่านจาก state filterTeam
      tag: filterTag                 // <<< อ่านจาก state filterTag
  };
  fetchTasks(currentFilters); // <<< ส่ง filters ให้ fetchTasks

  fetchTaskDurations(selectedTimeRange); // ใช้ Time Range ปัจจุบัน
}, [fetchSummary, fetchTasks, fetchTaskDurations, selectedTimeRange,
  filterStatus, filterAssignee, filterTeam, filterTag]); // <<< ใส่ state filter ใน dependencies ด้วย

  // --- useEffect สำหรับโหลดข้อมูลครั้งแรก ---
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError("Authentication token not found. Please login.");
      setLoadingSummary(false);
      setLoadingTasks(false);
      setLoadingDurations(false);
      navigate('/login');
      return;
    }
    refreshAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ไม่ต้องใส่ dependencies ที่เปลี่ยนบ่อย ให้เรียก refreshAllData ครั้งเดียวตอน Mount

// // ฟังก์ชัน fetch users และ teams
// const fetchFilterData = useCallback(async () => {
//   setLoadingFilters(true);
//   const token = localStorage.getItem('token');
//   const headers = { "Authorization": `Bearer ${token}` };
//   try {
//       const [userRes, teamRes] = await Promise.all([
//           fetch(`${baseUrl}/api/auth/users`, { headers }), // Endpoint ดึง users ทั้งหมด
//           fetch(`${baseUrl}/api/teams`, { headers })      // Endpoint ดึง teams ทั้งหมด
//       ]);
//       if (!userRes.ok) throw new Error('Failed to fetch users');
//       if (!teamRes.ok) throw new Error('Failed to fetch teams');

//       const userData = await userRes.json();
//       const teamData = await teamRes.json();

//       setUsers(Array.isArray(userData) ? userData : []);
//       setTeams(Array.isArray(teamData) ? teamData : []);

//   } catch (err) {
//       console.error("Error fetching filter data:", err);
//       setError(prev => `${prev ? prev + '; ' : ''}FilterData: ${err.message}`);
//   } finally {
//       setLoadingFilters(false);
//   }
// }, [baseUrl]);

// // ใน useEffect หลัก หรือสร้าง useEffect ใหม่
// useEffect(() => {
//   const token = localStorage.getItem('token');
//   if (token) {
//      refreshAllData(); // โหลดข้อมูล dashboard หลัก
//      fetchFilterData(); // <<< โหลดข้อมูลสำหรับ Filter
//   } else {
//       // ... (handle no token) ...
//   }
//   // eslint-disable-next-line react-hooks/exhaustive-deps
// }, []); // เรียกครั้งเดียวตอน Mount
// ฟังก์ชัน fetch users และ teams
const fetchFilterData = useCallback(async () => {
  setLoadingFilters(true);
  const token = localStorage.getItem('token');
  const headers = { "Authorization": `Bearer ${token}` };
  try {
      const [userRes, teamRes] = await Promise.all([
          fetch(`${baseUrl}/api/auth/users`, { headers }), // Endpoint ดึง users ทั้งหมด
          fetch(`${baseUrl}/api/teams`, { headers })      // Endpoint ดึง teams ทั้งหมด
      ]);
      if (!userRes.ok) throw new Error('Failed to fetch users');
      if (!teamRes.ok) throw new Error('Failed to fetch teams');

      const userData = await userRes.json();
      const teamData = await teamRes.json();

      setUsers(Array.isArray(userData) ? userData : []);
      setTeams(Array.isArray(teamData) ? teamData : []);

  } catch (err) {
      console.error("Error fetching filter data:", err);
      setError(prev => `${prev ? prev + '; ' : ''}FilterData: ${err.message}`);
  } finally {
      setLoadingFilters(false);
  }
}, [baseUrl]);

// ใน useEffect หลัก หรือสร้าง useEffect ใหม่
useEffect(() => {
  const token = localStorage.getItem('token');
  if (token) {
     refreshAllData(); // โหลดข้อมูล dashboard หลัก
     fetchFilterData(); // <<< โหลดข้อมูลสำหรับ Filter
  } else {
      // ... (handle no token) ...
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []); // เรียกครั้งเดียวตอน Mount

// useEffect สำหรับ re-fetch tasks เมื่อ filter เปลี่ยน
useEffect(() => {
  // สร้าง object filter ปัจจุบันจาก state
  const currentFilters = {
      status: filterStatus,
      assigneeId: filterAssignee,
      teamId: filterTeam,
      tag: filterTag
  };
  // console.log("Filters changed, fetching tasks:", currentFilters); // Debugging log
  fetchTasks(currentFilters); // เรียก fetchTasks เมื่อ filter state ใดๆ เปลี่ยนไป

}, [filterStatus, filterAssignee, filterTeam, filterTag, fetchTasks]);

  // --- Handler เมื่อมีการเปลี่ยน Time Range ใน Bar Chart ---
  const handleTimeRangeChange = (newTimeRange) => {
    if (selectedTimeRange !== newTimeRange) {
        // console.log("Time range changed to:", newTimeRange);
        setSelectedTimeRange(newTimeRange); // อัปเดต State Time Range
        fetchTaskDurations(newTimeRange); // เรียก Fetch ข้อมูล Performance ใหม่
    }
  };

  const handleTaskClick = useCallback((task) => {
    if (task && task._id) { // ตรวจสอบว่ามี task และ _id
      navigate(`/task/${task._id}`); // <<< เปลี่ยนเป็น navigate ไปยัง path ของ Task Detail
    } else {
      console.error("ไม่สามารถเปิดรายละเอียด Task: ไม่พบ Task หรือ ID", task);
      // อาจจะแสดงข้อผิดพลาดให้ผู้ใช้ทราบ
    }
  }, [navigate]); // ใส่ navigate ใน dependencies

  // --- ตัวแปรเช็คสถานะ Loading รวม ---
   const isLoading = loadingSummary || loadingTasks || loadingDurations;

  return (
    // ใช้ sx เพื่อให้ Container ขยายเต็มความสูงขั้นต่ำ และรองรับการ scroll ถ้าเนื้อหาล้น
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 64px - 32px)' /* ลบความสูง AppBar และ Padding */ }}>
      <Typography variant="h4" gutterBottom component="h1">
        Dashboard
      </Typography>

       {/* แสดง Loading Indicator ใหญ่ตรงกลางถ้ากำลังโหลดครั้งแรก */}
       {isLoading && !summaryData && tasks.length === 0 && (!taskDurationData || taskDurationData.length === 0) && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
              <CircularProgress size={60} />
            </Box>
       )}

       {/* แสดง Error รวม */}
       {error && (
           <Alert severity="warning" sx={{ mb: 2 }}>
               {/* อาจจะแสดงข้อความละเอียดน้อยลง หรือให้คลิกดูรายละเอียด */}
               Could not load some parts of the dashboard. Please check connection or try again later.
               {/* Details: {error} */}
           </Alert>
       )}

      {/* === ส่วนสรุป (Summary Cards) === */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid xs={12} sm={6} md={4}>
          <Card>
            <CardContent sx={{ position: 'relative', minHeight: '105px' /* กำหนดความสูงขั้นต่ำ */ }}>
              <Typography color="text.secondary" gutterBottom>Pending / In Progress</Typography>
              {loadingSummary ? <CircularProgress size={20} sx={{ position: 'absolute', top: '50%', left: '50%', mt: -1.25, ml: -1.25 }} /> : <Typography variant="h5">{summaryData?.pendingTasksCount ?? 'N/A'}</Typography>}
            </CardContent>
          </Card>
        </Grid>
        <Grid xs={12} sm={6} md={4}>
          <Card>
            <CardContent sx={{ position: 'relative', minHeight: '105px' }}>
               <Typography color="text.secondary" gutterBottom>Completed Tasks</Typography>
               {loadingSummary ? <CircularProgress size={20} sx={{ position: 'absolute', top: '50%', left: '50%', mt: -1.25, ml: -1.25 }} /> : <Typography variant="h5">{summaryData?.completedTasksCount ?? 'N/A'}</Typography>}
            </CardContent>
          </Card>
        </Grid>
        <Grid xs={12} sm={6} md={4}>
          <Card>
            <CardContent sx={{ position: 'relative', minHeight: '105px' }}>
              <Typography color="text.secondary" gutterBottom>Total Tasks</Typography>
               {loadingSummary ? <CircularProgress size={20} sx={{ position: 'absolute', top: '50%', left: '50%', mt: -1.25, ml: -1.25 }} /> : <Typography variant="h5">{((summaryData?.pendingTasksCount ?? 0) + (summaryData?.completedTasksCount ?? 0)) || 'N/A'}</Typography>}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* === ส่วนแสดง Chart === */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 350, /* เพิ่มความสูง */ position: 'relative' }}>
             <Typography variant="h6" gutterBottom>Task Status Summary</Typography>
             {loadingSummary ? (<Box sx={{display:'flex', justifyContent:'center', alignItems:'center', flexGrow:1}}><CircularProgress/></Box>) :
              (<SummaryPieChart data={summaryData} />) // Component นี้ควรจัดการเรื่อง No data ภายในตัวเอง
             }
          </Paper>
        </Grid>
        <Grid xs={12} md={6}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 350, /* เพิ่มความสูง */ position: 'relative' }}>
            {/* TaskDurationChart จะแสดง Loading/No Data ภายในตัวเองได้ */}
             {/* ไม่ต้องเช็ค Loading ที่นี่ ให้ Component ลูกจัดการ */}
             <TaskDurationChart
                 data={taskDurationData}
                 currentTimeRange={selectedTimeRange}
                 onTimeRangeChange={handleTimeRangeChange}
                 isLoading={loadingDurations}
               />
          </Paper>
        </Grid>
      </Grid>

      {/* === ฟิลเตอร์ === */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <Typography sx={{ mr: 1 }}>Filters:</Typography>

          {/* --- Status Filter --- */}
          <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel id="status-filter-label">Status</InputLabel>
              <Select
                  labelId="status-filter-label"
                  value={filterStatus}
                  label="Status"
                  onChange={(e) => setFilterStatus(e.target.value)} // <<< อัปเดต State เมื่อเปลี่ยน
              >
                  <MenuItem value="All">All Status</MenuItem>
                  <MenuItem value="Pending">Pending</MenuItem>
                  <MenuItem value="In Progress">In Progress</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
              </Select>
          </FormControl>

          {/* --- Assignee Filter (ใช้ Autocomplete) --- */}
          <Autocomplete
              options={users} // ใช้ state users ที่ fetch มา
              getOptionLabel={(option) => `${option.fname || ''} ${option.lname || ''} (${option.username})`.trim()}
              value={users.find(u => u._id === filterAssignee) || null} // หา object user ที่ตรงกับ ID ใน state
              onChange={(event, newValue) => {
                  setFilterAssignee(newValue ? newValue._id : ''); // <<< อัปเดต State ID เมื่อเปลี่ยน
              }}
              loading={loadingFilters}
              size="small"
              sx={{ minWidth: 220 }}
              renderInput={(params) => (
                  <TextField
                      {...params}
                      label="Assignee"
                      InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                              <React.Fragment>
                                  {loadingFilters ? <CircularProgress color="inherit" size={20} /> : null}
                                  {params.InputProps.endAdornment}
                              </React.Fragment>
                          ),
                      }}
                  />
              )}
              isOptionEqualToValue={(option, value) => option._id === value?._id}
          />

          {/* --- Team Filter (ใช้ Autocomplete) --- */}
          <Autocomplete
               options={teams} // ใช้ state teams ที่ fetch มา
               getOptionLabel={(option) => option.name || 'Unnamed Team'}
               value={teams.find(t => t._id === filterTeam) || null}
               onChange={(event, newValue) => {
                  setFilterTeam(newValue ? newValue._id : ''); // <<< อัปเดต State ID เมื่อเปลี่ยน
               }}
               loading={loadingFilters}
               size="small"
               sx={{ minWidth: 200 }}
               renderInput={(params) => (
                  <TextField
                      {...params}
                      label="Team"
                      InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                               <React.Fragment>
                                  {loadingFilters ? <CircularProgress color="inherit" size={20} /> : null}
                                  {params.InputProps.endAdornment}
                               </React.Fragment>
                          ),
                      }}
                   />
               )}
              isOptionEqualToValue={(option, value) => option._id === value?._id}
          />

          {/* --- Tag Filter --- */}
          <TextField
              label="Tag"
              variant="outlined"
              size="small"
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)} // <<< อัปเดต State เมื่อพิมพ์
              sx={{ minWidth: 150 }}
          />

         {/* อาจจะมีปุ่ม Apply Filters หรือ Clear Filters เพิ่มเติม */}
          <Button variant="outlined" size="small" onClick={() => {
              // เคลียร์ Filter ทั้งหมด
              setFilterStatus('All');
              setFilterAssignee('');
              setFilterTeam('');
              setFilterTag('');
              // อาจจะต้อง fetch ข้อมูลใหม่ทันที หรือรอให้กด Apply
          }}>
              Clear Filters
          </Button>
      </Paper>

      {/* === ส่วนแสดงรายการ Task === */}
      {/* ใช้ flexGrow: 1 เพื่อให้ส่วนนี้ขยายถ้ามีพื้นที่เหลือในแนวตั้ง */}
      <Grid container spacing={3} sx={{ flexGrow: 1 }}>
        <Grid xs={12}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
             {/* TaskList ควรจัดการ Loading/No Data ภายในตัวเอง */}
             {loadingTasks ? (
                 <Box sx={{display:'flex', justifyContent:'center', alignItems:'center', flexGrow:1, minHeight: '200px'}}>
                     <CircularProgress/>
                 </Box>
              ) :
              (<TaskList 
                tasks={tasks} 
                refreshData={refreshAllData} 
                onTaskClick={handleTaskClick}
                />)
             }
          </Paper>
        </Grid>
      </Grid>

    </Container>
  );
}

export default Dashboard;