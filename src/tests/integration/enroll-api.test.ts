import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/courses/enroll/route';
import { createClient, getUser, incrementPopularity } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  getUser: vi.fn(),
  incrementPopularity: vi.fn(),
  decrementPopularity: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('POST /api/courses/enroll', () => {
  const mockUser = { id: 'user-123' };

  beforeEach(() => {
    vi.resetAllMocks();
    (getUser as any).mockResolvedValue(mockUser); // eslint-disable-line @typescript-eslint/no-explicit-any
  });

  it('should enroll a user in a course', async () => {
    const mockUpsert = vi.fn().mockResolvedValue({ error: null });
    const mockFrom = vi.fn().mockReturnValue({ upsert: mockUpsert });
    (createClient as any).mockResolvedValue({ from: mockFrom }); // eslint-disable-line @typescript-eslint/no-explicit-any

    const req = new Request('http://localhost/api/courses/enroll', {
      method: 'POST',
      body: JSON.stringify({
        courseId: 1,
        action: 'enroll'
      })
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockUpsert).toHaveBeenCalledWith(expect.objectContaining({
      course_id: 1,
      status: 'in_progress'
    }));
    expect(revalidatePath).toHaveBeenCalledWith('/courses');
  });

  it('should unenroll a user from a course', async () => {
    const mockMatch = vi.fn().mockResolvedValue({ error: null });
    const mockDelete = vi.fn().mockReturnValue({ match: mockMatch });
    const mockFrom = vi.fn().mockReturnValue({ delete: mockDelete });
    (createClient as any).mockResolvedValue({ from: mockFrom }); // eslint-disable-line @typescript-eslint/no-explicit-any

    const req = new Request('http://localhost/api/courses/enroll', {
      method: 'POST',
      body: JSON.stringify({
        courseId: 1,
        action: 'unenroll'
      })
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockMatch).toHaveBeenCalledWith({ user_id: mockUser.id, course_id: 1 });
  });

  it('should update progress and increment popularity when completed', async () => {
    const mockSingle = vi.fn().mockResolvedValue({ data: { status: 'in_progress' }, error: null });
    const mockMatchSelect = vi.fn().mockReturnValue({ single: mockSingle });
    
    const mockMatchUpdate = vi.fn().mockResolvedValue({ error: null });
    const mockUpdate = vi.fn().mockReturnValue({ match: mockMatchUpdate });
    
    const mockFrom = vi.fn((table: string) => {
      if (table === 'user_courses') {
        return {
          select: vi.fn().mockReturnThis(),
          match: mockMatchSelect,
          update: mockUpdate
        };
      }
      return {};
    });

    // Handle update's match separately since we need to match twice
    mockUpdate.mockReturnValue({ match: mockMatchUpdate });

    (createClient as any).mockResolvedValue({ from: mockFrom }); // eslint-disable-line @typescript-eslint/no-explicit-any

    const req = new Request('http://localhost/api/courses/enroll', {
      method: 'POST',
      body: JSON.stringify({
        courseId: 1,
        action: 'update_progress',
        progress: 100,
        gpa: 4.0
      })
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockMatchUpdate).toHaveBeenCalled();
    expect(incrementPopularity).toHaveBeenCalledWith(1);
  });
});
