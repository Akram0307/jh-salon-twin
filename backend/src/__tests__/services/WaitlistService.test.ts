import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WaitlistService } from '../../services/WaitlistService';
import { WaitlistRepository } from '../../repositories/WaitlistRepository';

vi.mock('../../repositories/WaitlistRepository', () => ({
  WaitlistRepository: {
    getPendingByDate: vi.fn(),
    updateStatus: vi.fn(),
  },
}));

describe('WaitlistService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should process cancellation and notify pending waitlist entries', async () => {
    const pendingEntries = [
      { id: 'wl-1', client_id: 'client-1', preferred_time_range: 'morning' },
      { id: 'wl-2', client_id: 'client-2', preferred_time_range: 'afternoon' },
    ];
    vi.mocked(WaitlistRepository.getPendingByDate).mockResolvedValue(pendingEntries);
    vi.mocked(WaitlistRepository.updateStatus).mockResolvedValue(undefined);

    await WaitlistService.processCancellation('2024-01-15T10:00:00Z');

    expect(WaitlistRepository.getPendingByDate).toHaveBeenCalledWith('2024-01-15');
    expect(WaitlistRepository.updateStatus).toHaveBeenCalledTimes(2);
    expect(WaitlistRepository.updateStatus).toHaveBeenCalledWith('wl-1', 'notified');
    expect(WaitlistRepository.updateStatus).toHaveBeenCalledWith('wl-2', 'notified');
  });

  it('should handle no pending waitlist entries gracefully', async () => {
    vi.mocked(WaitlistRepository.getPendingByDate).mockResolvedValue([]);

    await WaitlistService.processCancellation('2024-01-15T10:00:00Z');

    expect(WaitlistRepository.getPendingByDate).toHaveBeenCalledWith('2024-01-15');
    expect(WaitlistRepository.updateStatus).not.toHaveBeenCalled();
  });

  it('should handle null result from repository gracefully', async () => {
    vi.mocked(WaitlistRepository.getPendingByDate).mockResolvedValue(null as any);

    await WaitlistService.processCancellation('2024-01-15T10:00:00Z');

    expect(WaitlistRepository.updateStatus).not.toHaveBeenCalled();
  });

  it('should handle repository errors gracefully', async () => {
    vi.mocked(WaitlistRepository.getPendingByDate).mockRejectedValue(new Error('DB down'));

    // Should not throw - error is caught internally
    await WaitlistService.processCancellation('2024-01-15T10:00:00Z');

    expect(WaitlistRepository.updateStatus).not.toHaveBeenCalled();
  });

  it('should parse date string correctly', async () => {
    vi.mocked(WaitlistRepository.getPendingByDate).mockResolvedValue([]);

    await WaitlistService.processCancellation('2024-06-15T14:30:00Z');

    expect(WaitlistRepository.getPendingByDate).toHaveBeenCalledWith('2024-06-15');
  });

  it('should handle Date object input', async () => {
    vi.mocked(WaitlistRepository.getPendingByDate).mockResolvedValue([]);

    await WaitlistService.processCancellation(new Date('2024-03-20T09:00:00Z'));

    expect(WaitlistRepository.getPendingByDate).toHaveBeenCalledWith('2024-03-20');
  });
});
