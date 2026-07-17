'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';

const priorityColors: Record<string, string> = {
  Low: 'bg-slate-100 text-slate-700',
  Medium: 'bg-blue-100 text-blue-700',
  High: 'bg-orange-100 text-orange-700',
  Critical: 'bg-red-100 text-red-700 border border-red-200',
};

const TicketCard = ({ ticket, onUpdateStatus }: { ticket: any, onUpdateStatus: (id: string, status: string) => void }) => (
  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-default group">
    <div className="flex justify-between items-start mb-2">
      <span className="text-xs font-semibold text-slate-400">#{ticket.id}</span>
      <span title={`Source: ${ticket.source}`} className="text-slate-400">
        {ticket.source === 'telegram' ? '📱' : '🌐'}
      </span>
    </div>
    
    <h3 className="font-medium text-slate-800 mb-3 line-clamp-2" title={ticket.title}>
      {ticket.title}
    </h3>
    
    <div className="flex flex-wrap gap-2 mb-4">
      <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${priorityColors[ticket.priority]}`}>
        {ticket.priority}
      </span>
      {ticket.category && (
        <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-700">
          {ticket.category}
        </span>
      )}
    </div>
    
    <div className="flex items-center justify-between text-xs text-slate-500 mt-auto pt-3 border-t border-slate-50">
      <div className="flex items-center gap-1.5 truncate">
        <span className="truncate max-w-[100px]">{ticket.reporter_name || 'Anonymous'}</span>
      </div>
      <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
    </div>
    
    <div className="mt-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
      {ticket.status === 'New' && (
        <button 
          onClick={() => onUpdateStatus(ticket.id, 'In Progress')}
          className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 py-1.5 rounded text-xs font-medium transition-colors"
        >
          → In Progress
        </button>
      )}
      {ticket.status === 'In Progress' && (
        <button 
          onClick={() => onUpdateStatus(ticket.id, 'Resolved')}
          className="flex-1 bg-green-50 hover:bg-green-100 text-green-600 py-1.5 rounded text-xs font-medium transition-colors"
        >
          ✓ Resolve
        </button>
      )}
    </div>
  </div>
);

const Column = ({ title, status, tickets, onUpdateStatus }: { title: string, status: string, tickets: any[], onUpdateStatus: (id: string, status: string) => void }) => (
  <div className="flex flex-col bg-slate-50/50 rounded-2xl p-4 min-h-[calc(100vh-120px)] border border-slate-100">
    <div className="flex items-center justify-between mb-4 px-1">
      <h2 className="font-semibold text-slate-700 flex items-center gap-2">
        {title}
        <span className="bg-slate-200 text-slate-600 text-xs py-0.5 px-2 rounded-full font-medium">
          {tickets.length}
        </span>
      </h2>
    </div>
    
    <div className="flex flex-col gap-3">
      {tickets.map(t => (
        <TicketCard key={t.id} ticket={t} onUpdateStatus={onUpdateStatus} />
      ))}
      {tickets.length === 0 && (
        <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-sm">
          Không có ticket nào
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
        // Revert on error
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
    return <div className="min-h-screen flex items-center justify-center">Loading dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold tracking-tight text-slate-800">IT Support Dashboard</h1>
            <span className="bg-green-100 text-green-700 text-xs px-2.5 py-1 rounded-full font-medium animate-pulse flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Realtime Active
            </span>
          </div>
          <a href="/" className="text-sm text-slate-500 hover:text-slate-800 font-medium transition-colors">
            + New Ticket
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Column title="New" status="New" tickets={newTickets} onUpdateStatus={handleUpdateStatus} />
          <Column title="In Progress" status="In Progress" tickets={inProgressTickets} onUpdateStatus={handleUpdateStatus} />
          <Column title="Resolved" status="Resolved" tickets={resolvedTickets} onUpdateStatus={handleUpdateStatus} />
        </div>
      </main>
    </div>
  );
}
