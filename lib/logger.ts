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

// Optimized order logging function
export async function logOrderChange(
  action: 'create' | 'update' | 'delete' | 'status_change',
  orderId: string,
  oldValues: any,
  newValues: any,
  request?: NextRequest
): Promise<void> {
  console.log('🔍 DEBUG: logOrderChange called with:', { action, orderId });
  try {
    const userInfo = await getUserInfo(request);
    
    // Extract only changed fields for better performance
    const changedFields = getChangedFields(oldValues, newValues);
    
    const logData: LogData = {
      action: `order_${action}`,
      resource: 'order',
      resourceId: orderId,
      details: {
        changedFields,
        oldValues: changedFields.old,
        newValues: changedFields.new,
        changeSummary: changedFields.summary
      },
      success: true,
      severity: 'info'
    };
    
    await logAction(logData, request);
  } catch (error) {
    console.error('Error logging order change:', error);
    console.error('Error details:', error);
  }
}

// Helper function to get only changed fields
function getChangedFields(oldValues: any, newValues: any) {
  
  
  
  const changed: any = {};
  const old: any = {};
  const new_: any = {};
  const summary: string[] = [];
  
  // Define important fields to track with their display names
  const fieldsToTrack = [
    { key: 'orderType', name: 'Order Type' },
    { key: 'arrivalDate', name: 'Arrival Date' },
    { key: 'contactName', name: 'Contact Name' },
    { key: 'contactPhone', name: 'Contact Phone' },
    { key: 'poNumber', name: 'PO Number' },
    { key: 'styleNo', name: 'Style Number' },
    { key: 'poDate', name: 'PO Date' },
    { key: 'deliveryDate', name: 'Delivery Date' },
    { key: 'status', name: 'Status' }
  ];
  
  // Track all field changes
  fieldsToTrack.forEach(({ key, name }) => {
    const oldVal = oldValues[key];
    const newVal = newValues[key];
    
    // Proper comparison for different data types
    let hasChanged = false;
    
    if (oldVal instanceof Date && newVal instanceof Date) {
      hasChanged = oldVal.getTime() !== newVal.getTime();
    } else if (oldVal && typeof oldVal === 'object' && newVal && typeof newVal === 'object') {
      // For objects (like populated party/quality), compare by ID or name
      if (oldVal._id && newVal._id) {
        hasChanged = oldVal._id.toString() !== newVal._id.toString();
      } else if (oldVal.name && newVal.name) {
        hasChanged = oldVal.name !== newVal.name;
      } else {
        hasChanged = JSON.stringify(oldVal) !== JSON.stringify(newVal);
      }
    } else {
      // Handle string comparisons including empty strings
      if (typeof oldVal === 'string' && typeof newVal === 'string') {
        hasChanged = oldVal.trim() !== newVal.trim();
      } else if (oldVal === null || oldVal === undefined || oldVal === '') {
        hasChanged = newVal !== null && newVal !== undefined && newVal !== '';
      } else if (newVal === null || newVal === undefined || newVal === '') {
        hasChanged = oldVal !== null && oldVal !== undefined && oldVal !== '';
      } else {
        hasChanged = oldVal !== newVal;
      }
    }
    

    
    if (hasChanged) {
      old[key] = oldVal;
      new_[key] = newVal;
      changed[key] = { from: oldVal, to: newVal };
      
      // Create human-readable summary with proper formatting
      const fromText = formatValue(oldVal);
      const toText = formatValue(newVal);
      summary.push(`${name}: ${fromText} → ${toText}`);
    }
  });

  // Enhanced item tracking - capture EVERY detail with 100% depth
  if (oldValues.items || newValues.items) {
    const oldItems = oldValues.items || [];
    const newItems = newValues.items || [];
    

    
    // Check for item count changes
    if (oldItems.length !== newItems.length) {

      if (newItems.length > oldItems.length) {
        summary.push(`📦 Items: Added ${newItems.length - oldItems.length} new item(s) (Total: ${oldItems.length} → ${newItems.length})`);
      } else {
        summary.push(`🗑️ Items: Removed ${oldItems.length - newItems.length} item(s) (Total: ${oldItems.length} → ${newItems.length})`);
      }
    }
    
    // Track individual item changes with maximum detail
    const maxItems = Math.max(oldItems.length, newItems.length);
    for (let i = 0; i < maxItems; i++) {
      const oldItem = oldItems[i];
      const newItem = newItems[i];
      

      
      if (!oldItem && newItem) {
        // New item added - show ALL details
        summary.push(`✨ Item ${i + 1}: Added new item`);
        
        // Always show quality and quantity even if they're default values
        if (newItem.quality) {
          summary.push(`  📋 Quality: "${formatValue(newItem.quality)}"`);
        } else {
          summary.push(`  📋 Quality: Not set`);
        }
        
        if (newItem.quantity !== undefined && newItem.quantity !== null) {
          summary.push(`  🔢 Quantity: ${formatValue(newItem.quantity)}`);
        } else {
          summary.push(`  🔢 Quantity: Not set`);
        }
        
        if (newItem.description && newItem.description.trim()) {
          summary.push(`  📝 Description: "${formatValue(newItem.description)}"`);
        } else {
          summary.push(`  📝 Description: Not set`);
        }
        
        if (newItem.imageUrls && newItem.imageUrls.length > 0) {
          summary.push(`  📷 Images: Added ${newItem.imageUrls.length} image(s)`);
          newItem.imageUrls.forEach((url: string, imgIndex: number) => {
            const fileName = url.split('/').pop() || url;
            summary.push(`    - Image ${imgIndex + 1}: ${fileName}`);
          });
        } else {
          summary.push(`  📷 Images: No images added`);
        }
        
      } else if (oldItem && !newItem) {
        // Item removed - show what was removed with full details
        summary.push(`🗑️ Item ${i + 1}: Removed item`);
        if (oldItem.quality) summary.push(`  - Had Quality: "${formatValue(oldItem.quality)}"`);
        if (oldItem.quantity) summary.push(`  - Had Quantity: ${formatValue(oldItem.quantity)}`);
        if (oldItem.description) summary.push(`  - Had Description: "${formatValue(oldItem.description)}"`);
        if (oldItem.imageUrls && oldItem.imageUrls.length > 0) {
          summary.push(`  - Had ${oldItem.imageUrls.length} image(s):`);
          oldItem.imageUrls.forEach((url: string, imgIndex: number) => {
            const fileName = url.split('/').pop() || url;
            summary.push(`    - Image ${imgIndex + 1}: ${fileName}`);
          });
        }
        
      } else if (oldItem && newItem) {
        // Item modified - track EVERY field change with maximum detail
        const itemChanges: string[] = [];
        let hasChanges = false;
        

        
        // Quality changes
        let qualityChanged = false;
        if (oldItem.quality && newItem.quality) {
          if (oldItem.quality._id && newItem.quality._id) {
            qualityChanged = oldItem.quality._id.toString() !== newItem.quality._id.toString();
          } else if (oldItem.quality.name && newItem.quality.name) {
            qualityChanged = oldItem.quality.name !== newItem.quality.name;
          } else {
            qualityChanged = oldItem.quality !== newItem.quality;
          }
        } else if (oldItem.quality || newItem.quality) {
          // One is null/undefined, the other exists - this is a change
          qualityChanged = true;
        }
        
        if (qualityChanged) {
          const oldQuality = formatValue(oldItem.quality);
          const newQuality = formatValue(newItem.quality);
          itemChanges.push(`Quality: "${oldQuality}" → "${newQuality}"`);
          hasChanges = true;
        }
        
        // Quantity changes
        if (oldItem.quantity !== newItem.quantity) {
  
          itemChanges.push(`Quantity: ${formatValue(oldItem.quantity)} → ${formatValue(newItem.quantity)}`);
          hasChanges = true;
        }
        
        // Description changes
        let descriptionChanged = false;
        if (oldItem.description && newItem.description) {
          descriptionChanged = oldItem.description.trim() !== newItem.description.trim();
        } else if (oldItem.description || newItem.description) {
          // One is null/undefined/empty, the other exists - this is a change
          descriptionChanged = true;
        }
        
        if (descriptionChanged) {
          itemChanges.push(`Description: "${formatValue(oldItem.description)}" → "${formatValue(newItem.description)}"`);
          hasChanges = true;
        }
        
        // Enhanced image tracking with 100% detail
        const oldImages = oldItem.imageUrls || [];
        const newImages = newItem.imageUrls || [];
        
        if (oldImages.length !== newImages.length) {
          if (newImages.length > oldImages.length) {
            const added = newImages.length - oldImages.length;
            itemChanges.push(`Images: Added ${added} new image(s)`);
            // Show the new images with file names
            newImages.slice(oldImages.length).forEach((url: string, imgIndex: number) => {
              const fileName = url.split('/').pop() || url;
              itemChanges.push(`  - New Image: ${fileName}`);
            });
          } else {
            const removed = oldImages.length - newImages.length;
            itemChanges.push(`Images: Removed ${removed} image(s)`);
            // Show which images were removed
            oldImages.slice(newImages.length).forEach((url: string, imgIndex: number) => {
              const fileName = url.split('/').pop() || url;
              itemChanges.push(`  - Removed Image: ${fileName}`);
            });
          }
          hasChanges = true;
        } else if (oldImages.length > 0 && newImages.length > 0) {
          // Check if any specific images changed
          const oldUrls = oldImages.map((url: string) => url.split('/').pop() || url);
          const newUrls = newImages.map((url: string) => url.split('/').pop() || url);
          
          if (JSON.stringify(oldUrls) !== JSON.stringify(newUrls)) {
            itemChanges.push(`Images: Changed image files`);
            // Show before and after image lists
            itemChanges.push(`  - Before: ${oldUrls.join(', ')}`);
            itemChanges.push(`  - After: ${newUrls.join(', ')}`);
            hasChanges = true;
          }
        }
        
        if (hasChanges) {
          summary.push(`✏️ Item ${i + 1}: ${itemChanges.join(', ')}`);
        }
      }
    }
  }
  
  // Track party changes if present
  let partyChanged = false;
  if (oldValues.party && newValues.party) {
    if (oldValues.party._id && newValues.party._id) {
      partyChanged = oldValues.party._id.toString() !== newValues.party._id.toString();
    } else if (oldValues.party.name && newValues.party.name) {
      partyChanged = oldValues.party.name !== newValues.party.name;
    } else {
      partyChanged = oldValues.party !== newValues.party;
    }
  } else if (oldValues.party || newValues.party) {
    // One is null/undefined, the other exists - this is a change
    partyChanged = true;
  }
  

  
  if (partyChanged) {
    summary.push(`🏢 Party: "${formatValue(oldValues.party)}" → "${formatValue(newValues.party)}"`);
  }
  
  // Track any other fields that might have changed
  const allOldKeys = Object.keys(oldValues || {});
  const allNewKeys = Object.keys(newValues || {});
  const allKeys = [...new Set([...allOldKeys, ...allNewKeys])];
  
  allKeys.forEach(key => {
    if (!fieldsToTrack.find(f => f.key === key) && key !== 'items' && key !== 'party') {
      const oldVal = oldValues[key];
      const newVal = newValues[key];
      
      if (oldVal !== newVal) {
        summary.push(`${key}: "${formatValue(oldVal)}" → "${formatValue(newVal)}"`);
      }
    }
  });
  

  
  return { changed, old, new: new_, summary };
}



// Helper function to format values for display
function formatValue(value: any): string {
  if (value === null || value === undefined) return 'Not set';
  if (value instanceof Date) return value.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  if (typeof value === 'string') {
    // Remove quotes for cleaner display
    return value.trim() || 'Empty';
  }
  if (typeof value === 'number') {
    return value.toString();
  }
  // Handle quality objects (populated from database)
  if (value && typeof value === 'object' && value.name) {
    return value.name;
  }
  // Handle party objects (populated from database)
  if (value && typeof value === 'object' && value.name) {
    return value.name;
  }
  // Handle arrays (like imageUrls)
  if (Array.isArray(value)) {
    if (value.length === 0) return 'No images';
    return `Added ${value.length} image(s)`;
  }
  // For any other object, try to get a meaningful string representation
  if (value && typeof value === 'object') {
    // If it has an _id, it's likely a database object
    if (value._id) {
      return value.name || value._id.toString();
    }
    // Try to stringify for debugging
    try {
      return JSON.stringify(value);
    } catch {
      return 'Object';
    }
  }
  return String(value);
}

// Main logging function
export async function logAction(logData: LogData, request?: NextRequest): Promise<void> {
  try {
    const userInfo = await getUserInfo(request);
    console.log('User info from getUserInfo:', userInfo);
    
    if (!userInfo) {
      console.log('No user info, logging as system action');
      // Try to get user info from request headers or cookies as fallback
      let fallbackUsername = 'Unknown User';
      let fallbackUserId = 'unknown';
      let fallbackUserRole = 'user';
      
      if (request) {
        // Try to extract user info from cookies or headers
        const authHeader = request.headers.get('authorization');
        const cookieHeader = request.headers.get('cookie');
        
        if (cookieHeader) {
          // Try to extract username from cookies
          const usernameMatch = cookieHeader.match(/username=([^;]+)/);
          if (usernameMatch) {
            fallbackUsername = decodeURIComponent(usernameMatch[1]);
          }
        }
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
          // Try to extract from JWT token
          try {
            const token = authHeader.substring(7);
            const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
            if (payload.username) {
              fallbackUsername = payload.username;
              fallbackUserId = payload.id || payload.sub || 'unknown';
              fallbackUserRole = payload.role || 'user';
            }
          } catch (e) {
            // Ignore JWT parsing errors
          }
        }
      }
      
      await (Log as ILogModel).logUserAction({
        userId: fallbackUserId,
        username: fallbackUsername,
        userRole: fallbackUserRole,
        ...logData
      });
      return;
    }
    
    console.log('Logging with user info:', userInfo);
    await (Log as ILogModel).logUserAction({
      ...userInfo,
      ...logData
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
