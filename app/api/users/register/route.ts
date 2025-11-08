import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import { UnregisteredUser } from '@/models/UnregisteredUser';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { rfid, fingerId, name, employeeId, email } = await request.json();

    if ((!rfid && !fingerId) || !name) {
      return NextResponse.json(
        { error: 'Either RFID or fingerId, and name are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUserQuery: any = [];
    if (rfid) existingUserQuery.push({ rfid });
    if (fingerId) existingUserQuery.push({ fingerId });
    if (employeeId) existingUserQuery.push({ employeeId });
    if (email) existingUserQuery.push({ email });

    const existingUser = await User.findOne({
      $or: existingUserQuery,
    });

    if (existingUser) {
      let errorMessage = 'User already exists';
      if (existingUser.rfid === rfid && rfid) {
        errorMessage = 'User with this RFID already exists';
      } else if (existingUser.fingerId === fingerId && fingerId) {
        errorMessage = 'User with this fingerId already exists';
      } else if (existingUser.employeeId === employeeId && employeeId) {
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
    const unregisteredUserQuery: any = [];
    if (rfid) unregisteredUserQuery.push({ rfid });
    if (fingerId) unregisteredUserQuery.push({ fingerId });
    
    const unregisteredUser = unregisteredUserQuery.length > 0 
      ? await UnregisteredUser.findOne({ $or: unregisteredUserQuery })
      : null;

    // Create new user
    const userData: any = {
      name,
      attendance: 0,
    };
    
    if (rfid) userData.rfid = rfid;
    if (fingerId) userData.fingerId = fingerId;
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
        fingerId: user.fingerId,
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
