import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import { UnregisteredUser } from '@/models/UnregisteredUser';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { rfid, name, employeeId, email } = await request.json();

    if (!rfid || !name) {
      return NextResponse.json(
        { error: 'RFID and name are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUserQuery: any = [{ rfid }];
    if (employeeId) existingUserQuery.push({ employeeId });
    if (email) existingUserQuery.push({ email });

    const existingUser = await User.findOne({
      $or: existingUserQuery,
    });

    if (existingUser) {
      let errorMessage = 'User with this RFID already exists';
      if (existingUser.employeeId === employeeId && employeeId) {
        errorMessage = 'User with this Employee ID already exists';
      } else if (existingUser.email === email && email) {
        errorMessage = 'User with this email already exists';
      }
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    // Check if unregistered user exists
    const unregisteredUser = await UnregisteredUser.findOne({ rfid });

    // Create new user
    const userData: any = {
      rfid,
      name,
      attendance: 0,
    };
    
    if (employeeId) userData.employeeId = employeeId;
    if (email) userData.email = email;

    const user = new User(userData);

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
        email: user.email,
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
