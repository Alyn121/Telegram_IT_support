'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { CheckCircle2, Clock, Inbox, ArrowRight, LayoutDashboard, PlusCircle, Activity } from 'lucide-react';

const priorityColors: Record<string, { bg: string, text: string, border: string, dot: string }> = {
  Low: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', dot: 'bg-slate-400' },
  Medium: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100', dot: 'bg-blue-500' },
  High: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500' },
  Critical: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' },
};

const categoryIcons: Record<string, string> = {
  Hardware: '💻',
  Software: '💽',
  Network: '🌐',
  Account: '🔑',
  Other: '📁'
};

const TicketCard = ({ ticket, onUpdateStatus }: { ticket: any, onUpdateStatus: (id: string, status: string) => void }) => {
  const pColors = priorityColors[ticket.priority] || priorityColors.Medium;
  const isCritical = ticket.priority === 'Critical';
  
  return (
    <div className={`glass-card p-5 rounded-2xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group relative overflow-hidden ${isCritical ? 'border-red-200 shadow-red-500/5' : ''}`}>
      {isCritical && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500"></div>}
      
      <div className="flex justify-between items-start mb-3">
        <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">#{ticket.id}</span>
        <span title={`Source: ${ticket.source}`} className="text-slate-400 text-sm bg-slate-50 p-1 rounded-full border border-slate-100 shadow-sm">
          {ticket.source === 'telegram' ? '📱' : '🌐'}
        </span>
      </div>
      
      <h3 className="font-semibold text-slate-800 mb-4 line-clamp-2 leading-snug" title={ticket.title}>
        {ticket.title}
      </h3>
      
      <div className="flex flex-wrap gap-2 mb-5">
        <span className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 border ${pColors.bg} ${pColors.text} ${pColors.border}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${pColors.dot}`}></span>
          {ticket.priority}
        </span>
        {ticket.category && (
          <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-100 flex items-center gap-1">
            {categoryIcons[ticket.category] || '📁'} {ticket.category}
          </span>
        )}
      </div>
      
      <div className="flex items-center justify-between text-xs text-slate-500 mt-auto pt-4 border-t border-slate-100/60">
        <div className="flex items-center gap-2 truncate font-medium">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-700 font-bold text-[10px]">
            {(ticket.reporter_name?.[0] || 'A').toUpperCase()}
          </div>
          <span className="truncate max-w-[90px]">{ticket.reporter_name || 'Anonymous'}</span>
        </div>
        <span className="font-medium bg-slate-50 px-2 py-0.5 rounded">{new Date(ticket.created_at).toLocaleDateString('vi-VN')}</span>
      </div>
      
      <div className="absolute inset-0 bg-white/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4 gap-3 pointer-events-none group-hover:pointer-events-auto">
        {ticket.status === 'New' && (
          <button 
            onClick={() => onUpdateStatus(ticket.id, 'In Progress')}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-500/30 hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-1.5"
          >
            Nhận xử lý <ArrowRight size={16} />
          </button>
        )}
        {ticket.status === 'In Progress' && (
          <button 
            onClick={() => onUpdateStatus(ticket.id, 'Resolved')}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-green-500/30 hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-1.5"
          >
            Hoàn thành <CheckCircle2 size={16} />
          </button>
        )}
        {ticket.status === 'Resolved' && (
          <span className="text-green-700 font-bold bg-green-50 px-4 py-2 rounded-xl flex items-center gap-2 border border-green-200">
            <CheckCircle2 size={18} /> Đã xong
          </span>
        )}
      </div>
    </div>
  );
};

const Column = ({ title, icon: Icon, tickets, onUpdateStatus, accentColor }: { title: string, icon: any, tickets: any[], onUpdateStatus: (id: string, status: string) => void, accentColor: string }) => (
  <div className="flex flex-col bg-white/40 backdrop-blur-md rounded-3xl p-5 min-h-[calc(100vh-140px)] border border-white/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.03)]">
    <div className="flex items-center justify-between mb-6 px-2">
      <h2 className="font-bold text-slate-800 flex items-center gap-2.5 text-lg">
        <div className={`p-2 rounded-xl ${accentColor} text-white shadow-sm`}>
          <Icon size={18} />
        </div>
        {title}
      </h2>
      <span className="bg-white text-slate-700 text-xs py-1 px-3 rounded-full font-bold shadow-sm border border-slate-100">
        {tickets.length}
      </span>
    </div>
    
    <div className="flex flex-col gap-4">
      {tickets.map(t => (
        <TicketCard key={t.id} ticket={t} onUpdateStatus={onUpdateStatus} />
      ))}
      {tickets.length === 0 && (
        <div className="text-center p-10 border-2 border-dashed border-slate-200/60 rounded-2xl text-slate-400 text-sm font-medium bg-white/20">
          Trống
        </div>
      )}
    </div>
  </div>
);

export default function DashboardPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTickets();
    const supabase = createClient();
    
    const channel = supabase.channel('tickets')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tickets' }, (payload) => {
        setTickets(prev => [payload.new, ...prev]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tickets' }, (payload) => {
        setTickets(prev => prev.map(t => t.id === payload.new.id ? payload.new : t));
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

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      // Optimistic update
      setTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t));
      
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

  const newTickets = tickets.filter(t => t.status === 'New');
  const inProgressTickets = tickets.filter(t => t.status === 'In Progress');
  const resolvedTickets = tickets.filter(t => t.status === 'Resolved');

  if (loading) {
    return (
      <div className="min-h-screen bg-mesh flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-md px-8 py-6 rounded-2xl shadow-xl flex items-center gap-4 text-blue-600 font-bold">
          <Activity size={24} className="animate-spin" /> Đang tải dữ liệu Dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mesh text-slate-800">
      <header className="bg-white/70 backdrop-blur-lg border-b border-white/50 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-blue-500/20">
              <LayoutDashboard size={24} />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600">
                IT Support Dashboard
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                </span>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Hệ thống Realtime đang chạy</span>
              </div>
            </div>
          </div>
          <a href="/" className="px-5 py-2.5 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-blue-600 font-bold rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-2 active:scale-95">
            <PlusCircle size={18} /> Tạo Ticket
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="animate-slide-up" style={{ animationDelay: '0s' }}>
            <Column title="Tiếp nhận" icon={Inbox} tickets={newTickets} onUpdateStatus={handleUpdateStatus} accentColor="bg-blue-500" />
          </div>
          <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <Column title="Đang xử lý" icon={Clock} tickets={inProgressTickets} onUpdateStatus={handleUpdateStatus} accentColor="bg-orange-500" />
          </div>
          <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Column title="Hoàn thành" icon={CheckCircle2} tickets={resolvedTickets} onUpdateStatus={handleUpdateStatus} accentColor="bg-green-500" />
          </div>
        </div>
      </main>
    </div>
  );
}
