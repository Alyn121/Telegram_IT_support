export type TicketStatus = 'New' | 'In Progress' | 'Resolved' | 'Escalated';

export interface Ticket {
  id: string | number;
  title: string;
  description: string | null;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  category: string | null;
  status: TicketStatus;
  source: 'portal' | 'telegram';
  reporter_name: string | null;
  original_text: string | null;
  created_at: string;
  updated_at: string;
}

export const STATUSES: TicketStatus[] = ['New', 'In Progress', 'Resolved', 'Escalated'];

export const STATUS_META: Record<TicketStatus, { label: string; accent: string; badge: string; hex: string }> = {
  'New': { label: 'Tiếp nhận', accent: 'bg-blue-600', badge: 'bg-blue-600 text-white border-blue-700', hex: '#2563eb' },
  'In Progress': { label: 'Đang xử lý', accent: 'bg-orange-600', badge: 'bg-orange-600 text-white border-orange-700', hex: '#ea580c' },
  'Resolved': { label: 'Hoàn thành', accent: 'bg-green-600', badge: 'bg-green-600 text-white border-green-700', hex: '#16a34a' },
  'Escalated': { label: 'Leo thang', accent: 'bg-red-600', badge: 'bg-red-600 text-white border-red-700', hex: '#dc2626' },
};
