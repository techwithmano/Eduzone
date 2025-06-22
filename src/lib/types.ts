
import type { Timestamp, FieldValue } from "firebase/firestore";

export type UserProfile = {
  uid: string;
  displayName: string | null;
  email: string;
  photoURL?: string | null;
  role: 'STUDENT' | 'TEACHER';
  createdAt: Timestamp | FieldValue;
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
  category: string;
  language: string;
  priceKWD: number;
  imageUrl: string;
  creatorId: string;
  creatorName: string;
  createdAt: Timestamp;
  dataAiHint?: string;
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

export type Material = {
  id: string;
  title: string;
  description?: string;
  link: string;
  createdAt: Timestamp;
};

export type QuizQuestion = {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number; // index of the correct option
};

export type Quiz = {
  id: string;
  title: string;
  description?: string;
  questions: QuizQuestion[];
  createdAt: Timestamp;
};

export type QuizSubmission = {
    id: string; // Document ID is student's UID
    studentId: string;
    studentName: string;
    answers: { question: string; answer: number }[];
    score: number;
    totalQuestions: number;
    submittedAt: Timestamp;
};
