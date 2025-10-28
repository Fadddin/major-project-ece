import mongoose, { Schema, Document } from 'mongoose';

export interface IAttendanceRecord extends Document {
  rfid: string;
  userId?: mongoose.Types.ObjectId;
  subjectId?: mongoose.Types.ObjectId;
  subjectName?: string;
  courseCode?: string;
  instructor?: string;
  timestamp: Date;
  type: 'check-in' | 'check-out';
}

const AttendanceRecordSchema = new Schema<IAttendanceRecord>({
  rfid: {
    type: String,
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  subjectId: {
    type: Schema.Types.ObjectId,
    ref: 'Subject',
    required: false,
  },
  subjectName: {
    type: String,
    required: false,
  },
  courseCode: {
    type: String,
    required: false,
  },
  instructor: {
    type: String,
    required: false,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  type: {
    type: String,
    enum: ['check-in', 'check-out'],
    required: true,
  },
});

// Force model refresh to ensure new fields are recognized
if (mongoose.models.AttendanceRecord) {
  delete mongoose.models.AttendanceRecord;
}

export const AttendanceRecord = mongoose.model<IAttendanceRecord>('AttendanceRecord', AttendanceRecordSchema);
