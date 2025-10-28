import mongoose, { Schema, Document } from 'mongoose';

export interface ISelectedSubject extends Document {
  subjectId: mongoose.Types.ObjectId;
  subjectName: string;
  courseCode: string;
  instructor: string;
  selectedAt: Date;
}

const SelectedSubjectSchema = new Schema<ISelectedSubject>({
  subjectId: {
    type: Schema.Types.ObjectId,
    ref: 'Subject',
    required: true,
  },
  subjectName: {
    type: String,
    required: true,
  },
  courseCode: {
    type: String,
    required: true,
  },
  instructor: {
    type: String,
    required: true,
  },
  selectedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true
});

// Ensure only one selected subject exists - we'll handle this in the API

export const SelectedSubject = mongoose.models.SelectedSubject || mongoose.model<ISelectedSubject>('SelectedSubject', SelectedSubjectSchema);
