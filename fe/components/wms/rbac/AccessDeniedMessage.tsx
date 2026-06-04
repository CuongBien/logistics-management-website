'use client';

import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function AccessDeniedMessage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="max-w-md w-full text-center space-y-6 p-8 bg-[#1a1a2e]/90 border border-[#C41E3A]/20 rounded-2xl shadow-2xl backdrop-blur-md relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-[#C41E3A]/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#C41E3A]/10 rounded-full blur-3xl" />

        <div className="mx-auto w-16 h-16 bg-[#C41E3A]/10 border border-[#C41E3A]/30 rounded-full flex items-center justify-center text-[#C41E3A]">
          <ShieldAlert className="h-8 w-8 animate-pulse" />
        </div>

        <div className="space-y-2 text-center">
          <h2 className="text-xl font-bold text-white tracking-wide">Truy Cập Bị Từ Chối</h2>
          <p className="text-white/60 text-xs leading-relaxed max-w-sm mx-auto">
            Tài khoản của bạn không có quyền quản lý vai trò và nhân sự (`role:manage`). Vui lòng liên hệ Quản trị viên hệ thống để yêu cầu phân quyền.
          </p>
        </div>

        <div className="pt-2">
          <Button asChild className="w-full bg-[#C41E3A] hover:bg-[#A31830] text-white text-xs font-semibold h-10 shadow-lg shadow-[#C41E3A]/20 transition-all duration-150">
            <Link href="/">Quay lại Trang chủ</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
