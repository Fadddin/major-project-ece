import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { AttendanceRecord } from '@/models/AttendanceRecord';
import { User } from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const userId = searchParams.get('userId');

    // Build query
    let query: any = {};
    
    if (startDate && endDate) {
      query.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (userId) {
      query.userId = userId;
    }

    // Get attendance records
    const attendanceRecords = await AttendanceRecord.find(query)
      .populate('userId', 'name employeeId')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    const totalRecords = await AttendanceRecord.countDocuments(query);

    // Get statistics
    const stats = await AttendanceRecord.aggregate([
      {
        $match: query,
      },
      {
        $group: {
          _id: null,
          totalScans: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' },
        },
      },
      {
        $project: {
          totalScans: 1,
          uniqueUsersCount: { $size: '$uniqueUsers' },
        },
      },
    ]);

    return NextResponse.json({
      success: true,
      data: {
        records: attendanceRecords,
        pagination: {
          page,
          limit,
          total: totalRecords,
          pages: Math.ceil(totalRecords / limit),
        },
        stats: stats[0] || { totalScans: 0, uniqueUsersCount: 0 },
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
