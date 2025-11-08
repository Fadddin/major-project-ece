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

    const { rfid, fingerId } = await request.json();
    console.log("gotten rfid and fingerId", rfid, fingerId);

    // Validate that at least one identifier is provided
    if (!rfid && !fingerId) {
      return NextResponse.json(
        { error: 'Either RFID or fingerId is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Use current time for the record
    const recordTimestamp = new Date();

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
      const attendanceRecord = new AttendanceRecord(attendanceRecordData);
      console.log('Created attendance record before save:', attendanceRecord);
      console.log('Attendance record toObject():', attendanceRecord.toObject());
      await attendanceRecord.save();
      console.log('Attendance record after save:', await AttendanceRecord.findById(attendanceRecord._id));

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
      const attendanceRecord = new AttendanceRecord(attendanceRecordData);
      console.log('Created unregistered user attendance record:', attendanceRecord);
      await attendanceRecord.save();

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
