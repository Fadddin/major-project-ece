import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import { UnregisteredUser } from '@/models/UnregisteredUser';
import { AttendanceRecord } from '@/models/AttendanceRecord';
import mongoose from 'mongoose';

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// Handle preflight OPTIONS requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { rfid, timestamp } = await request.json();

    if (!rfid) {
      return NextResponse.json(
        { error: 'RFID is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Parse the provided timestamp or use current time as fallback
    const recordTimestamp = timestamp ? new Date(timestamp) : new Date();

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
        timestamp: recordTimestamp,
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
      }, { headers: corsHeaders });
    } else {
      // User is not registered - handle unregistered user
      let unregisteredUser = await UnregisteredUser.findOne({ rfid });
      
      if (unregisteredUser) {
        // Update existing unregistered user
        unregisteredUser.scannedCount += 1;
        unregisteredUser.lastSeen = recordTimestamp;
        await unregisteredUser.save();
      } else {
        // Create new unregistered user
        unregisteredUser = new UnregisteredUser({
          rfid,
          lastSeen: recordTimestamp,
          scannedCount: 1,
        });
        await unregisteredUser.save();
      }

      // Create attendance record for unregistered user
      const attendanceRecord = new AttendanceRecord({
        rfid,
        timestamp: recordTimestamp,
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
      }, { headers: corsHeaders });
    }
  } catch (error) {
    console.error('Error processing RFID scan:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
