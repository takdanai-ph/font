// src/PerformanceBarChart.js
import React, { useState, useEffect } from 'react'; // เพิ่ม useEffect
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Box, Typography, ButtonGroup, Button, CircularProgress } from '@mui/material';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// รับ Props จาก Dashboard.js
function TaskDurationChart({ data, currentTimeRange, onTimeRangeChange, isLoading }) {
    
    const [chartData, setChartData] = useState({ labels: [], datasets: [] });
    
    // --- useEffect: ประมวลผลข้อมูลใหม่เมื่อ prop 'data' เปลี่ยนแปลง ---
  useEffect(() => {
    let labels = [];
    let durationValues = [];

    // ตรวจสอบว่า data ที่ได้รับมาเป็น Array และมีข้อมูลหรือไม่
    if (data && Array.isArray(data) && data.length > 0) {
      labels = data.map(item => item.title); // ดึง title มาเป็น Label แกน X
      durationValues = data.map(item => item.duration); // ดึง duration มาเป็นค่าแกน Y
    }

    // อัปเดต State ของ Chart ด้วยข้อมูลใหม่
    setChartData({
      labels: labels,
      datasets: [
        {
          // --- เปลี่ยน Label ของชุดข้อมูล ---
          label: 'Duration (Days)', // หรือ 'ระยะเวลา (วัน)'
          data: durationValues,
          backgroundColor: 'rgba(54, 162, 235, 0.6)', // สีแท่งกราฟ (ตัวอย่าง)
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
      ],
    });
  }, [data]); // <<< ให้ useEffect ทำงานเมื่อ prop 'data' เปลี่ยน

    // --- Handler การเปลี่ยน Time Range ---
    // const handleTimeRangeClick = (range) => {
    //     // ไม่ต้อง update state ที่นี่
    //     // setTimeRange(range);
    //     // เรียก function ที่ส่งมาจาก Dashboard เพื่อแจ้งการเปลี่ยนแปลง
    //     if (onTimeRangeChange) {
    //         onTimeRangeChange(range);
    //     }
    // };

    // --- ตั้งค่า Options ของกราฟ ---
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false, // ทำให้กราฟปรับขนาดตาม Container ได้ดีขึ้น
    plugins: {
      legend: {
        position: 'top', // ตำแหน่งคำอธิบาย (อาจจะเอาออกถ้ามีแค่ชุดข้อมูลเดียว)
        display: false, // << ซ่อน Legend ถ้ามีแค่ชุดข้อมูลเดียว
      },
      title: {
        display: true,
        // --- เปลี่ยน Title ของกราฟ ---
        text: 'Task Completion Duration', // หรือ 'ระยะเวลาที่ใช้ทำงานเสร็จ'
        padding: { // เพิ่มระยะห่างด้านล่าง Title เล็กน้อย
            bottom: 10
        }
      },
      tooltip: { // ตั้งค่า Tooltip เมื่อโฮเวอร์
         callbacks: {
            label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                    label += ': ';
                }
                if (context.parsed.y !== null) {
                    // อาจจะเพิ่มหน่วย ' Days' ต่อท้ายตัวเลขใน Tooltip
                    label += context.parsed.y + ' Days';
                }
                return label;
            }
         }
      }
    },
    scales: {
      x: {
        // --- เปลี่ยน Title แกน X ---
        title: {
          display: true,
          text: 'Task Title', // หรือ 'ชื่องาน'
        },
        ticks: { // อาจจะซ่อน label แกน x ถ้าชื่อ task ยาวเกินไป
            display: true, // ลองตั้งเป็น false ถ้าชื่อมันทับกันเยอะ
            // autoSkip: true,
            // maxRotation: 0,
            // minRotation: 0
        }
      },
      y: {
        beginAtZero: true, // ให้แกน Y เริ่มที่ 0 เสมอ
        // --- เปลี่ยน Title แกน Y ---
        title: {
          display: true,
          text: 'Duration (Days)', // หรือ 'ระยะเวลา (วัน)'
        },
      },
    },
  };

    // ตรวจสอบว่ามีข้อมูลหรือไม่ก่อน Render Chart
    const hasData = chartData && chartData.labels && chartData.labels.length > 0;


    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
           {/* ส่วนหัวและปุ่มเลือก Time Range */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexShrink: 0 }}>
            <Typography variant="h6">Task Duration</Typography>
            <ButtonGroup size="small" variant="outlined" aria-label="time range button group">
              <Button onClick={() => onTimeRangeChange('W')} variant={currentTimeRange === 'W' ? 'contained' : 'outlined'}>Week</Button>
              <Button onClick={() => onTimeRangeChange('M')} variant={currentTimeRange === 'M' ? 'contained' : 'outlined'}>Month</Button>
              <Button onClick={() => onTimeRangeChange('Y')} variant={currentTimeRange === 'Y' ? 'contained' : 'outlined'}>Year</Button>
            </ButtonGroup>
          </Box>
    
          {/* ส่วนแสดงกราฟ หรือ Loading หรือ No Data */}
          <Box sx={{ flexGrow: 1, position: 'relative' }}>
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress />
              </Box>
            // --- ปรับเงื่อนไขเช็ค No Data ให้เข้ากับข้อมูลใหม่ ---
            ) : (!chartData || !chartData.labels || chartData.labels.length === 0) ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Typography color="text.secondary">No completed task data available for this period.</Typography>
              </Box>
            ) : (
              <Bar options={chartOptions} data={chartData} />
            )}
          </Box>
        </Box>
      );
    }
    

export default TaskDurationChart;