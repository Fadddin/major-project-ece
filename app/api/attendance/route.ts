import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import { UnregisteredUser } from '@/models/UnregisteredUser';
import { AttendanceRecord } from '@/models/AttendanceRecord';
import mongoose from 'mongoose';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { rfid } = await request.json();

    if (!rfid) {
      return NextResponse.json(
        { error: 'RFID is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await User.findOne({ rfid });
    
    if (user) {
      // User is registered - increment attendance and create record
      user.attendance += 1;
      await user.save();

      // Create attendance record
      const attendanceRecord = new AttendanceRecord({
        rfid,
        userId: new mongoose.Types.ObjectId(user._id),
        timestamp: new Date(),
        type: 'check-in', // You can modify this logic based on your requirements
      });
      await attendanceRecord.save();

      return NextResponse.json({
        success: true,
        message: 'Attendance recorded successfully',
        user: {
          name: user.name,
          employeeId: user.employeeId,
          attendance: user.attendance,
        },
        timestamp: attendanceRecord.timestamp,
      });
    } else {
      // User is not registered - handle unregistered user
      let unregisteredUser = await UnregisteredUser.findOne({ rfid });
      
      if (unregisteredUser) {
        // Update existing unregistered user
        unregisteredUser.scannedCount += 1;
        unregisteredUser.lastSeen = new Date();
        await unregisteredUser.save();
      } else {
        // Create new unregistered user
        unregisteredUser = new UnregisteredUser({
          rfid,
          lastSeen: new Date(),
          scannedCount: 1,
        });
        await unregisteredUser.save();
      }

      // Create attendance record for unregistered user
      const attendanceRecord = new AttendanceRecord({
        rfid,
        timestamp: new Date(),
        type: 'check-in',
      });
      await attendanceRecord.save();

      return NextResponse.json({
        success: true,
        message: 'Unregistered user scanned',
        unregisteredUser: {
          rfid: unregisteredUser.rfid,
          scannedCount: unregisteredUser.scannedCount,
          lastSeen: unregisteredUser.lastSeen,
        },
        timestamp: attendanceRecord.timestamp,
      });
    }
  } catch (error) {
    console.error('Error processing RFID scan:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
