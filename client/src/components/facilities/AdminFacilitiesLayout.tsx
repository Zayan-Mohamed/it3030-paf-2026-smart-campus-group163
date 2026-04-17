import type { ReactNode } from 'react';
import '../../styles/Dashboard.css';

type AdminFacilitiesLayoutProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};


export const AdminFacilitiesLayout = ({
  title,
  subtitle,
  children,
}: AdminFacilitiesLayoutProps) => {

  return (
    <div className="dashboard-layout">

      <main className="dashboard-main">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">{title}</h1>
            <p className="dashboard-subtitle">{subtitle}</p>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
};
