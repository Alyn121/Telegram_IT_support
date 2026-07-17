'use client';

import React, { useState } from 'react';

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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        <div className="bg-blue-600 px-8 py-6 text-white">
          <h1 className="text-3xl font-bold tracking-tight">IT Support Portal</h1>
          <p className="mt-2 text-blue-100">Gửi yêu cầu hỗ trợ IT của bạn tại đây. Đội ngũ chúng tôi sẽ xử lý sớm nhất có thể.</p>
        </div>
        
        {success && (
          <div className="m-8 p-4 bg-green-50 text-green-700 rounded-lg border border-green-200">
            ✅ Ticket của bạn đã được gửi thành công!
          </div>
        )}
        
        {errorMsg && (
          <div className="m-8 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
            ❌ Lỗi: {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-8 space-y-6 pt-0 mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <label htmlFor="title" className="block text-sm font-medium text-slate-700">
                Tiêu đề sự cố <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                placeholder="VD: Không thể kết nối WiFi ở tầng 3"
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-slate-50 focus:bg-white outline-none"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="reporter_name" className="block text-sm font-medium text-slate-700">
                Người báo cáo
              </label>
              <input
                type="text"
                id="reporter_name"
                name="reporter_name"
                placeholder="Nhập tên của bạn"
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-slate-50 focus:bg-white outline-none"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="priority" className="block text-sm font-medium text-slate-700">
                Mức độ ưu tiên
              </label>
              <select
                id="priority"
                name="priority"
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-slate-50 focus:bg-white outline-none appearance-none"
              >
                <option value="Low">Low - Không gấp</option>
                <option value="Medium">Medium - Bình thường</option>
                <option value="High">High - Cần xử lý sớm</option>
                <option value="Critical">Critical - Khẩn cấp</option>
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-slate-700">
                Mô tả chi tiết <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                placeholder="Mô tả chi tiết vấn đề bạn đang gặp phải..."
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-slate-50 focus:bg-white outline-none resize-none"
                required
              ></textarea>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-slate-100">
            <a href="/dashboard" className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors">
              → Tới Dashboard quản lý
            </a>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
            >
              {loading ? 'Đang gửi...' : 'Gửi Yêu Cầu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
