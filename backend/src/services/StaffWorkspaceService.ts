import logger from '../config/logger';
const log = logger.child({ module: 'staff_workspace_service' });

export class StaffWorkspaceService {
  static async getAvailability(staffId: string): Promise<any> {
    log.warn({ staffId }, 'getAvailability not yet implemented');
    throw new Error('StaffWorkspaceService.getAvailability not implemented');
  }

  static async updateAvailability(params: { staffId: string; dayOfWeek: number; startTime: string; endTime: string; isAvailable: boolean }): Promise<any> {
    log.warn(params, 'updateAvailability not yet implemented');
    throw new Error('StaffWorkspaceService.updateAvailability not implemented');
  }

  static async getTimeoff(staffId: string): Promise<any> {
    log.warn({ staffId }, 'getTimeoff not yet implemented');
    throw new Error('StaffWorkspaceService.getTimeoff not implemented');
  }

  static async createTimeoff(params: { staffId: string; startDate: string; endDate: string; reason: string }): Promise<any> {
    log.warn(params, 'createTimeoff not yet implemented');
    throw new Error('StaffWorkspaceService.createTimeoff not implemented');
  }
}
