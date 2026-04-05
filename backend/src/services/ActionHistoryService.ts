import { ActionHistoryRepository, LogActionParams, ActionHistory } from '../repositories/ActionHistoryRepository';
import { logInfo, logError } from '../config/logger';

export interface UndoActionParams {
  actionId: string;
  salonId: string;
  userId: string;
  userType: 'owner' | 'staff' | 'manager' | 'system';
}

export interface RedoActionParams {
  actionId: string;
  salonId: string;
  userId: string;
  userType: 'owner' | 'staff' | 'manager' | 'system';
}

export class ActionHistoryService {
  private actionHistoryRepository: ActionHistoryRepository;

  constructor() {
    this.actionHistoryRepository = new ActionHistoryRepository();
  }

  async logAction(params: LogActionParams): Promise<ActionHistory> {
    try {
      const action = await this.actionHistoryRepository.logAction(params);
      logInfo('Action logged', {
        actionId: action.id,
        actionType: action.action_type,
        entityType: action.entity_type,
        entityId: action.entity_id,
        userId: action.user_id,
        salonId: action.salon_id
      });
      return action;
    } catch (error) {
      logError(error as Error, 'unknown', {
        operation: 'logAction',
        params
      });
      throw error;
    }
  }

  async getActionHistory(
    salonId: string,
    options: {
      userId?: string;
      entityType?: string;
      entityId?: string;
      actionType?: string;
      limit?: number;
      offset?: number;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ): Promise<{ actions: ActionHistory[]; total: number }> {
    try {
      return await this.actionHistoryRepository.getActionHistory(salonId, options);
    } catch (error) {
      logError(error as Error, 'unknown', {
        operation: 'getActionHistory',
        salonId,
        options
      });
      throw error;
    }
  }

  async getActionById(actionId: string): Promise<ActionHistory | null> {
    try {
      return await this.actionHistoryRepository.getActionById(actionId);
    } catch (error) {
      logError(error as Error, 'unknown', {
        operation: 'getActionById',
        actionId
      });
      throw error;
    }
  }

  async undoAction(params: UndoActionParams): Promise<{ success: boolean; message: string; action?: ActionHistory }> {
    try {
      const action = await this.actionHistoryRepository.getActionById(params.actionId);
      
      if (!action) {
        return {
          success: false,
          message: 'Action not found'
        };
      }

      if (action.salon_id !== params.salonId) {
        return {
          success: false,
          message: 'Action does not belong to this salon'
        };
      }

      if (!action.is_undoable || action.undone_at) {
        return {
          success: false,
          message: 'Action cannot be undone'
        };
      }

      // Mark the action as undone
      const updatedAction = await this.actionHistoryRepository.markAsUndone(params.actionId);
      
      if (!updatedAction) {
        return {
          success: false,
          message: 'Failed to mark action as undone'
        };
      }

      logInfo('Action undone', {
        actionId: params.actionId,
        userId: params.userId,
        salonId: params.salonId
      });

      return {
        success: true,
        message: 'Action undone successfully',
        action: updatedAction
      };
    } catch (error) {
      logError(error as Error, 'unknown', {
        operation: 'undoAction',
        params
      });
      return {
        success: false,
        message: 'Failed to undo action'
      };
    }
  }

  async redoAction(params: RedoActionParams): Promise<{ success: boolean; message: string; action?: ActionHistory }> {
    try {
      const action = await this.actionHistoryRepository.getActionById(params.actionId);
      
      if (!action) {
        return {
          success: false,
          message: 'Action not found'
        };
      }

      if (action.salon_id !== params.salonId) {
        return {
          success: false,
          message: 'Action does not belong to this salon'
        };
      }

      if (action.is_undoable || !action.undone_at || action.redone_at) {
        return {
          success: false,
          message: 'Action cannot be redone'
        };
      }

      // Mark the action as redone
      const updatedAction = await this.actionHistoryRepository.markAsRedone(params.actionId);
      
      if (!updatedAction) {
        return {
          success: false,
          message: 'Failed to mark action as redone'
        };
      }

      logInfo('Action redone', {
        actionId: params.actionId,
        userId: params.userId,
        salonId: params.salonId
      });

      return {
        success: true,
        message: 'Action redone successfully',
        action: updatedAction
      };
    } catch (error) {
      logError(error as Error, 'unknown', {
        operation: 'redoAction',
        params
      });
      return {
        success: false,
        message: 'Failed to redo action'
      };
    }
  }

  async getUndoableActions(salonId: string, userId?: string): Promise<ActionHistory[]> {
    try {
      return await this.actionHistoryRepository.getUndoableActions(salonId, userId);
    } catch (error) {
      logError(error as Error, 'unknown', {
        operation: 'getUndoableActions',
        salonId,
        userId
      });
      throw error;
    }
  }

  async getRedoableActions(salonId: string, userId?: string): Promise<ActionHistory[]> {
    try {
      return await this.actionHistoryRepository.getRedoableActions(salonId, userId);
    } catch (error) {
      logError(error as Error, 'unknown', {
        operation: 'getRedoableActions',
        salonId,
        userId
      });
      throw error;
    }
  }
}
