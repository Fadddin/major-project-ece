import mongoose, { Schema, Document } from 'mongoose';

export interface IUnregisteredUser extends Document {
  rfid: string;
  lastSeen: Date;
  scannedCount: number;
}

const UnregisteredUserSchema = new Schema<IUnregisteredUser>({
  rfid: {
    type: String,
    required: true,
    unique: true,
  },
  lastSeen: {
    type: Date,
    default: Date.now,
  },
  scannedCount: {
    type: Number,
    default: 1,
  },
});

export const UnregisteredUser = mongoose.models.UnregisteredUser || mongoose.model<IUnregisteredUser>('UnregisteredUser', UnregisteredUserSchema);
