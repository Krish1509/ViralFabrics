// Export all models for easy importing
export { default as User } from './User';
export { default as Party } from './Party';
export { default as Order } from './Order';
export { default as Quality } from './Quality';
export { default as Lab } from './Lab';
export { default as Counter } from './Counter';
export { default as Log } from './Log';

// Export TypeScript interfaces for all models
export type { 
  IUser, 
  IUserModel 
} from './User';

export type { 
  IParty, 
  IPartyModel 
} from './Party';

export type { 
  IOrder, 
  IOrderItem, 
  IOrderModel 
} from './Order';

export type { 
  IQuality, 
  IQualityModel 
} from './Quality';

export type { 
  ILab, 
  ILabModel 
} from './Lab';

export type { 
  ICounter, 
  ICounterModel 
} from './Counter';

export type { 
  ILog, 
  ILogModel 
} from './Log';

// Export common types and utilities
export type { Document, Model, Schema } from 'mongoose';

// Export validation schemas (if you have them)
// export * from '../lib/validation';

// Export error types
// export * from '../lib/errors';

// Export response types
// export * from '../lib/response';
