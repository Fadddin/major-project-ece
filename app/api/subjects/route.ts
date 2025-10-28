import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Subject } from '@/models/Subject';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const subjects = await Subject.find()
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: subjects,
    });
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { name, courseCode, instructor } = await request.json();

    if (!name || !courseCode || !instructor) {
      return NextResponse.json(
        { error: 'Name, course code, and instructor are required' },
        { status: 400 }
      );
    }

    // Check if subject with same course code already exists
    const existingSubject = await Subject.findOne({ courseCode });
    if (existingSubject) {
      return NextResponse.json(
        { error: 'Subject with this course code already exists' },
        { status: 400 }
      );
    }

    const subject = new Subject({
      name,
      courseCode,
      instructor,
    });

    await subject.save();

    return NextResponse.json({
      success: true,
      message: 'Subject created successfully',
      subject,
    });
  } catch (error) {
    console.error('Error creating subject:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const { id, name, courseCode, instructor } = await request.json();

    if (!id || !name || !courseCode || !instructor) {
      return NextResponse.json(
        { error: 'ID, name, course code, and instructor are required' },
        { status: 400 }
      );
    }

    // Check if subject exists
    const existingSubject = await Subject.findById(id);
    if (!existingSubject) {
      return NextResponse.json(
        { error: 'Subject not found' },
        { status: 404 }
      );
    }

    // Check for duplicate course code (excluding current subject)
    const duplicateSubject = await Subject.findOne({
      courseCode,
      _id: { $ne: id }
    });
    if (duplicateSubject) {
      return NextResponse.json(
        { error: 'Subject with this course code already exists' },
        { status: 400 }
      );
    }

    const updatedSubject = await Subject.findByIdAndUpdate(
      id,
      { name, courseCode, instructor },
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Subject updated successfully',
      subject: updatedSubject,
    });
  } catch (error) {
    console.error('Error updating subject:', error);
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
        { error: 'Subject ID is required' },
        { status: 400 }
      );
    }

    // Check if subject exists
    const existingSubject = await Subject.findById(id);
    if (!existingSubject) {
      return NextResponse.json(
        { error: 'Subject not found' },
        { status: 404 }
      );
    }

    await Subject.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Subject deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting subject:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
