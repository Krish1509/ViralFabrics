import { NextRequest } from 'next/server';
import Log, { ILogModel } from '@/models/Log';
import { getSession } from '@/lib/session';

export interface LogData {
  action: string;
  resource: string;
  resourceId?: string;
  details?: any;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  duration?: number;
  success?: boolean;
  severity?: 'info' | 'warning' | 'error' | 'critical';
}

export interface UserInfo {
  userId: string;
  username: string;
  userRole: string;
}

// Get user info from session
export async function getUserInfo(request?: NextRequest): Promise<UserInfo | null> {
  try {
    if (!request) {
      console.log('No request provided to getUserInfo');
      return null;
    }
    
    const session = await getSession(request);
    console.log('Session retrieved:', session);
    
    if (!session) {
      console.log('No session found in getUserInfo');
      return null;
    }
    
    const userInfo = {
      userId: session.id || 'unknown',
      username: session.username || session.name || 'unknown',
      userRole: session.role || 'user'
    };
    
    console.log('User info created:', userInfo);
    return userInfo;
  } catch (error) {
    console.error('Error getting user info:', error);
    return null;
  }
}

// Get client info from request
export function getClientInfo(request: NextRequest) {
  const ipAddress = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown';
  
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  return { ipAddress, userAgent };
}

// Main logging function
export async function logAction(logData: LogData, request?: NextRequest): Promise<void> {
  try {
    console.log('logAction called with:', { logData, hasRequest: !!request });
    
    const userInfo = await getUserInfo(request);
    console.log('User info from getUserInfo:', userInfo);
    
    const clientInfo = request ? getClientInfo(request) : { ipAddress: 'unknown', userAgent: 'unknown' };
    
    if (!userInfo) {
      console.log('No user info, logging as system action');
      // Log as system action if no user info
      await (Log as ILogModel).logUserAction({
        userId: 'system',
        username: 'system',
        userRole: 'system',
        ...logData,
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent
      });
      return;
    }
    
    console.log('Logging with user info:', userInfo);
    await (Log as ILogModel).logUserAction({
      ...userInfo,
      ...logData,
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent
    });
  } catch (error) {
    console.error('Error logging action:', error);
    // Don't throw error to avoid breaking the main functionality
  }
}

// Convenience functions for common actions
export async function logLogin(username: string, success: boolean, request?: NextRequest, errorMessage?: string) {
  try {
    const clientInfo = request ? getClientInfo(request) : { ipAddress: 'unknown', userAgent: 'unknown' };
    
    // For login actions, we don't have a session yet, so we create the log directly
    await (Log as ILogModel).logUserAction({
      userId: 'login-process',
      username: username,
      userRole: 'system', // Will be updated when user logs in successfully
      action: success ? 'login' : 'login_failed',
      resource: 'auth',
      details: {
        username,
        errorMessage: errorMessage || undefined
      },
      success,
      severity: success ? 'info' : 'warning',
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent
    });
  } catch (error) {
    console.error('Error logging login action:', error);
    // Don't throw error to avoid breaking the main functionality
  }
}



export async function logLogout(request?: NextRequest) {
  await logAction({
    action: 'logout',
    resource: 'auth',
    success: true,
    severity: 'info'
  }, request);
}

export async function logCreate(resource: string, resourceId: string, details?: any, request?: NextRequest) {
  await logAction({
    action: `${resource}_create`,
    resource,
    resourceId,
    details,
    success: true,
    severity: 'info'
  }, request);
}

export async function logUpdate(resource: string, resourceId: string, oldValues?: any, newValues?: any, request?: NextRequest) {
  await logAction({
    action: `${resource}_update`,
    resource,
    resourceId,
    details: {
      oldValues,
      newValues
    },
    success: true,
    severity: 'info'
  }, request);
}

export async function logDelete(resource: string, resourceId: string, details?: any, request?: NextRequest) {
  await logAction({
    action: `${resource}_delete`,
    resource,
    resourceId,
    details,
    success: true,
    severity: 'warning'
  }, request);
}

export async function logView(resource: string, resourceId?: string, request?: NextRequest) {
  await logAction({
    action: 'view',
    resource,
    resourceId,
    success: true,
    severity: 'info'
  }, request);
}

export async function logError(action: string, resource: string, errorMessage: string, request?: NextRequest) {
  await logAction({
    action,
    resource,
    details: {
      errorMessage
    },
    success: false,
    severity: 'error'
  }, request);
}

// Higher-order function to wrap API routes with logging
export function withLogging<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  action: string,
  resource: string,
  getResourceId?: (...args: T) => string | undefined
) {
  return async (...args: T): Promise<R> => {
    const startTime = Date.now();
    let success = true;
    let errorMessage: string | undefined;
    
    try {
      const result = await fn(...args);
      return result;
    } catch (error) {
      success = false;
      errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    } finally {
      const duration = Date.now() - startTime;
      const resourceId = getResourceId ? getResourceId(...args) : undefined;
      
      await logAction({
        action,
        resource,
        resourceId,
        details: {
          duration,
          errorMessage
        },
        success,
        severity: success ? 'info' : 'error'
      });
    }
  };
}

// Middleware for logging API requests
export async function logApiRequest(
  request: NextRequest,
  action: string,
  resource: string,
  resourceId?: string,
  additionalDetails?: any
) {
  const startTime = Date.now();
  
  return {
    logSuccess: async (responseStatus?: number) => {
      const duration = Date.now() - startTime;
      await logAction({
        action,
        resource,
        resourceId,
        details: {
          method: request.method,
          endpoint: request.url,
          responseStatus,
          duration,
          ...additionalDetails
        },
        success: true,
        severity: 'info'
      }, request);
    },
    logError: async (errorMessage: string, responseStatus?: number) => {
      const duration = Date.now() - startTime;
      await logAction({
        action,
        resource,
        resourceId,
        details: {
          method: request.method,
          endpoint: request.url,
          responseStatus,
          errorMessage,
          duration,
          ...additionalDetails
        },
        success: false,
        severity: 'error'
      }, request);
    }
  };
}
