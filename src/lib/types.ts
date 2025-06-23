
import type { Timestamp, FieldValue } from "firebase/firestore";

export type UserProfile = {
  uid: string;
  displayName: string | null;
  email: string;
  photoURL?: string | null;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
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
  displayTeacherName?: string;
  enrolledStudentIds: string[];
  teacherIds?: string[];
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
  id:string;
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
  content?: string;
  submittedAt: Timestamp;
  resubmittedAt?: Timestamp;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
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
    type: 'multiple-choice' | 'typed-answer';
    // Only for multiple-choice
    options?: string[];
    correctAnswer?: number; // index of the correct option
};

export type QuizAnswer = {
    question: string;
    questionType: 'multiple-choice' | 'typed-answer';
    studentAnswer: string | number; // string for typed, number index for mcq
    isCorrect?: boolean; // undefined for pending review, true/false after grading
    teacherFeedback?: string;
    correctAnswer?: number; // Store the correct answer index for review
    options?: string[];
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
    answers: QuizAnswer[];
    score: number; // Initially score from auto-graded questions, then final score
    status: 'auto-graded' | 'pending-review' | 'fully-graded';
    totalQuestions: number;
    submittedAt: Timestamp;
};
