import mongoose, { Schema, Document } from 'mongoose';

export interface IAttendanceRecord extends Document {
  rfid: string;
  userId?: mongoose.Types.ObjectId;
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

export const AttendanceRecord = mongoose.models.AttendanceRecord || mongoose.model<IAttendanceRecord>('AttendanceRecord', AttendanceRecordSchema);
