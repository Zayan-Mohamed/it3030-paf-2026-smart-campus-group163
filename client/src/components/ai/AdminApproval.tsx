import React, { useState, useRef, useEffect } from 'react';
import { Shield, User, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface PendingAction {
  action: string;
  details: Record<string, unknown>;
}

interface PendingApproval {
  thread_id: string;
  message: string;
  action: string;
  details: Record<string, unknown>;
}

const URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_BASE_URL = `${URL}/api`;

export function AdminApproval() {
  const { token, user } = useAuth();
  
  // Use simple state instead of localStorage
  const [requestText, setRequestText] = useState('I need the 4K Cinema Camera for my film project this weekend.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResuming, setIsResuming] = useState<string | null>(null);
  
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [finalStatus, setFinalStatus] = useState<string | null>(null);
  
  const threadId = useRef(user?.id ? `approval_student_${user.id}` : `approval_${Math.random().toString(36).substring(7)}`);
  
  // Make sure to update threadId if user loads late
  useEffect(() => {
    if (user?.id) {
      threadId.current = `approval_student_${user.id}`;
    }
  }, [user]);

  const isAdminOrStaff = user?.roles?.includes('ADMIN') || user?.roles?.includes('STAFF') || user?.roles?.includes('ROLE_ADMIN') || user?.roles?.includes('ROLE_STAFF');

  const [allPendingApprovals, setAllPendingApprovals] = useState<PendingApproval[]>([]);
  const [isLoadingApprovals, setIsLoadingApprovals] = useState(false);

  // Fetch pending approvals for admins OR to check student's own pending request
  useEffect(() => {
    const fetchPending = async () => {
      setIsLoadingApprovals(true);
      try {
        const res = await fetch(`${API_BASE_URL}/approval/pending`, {
          headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
        });
        const data = await res.json();
        const pending = data.pending || [];
        
        if (isAdminOrStaff) {
          setAllPendingApprovals(pending);
        } else if (user?.id) {
          // If student, check if they have a pending request
          const myPending = pending.find((p: PendingApproval) => p.thread_id === `approval_student_${user.id}`);
          if (myPending) {
            setPendingAction(myPending.details as PendingAction);
            setFinalStatus(null);
          } else {
            // If we previously had a pending action but now it's gone, it was processed!
            setPendingAction(prev => {
              if (prev) {
                setFinalStatus('Your request has been processed by an admin. Check your bookings or notifications.');
              }
              return null;
            });
          }
        }
      } catch (err) {
        console.error('Failed to fetch pending approvals', err);
      } finally {
        setIsLoadingApprovals(false);
      }
    };
    
    fetchPending();
    
    // Optional: Poll every 10 seconds for new requests (or for student to see if it got approved)
    const interval = setInterval(fetchPending, 10000);
    return () => clearInterval(interval);
  }, [isAdminOrStaff, token, user]);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestText.trim()) return;

    setIsSubmitting(true);
    setPendingAction(null);
    setFinalStatus(null);
    
    // Generate a new thread ID for a new request if not student, else use student ID
    if (!user?.id) {
      threadId.current = `approval_${Math.random().toString(36).substring(7)}`;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/approval/request`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ message: requestText, thread_id: threadId.current }),
      });
      const data = await res.json();
      
      if (data.status === 'PENDING_APPROVAL') {
        setPendingAction(data.details);
      } else {
        setFinalStatus('Request completed without needing approval.');
      }
    } catch (error) {
      console.error(error);
      setFinalStatus('Error submitting request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdminDecision = async (thread_id: string, approved: boolean) => {
    setIsResuming(thread_id);
    
    try {
      const res = await fetch(`${API_BASE_URL}/approval/resume`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ thread_id, approved }),
      });
      const data = await res.json();
      
      // Update local state if the admin is deciding on their own stored request
      if (thread_id === threadId.current) {
        setPendingAction(null);
        setFinalStatus(data.approved ? 'Approved and Finalized' : 'Rejected');
      }

      // Remove from the admin list
      setAllPendingApprovals(prev => prev.filter(req => req.thread_id !== thread_id));
      
    } catch (error) {
      console.error(error);
      if (thread_id === threadId.current) {
        setFinalStatus('Error processing decision.');
      }
    } finally {
      setIsResuming(null);
    }
  };

  const clearSession = () => {
    setPendingAction(null);
    setFinalStatus(null);
    if (!user?.id) {
      threadId.current = `approval_${Math.random().toString(36).substring(7)}`;
    }
  };

  return (
    <div className="flex justify-center w-full max-w-2xl h-[600px]">
      {/* Student View Pane */}
      {!isAdminOrStaff && (
        <div className="flex flex-col flex-1 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden h-full w-full">
          <div className="bg-indigo-600 p-4 text-white flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <User className="w-6 h-6" />
              <div>
                <h2 className="font-semibold text-lg">Student Request Portal</h2>
                <p className="text-indigo-100 text-sm">Request restricted assets</p>
              </div>
            </div>
            {(pendingAction || finalStatus) && (
              <button 
                onClick={clearSession}
                className="text-xs bg-indigo-700 hover:bg-indigo-800 px-2 py-1 rounded"
              >
                Reset Session
              </button>
            )}
          </div>
          
          <div className="p-6 flex-1 overflow-y-auto flex flex-col">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">What do you need?</label>
                <textarea
                  value={requestText}
                  onChange={(e) => setRequestText(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm resize-none"
                  rows={4}
                  disabled={isSubmitting || !!pendingAction || !!finalStatus}
                />
              </div>
              
              <button
                onClick={handleRequest}
                disabled={isSubmitting || !!pendingAction || !requestText.trim() || !!finalStatus}
                className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 flex justify-center items-center transition-colors"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Request to AI'}
              </button>

              {pendingAction && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
                  <span className="font-semibold block mb-1">⏳ Processing Paused</span>
                  The AI has drafted your request but it requires human admin approval before finalizing.
                </div>
              )}
              
              {finalStatus && (
                <div className={`mt-4 p-4 border rounded-lg text-sm ${finalStatus.includes('Approved') ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                  <span className="font-semibold block mb-1">Result</span>
                  {finalStatus}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Admin Dashboard Pane */}
      {isAdminOrStaff && (
        <div className="flex flex-col flex-1 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden h-full w-full">
          <div className="bg-slate-800 p-4 text-white flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="w-6 h-6 text-slate-300" />
              <div>
                <h2 className="font-semibold text-lg">Admin Approval Dashboard</h2>
                <p className="text-slate-400 text-sm">Global Pending Requests</p>
              </div>
            </div>
            <button 
              onClick={() => {
                const fetchPending = async () => {
                  setIsLoadingApprovals(true);
                  try {
                    const res = await fetch(`${API_BASE_URL}/approval/pending`, {
                      headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
                    });
                    const data = await res.json();
                    setAllPendingApprovals(data.pending || []);
                  } catch (err) {
                    console.error('Failed to fetch pending approvals', err);
                  } finally {
                    setIsLoadingApprovals(false);
                  }
                };
                fetchPending();
              }}
              className="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded border border-slate-600 flex items-center"
            >
              {isLoadingApprovals ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
              Refresh
            </button>
          </div>
          
          <div className="p-6 bg-slate-50 flex-1 overflow-y-auto flex flex-col space-y-4">
            {isLoadingApprovals && allPendingApprovals.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                <Loader2 className="w-8 h-8 mb-3 animate-spin text-gray-300" />
                <p className="text-sm italic">Loading requests...</p>
              </div>
            ) : allPendingApprovals.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                <CheckCircle className="w-12 h-12 mb-3 text-gray-300" />
                <p className="text-sm italic">No pending approval requests globally.</p>
              </div>
            ) : (
              allPendingApprovals.map((req) => (
                <div key={req.thread_id} className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm flex flex-col shrink-0">
                  <div className="flex justify-between items-start mb-3 border-b pb-2">
                    <h3 className="font-bold text-gray-800">Pending Asset Request</h3>
                    <span className="text-xs text-gray-400 font-mono" title={req.thread_id}>
                      ID: {req.thread_id.split('_')[1] || req.thread_id}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800 mb-2 font-medium">"{req.message}"</p>
                  <p className="text-sm text-gray-600 mb-4">{req.action}</p>
                  
                  <div className="bg-slate-100 rounded p-3 mb-4 font-mono text-xs text-gray-800 overflow-x-auto">
                    <pre>{JSON.stringify(req.details, null, 2)}</pre>
                  </div>
                  
                  <div className="flex space-x-3 mt-auto">
                    <button
                      onClick={() => handleAdminDecision(req.thread_id, true)}
                      disabled={isResuming === req.thread_id}
                      className="flex-1 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex justify-center items-center text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {isResuming === req.thread_id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4 mr-2" /> Approve</>}
                    </button>
                    <button
                      onClick={() => handleAdminDecision(req.thread_id, false)}
                      disabled={isResuming === req.thread_id}
                      className="flex-1 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex justify-center items-center text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {isResuming === req.thread_id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><XCircle className="w-4 h-4 mr-2" /> Reject</>}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}