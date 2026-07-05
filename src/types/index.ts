export type UserRole =
  | "super_admin"
  | "institution_admin"
  | "teacher"
  | "student";

export type CourseStatus = "draft" | "published" | "archived";

export type LessonType = "video" | "document" | "text";

export type EnrollmentStatus = "active" | "completed" | "dropped";

export type SubmissionStatus = "submitted" | "graded" | "late";

export type AttendanceStatus = "present" | "absent" | "late";

// Tenant/Institution
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string;
  is_active: boolean;
  created_at: string;
}

// User
export interface User {
  id: string;
  tenant_id: string | null;
  full_name: string;
  email: string;
  avatar_url: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

// Course
export interface Course {
  id: string;
  tenant_id: string;
  teacher_id: string | null;
  department_id: string | null;
  session_id: string | null;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  status: CourseStatus;
  created_at: string;
}

// Module
export interface Module {
  id: string;
  tenant_id: string;
  course_id: string;
  title: string;
  order_index: number;
  created_at: string;
}

// Lesson
export interface Lesson {
  id: string;
  tenant_id: string;
  module_id: string;
  title: string;
  type: LessonType;
  content_url: string | null;
  duration_mins: number | null;
  order_index: number;
  created_at: string;
}

// Enrollment
export interface Enrollment {
  id: string;
  tenant_id: string;
  student_id: string;
  course_id: string;
  status: EnrollmentStatus;
  enrolled_at: string;
}

// Assignment
export interface Assignment {
  id: string;
  tenant_id: string;
  course_id: string;
  teacher_id: string | null;
  title: string;
  description: string | null;
  due_date: string | null;
  max_marks: number;
  created_at: string;
}

// Quiz
export interface Quiz {
  id: string;
  tenant_id: string;
  course_id: string;
  title: string;
  duration_mins: number | null;
  total_marks: number;
  created_at: string;
}

// Stats (for dashboards)
export interface AdminStats {
  totalInstitutions: number;
  totalTeachers: number;
  totalStudents: number;
  totalCourses: number;
}

export interface TenantWithStats extends Tenant {
  teacherCount: number;
  studentCount: number;
  courseCount: number;
}
