import mongoose, { Schema, Document } from 'mongoose';

export interface ISubject extends Document {
  name: string;
  courseCode: string;
  instructor: string;
  createdAt: Date;
}

const SubjectSchema = new Schema<ISubject>({
  name: {
    type: String,
    required: true,
  },
  courseCode: {
    type: String,
    required: true,
    unique: true,
  },
  instructor: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true
});

export const Subject = mongoose.models.Subject || mongoose.model<ISubject>('Subject', SubjectSchema);
