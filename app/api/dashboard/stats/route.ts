import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import { UnregisteredUser } from '@/models/UnregisteredUser';
import { AttendanceRecord } from '@/models/AttendanceRecord';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get basic counts
    const totalUsers = await User.countDocuments();
    const totalUnregisteredUsers = await UnregisteredUser.countDocuments();
    const totalAttendanceRecords = await AttendanceRecord.countDocuments();

    // Get today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAttendance = await AttendanceRecord.countDocuments({
      timestamp: {
        $gte: today,
        $lt: tomorrow,
      },
    });

    // Get this week's attendance
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - today.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const thisWeekAttendance = await AttendanceRecord.countDocuments({
      timestamp: {
        $gte: weekStart,
      },
    });

    // Get this month's attendance
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const thisMonthAttendance = await AttendanceRecord.countDocuments({
      timestamp: {
        $gte: monthStart,
      },
    });

    // Get top users by attendance
    const topUsers = await User.find()
      .sort({ attendance: -1 })
      .limit(5)
      .select('name employeeId attendance');

    // Get recent activity
    const recentActivity = await AttendanceRecord.find()
      .populate('userId', 'name employeeId')
      .sort({ timestamp: -1 })
      .limit(10);

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalUnregisteredUsers,
          totalAttendanceRecords,
        },
        attendance: {
          today: todayAttendance,
          thisWeek: thisWeekAttendance,
          thisMonth: thisMonthAttendance,
        },
        topUsers,
        recentActivity,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
