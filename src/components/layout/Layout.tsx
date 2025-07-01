
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Toaster } from '@/components/ui/toaster';

export const Layout = () => {
  return (
    <div className="h-screen bg-white dark:bg-slate-900 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-slate-800">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
      <Toaster />
    </div>
  );
};
