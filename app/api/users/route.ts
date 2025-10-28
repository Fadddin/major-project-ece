import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import { UnregisteredUser } from '@/models/UnregisteredUser';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Get registered users
    const users = await User.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalUsers = await User.countDocuments();

    // Get unregistered users
    const unregisteredUsers = await UnregisteredUser.find()
      .sort({ lastSeen: -1 })
      .skip(skip)
      .limit(limit);

    const totalUnregisteredUsers = await UnregisteredUser.countDocuments();

    return NextResponse.json({
      success: true,
      data: {
        users: {
          users: users,
          pagination: {
            page,
            limit,
            total: totalUsers,
            pages: Math.ceil(totalUsers / limit),
          },
        },
        unregisteredUsers: {
          unregisteredUsers: unregisteredUsers,
          pagination: {
            page,
            limit,
            total: totalUnregisteredUsers,
            pages: Math.ceil(totalUnregisteredUsers / limit),
          },
        },
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const { id, name, employeeId, email } = await request.json();

    if (!id || !name) {
      return NextResponse.json(
        { error: 'User ID and name are required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check for duplicate employeeId or email (excluding current user)
    const duplicateQuery: any = [];
    if (employeeId) duplicateQuery.push({ employeeId, _id: { $ne: id } });
    if (email) duplicateQuery.push({ email, _id: { $ne: id } });

    if (duplicateQuery.length > 0) {
      const duplicateUser = await User.findOne({ $or: duplicateQuery });
      if (duplicateUser) {
        let errorMessage = 'User with this Employee ID already exists';
        if (duplicateUser.email === email && email) {
          errorMessage = 'User with this email already exists';
        }
        return NextResponse.json(
          { error: errorMessage },
          { status: 400 }
        );
      }
    }

    // Update user
    const updateData: any = { name };
    if (employeeId !== undefined) updateData.employeeId = employeeId || null;
    if (email !== undefined) updateData.email = email || null;

    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Delete user
    await User.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
