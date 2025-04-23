// src/UserList.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import {
  Container, Box, Typography, Button, IconButton, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Tooltip,
  TextField, // <<< เพิ่ม TextField สำหรับ Search
  Select, MenuItem, InputLabel, FormControl, // <<< เพิ่มสำหรับ Filter Role
  TableSortLabel // <<< เพิ่มสำหรับ Sort
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search'; // <<< Icon ค้นหา
import ClearIcon from '@mui/icons-material/Clear'; // <<< Icon ล้างค่า

// --- อย่าลืม Import EditUserDialog ---
import EditUserDialog from './EditUserDialog'; // ถ้ายังไม่ได้สร้าง ให้ดูโค้ดในคำตอบก่อนหน้านี้

const MySwal = withReactContent(Swal);

function UserList() {
  const navigate = useNavigate();
  const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';
  // const baseUrl = process.env.REACT_APP_API_BASE_URL || 'https://back-takdanai.up.railway.app';
  const apiUrl = `${baseUrl}/api/auth/users`;
  // const apiIdUrl = `<span class="math-inline">\{API\_BASE\_URL\}/api/auth/users/</span>{userId}`;;

  const [allUsers, setAllUsers] = useState([]); // <<< เก็บข้อมูลดิบทั้งหมด
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- State สำหรับ Edit Dialog ---
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // --- State สำหรับ Filter และ Sort ---
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [sortBy, setSortBy] = useState(null); // null | 'name' | 'role'
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' | 'desc'

  // --- Function สำหรับ Fetch ข้อมูล User ---
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('token');
    if (!token) {
      setError("No token found. Please login.");
      setLoading(false);
      navigate('/login');
      return;
    }

    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${token}`);

    const requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow"
    };

    try {
      const response = await fetch(apiUrl, requestOptions);
      if (!response.ok) {
        const errData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
        throw new Error(errData.message || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setAllUsers(data);
    } catch (err) {
      console.error("Fetch users error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [navigate, apiUrl]);

  // --- เรียก fetchUsers เมื่อ Component โหลด ---
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // --- Function สำหรับลบ User ---
  const handleDelete = useCallback((userId, username) => {
    MySwal.fire({
      title: `ลบผู้ใช้ ${username}?`,
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
  
        const requestOptions = {
          method: "DELETE",
          headers: myHeaders,
          redirect: "follow"
        };
  
        setLoading(true);
  
        const deleteUrl = `${baseUrl}/api/auth/users/${userId}`;
  
        fetch(deleteUrl, requestOptions)
          .then(response => {
            if (!response.ok) {
                return response.json().catch(() => ({ message: `HTTP error ${response.status}` })).then(err => { throw new Error(err.message) });
            }
            return response.text();
          })
          .then(deleteResult => {
            MySwal.fire(
              'ลบแล้ว!',
              `ผู้ใช้ ${username} ถูกลบเรียบร้อย.`,
              'success'
            );
            fetchUsers();
          })
          .catch(err => {
            console.error("Delete user error:", err);
            MySwal.fire(
              'เกิดข้อผิดพลาด!',
              `ไม่สามารถลบผู้ใช้ได้: ${err.message}`,
              'error'
            );
            setLoading(false);
          });
      }
    });
  }, [fetchUsers, baseUrl]);

  // --- Functions สำหรับ Edit Dialog ---
  const handleEditClick = useCallback((user) => {
    setCurrentUser(user);
    setEditDialogOpen(true);
  }, []);

  const handleEditDialogClose = useCallback(() => {
    setEditDialogOpen(false);
    setCurrentUser(null);
  }, []);

  // เรียก fetchUsers หลัง save สำเร็จ
  const handleEditSubmit = useCallback(() => {
    handleEditDialogClose();
    fetchUsers();
  }, [handleEditDialogClose, fetchUsers]);

  // --- Handlers สำหรับ Search, Filter, Sort ---
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleRoleFilterChange = (event) => {
    setRoleFilter(event.target.value);
  };

  const handleSortRequest = (property) => {
    const isAsc = sortBy === property && sortDirection === 'asc';
    setSortDirection(isAsc ? 'desc' : 'asc');
    setSortBy(property);
  };

  // --- Logic การ Filter และ Sort ข้อมูล (ใช้ useMemo) ---
  const displayedUsers = useMemo(() => {
    let filtered = [...allUsers];

    // 1. Filter ตาม Role
    if (roleFilter !== 'All') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // 2. Filter ตาม Search Term (ค้นหา fname หรือ lname แบบ case-insensitive)
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase().trim(); // trim() เพื่อตัดช่องว่างหน้า/หลัง
      if (lowerSearchTerm) { // เช็คว่าหลัง trim แล้วไม่เป็นค่าว่าง
          filtered = filtered.filter(user =>
            (user.fname && user.fname.toLowerCase().includes(lowerSearchTerm)) ||
            (user.lname && user.lname.toLowerCase().includes(lowerSearchTerm))
          );
      }
    }

    // 3. Sort
    if (sortBy) {
      filtered.sort((a, b) => {
        let compareA, compareB;
        // กำหนดค่าเริ่มต้นเผื่อเป็น null หรือ undefined
        if (sortBy === 'name') {
          compareA = `${a.fname || ''} ${a.lname || ''}`.trim().toLowerCase();
          compareB = `${b.fname || ''} ${b.lname || ''}`.trim().toLowerCase();
        } else { // Sort ตาม Role หรือ field อื่นๆ
          compareA = (a[sortBy] || '').toLowerCase();
          compareB = (b[sortBy] || '').toLowerCase();
        }

        // ใช้ localeCompare เพื่อการเรียงลำดับตัวอักษรที่ดีกว่า (รวมถึงภาษาไทย ถ้ามี)
        const comparison = compareA.localeCompare(compareB);

        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return filtered;
  }, [allUsers, searchTerm, roleFilter, sortBy, sortDirection]);


  // --- ส่วน Render ---
  if (loading && allUsers.length === 0) { // แสดง loading เฉพาะตอนโหลดครั้งแรก
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Typography color="error" sx={{ mt: 2, textAlign:'center' }}>Error fetching users: {error}</Typography>;
  }

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom sx={{ mt: 2}}>
        User Management
      </Typography>

      {/* --- แถวสำหรับ Search และ Filter --- */}
      <Paper sx={{ p: 2, display: 'flex', gap: 2, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          label="Search by Name"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />,
            endAdornment: searchTerm ? (
              <IconButton size="small" onClick={() => setSearchTerm('')} title="Clear search">
                <ClearIcon fontSize="small" />
              </IconButton>
            ) : null,
          }}
          sx={{ minWidth: '250px', flexGrow: { xs: 1, sm: 0 } }} // ให้ช่อง search ขยายได้บนจอเล็ก
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel id="role-filter-label">Filter by Role</InputLabel>
          <Select
            labelId="role-filter-label"
            id="role-filter"
            value={roleFilter}
            label="Filter by Role"
            onChange={handleRoleFilterChange}
          >
            <MenuItem value="All">All Roles</MenuItem>
            <MenuItem value="User">User</MenuItem>
            <MenuItem value="Manager">Manager</MenuItem>
            <MenuItem value="Admin">Admin</MenuItem>
            {/* ควรดึง Role ที่มีจริงๆ จากข้อมูล users มาใส่ในนี้แบบ Dynamic ถ้าเป็นไปได้ */}
          </Select>
        </FormControl>
        <Box sx={{ flexGrow: 1 }} /> {/* ตัวดันปุ่มไปขวาสุด */}
         <Button
          variant="contained"
          startIcon={<AddIcon />}
          component={Link}
          to="/create-account"
          sx={{ flexShrink: 0 }}
        >
          Create User
        </Button>
      </Paper>

      {/* --- ตารางแสดงผล --- */}
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="user table">
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 'bold' } }}>
              <TableCell sortDirection={sortBy === 'name' ? sortDirection : false}>
                <TableSortLabel
                  active={sortBy === 'name'}
                  direction={sortBy === 'name' ? sortDirection : 'asc'}
                  onClick={() => handleSortRequest('name')}
                >
                  Name
                </TableSortLabel>
              </TableCell>
              <TableCell>Username</TableCell>
              <TableCell>Email</TableCell>
              <TableCell sortDirection={sortBy === 'role' ? sortDirection : false}>
                 <TableSortLabel
                  active={sortBy === 'role'}
                  direction={sortBy === 'role' ? sortDirection : 'asc'}
                  onClick={() => handleSortRequest('role')}
                >
                  Role
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {displayedUsers.length > 0 ? (
              displayedUsers.map((user) => (
                <TableRow
                  hover // เพิ่ม hover effect
                  key={user.id || user._id}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell component="th" scope="row">{`${user.fname || ''} ${user.lname || ''}`}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="Edit">
                      <IconButton size="small" aria-label="edit" color="primary" onClick={() => handleEditClick(user)}>
                        <EditIcon fontSize="small"/>
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" aria-label="delete" color="error" onClick={() => handleDelete(user.id || user._id, user.username)}>
                        <DeleteIcon fontSize="small"/>
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            ) : (
                <TableRow>
                    <TableCell colSpan={5} align="center">
                        No users found matching your criteria.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* --- Edit Dialog --- */}
      {currentUser && (
        <EditUserDialog
          open={editDialogOpen}
          onClose={handleEditDialogClose}
          user={currentUser}
          onSave={handleEditSubmit}
        />
      )}

    </Container>
  );
}

export default UserList;