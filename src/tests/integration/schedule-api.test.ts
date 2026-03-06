import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/schedule/route';
import { createClient, getUser } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  getUser: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('POST /api/schedule', () => {
  const mockUser = { id: 'user-123' };

  beforeEach(() => {
    vi.resetAllMocks();
    (getUser as any).mockResolvedValue(mockUser); // eslint-disable-line @typescript-eslint/no-explicit-any
  });

  describe('action: toggle_complete', () => {
    it('should create a new log if none exists', async () => {
      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      const mockFrom = vi.fn((table: string) => {
        if (table === 'study_logs') {
          return {
            select: vi.fn().mockReturnThis(),
            match: vi.fn().mockReturnThis(),
            single: mockSingle,
            insert: mockInsert
          };
        }
        return {};
      });

      (createClient as any).mockResolvedValue({ from: mockFrom }); // eslint-disable-line @typescript-eslint/no-explicit-any

      const req = new Request('http://localhost/api/schedule', {
        method: 'POST',
        body: JSON.stringify({
          action: 'toggle_complete',
          scheduleId: 456,
          date: '2026-03-07'
        })
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        course_schedule_id: 456,
        is_completed: true
      }));
      expect(revalidatePath).toHaveBeenCalled();
    });

    it('should toggle existing log if it exists', async () => {
      const mockSingle = vi.fn().mockResolvedValue({ data: { id: 1, is_completed: true }, error: null });
      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      
      const mockFrom = vi.fn((table: string) => {
        if (table === 'study_logs') {
          return {
            select: vi.fn().mockReturnThis(),
            match: vi.fn().mockReturnThis(),
            single: mockSingle,
            update: mockUpdate,
            eq: mockEq
          };
        }
        return {};
      });

      (createClient as any).mockResolvedValue({ from: mockFrom }); // eslint-disable-line @typescript-eslint/no-explicit-any

      const req = new Request('http://localhost/api/schedule', {
        method: 'POST',
        body: JSON.stringify({
          action: 'toggle_complete',
          assignmentId: 789,
          date: '2026-03-07'
        })
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
        is_completed: false
      }));
    });
  });

  describe('action: add_plan', () => {
    it('should add a new manual plan', async () => {
      const mockInsert = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({ data: { id: 101 }, error: null });

      const mockFrom = vi.fn((table: string) => {
        if (table === 'study_plans') {
          return { insert: mockInsert, select: mockSelect, single: mockSingle };
        }
        return {};
      });

      (createClient as any).mockResolvedValue({ from: mockFrom }); // eslint-disable-line @typescript-eslint/no-explicit-any

      const req = new Request('http://localhost/api/schedule', {
        method: 'POST',
        body: JSON.stringify({
          action: 'add_plan',
          courseId: 1,
          startDate: '2026-03-01',
          endDate: '2026-06-01',
          daysOfWeek: [1, 3, 5]
        })
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.id).toBe(101);
      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        course_id: 1,
        days_of_week: [1, 3, 5]
      }));
    });
  });
});
