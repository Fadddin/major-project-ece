import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import { UnregisteredUser } from '@/models/UnregisteredUser';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { rfid, name, employeeId } = await request.json();

    if (!rfid || !name || !employeeId) {
      return NextResponse.json(
        { error: 'RFID, name, and employeeId are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ rfid }, { employeeId }],
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this RFID or Employee ID already exists' },
        { status: 400 }
      );
    }

    // Check if unregistered user exists
    const unregisteredUser = await UnregisteredUser.findOne({ rfid });

    // Create new user
    const user = new User({
      rfid,
      name,
      employeeId,
      attendance: 0,
    });

    await user.save();

    // Remove from unregistered users if exists
    if (unregisteredUser) {
      await UnregisteredUser.findByIdAndDelete(unregisteredUser._id);
    }

    return NextResponse.json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user._id,
        rfid: user.rfid,
        name: user.name,
        employeeId: user.employeeId,
        attendance: user.attendance,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Error registering user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
