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
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full animate-slide-up">
        <div className="bg-white rounded-2xl overflow-hidden border-2 border-slate-200">

          <div className="bg-blue-600 px-10 py-10 text-white text-center">
            <div className="mx-auto bg-blue-700 w-16 h-16 flex items-center justify-center rounded-2xl mb-4 border-2 border-blue-500">
              <HelpCircle size={32} className="text-white" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">IT Support Portal</h1>
            <p className="text-blue-100 text-lg font-semibold">Chúng tôi luôn sẵn sàng hỗ trợ bạn 24/7</p>
          </div>

          <div className="p-10">
            {success && (
              <div className="mb-8 p-5 bg-green-50 text-green-800 rounded-2xl border-2 border-green-300 flex items-center gap-3 animate-fade-in">
                <CheckCircle2 size={24} className="text-green-600 flex-shrink-0" />
                <div>
                  <h4 className="font-bold">Gửi yêu cầu thành công!</h4>
                  <p className="text-sm text-green-700 mt-1">Đội ngũ IT đã nhận được thông tin và sẽ xử lý sớm nhất.</p>
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="mb-8 p-5 bg-red-50 text-red-800 rounded-2xl border-2 border-red-300 flex items-center gap-3 animate-fade-in">
                <AlertCircle size={24} className="text-red-600 flex-shrink-0" />
                <div>
                  <h4 className="font-bold">Không thể gửi yêu cầu</h4>
                  <p className="text-sm text-red-700 mt-1">{errorMsg}</p>
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
                    className="w-full px-5 py-4 rounded-xl border-2 border-slate-300 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-colors bg-white outline-none placeholder:text-slate-400 font-semibold text-slate-900"
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
                    className="w-full px-5 py-4 rounded-xl border-2 border-slate-300 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-colors bg-white outline-none placeholder:text-slate-400 font-semibold text-slate-900"
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
                      className="w-full px-5 py-4 rounded-xl border-2 border-slate-300 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-colors bg-white outline-none appearance-none font-semibold text-slate-900 cursor-pointer"
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
                    className="w-full px-5 py-4 rounded-xl border-2 border-slate-300 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-colors bg-white outline-none resize-none placeholder:text-slate-400 font-semibold text-slate-900"
                    required
                  ></textarea>
                </div>
              </div>

              <div className="pt-8 mt-4 flex items-center justify-between border-t-2 border-slate-200">
                <a href="/dashboard" className="text-sm text-slate-700 hover:text-blue-600 font-bold transition-colors flex items-center gap-2 group">
                  <span className="bg-slate-200 group-hover:bg-blue-100 p-2 rounded-full transition-colors">
                    <Activity size={16} className="text-slate-700 group-hover:text-blue-600" />
                  </span>
                  Dashboard Quản lý
                </a>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-bold rounded-xl transition-colors active:scale-95 flex items-center gap-2"
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
        
        <p className="text-center text-slate-600 text-sm mt-6 font-semibold">
          IT Support System v0.1 • Powered by Gemini AI
        </p>
      </div>
    </div>
  );
}
