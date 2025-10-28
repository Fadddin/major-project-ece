import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { UnregisteredUser } from '@/models/UnregisteredUser';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Get unregistered users
    const unregisteredUsers = await UnregisteredUser.find()
      .sort({ lastSeen: -1 })
      .skip(skip)
      .limit(limit);

    const totalUnregisteredUsers = await UnregisteredUser.countDocuments();

    return NextResponse.json({
      success: true,
      data: {
        unregisteredUsers,
        pagination: {
          page,
          limit,
          total: totalUnregisteredUsers,
          pages: Math.ceil(totalUnregisteredUsers / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching unregistered users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
