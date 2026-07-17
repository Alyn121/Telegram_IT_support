'use client';

import React, { useState } from 'react';
import { Send, AlertCircle, CheckCircle2, User, HelpCircle, Activity } from 'lucide-react';

export default function PortalPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setErrorMsg('');

    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get('title'),
      reporter_name: formData.get('reporter_name'),
      priority: formData.get('priority'),
      description: formData.get('description'),
      source: 'portal',
    };

    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to submit ticket');
      }

      setSuccess(true);
      (e.target as HTMLFormElement).reset();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative blurred blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400 rounded-full mix-blend-multiply filter blur-[100px] opacity-40 animate-pulse-soft"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-400 rounded-full mix-blend-multiply filter blur-[100px] opacity-40 animate-pulse-soft" style={{ animationDelay: '1s' }}></div>

      <div className="max-w-2xl w-full z-10 animate-slide-up">
        <div className="glass-panel rounded-3xl overflow-hidden">
          
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-10 py-10 text-white text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
            <div className="relative z-10">
              <div className="mx-auto bg-white/20 w-16 h-16 flex items-center justify-center rounded-2xl mb-4 backdrop-blur-md border border-white/30 shadow-lg">
                <HelpCircle size={32} className="text-white" />
              </div>
              <h1 className="text-4xl font-bold tracking-tight mb-2 drop-shadow-sm">IT Support Portal</h1>
              <p className="text-blue-100 text-lg font-medium opacity-90">Chúng tôi luôn sẵn sàng hỗ trợ bạn 24/7</p>
            </div>
          </div>
          
          <div className="p-10">
            {success && (
              <div className="mb-8 p-5 bg-green-50/80 backdrop-blur-md text-green-700 rounded-2xl border border-green-200 flex items-center gap-3 animate-fade-in shadow-sm">
                <CheckCircle2 size={24} className="text-green-500 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold">Gửi yêu cầu thành công!</h4>
                  <p className="text-sm text-green-600 mt-1">Đội ngũ IT đã nhận được thông tin và sẽ xử lý sớm nhất.</p>
                </div>
              </div>
            )}
            
            {errorMsg && (
              <div className="mb-8 p-5 bg-red-50/80 backdrop-blur-md text-red-700 rounded-2xl border border-red-200 flex items-center gap-3 animate-fade-in shadow-sm">
                <AlertCircle size={24} className="text-red-500 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold">Không thể gửi yêu cầu</h4>
                  <p className="text-sm text-red-600 mt-1">{errorMsg}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-7">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
                <div className="space-y-2 md:col-span-2 group">
                  <label htmlFor="title" className="text-sm font-semibold text-slate-700 flex items-center gap-1.5 ml-1">
                    <Activity size={16} className="text-blue-500" /> Tiêu đề sự cố <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    placeholder="VD: Không thể kết nối WiFi ở tầng 3"
                    className="w-full px-5 py-4 rounded-xl border border-slate-200/60 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white/50 focus:bg-white outline-none shadow-sm placeholder:text-slate-400 font-medium text-slate-800"
                    required
                  />
                </div>

                <div className="space-y-2 group">
                  <label htmlFor="reporter_name" className="text-sm font-semibold text-slate-700 flex items-center gap-1.5 ml-1">
                    <User size={16} className="text-blue-500" /> Tên của bạn
                  </label>
                  <input
                    type="text"
                    id="reporter_name"
                    name="reporter_name"
                    placeholder="VD: Nguyễn Văn A"
                    className="w-full px-5 py-4 rounded-xl border border-slate-200/60 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white/50 focus:bg-white outline-none shadow-sm placeholder:text-slate-400 font-medium text-slate-800"
                  />
                </div>

                <div className="space-y-2 group">
                  <label htmlFor="priority" className="text-sm font-semibold text-slate-700 flex items-center gap-1.5 ml-1">
                    <AlertCircle size={16} className="text-blue-500" /> Mức độ ưu tiên
                  </label>
                  <div className="relative">
                    <select
                      id="priority"
                      name="priority"
                      className="w-full px-5 py-4 rounded-xl border border-slate-200/60 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white/50 focus:bg-white outline-none appearance-none shadow-sm font-medium text-slate-800 cursor-pointer"
                    >
                      <option value="Low">🟢 Low - Không gấp</option>
                      <option value="Medium" selected>🟡 Medium - Bình thường</option>
                      <option value="High">🟠 High - Cần xử lý sớm</option>
                      <option value="Critical">🔴 Critical - Khẩn cấp</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2 group">
                  <label htmlFor="description" className="text-sm font-semibold text-slate-700 flex items-center gap-1.5 ml-1">
                    Mô tả chi tiết <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    placeholder="Mô tả chi tiết vấn đề bạn đang gặp phải. Bạn đã thử khởi động lại chưa? Màn hình hiện lỗi gì?..."
                    className="w-full px-5 py-4 rounded-xl border border-slate-200/60 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white/50 focus:bg-white outline-none resize-none shadow-sm placeholder:text-slate-400 font-medium text-slate-800"
                    required
                  ></textarea>
                </div>
              </div>

              <div className="pt-8 mt-4 flex items-center justify-between border-t border-slate-200/60">
                <a href="/dashboard" className="text-sm text-slate-500 hover:text-blue-600 font-semibold transition-colors flex items-center gap-2 group">
                  <span className="bg-slate-100 group-hover:bg-blue-100 p-2 rounded-full transition-colors">
                    <Activity size={16} className="text-slate-600 group-hover:text-blue-600" />
                  </span>
                  Dashboard Quản lý
                </a>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5 transition-all active:scale-95 flex items-center gap-2"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Đang xử lý...
                    </span>
                  ) : (
                    <>Gửi Yêu Cầu <Send size={18} /></>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
        
        <p className="text-center text-slate-500 text-sm mt-6 font-medium">
          IT Support System v0.1 • Powered by Gemini AI
        </p>
      </div>
    </div>
  );
}
