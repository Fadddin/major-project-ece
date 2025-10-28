import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { SelectedSubject } from '@/models/SelectedSubject';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const selectedSubject = await SelectedSubject.findOne();
    const allSelectedSubjects = await SelectedSubject.find();
    const count = await SelectedSubject.countDocuments();

    return NextResponse.json({
      success: true,
      data: {
        selectedSubject,
        allSelectedSubjects,
        count,
        message: count === 0 ? 'No selected subject found' : 'Selected subject found'
      }
    });
  } catch (error) {
    console.error('Error fetching selected subject:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
