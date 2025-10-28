import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { SelectedSubject } from '@/models/SelectedSubject';
import { Subject } from '@/models/Subject';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const selectedSubject = await SelectedSubject.findOne()
      .populate('subjectId', 'name courseCode instructor');

    return NextResponse.json({
      success: true,
      data: selectedSubject,
    });
  } catch (error) {
    console.error('Error fetching selected subject:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { subjectId } = await request.json();

    if (!subjectId) {
      return NextResponse.json(
        { error: 'Subject ID is required' },
        { status: 400 }
      );
    }

    // Check if subject exists
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return NextResponse.json(
        { error: 'Subject not found' },
        { status: 404 }
      );
    }

    // Remove any existing selected subject
    await SelectedSubject.deleteMany({});

    // Create new selected subject
    const selectedSubject = new SelectedSubject({
      subjectId: subject._id,
      subjectName: subject.name,
      courseCode: subject.courseCode,
      instructor: subject.instructor,
    });

    await selectedSubject.save();

    return NextResponse.json({
      success: true,
      message: 'Subject selected successfully',
      data: selectedSubject,
    });
  } catch (error) {
    console.error('Error selecting subject:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    // Remove selected subject
    await SelectedSubject.deleteMany({});

    return NextResponse.json({
      success: true,
      message: 'Selected subject cleared successfully',
    });
  } catch (error) {
    console.error('Error clearing selected subject:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
