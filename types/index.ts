export interface Party {
  _id: string;
  name: string;
  contactName?: string;
  contactPhone?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Quality {
  _id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  quality?: string | Quality;
  quantity?: number;
  imageUrls?: string[]; // Changed from imageUrl to imageUrls array
  description?: string;
  labData?: {
    color?: string;
    shade?: string;
    notes?: string;
    imageUrl?: string;
    labSendDate?: string;
    approvalDate?: string;
    sampleNumber?: string;
  };
}

export interface Order {
  _id: string;
  orderId: string;
  orderNo?: string;
  orderType?: "Dying" | "Printing";
  arrivalDate?: string;
  party?: string | Party;
  contactName?: string;
  contactPhone?: string;
  poNumber?: string;
  styleNo?: string;
  poDate?: string;
  deliveryDate?: string;
  items: OrderItem[];
  status?: "pending" | "delivered";
  labData?: any;
  createdAt: string;
  updatedAt: string;
}

export interface OrderFormData {
  orderType?: "Dying" | "Printing";
  arrivalDate?: string;
  party?: string;
  contactName?: string;
  contactPhone?: string;
  poNumber?: string;
  styleNo?: string;
  poDate?: string;
  deliveryDate?: string;
  items: OrderItem[];
}

export interface PartyFormData {
  name: string;
  contactName?: string;
  contactPhone?: string;
  address?: string;
}
