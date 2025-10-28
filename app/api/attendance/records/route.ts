import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { AttendanceRecord } from '@/models/AttendanceRecord';
import { User } from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get all attendance records
    const attendanceRecords = await AttendanceRecord.find({})
      .sort({ timestamp: -1 });

    // Get all users to create a lookup map
    const users = await User.find({});
    const userMap = new Map();
    users.forEach(user => {
      userMap.set(user.rfid, user.name);
    });

    // Map attendance records with user names
    const recordsWithNames = attendanceRecords.map(record => ({
      _id: record._id,
      rfid: record.rfid,
      userName: userMap.get(record.rfid) || 'Unknown User',
      timestamp: record.timestamp,
      type: record.type,
    }));

    return NextResponse.json({
      success: true,
      data: recordsWithNames,
    });
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
