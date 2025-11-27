import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import { UnregisteredUser } from '@/models/UnregisteredUser';
import { AttendanceRecord } from '@/models/AttendanceRecord';
import { SelectedSubject } from '@/models/SelectedSubject';
import mongoose from 'mongoose';

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

/**
 * Validates and parses a time value into a valid Date object
 * Supports:
 * - ISO 8601 strings (e.g., "2024-01-15T10:30:00Z", "2024-01-15T10:30:00.000Z")
 * - Unix timestamps (milliseconds or seconds)
 * - Date strings parseable by Date constructor
 * 
 * @param time - Time value to parse (string, number, or Date)
 * @returns Valid Date object or null if invalid
 */
function parseTime(time: any): Date | null {
  if (!time) {
    return null;
  }

  // If it's already a Date object, validate it
  if (time instanceof Date) {
    return isNaN(time.getTime()) ? null : time;
  }

  // If it's a number, treat as timestamp (milliseconds or seconds)
  if (typeof time === 'number') {
    // If timestamp is in seconds (less than year 2000 in milliseconds), convert to milliseconds
    const timestamp = time < 946684800000 ? time * 1000 : time;
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? null : date;
  }

  // If it's a string, try to parse it
  if (typeof time === 'string') {
    // Try ISO 8601 format first (most common)
    const isoDate = new Date(time);
    if (!isNaN(isoDate.getTime())) {
      return isoDate;
    }

    // Try parsing as timestamp string
    const timestamp = Number(time);
    if (!isNaN(timestamp)) {
      const date = timestamp < 946684800000 ? new Date(timestamp * 1000) : new Date(timestamp);
      return isNaN(date.getTime()) ? null : date;
    }
  }

  return null;
}

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

    const { rfid, fingerId, time } = await request.json();
    console.log("Received rfid, fingerId, and time", { rfid, fingerId, time, timeType: typeof time });

    // Validate that at least one identifier is provided
    if (!rfid && !fingerId) {
      return NextResponse.json(
        { error: 'Either RFID or fingerId is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Parse and validate time format
    let recordTimestamp: Date;
    if (time) {
      const parsedTime = parseTime(time);
      if (!parsedTime) {
        console.error('Invalid time format received:', time);
        return NextResponse.json(
          { 
            error: 'Invalid time format. Please provide a valid ISO 8601 string (e.g., "2024-01-15T10:30:00Z") or Unix timestamp (milliseconds or seconds)',
            receivedTime: time,
            timeType: typeof time
          },
          { status: 400, headers: corsHeaders }
        );
      }
      recordTimestamp = parsedTime;
      console.log('Parsed time successfully:', {
        original: time,
        parsed: recordTimestamp.toISOString(),
        local: recordTimestamp.toLocaleString()
      });
    } else {
      recordTimestamp = new Date();
      console.log('No time provided, using current time:', recordTimestamp.toISOString());
    }

    // Get selected subject if any
    const selectedSubject = await SelectedSubject.findOne();
    console.log('Selected Subject Query Result:', selectedSubject);
    console.log('Selected Subject Count:', await SelectedSubject.countDocuments());
    
    // Debug: Check all selected subjects
    const allSelectedSubjects = await SelectedSubject.find();
    console.log('All Selected Subjects:', allSelectedSubjects);

    // Search for user by rfid or fingerId
    const searchQuery: any = {};
    if (rfid && fingerId) {
      // If both are provided, search for either
      searchQuery.$or = [{ rfid }, { fingerId }];
    } else if (rfid) {
      searchQuery.rfid = rfid;
    } else if (fingerId) {
      searchQuery.fingerId = fingerId;
    }

    const user = await User.findOne(searchQuery);
    
    // If both rfid and fingerId are present and no user found, this is a registration request
    if (rfid && fingerId && !user) {
      // Registration request - create new unregistered user
      let unregisteredUser = await UnregisteredUser.findOne({ 
        $or: [{ rfid }, { fingerId }] 
      });
      
      if (unregisteredUser) {
        // Update existing unregistered user with both fields
        if (!unregisteredUser.rfid && rfid) unregisteredUser.rfid = rfid;
        if (!unregisteredUser.fingerId && fingerId) unregisteredUser.fingerId = fingerId;
        unregisteredUser.scannedCount += 1;
        unregisteredUser.lastSeen = recordTimestamp;
        await unregisteredUser.save();
      } else {
        // Create new unregistered user with both rfid and fingerId
        unregisteredUser = new UnregisteredUser({
          rfid,
          fingerId,
          lastSeen: recordTimestamp,
          scannedCount: 1,
        });
        await unregisteredUser.save();
      }

      return NextResponse.json({
        success: true,
        message: 'Unregistered user registered successfully',
        unregisteredUser: {
          rfid: unregisteredUser.rfid,
          fingerId: unregisteredUser.fingerId,
          scannedCount: unregisteredUser.scannedCount,
          lastSeen: unregisteredUser.lastSeen,
        },
      }, { headers: corsHeaders });
    }
    
    if (user) {
      // User is registered - increment attendance and create record
      user.attendance += 1;
      await user.save();

      // Create attendance record with subject data if available
      const attendanceRecordData: any = {
        userId: new mongoose.Types.ObjectId(user._id),
        timestamp: recordTimestamp,
        type: 'check-in',
      };

      // Add rfid or fingerId to record if available
      if (user.rfid) attendanceRecordData.rfid = user.rfid;
      if (user.fingerId) attendanceRecordData.fingerId = user.fingerId;

      // Add subject data if selected subject exists
      if (selectedSubject) {
        console.log('Adding subject data to attendance record:', {
          subjectId: selectedSubject.subjectId,
          subjectName: selectedSubject.subjectName,
          courseCode: selectedSubject.courseCode,
          instructor: selectedSubject.instructor
        });
        attendanceRecordData.subjectId = new mongoose.Types.ObjectId(selectedSubject.subjectId);
        attendanceRecordData.subjectName = selectedSubject.subjectName;
        attendanceRecordData.courseCode = selectedSubject.courseCode;
        attendanceRecordData.instructor = selectedSubject.instructor;
      } else {
        console.log('No selected subject found, creating record without subject data');
      }

      console.log('Final attendance record data:', attendanceRecordData);
      console.log('Timestamp being set:', {
        recordTimestamp,
        isoString: recordTimestamp.toISOString(),
        timestampValue: attendanceRecordData.timestamp
      });
      const attendanceRecord = new AttendanceRecord(attendanceRecordData);
      // Explicitly set timestamp to ensure it's not overridden by default
      attendanceRecord.timestamp = recordTimestamp;
      console.log('Created attendance record before save:', {
        timestamp: attendanceRecord.timestamp,
        timestampISO: attendanceRecord.timestamp.toISOString()
      });
      await attendanceRecord.save();
      const savedRecord = await AttendanceRecord.findById(attendanceRecord._id);
      console.log('Attendance record after save:', {
        _id: savedRecord?._id,
        timestamp: savedRecord?.timestamp,
        timestampISO: savedRecord?.timestamp?.toISOString()
      });

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
      let unregisteredUser = await UnregisteredUser.findOne(searchQuery);
      
      if (unregisteredUser) {
        // Update existing unregistered user
        unregisteredUser.scannedCount += 1;
        unregisteredUser.lastSeen = recordTimestamp;
        // Update missing fields if provided
        if (rfid && !unregisteredUser.rfid) unregisteredUser.rfid = rfid;
        if (fingerId && !unregisteredUser.fingerId) unregisteredUser.fingerId = fingerId;
        await unregisteredUser.save();
      } else {
        // Create new unregistered user
        unregisteredUser = new UnregisteredUser({
          rfid: rfid || undefined,
          fingerId: fingerId || undefined,
          lastSeen: recordTimestamp,
          scannedCount: 1,
        });
        await unregisteredUser.save();
      }

      // Create attendance record for unregistered user with subject data if available
      const attendanceRecordData: any = {
        timestamp: recordTimestamp,
        type: 'check-in',
      };

      // Add rfid or fingerId to record if available
      if (rfid) attendanceRecordData.rfid = rfid;
      if (fingerId) attendanceRecordData.fingerId = fingerId;

      // Add subject data if selected subject exists
      if (selectedSubject) {
        console.log('Adding subject data to unregistered user attendance record:', {
          subjectId: selectedSubject.subjectId,
          subjectName: selectedSubject.subjectName,
          courseCode: selectedSubject.courseCode,
          instructor: selectedSubject.instructor
        });
        attendanceRecordData.subjectId = new mongoose.Types.ObjectId(selectedSubject.subjectId);
        attendanceRecordData.subjectName = selectedSubject.subjectName;
        attendanceRecordData.courseCode = selectedSubject.courseCode;
        attendanceRecordData.instructor = selectedSubject.instructor;
      } else {
        console.log('No selected subject found for unregistered user, creating record without subject data');
      }

      console.log('Final unregistered user attendance record data:', attendanceRecordData);
      console.log('Timestamp being set for unregistered user:', {
        recordTimestamp,
        isoString: recordTimestamp.toISOString(),
        timestampValue: attendanceRecordData.timestamp
      });
      const attendanceRecord = new AttendanceRecord(attendanceRecordData);
      // Explicitly set timestamp to ensure it's not overridden by default
      attendanceRecord.timestamp = recordTimestamp;
      console.log('Created unregistered user attendance record:', {
        timestamp: attendanceRecord.timestamp,
        timestampISO: attendanceRecord.timestamp.toISOString()
      });
      await attendanceRecord.save();
      const savedRecord = await AttendanceRecord.findById(attendanceRecord._id);
      console.log('Unregistered user attendance record after save:', {
        _id: savedRecord?._id,
        timestamp: savedRecord?.timestamp,
        timestampISO: savedRecord?.timestamp?.toISOString()
      });

      return NextResponse.json({
        success: true,
        message: 'Unregistered user scanned',
        unregisteredUser: {
          rfid: unregisteredUser.rfid,
          fingerId: unregisteredUser.fingerId,
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
  // return NextResponse.json({
  //   success: true,
  //   message: 'Unregistered user scanned',
  //   unregisteredUser: {
  //     rfid: "dfsd",
  //     fingerId: "12",
  //     scannedCount: "1",
  //     lastSeen: "3",
  //   },
  //   timestamp: "643",
  // }, { headers: corsHeaders });
}
