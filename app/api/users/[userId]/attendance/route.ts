import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { AttendanceRecord } from '@/models/AttendanceRecord';
import { User } from '@/models/User';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await connectDB();

    const { userId } = await params;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get attendance records for this user
    const attendanceRecords = await AttendanceRecord.find({
      $or: [
        { userId: userId },
        { rfid: user.rfid }
      ]
    }).sort({ timestamp: -1 });

    // Group attendance by subject
    const attendanceBySubject: { [key: string]: {
      subjectId: string;
      subjectName: string;
      courseCode: string;
      instructor: string;
      records: any[];
      totalAttendance: number;
    } } = {};

    // Group records without subject
    const noSubjectRecords: any[] = [];

    attendanceRecords.forEach(record => {
      if (record.subjectId && record.subjectName) {
        const subjectKey = record.subjectId.toString();
        
        if (!attendanceBySubject[subjectKey]) {
          attendanceBySubject[subjectKey] = {
            subjectId: record.subjectId.toString(),
            subjectName: record.subjectName,
            courseCode: record.courseCode || '',
            instructor: record.instructor || '',
            records: [],
            totalAttendance: 0
          };
        }
        
        attendanceBySubject[subjectKey].records.push({
          _id: record._id,
          timestamp: record.timestamp,
          type: record.type,
          rfid: record.rfid
        });
        attendanceBySubject[subjectKey].totalAttendance++;
      } else {
        noSubjectRecords.push({
          _id: record._id,
          timestamp: record.timestamp,
          type: record.type,
          rfid: record.rfid
        });
      }
    });

    // Convert to array and add no subject group if exists
    const groupedAttendance = Object.values(attendanceBySubject);
    
    if (noSubjectRecords.length > 0) {
      groupedAttendance.push({
        subjectId: '',
        subjectName: 'No Subject',
        courseCode: '',
        instructor: '',
        records: noSubjectRecords,
        totalAttendance: noSubjectRecords.length
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          rfid: user.rfid,
          employeeId: user.employeeId,
          email: user.email
        },
        attendanceBySubject: groupedAttendance,
        totalRecords: attendanceRecords.length
      }
    });
  } catch (error) {
    console.error('Error fetching user attendance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
