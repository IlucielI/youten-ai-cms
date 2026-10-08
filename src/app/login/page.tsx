import React, { Suspense } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { LoginForm } from './login-form';
import { AUTH_COOKIES } from '@/server/constants';

export const metadata = {
  title: 'Sign In | Youten AI CMS Console',
  description: 'Administrative Authentication and Access Gateway for Youten AI Operator Console',
};

export default async function LoginPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(AUTH_COOKIES.SESSION_TOKEN)?.value;

  if (sessionToken && sessionToken.trim().length > 0) {
    redirect('/admin');
  }

  return (
    <main className="min-h-screen w-full bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden select-none">
      {/* Dynamic Ambient Background Elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-blue-600/10 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[300px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-cyan-600/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0a_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        <Suspense
          fallback={
            <div className="p-8 rounded-2xl bg-slate-900/80 border border-slate-800 text-center text-slate-400 text-sm">
              Loading Console Gateway...
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>

      {/* Footer Info */}
      <footer className="mt-8 text-center text-xs text-slate-600 z-10">
        &copy; {new Date().getFullYear()} Youten AI Engine &bull; Enterprise Governance Console
      </footer>
    </main>
  );
}
