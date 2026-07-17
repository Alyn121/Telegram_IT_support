'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase';
import { Ticket, TicketStatus, STATUSES, STATUS_META } from '@/lib/types';
import {
  CheckCircle2, Clock, Inbox, AlertTriangle, ArrowRight, LayoutDashboard,
  PlusCircle, Activity, Eye, X, User as UserIcon, BarChart3
} from 'lucide-react';

const priorityColors: Record<string, { bg: string, text: string }> = {
  Low: { bg: 'bg-slate-600', text: 'text-white' },
  Medium: { bg: 'bg-blue-600', text: 'text-white' },
  High: { bg: 'bg-orange-600', text: 'text-white' },
  Critical: { bg: 'bg-red-600', text: 'text-white' },
};

const categoryIcons: Record<string, string> = {
  Hardware: '💻',
  Software: '💽',
  Network: '🌐',
  Account: '🔑',
  Other: '📁'
};

const priorityWeight: Record<string, number> = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1
};

const priorityBorder: Record<string, string> = {
  Low: 'border-l-slate-400',
  Medium: 'border-l-blue-500',
  High: 'border-l-orange-500',
  Critical: 'border-l-red-500',
};

const statusIcons: Record<TicketStatus, any> = {
  'New': Inbox,
  'In Progress': Clock,
  'Resolved': CheckCircle2,
  'Escalated': AlertTriangle,
};

// Advances a ticket to the next logical status from a quick-action button; null = no next step.
function nextStatus(status: TicketStatus): TicketStatus | null {
  if (status === 'New') return 'In Progress';
  if (status === 'In Progress') return 'Resolved';
  if (status === 'Escalated') return 'In Progress';
  return null;
}

function getRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Vừa xong';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
  return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
}

function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
}

const TicketCard = ({ ticket, onUpdateStatus, onOpenDetail }: { ticket: Ticket, onUpdateStatus: (id: string, status: TicketStatus) => void, onOpenDetail: (ticket: Ticket) => void }) => {
  const pColors = priorityColors[ticket.priority] || priorityColors.Medium;
  const pBorder = priorityBorder[ticket.priority] || priorityBorder.Medium;

  const hasNeedsReview = ticket.title.includes('[Needs Review]');
  const cleanTitle = ticket.title.replace('[Needs Review]', '').trim();
  const next = nextStatus(ticket.status);

  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData('text/plain', String(ticket.id))}
      className={`bg-white p-3 rounded-xl border border-slate-200 transition-colors hover:border-slate-300 flex items-start gap-3 border-l-4 cursor-grab active:cursor-grabbing ${pBorder}`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
          <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">#{ticket.id}</span>
          <span className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${pColors.bg} ${pColors.text}`}>
            {ticket.priority}
          </span>
          {ticket.category && (
            <span className="text-[11px] text-slate-500 font-semibold">
              {categoryIcons[ticket.category] || '📁'} {ticket.category}
            </span>
          )}
          {hasNeedsReview && (
            <span className="text-[10px] font-bold text-white bg-red-600 px-1.5 py-0.5 rounded uppercase tracking-wide">
              Review
            </span>
          )}
        </div>

        <p className="font-bold text-slate-900 text-sm leading-snug truncate" title={cleanTitle}>
          {cleanTitle}
        </p>

        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mt-1 truncate">
          <span title={`Source: ${ticket.source}`}>{ticket.source === 'telegram' ? '📱' : '🌐'}</span>
          <span className="truncate max-w-[80px]">{ticket.reporter_name || 'Anonymous'}</span>
          <span>·</span>
          <span>{getRelativeTime(ticket.created_at)}</span>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onOpenDetail(ticket)}
          title="Xem chi tiết"
          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
        >
          <Eye size={15} />
        </button>
        {next && (
          <button
            onClick={() => onUpdateStatus(String(ticket.id), next)}
            title={STATUS_META[next].label}
            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <ArrowRight size={15} />
          </button>
        )}
      </div>
    </div>
  );
};

const Column = ({ status, tickets, onUpdateStatus, onOpenDetail, isWarning }: { status: TicketStatus, tickets: Ticket[], onUpdateStatus: (id: string, status: TicketStatus) => void, onOpenDetail: (ticket: Ticket) => void, isWarning?: boolean }) => {
  const [dragOver, setDragOver] = useState(false);
  const meta = STATUS_META[status];
  const Icon = statusIcons[status];

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const id = e.dataTransfer.getData('text/plain');
        if (id) onUpdateStatus(id, status);
      }}
      className={`flex flex-col bg-white rounded-2xl p-4 h-[75vh] min-w-[300px] w-[320px] flex-shrink-0 border-2 transition-colors ${
        dragOver ? 'border-blue-500' : isWarning ? 'border-red-400' : 'border-slate-200'
      }`}
    >
      <div className="flex items-center justify-between mb-4 px-1 shrink-0">
        <h2 className="font-bold text-slate-900 flex items-center gap-2.5 text-lg">
          <div className={`p-2 rounded-xl ${isWarning ? 'bg-red-600 animate-pulse' : meta.accent} text-white`}>
            <Icon size={18} />
          </div>
          {meta.label}
        </h2>
        <span className={`text-xs py-1 px-3 rounded-full font-bold border ${isWarning ? 'bg-red-600 text-white border-red-700' : 'bg-slate-200 text-slate-800 border-slate-300'}`}>
          {tickets.length}
        </span>
      </div>

      <div className="flex flex-col gap-2.5 overflow-y-auto flex-1 pr-1 -mr-1">
        {tickets.map(t => (
          <TicketCard key={t.id} ticket={t} onUpdateStatus={onUpdateStatus} onOpenDetail={onOpenDetail} />
        ))}
        {tickets.length === 0 && (
          <div className={`text-center p-10 border-2 border-dashed rounded-2xl text-sm font-semibold ${isWarning ? 'border-red-300 text-red-700 bg-red-50' : 'border-slate-300 text-slate-500 bg-slate-50'}`}>
            {isWarning ? 'CẢNH BÁO: Đang không xử lý ticket nào!' : 'Kéo ticket vào đây'}
          </div>
        )}
      </div>
    </div>
  );
};

const BarChartCard = ({ counts, max }: { counts: { status: TicketStatus, count: number }[], max: number }) => (
  <div className="bg-white rounded-2xl p-6 border-2 border-slate-200">
    <h3 className="font-bold text-slate-900 text-sm mb-6">Số lượng theo trạng thái</h3>
    <div className="flex items-end gap-4 h-40">
      {counts.map(({ status, count }) => {
        const meta = STATUS_META[status];
        const heightPct = (count / max) * 100;
        return (
          <div key={status} className="flex-1 h-full flex flex-col items-center justify-end">
            <span className="text-sm font-extrabold text-slate-900 mb-1">{count}</span>
            <div
              className={`w-full max-w-[52px] rounded-t-md ${meta.accent}`}
              style={{ height: `${count > 0 ? Math.max(heightPct, 4) : 2}%` }}
            />
            <span className="text-xs font-bold text-slate-600 mt-2 text-center leading-tight">{meta.label}</span>
          </div>
        );
      })}
    </div>
  </div>
);

const PieChartCard = ({ counts, total }: { counts: { status: TicketStatus, count: number }[], total: number }) => {
  let cumulative = 0;
  const stops = counts.map(({ status, count }) => {
    const meta = STATUS_META[status];
    const start = (cumulative / (total || 1)) * 360;
    cumulative += count;
    const end = (cumulative / (total || 1)) * 360;
    return `${meta.hex} ${start}deg ${end}deg`;
  }).join(', ');

  return (
    <div className="bg-white rounded-2xl p-6 border-2 border-slate-200">
      <h3 className="font-bold text-slate-900 text-sm mb-6">Tỉ lệ trạng thái</h3>
      <div className="flex items-center gap-6">
        <div
          className="relative w-32 h-32 rounded-full shrink-0"
          style={{ background: total > 0 ? `conic-gradient(${stops})` : '#e2e8f0' }}
        >
          <div className="absolute inset-[20%] bg-white rounded-full flex flex-col items-center justify-center">
            <span className="text-xl font-extrabold text-slate-900">{total}</span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Tổng</span>
          </div>
        </div>
        <ul className="flex flex-col gap-2 min-w-0">
          {counts.map(({ status, count }) => {
            const meta = STATUS_META[status];
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <li key={status} className="flex items-center gap-2 text-sm">
                <span className={`w-3 h-3 rounded-full shrink-0 ${meta.accent}`}></span>
                <span className="font-semibold text-slate-700 truncate">{meta.label}</span>
                <span className="font-extrabold text-slate-900 ml-auto">{count}</span>
                <span className="text-slate-500 text-xs w-9 text-right">{pct}%</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

const StatsPanel = ({ tickets }: { tickets: Ticket[] }) => {
  const counts = STATUSES.map(s => ({ status: s, count: tickets.filter(t => t.status === s).length }));
  const max = Math.max(1, ...counts.map(c => c.count));

  return (
    <div className="mb-8">
      <h2 className="font-bold text-slate-900 flex items-center gap-2.5 text-lg mb-4">
        <div className="p-2 rounded-xl bg-indigo-600 text-white">
          <BarChart3 size={18} />
        </div>
        Thống kê ticket ({tickets.length} tổng)
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <BarChartCard counts={counts} max={max} />
        <PieChartCard counts={counts} total={tickets.length} />
      </div>
    </div>
  );
};

const TicketDetailModal = ({ ticket, onClose }: { ticket: Ticket | null, onClose: () => void }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (ticket) dialogRef.current?.showModal();
    else dialogRef.current?.close();
  }, [ticket]);

  const cleanTitle = ticket?.title.replace('[Needs Review]', '').trim();

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="backdrop:bg-slate-900/60 rounded-2xl p-0 border-0 max-w-lg w-full m-auto"
    >
      {ticket && (
        <div className="bg-white rounded-2xl p-8 relative border-2 border-slate-200">
          <button
            onClick={() => dialogRef.current?.close()}
            className="absolute top-5 right-5 text-slate-600 hover:text-slate-900 bg-slate-200 hover:bg-slate-300 rounded-full p-1.5 transition-colors"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded-md">#{ticket.id}</span>
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${STATUS_META[ticket.status].badge}`}>
              {STATUS_META[ticket.status].label}
            </span>
          </div>

          <h3 className="text-xl font-bold text-slate-900 mb-5">{cleanTitle}</h3>

          <dl className="space-y-4 text-sm">
            <div>
              <dt className="font-bold text-slate-600 mb-1">Mô tả</dt>
              <dd className="text-slate-900 whitespace-pre-wrap">{ticket.description || '—'}</dd>
            </div>
            {ticket.original_text && ticket.original_text !== ticket.description && (
              <div>
                <dt className="font-bold text-slate-600 mb-1">Tin nhắn gốc</dt>
                <dd className="text-slate-700 italic whitespace-pre-wrap">{ticket.original_text}</dd>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <dt className="font-bold text-slate-600 mb-1">Mức độ</dt>
                <dd className="text-slate-900 font-semibold">{ticket.priority}</dd>
              </div>
              <div>
                <dt className="font-bold text-slate-600 mb-1">Phân loại</dt>
                <dd className="text-slate-900 font-semibold">{categoryIcons[ticket.category || ''] || '📁'} {ticket.category || 'Other'}</dd>
              </div>
              <div>
                <dt className="font-bold text-slate-600 mb-1">Người báo cáo</dt>
                <dd className="text-slate-900 font-semibold">{ticket.reporter_name || 'Anonymous'}</dd>
              </div>
              <div>
                <dt className="font-bold text-slate-600 mb-1">Nguồn</dt>
                <dd className="text-slate-900 font-semibold">{ticket.source === 'telegram' ? '📱 Telegram' : '🌐 Portal'}</dd>
              </div>
              <div>
                <dt className="font-bold text-slate-600 mb-1">Tạo lúc</dt>
                <dd className="text-slate-900 font-semibold">{formatDateTime(ticket.created_at)}</dd>
              </div>
              <div>
                <dt className="font-bold text-slate-600 mb-1">Cập nhật lúc</dt>
                <dd className="text-slate-900 font-semibold">{formatDateTime(ticket.updated_at)}</dd>
              </div>
            </div>
          </dl>
        </div>
      )}
    </dialog>
  );
};

export default function DashboardPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [myName, setMyName] = useState('');
  const [onlyMine, setOnlyMine] = useState(false);

  useEffect(() => {
    setMyName(localStorage.getItem('myName') || '');

    fetchTickets();
    const supabase = createClient();

    const channel = supabase.channel('tickets')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tickets' }, (payload) => {
        setTickets(prev => [payload.new as Ticket, ...prev]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tickets' }, (payload) => {
        setTickets(prev => prev.map(t => t.id === (payload.new as Ticket).id ? payload.new as Ticket : t));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/tickets');
      const data = await res.json();
      if (res.ok) setTickets(data);
    } catch (error) {
      console.error("Failed to fetch tickets", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: TicketStatus) => {
    try {
      // Optimistic update
      setTickets(prev => prev.map(t => String(t.id) === id ? { ...t, status } : t));

      const res = await fetch(`/api/tickets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (!res.ok) {
        fetchTickets();
        alert('Failed to update status');
      }
    } catch (error) {
      fetchTickets();
      console.error("Error updating ticket status", error);
    }
  };

  const handleNameChange = (name: string) => {
    setMyName(name);
    localStorage.setItem('myName', name);
  };

  const sortTickets = (ticketList: Ticket[]) => {
    return [...ticketList].sort((a, b) => {
      const pDiff = (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
      if (pDiff !== 0) return pDiff;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  };

  const visibleTickets = onlyMine && myName.trim()
    ? tickets.filter(t => (t.reporter_name || '').toLowerCase().includes(myName.trim().toLowerCase()))
    : tickets;

  const columns = Object.fromEntries(STATUSES.map(s => [s, sortTickets(visibleTickets.filter(t => t.status === s))])) as Record<TicketStatus, Ticket[]>;

  // Bottleneck detection: if many New tickets but 0 In Progress
  const isBottleneck = columns['New'].length >= 3 && columns['In Progress'].length === 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="bg-white px-8 py-6 rounded-2xl shadow-md border-2 border-slate-200 flex items-center gap-4 text-blue-600 font-bold">
          <Activity size={24} className="animate-spin" /> Đang tải dữ liệu Dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="bg-white border-b-2 border-slate-200 sticky top-0 z-20">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-2.5 rounded-xl text-white">
              <LayoutDashboard size={24} />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
                IT Support Dashboard
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                </span>
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Hệ thống Realtime đang chạy</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 bg-white border-2 border-slate-300 rounded-xl px-3 py-2">
              <UserIcon size={16} className="text-slate-500" />
              <input
                type="text"
                value={myName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Tên của bạn..."
                className="bg-transparent outline-none text-sm font-semibold text-slate-900 w-32"
              />
            </div>
            <button
              onClick={() => setOnlyMine(v => !v)}
              disabled={!myName.trim()}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-colors border-2 disabled:opacity-40 disabled:cursor-not-allowed ${
                onlyMine ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-300 text-slate-700 hover:border-blue-400'
              }`}
            >
              Ticket của tôi
            </button>
            <a href="/" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors flex items-center gap-2 active:scale-95">
              <PlusCircle size={18} /> Tạo Ticket
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <StatsPanel tickets={visibleTickets} />

        <div className="flex gap-6 overflow-x-auto pb-4">
          {STATUSES.map((status, i) => (
            <div key={status} className="animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <Column
                status={status}
                tickets={columns[status]}
                onUpdateStatus={handleUpdateStatus}
                onOpenDetail={setSelectedTicket}
                isWarning={status === 'New' ? isBottleneck && columns['New'].length > 0 : status === 'In Progress' ? isBottleneck : false}
              />
            </div>
          ))}
        </div>
      </main>

      <TicketDetailModal ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />
    </div>
  );
}
