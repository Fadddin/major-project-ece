import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { AttendanceRecord } from '@/models/AttendanceRecord';
import { User } from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get pagination parameters from query string
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const dateFilter = searchParams.get('date') || '';

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Build filter object
    const filter: any = {};
    
    if (search) {
      // Get user IDs that match the search term
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { rfid: { $regex: search, $options: 'i' } },
          { fingerId: { $regex: search, $options: 'i' } }
        ]
      });
      const rfids = users.map(user => user.rfid).filter(Boolean);
      const fingerIds = users.map(user => user.fingerId).filter(Boolean);
      
      filter.$or = [
        { rfid: { $in: rfids } },
        { fingerId: { $in: fingerIds } },
        { rfid: { $regex: search, $options: 'i' } },
        { fingerId: { $regex: search, $options: 'i' } }
      ];
    }

    if (dateFilter) {
      const startDate = new Date(dateFilter);
      const endDate = new Date(dateFilter);
      endDate.setDate(endDate.getDate() + 1);
      
      filter.timestamp = {
        $gte: startDate,
        $lt: endDate
      };
    }

    // Get total count for pagination
    const totalRecords = await AttendanceRecord.countDocuments(filter);
    const totalPages = Math.ceil(totalRecords / limit);

    // Get paginated attendance records
    const attendanceRecords = await AttendanceRecord.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    // Get all users to create a lookup map (by both rfid and fingerId)
    const users = await User.find({});
    const userMapByRfid = new Map();
    const userMapByFingerId = new Map();
    users.forEach(user => {
      if (user.rfid) {
        userMapByRfid.set(user.rfid, user.name);
      }
      if (user.fingerId) {
        userMapByFingerId.set(user.fingerId, user.name);
      }
    });

    // Map attendance records with user names and subject data
    const recordsWithNames = attendanceRecords.map(record => {
      console.log('Processing attendance record:', {
        _id: record._id,
        rfid: record.rfid,
        fingerId: record.fingerId,
        subjectId: record.subjectId,
        subjectName: record.subjectName,
        courseCode: record.courseCode,
        instructor: record.instructor,
        timestamp: record.timestamp
      });
      
      // Look up user name by rfid or fingerId
      const userName = record.rfid 
        ? userMapByRfid.get(record.rfid)
        : record.fingerId 
          ? userMapByFingerId.get(record.fingerId)
          : null;
      
      return {
        _id: record._id,
        rfid: record.rfid,
        fingerId: record.fingerId,
        userName: userName || 'Unknown User',
        timestamp: record.timestamp,
        type: record.type,
        subjectId: record.subjectId,
        subjectName: record.subjectName,
        courseCode: record.courseCode,
        instructor: record.instructor,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        records: recordsWithNames,
        pagination: {
          currentPage: page,
          totalPages,
          totalRecords,
          limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      },
    });
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
