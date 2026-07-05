import { createServerSupabaseClient } from '@/lib/supabase/server'

export const QuizService = {

  // Get all quizzes for a course
  async getByCourse(courseId: string) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false })

    if (error) return []
    return data
  },

  // Get single quiz with questions
  async getById(id: string) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('quizzes')
      .select('*, quiz_questions(*)')
      .eq('id', id)
      .single()

    if (error) return null
    return data
  },

  // Create quiz
  async create(data: {
    tenant_id: string
    course_id: string
    title: string
    description?: string
    duration_mins?: number
    total_marks: number
  }) {
    const supabase = await createServerSupabaseClient()
    const { data: quiz, error } = await supabase
      .from('quizzes')
      .insert(data)
      .select()
      .single()

    if (error) return null
    return quiz
  },

  // Add question to quiz
  // Create quiz with all questions in one transaction
async createWithQuestions(data: {
  tenant_id: string
  course_id: string
  title: string
  description?: string
  duration_mins?: number
  total_marks: number
  questions: {
    question_text: string
    option_a: string
    option_b: string
    option_c?: string
    option_d?: string
    correct_option: string
    correct_options: string[]
    allow_multiple: boolean
    marks: number
  }[]
}) {
  const supabase = await createServerSupabaseClient()

  // Create quiz first
  const { data: quiz, error: quizError } = await supabase
    .from('quizzes')
    .insert({
      tenant_id: data.tenant_id,
      course_id: data.course_id,
      title: data.title,
      description: data.description,
      duration_mins: data.duration_mins,
      total_marks: data.total_marks,
    })
    .select()
    .single()

  if (quizError || !quiz) return null

  // Insert all questions
  if (data.questions.length > 0) {
    const { error: qError } = await supabase
      .from('quiz_questions')
      .insert(
        data.questions.map((q) => ({
          quiz_id: quiz.id,
          question_text: q.question_text,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c,
          option_d: q.option_d,
          correct_option: q.correct_option,
          correct_options: q.correct_options,
          allow_multiple: q.allow_multiple,
          marks: q.marks,
        }))
      )

    if (qError) return null
  }

  return quiz
},

// Get quiz with questions (for editing)
async getWithQuestions(quizId: string) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('quizzes')
    .select('*, quiz_questions(*)')
    .eq('id', quizId)
    .single()

  if (error) return null
  return data
},

// Update existing quiz questions (for editing)
async updateQuestions(
  quizId: string,
  questions: {
    question_text: string
    option_a: string
    option_b: string
    option_c?: string
    option_d?: string
    correct_option: string
    correct_options: string[]
    allow_multiple: boolean
    marks: number
  }[]
) {
  const supabase = await createServerSupabaseClient()

  // Delete all existing questions
  await supabase.from('quiz_questions').delete().eq('quiz_id', quizId)

  // Re-insert updated set
  if (questions.length > 0) {
    const { error } = await supabase
      .from('quiz_questions')
      .insert(
        questions.map((q) => ({
          quiz_id: quizId,
          question_text: q.question_text,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c,
          option_d: q.option_d,
          correct_option: q.correct_option,
          correct_options: q.correct_options,
          allow_multiple: q.allow_multiple,
          marks: q.marks,
        }))
      )
    if (error) return false
  }

  return true
},

// Get course quizzes WITH question count
async getByCourseWithCount(courseId: string) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('quizzes')
    .select('*, quiz_questions(id, question_text, option_a, option_b, option_c, option_d, correct_option, correct_options, allow_multiple, marks)')
    .eq('course_id', courseId)
    .order('created_at', { ascending: false })

  if (error) return []
  return data
},

  // Delete question
  async deleteQuestion(questionId: string) {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase
      .from('quiz_questions')
      .delete()
      .eq('id', questionId)
    return !error
  },

  // Delete quiz (cascades to questions)
  async delete(quizId: string) {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase
      .from('quizzes')
      .delete()
      .eq('id', quizId)
    return !error
  },

  // Check if student has already attempted a quiz
  async getAttempt(quizId: string, studentId: string) {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase
      .from('quiz_attempts')
      .select('*, quiz_answers(*)')
      .eq('quiz_id', quizId)
      .eq('student_id', studentId)
      .maybeSingle()

    return data
  },

  // Start a new quiz attempt
  async startAttempt(data: {
    tenant_id: string
    quiz_id: string
    student_id: string
  }) {
    const supabase = await createServerSupabaseClient()
    const { data: attempt, error } = await supabase
      .from('quiz_attempts')
      .insert({ ...data, started_at: new Date().toISOString() })
      .select()
      .single()

    if (error) return null
    return attempt
  },

  // Submit quiz attempt with answers — auto grades
  async submitAttempt(
  attemptId: string,
  quizId: string,
  answers: { questionId: string; selectedOption: string; selectedOptions?: string[] }[]
) {
  const supabase = await createServerSupabaseClient()

  const { data: questions } = await supabase
    .from('quiz_questions')
    .select('id, correct_option, correct_options, allow_multiple, marks')
    .eq('quiz_id', quizId)

  if (!questions) return null

  let totalScore = 0
  const answerRecords = answers.map((a) => {
    const question = questions.find((q) => q.id === a.questionId)
    const selectedOpts = a.selectedOptions ?? (a.selectedOption ? [a.selectedOption] : [])

    let isCorrect = false
    if (question?.allow_multiple) {
      const correctOpts: string[] = question.correct_options ?? [question.correct_option]
      isCorrect =
        correctOpts.length === selectedOpts.length &&
        correctOpts.every((o) => selectedOpts.includes(o))
    } else {
      isCorrect = question?.correct_option === selectedOpts[0]
    }

    if (isCorrect) totalScore += question?.marks ?? 0

    return {
      attempt_id: attemptId,
      question_id: a.questionId,
      selected_option: selectedOpts[0] ?? '',
      selected_options: selectedOpts,
      is_correct: isCorrect,
    }
  })

  await supabase.from('quiz_answers').insert(answerRecords)

  const { data: attempt, error } = await supabase
    .from('quiz_attempts')
    .update({
      score: totalScore,
      completed_at: new Date().toISOString(),
    })
    .eq('id', attemptId)
    .select()
    .single()

  if (error) return null
  return { ...attempt, totalScore }
},

  // Get all attempts for a quiz (teacher view)
  async getAttemptsByQuiz(quizId: string) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('quiz_attempts')
      .select('*, users!quiz_attempts_student_id_fkey(full_name, email)')
      .eq('quiz_id', quizId)
      .not('completed_at', 'is', null)
      .order('score', { ascending: false })

    if (error) return []
    return data
  },

  // Get all quiz results for a student
  async getStudentResults(studentId: string, tenantId: string) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('quiz_attempts')
      .select('*, quizzes(id, title, total_marks, course_id, courses(title))')
      .eq('student_id', studentId)
      .eq('tenant_id', tenantId)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })

    if (error) return []
    return data
  },
}