import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/dashboard/stats/route';
import { createClient, getUser } from '@/lib/supabase/server';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  getUser: vi.fn(),
  mapCourseFromRow: vi.fn((row) => ({ id: row.id, title: row.title })),
}));

describe('GET /api/dashboard/stats', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    (getUser as any).mockResolvedValue(null); // eslint-disable-line @typescript-eslint/no-explicit-any
    const res = await GET();
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('should fetch and aggregate dashboard statistics', async () => {
    const mockUser = { id: 'user-123' };
    (getUser as any).mockResolvedValue(mockUser); // eslint-disable-line @typescript-eslint/no-explicit-any

    const mockRpc = vi.fn().mockResolvedValue({
      data: [
        { 
          event_date: '2026-03-07', 
          source_type: 'study_plan', 
          plan_id: 1, 
          title: 'Study Session', 
          is_completed: true 
        },
        { 
          event_date: '2026-03-07', 
          source_type: 'workout', 
          workout_id: 2, 
          title: 'Gym', 
          is_completed: false 
        }
      ]
    });

    const mockFrom = vi.fn((table: string) => {
      if (table === 'courses') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          neq: vi.fn().mockResolvedValue({
            data: [{ id: 1, title: 'Course 1', user_courses: { status: 'in_progress', progress: 50, updated_at: '2026-03-01T12:00:00Z' } }]
          })
        };
      }
      if (table === 'study_logs') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({
            data: [{ log_date: '2026-03-07', is_completed: true }]
          })
        };
      }
      if (table === 'user_workout_logs') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({
            data: [{ log_date: '2026-03-07', is_attended: true }]
          })
        };
      }
      if (table === 'course_fields') {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockResolvedValue({
            data: [{ fields: { name: 'CS' } }]
          })
        };
      }
      return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ data: [] }) };
    });

    (createClient as any).mockResolvedValue({ // eslint-disable-line @typescript-eslint/no-explicit-any
      rpc: mockRpc,
      from: mockFrom
    });

    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.routine).toHaveLength(2);
    expect(data.momentum.inProgressCount).toBe(1);
    expect(data.momentum.studyDoneToday).toBe(1);
    expect(data.execution.studyLogs).toHaveLength(1);
    expect(data.identity.primaryFocus).toBe('CS');
    
    expect(mockRpc).toHaveBeenCalledWith('get_user_schedule', expect.objectContaining({
      p_user_id: mockUser.id
    }));
  });

  it('should handle internal server errors', async () => {
    (getUser as any).mockResolvedValue({ id: 'user-123' }); // eslint-disable-line @typescript-eslint/no-explicit-any
    (createClient as any).mockImplementation(() => { // eslint-disable-line @typescript-eslint/no-explicit-any
      throw new Error('Supabase failure');
    });

    const res = await GET();
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe('Internal Server Error');
  });
});
