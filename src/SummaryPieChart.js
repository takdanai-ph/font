import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Box, Typography } from '@mui/material';

// ลงทะเบียน elements ที่จำเป็นสำหรับ Pie Chart
ChartJS.register(ArcElement, Tooltip, Legend);

function SummaryPieChart({ data }) {
  // ตรวจสอบว่ามี data หรือไม่ ก่อนจะสร้าง chartData
  if (!data || data.pendingTasksCount === undefined || data.completedTasksCount === undefined) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography color="text.secondary">No summary data available</Typography>
        </Box>
    );
  }

  // เตรียมข้อมูลสำหรับ Pie Chart
  const chartData = {
    labels: ['Pending / In Progress', 'Completed'],
    datasets: [
      {
        label: '# of Tasks',
        data: [data.pendingTasksCount, data.completedTasksCount],
        backgroundColor: [
          'rgba(255, 159, 64, 0.7)', // สีส้มสำหรับ Pending/In Progress
          'rgba(75, 192, 192, 0.7)', // สีเขียว/ฟ้าสำหรับ Completed
        ],
        borderColor: [
          'rgba(255, 159, 64, 1)',
          'rgba(75, 192, 192, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // ตั้งค่า Options เพิ่มเติม (ถ้าต้องการ)
  const options = {
    responsive: true, // ทำให้ Chart ปรับขนาดตาม Container
    maintainAspectRatio: false, // อนุญาตให้ปรับอัตราส่วนได้
    plugins: {
      legend: {
        position: 'top', // แสดง Legend ด้านบน
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed !== null) {
              label += context.parsed;
            }
            return label;
          }
        }
      }
    },
  };

  // ใช้ Box เพื่อควบคุมขนาดของ Chart Container
  return (
    <Box sx={{ height: '100%', width: '100%', position: 'relative' }}>
      <Pie data={chartData} options={options} />
    </Box>
  );
}

export default SummaryPieChart;