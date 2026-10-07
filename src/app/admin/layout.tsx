import React from 'react';
import { DashboardLayout } from '@/components/templates/dashboard-layout';

export const metadata = {
  title: 'Youten AI CMS | Operational Console',
  description: 'Operational Management, Analytics, and Governance for Youten AI',
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
