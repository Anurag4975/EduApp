import { createServerSupabaseClient } from '@/lib/supabase/server'

export type FeeStatus = 'pending' | 'partial' | 'paid' | 'overdue' | 'waived'
export type PaymentMethod = 'cash' | 'bank_transfer' | 'online' | 'cheque'

export const FeeService = {

  // Get full fee summary for a student (uses RPC)
  async getStudentFeeSummary(studentId: string, tenantId: string) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .rpc('get_student_fee_summary', {
        p_student_id: studentId,
        p_tenant_id: tenantId,
      })
    if (error) return []
    return data
  },

  // Get all fee records for a tenant (uses RPC)
  async getTenantFeeOverview(tenantId: string) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .rpc('get_tenant_fee_overview', { p_tenant_id: tenantId })
    if (error) return []
    return data
  },

  // Get payments for a fee record
  async getPayments(feeRecordId: string) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('fee_payments')
      .select('*, users!fee_payments_recorded_by_fkey(full_name)')
      .eq('fee_record_id', feeRecordId)
      .order('created_at', { ascending: false })
    if (error) return []
    return data
  },

  // Get all payments for a student
  async getStudentPayments(studentId: string) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('fee_payments')
      .select('*, fee_records(title), users!fee_payments_recorded_by_fkey(full_name)')
      .eq('student_id', studentId)
      .order('payment_date', { ascending: false })
    if (error) return []
    return data
  },

  // Create a fee record
  async createFeeRecord(data: {
    tenant_id: string
    student_id: string
    title: string
    academic_session?: string
    base_amount: number
    discount_amount?: number
    due_date: string
    notes?: string
    created_by: string
  }) {
    const supabase = await createServerSupabaseClient()
    const { data: record, error } = await supabase
      .from('fee_records')
      .insert({
        ...data,
        discount_amount: data.discount_amount ?? 0,
        penalty_amount: 0,
        status: 'pending',
      })
      .select()
      .single()
    if (error) return null
    return record
  },

  // Bulk create fee records for multiple students
  async createBulkFeeRecords(data: {
    tenant_id: string
    student_ids: string[]
    title: string
    academic_session?: string
    base_amount: number
    due_date: string
    notes?: string
    created_by: string
  }) {
    const supabase = await createServerSupabaseClient()
    const records = data.student_ids.map((student_id) => ({
      tenant_id: data.tenant_id,
      student_id,
      title: data.title,
      academic_session: data.academic_session,
      base_amount: data.base_amount,
      discount_amount: 0,
      penalty_amount: 0,
      due_date: data.due_date,
      notes: data.notes,
      status: 'pending',
      created_by: data.created_by,
    }))
    const { error } = await supabase.from('fee_records').insert(records)
    return !error
  },

  // Update fee record (only if not locked)
  async updateFeeRecord(feeRecordId: string, data: {
    title?: string
    base_amount?: number
    discount_amount?: number
    due_date?: string
    notes?: string
    academic_session?: string
  }) {
    const supabase = await createServerSupabaseClient()

    // Check if locked
    const { data: record } = await supabase
      .from('fee_records')
      .select('is_locked')
      .eq('id', feeRecordId)
      .single()

    if (record?.is_locked && data.base_amount !== undefined) {
      return { success: false, error: 'Cannot edit amount — payments exist. Void all payments first.' }
    }

    const { error } = await supabase
      .from('fee_records')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', feeRecordId)

    return error ? { success: false, error: error.message } : { success: true }
  },

  // Add penalty to a fee record
  async addPenalty(feeRecordId: string, penaltyAmount: number) {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase
      .from('fee_records')
      .update({ penalty_amount: penaltyAmount, updated_at: new Date().toISOString() })
      .eq('id', feeRecordId)
    return !error
  },

  // Waive a fee record
  async waiveFeeRecord(feeRecordId: string, waivedBy: string, reason: string) {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase
      .from('fee_records')
      .update({
        status: 'waived',
        waived_by: waivedBy,
        waived_at: new Date().toISOString(),
        waived_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', feeRecordId)
    return !error
  },

  // Delete fee record (only if no payments)
  async deleteFeeRecord(feeRecordId: string) {
    const supabase = await createServerSupabaseClient()

    const { count } = await supabase
      .from('fee_payments')
      .select('id', { count: 'exact', head: true })
      .eq('fee_record_id', feeRecordId)
      .eq('is_voided', false)

    if ((count ?? 0) > 0) {
      return { success: false, error: 'Cannot delete — payments exist. Waive the fee instead.' }
    }

    const { error } = await supabase
      .from('fee_records')
      .delete()
      .eq('id', feeRecordId)

    return error ? { success: false, error: error.message } : { success: true }
  },

  // Record a payment
  async recordPayment(data: {
    tenant_id: string
    student_id: string
    fee_record_id: string
    amount: number
    payment_date: string
    payment_method: PaymentMethod
    reference_number?: string
    notes?: string
    recorded_by: string
  }) {
    const supabase = await createServerSupabaseClient()

    // Get current balance
    const summary = await this.getStudentFeeSummary(data.student_id, data.tenant_id)
    const record = summary.find((r: any) => r.fee_record_id === data.fee_record_id)

    if (!record) return { success: false, error: 'Fee record not found.' }

    if (data.amount > record.balance) {
      return {
        success: false,
        error: `Amount exceeds balance of ${record.balance}. Use a smaller amount or confirm advance payment.`,
      }
    }

    // Insert payment
    const { error: paymentError } = await supabase
      .from('fee_payments')
      .insert(data)

    if (paymentError) return { success: false, error: paymentError.message }

    // Lock the fee record so base_amount can't be changed
    await supabase
      .from('fee_records')
      .update({ is_locked: true, updated_at: new Date().toISOString() })
      .eq('id', data.fee_record_id)

    return { success: true }
  },

  // Void a payment (soft delete)
  async voidPayment(paymentId: string, voidedBy: string, reason: string) {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase
      .from('fee_payments')
      .update({
        is_voided: true,
        voided_by: voidedBy,
        voided_at: new Date().toISOString(),
        voided_reason: reason,
      })
      .eq('id', paymentId)
    return !error
  },

  // Get fee settings for a tenant
  async getFeeSettings(tenantId: string) {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase
      .from('tenants')
      .select('fee_penalty_enabled, fee_penalty_type, fee_penalty_value, fee_grace_period_days, fee_currency_symbol')
      .eq('id', tenantId)
      .single()
    return data
  },

  // Update fee settings
  async updateFeeSettings(tenantId: string, settings: {
    fee_penalty_enabled?: boolean
    fee_penalty_type?: string
    fee_penalty_value?: number
    fee_grace_period_days?: number
    fee_currency_symbol?: string
  }) {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase
      .from('tenants')
      .update(settings)
      .eq('id', tenantId)
    return !error
  },

  // Calculate penalty amount for a fee record
  calculatePenalty(
    balance: number,
    penaltyType: string,
    penaltyValue: number
  ): number {
    if (penaltyType === 'percentage') {
      return Math.round((balance * penaltyValue) / 100)
    }
    return penaltyValue
  },

  // Format currency
  formatAmount(amount: number, symbol = '₹'): string {
    return `${symbol}${amount.toLocaleString('en-IN')}`
  },
}