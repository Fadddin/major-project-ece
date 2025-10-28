import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  userId?: mongoose.Types.ObjectId;
  rfid: string;
  name: string;
  employeeId: string;
  attendance: number;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  userId: {
    type: Schema.Types.ObjectId,
    required: false,
  },
  rfid: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  employeeId: {
    type: String,
    required: true,
    unique: true,
  },
  attendance: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true
});

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
