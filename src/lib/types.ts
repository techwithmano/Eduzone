
import type { Timestamp } from "firebase/firestore";

export type UserProfile = {
  uid: string;
  displayName: string;
  email: string;
  role: 'STUDENT' | 'TEACHER';
  createdAt: Timestamp;
  enrolledClassroomIds: string[];
  createdClassroomIds: string[];
};

export type Classroom = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  subject: string;
  creatorId: string;
  creatorName: string;
  enrolledStudentIds: string[];
  createdAt: Timestamp;
};

export type Product = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  subject: string;
};

export type Announcement = {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: Timestamp;
};

export type Assignment = {
  id:string;
  title: string;
  description?: string;
  dueDate: Timestamp;
  createdAt: Timestamp;
};

export type Submission = {
  id: string; // Document ID is the student's UID
  studentId: string;
  studentName: string;
  content: string;
  submittedAt: Timestamp;
  resubmittedAt?: Timestamp;
};
