import React, { useState } from 'react';
import { BookingConcierge } from './BookingConcierge';
import { MaintenanceTriage } from './MaintenanceTriage';
import { AdminApproval } from './AdminApproval';
import { KnowledgeBaseChat } from './KnowledgeBaseChat';
import { LayoutDashboard, Calendar, Wrench, ShieldAlert, BookOpen } from 'lucide-react';

export function AITester() {
  const [activeTab, setActiveTab] = useState('booking');

  const tabs = [
    { id: 'booking', label: 'Booking Concierge', icon: Calendar, color: 'text-blue-600' },
    { id: 'triage', label: 'Maintenance Triage', icon: Wrench, color: 'text-amber-600' },
    { id: 'approval', label: 'Admin Approvals', icon: ShieldAlert, color: 'text-indigo-600' },
    { id: 'rag', label: 'Knowledge Base', icon: BookOpen, color: 'text-emerald-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-6xl mb-8 text-center">
        <div className="inline-flex items-center justify-center p-3 bg-white rounded-full shadow-sm mb-4 border border-gray-200">
          <LayoutDashboard className="w-8 h-8 text-slate-800" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Smart Campus AI Dashboard</h1>
        <p className="text-gray-500 max-w-2xl mx-auto">
          Test the four distinct LangGraph workflows integrated with the Spring Boot backend.
        </p>
      </div>

      <div className="w-full max-w-6xl flex flex-col md:flex-row gap-6">
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 flex flex-col space-y-2 shrink-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-white text-gray-900 shadow-sm border border-gray-200' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? tab.color : 'text-gray-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 flex justify-center items-start">
          {activeTab === 'booking' && <BookingConcierge />}
          {activeTab === 'triage' && <MaintenanceTriage />}
          {activeTab === 'approval' && <AdminApproval />}
          {activeTab === 'rag' && <KnowledgeBaseChat />}
        </div>
      </div>
    </div>
  );
}