import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { CourseService } from '@/services/course.service'
import { AttendanceService } from '@/services/attendance.service'
import { AssignmentService } from '@/services/assignment.service'
import { QuizService } from '@/services/quiz.service'
import CourseBuilder from './CourseBuilder'

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const course = await CourseService.getById(id)
  if (!course) redirect('/teacher/courses')

  const modules = await CourseService.getModulesWithLessons(id)
  const studentCount = await CourseService.getEnrollmentCount(id)
  const enrolledStudents = await CourseService.getEnrolledStudents(id)
  const today = new Date().toISOString().split('T')[0]
  const todayAttendance = await AttendanceService.getByCourseAndDate(id, today)
  const attendanceHistory = await AttendanceService.getCourseHistory(id)
  const assignments = await AssignmentService.getByCourse(id)
const quizzes = await QuizService.getByCourseWithCount(id)
const quizzesWithAttempts = await Promise.all(
  quizzes.map(async (q: any) => ({
    ...q,
    attempts: await QuizService.getAttemptsByQuiz(q.id),
  }))
)
  const progressStats = await CourseService.getLessonProgressStats(id)

  return (
    <CourseBuilder
      course={course}
      initialModules={modules}
      studentCount={studentCount}
      enrolledStudents={enrolledStudents}
      todayAttendance={todayAttendance}
      attendanceHistory={attendanceHistory}
      assignments={assignments}
      quizzes={quizzesWithAttempts}
      progressStats={progressStats}
    />
  )
}