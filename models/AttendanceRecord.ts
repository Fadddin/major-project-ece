import mongoose, { Schema, Document } from 'mongoose';

export interface IAttendanceRecord extends Document {
  rfid?: string;
  fingerId?: string;
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
    required: false,
  },
  fingerId: {
    type: String,
    required: false,
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
    default: () => new Date(), // Use function to ensure it's called at document creation time
  },
  type: {
    type: String,
    enum: ['check-in', 'check-out'],
    required: true,
  },
});

// Validate that at least one identifier (rfid or fingerId) is present
AttendanceRecordSchema.pre('validate', function(next) {
  if (!this.rfid && !this.fingerId) {
    next(new Error('Either rfid or fingerId must be provided'));
  } else {
    next();
  }
});

// Force model refresh to ensure new fields are recognized
if (mongoose.models.AttendanceRecord) {
  delete mongoose.models.AttendanceRecord;
}

export const AttendanceRecord = mongoose.model<IAttendanceRecord>('AttendanceRecord', AttendanceRecordSchema);
