import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Users, Plus, ExternalLink, MessageCircle, X, Search, Filter, Edit, Trash2, LogOut } from 'lucide-react';
import type { CampusEvent, EventSquad } from '../types/events';
import api from '../lib/api';
import { useForm } from 'react-hook-form';

export default function CampusEventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CampusEvent | null>(null);
  const [squads, setSquads] = useState<EventSquad[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Filtering and Searching
  const [searchTerm, setSearchTerm] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  
  const { register: registerSquad, handleSubmit: handleSquadSubmit, reset: resetSquad } = useForm();
  const { register: registerEvent, handleSubmit: handleEventSubmit, reset: resetEvent } = useForm();
  
  const fetchEvents = async () => {
    try {
      const response = await api.get('/api/events');
      if (response.data.length === 0) {
        // Provide mock data if empty for demo purposes
        setEvents([
          {
            id: 998,
            title: 'Spring 2026 Hackathon',
            description: 'Join us for a 48-hour coding marathon!',
            eventDate: '2026-05-10T10:00:00',
            lfgEnabled: true,
            eventType: 'HACKATHON',
            creator: { id: 1, username: 'Admin', email: 'admin@test.com' },
            createdAt: new Date().toISOString(),
            externalFormUrl: 'https://forms.gle/hackathon'
          },
          {
            id: 999,
            title: 'Final Year Project 2026 Grouping',
            description: 'Find your FYP team for the next academic year.',
            eventDate: '2026-08-01T00:00:00',
            lfgEnabled: true,
            eventType: 'FINAL_YEAR_PROJECT',
            creator: { id: 1, username: 'Admin', email: 'admin@test.com' },
            createdAt: new Date().toISOString()
          }
        ]);
      } else {
        setEvents(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch events', error);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const onCreateEventSubmit = async (data: any) => {
    try {
      const payload = {
        ...data,
        lfgEnabled: data.lfgEnabled === 'true' || data.lfgEnabled === true
      };
      await api.post('/api/events', payload);
      setIsCreateModalOpen(false);
      resetEvent();
      fetchEvents();
    } catch (error) {
      console.error('Failed to create event', error);
    }
  };

  const fetchSquads = async (eventId: number) => {
    try {
      const response = await api.get(`/api/events/${eventId}/squads`);
      setSquads(response.data);
    } catch (error) {
      console.error('Failed to fetch squads', error);
      setSquads([]);
    }
  };

  const handleEventClick = (event: CampusEvent) => {
    setSelectedEvent(event);
    if (event.lfgEnabled) {
      fetchSquads(event.id);
    }
  };

  const onSquadSubmit = async (data: any) => {
    if (!selectedEvent) return;
    try {
      const payload = {
        ...data,
        maxMembers: data.maxMembers ? parseInt(data.maxMembers, 10) : null
      };
      await api.post(`/api/events/${selectedEvent.id}/squads`, payload);
      resetSquad();
      fetchSquads(selectedEvent.id);
    } catch (error) {
      console.error('Failed to create squad', error);
    }
  };

  const handleJoinSquad = async (squadId: number) => {
    if (!selectedEvent) return;
    try {
      await api.post(`/api/events/${selectedEvent.id}/squads/${squadId}/join`);
      fetchSquads(selectedEvent.id);
      alert('Join request sent! Waiting for creator approval.');
    } catch (error: any) {
      console.error('Failed to join squad', error);
      alert(error.response?.data?.message || 'Failed to request join. You might already be in a squad for this event.');
    }
  };

  const [editingSquad, setEditingSquad] = useState<EventSquad | null>(null);
  
  const handleEditSquadSubmit = async (data: any) => {
    if (!selectedEvent || !editingSquad) return;
    try {
      const payload = {
        ...data,
        maxMembers: data.maxMembers ? parseInt(data.maxMembers, 10) : null
      };
      await api.put(`/api/events/${selectedEvent.id}/squads/${editingSquad.id}`, payload);
      setEditingSquad(null);
      fetchSquads(selectedEvent.id);
    } catch (error: any) {
      console.error('Failed to update squad', error);
      alert(error.response?.data?.message || 'Failed to update squad.');
    }
  };

  const handleDeleteSquad = async (squadId: number) => {
    if (!selectedEvent) return;
    if (!window.confirm('Are you sure you want to delete this squad?')) return;
    try {
      await api.delete(`/api/events/${selectedEvent.id}/squads/${squadId}`);
      fetchSquads(selectedEvent.id);
    } catch (error: any) {
      console.error('Failed to delete squad', error);
      alert(error.response?.data?.message || 'Failed to delete squad.');
    }
  };

  const handleLeaveSquad = async (squadId: number) => {
    if (!selectedEvent) return;
    if (!window.confirm('Are you sure you want to leave this squad?')) return;
    try {
      await api.post(`/api/events/${selectedEvent.id}/squads/${squadId}/leave`);
      fetchSquads(selectedEvent.id);
    } catch (error: any) {
      console.error('Failed to leave squad', error);
      alert(error.response?.data?.message || 'Failed to leave squad.');
    }
  };

  const handleApproveJoin = async (squadId: number, userId: number) => {
    if (!selectedEvent) return;
    try {
      await api.post(`/api/events/${selectedEvent.id}/squads/${squadId}/approve/${userId}`);
      fetchSquads(selectedEvent.id);
    } catch (error: any) {
      console.error('Failed to approve join', error);
      alert(error.response?.data?.message || 'Failed to approve join request.');
    }
  };

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            event.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = eventTypeFilter ? event.eventType === eventTypeFilter : true;
      return matchesSearch && matchesType;
    });
  }, [events, searchTerm, eventTypeFilter]);

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 py-8">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Campus Events & Squads
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Discover events and find your perfect team or buddy for projects, hackathons, and more.
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Create Event
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Search events by title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="sm:w-64 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter className="h-5 w-5 text-gray-400" />
          </div>
          <select
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
          >
            <option value="">All Event Types</option>
            <option value="SEMESTER_PROJECT">Semester Project</option>
            <option value="FINAL_YEAR_PROJECT">Final Year Project</option>
            <option value="HACKATHON">Hackathon</option>
            <option value="WORKSHOP">Workshop</option>
            <option value="SOCIAL">Social</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Events List */}
        <div className="lg:col-span-1 space-y-4 max-h-[800px] overflow-y-auto pr-2">
          {filteredEvents.length === 0 ? (
            <div className="text-center p-6 bg-white rounded-lg border border-dashed border-gray-300 text-gray-500">
              No events found matching your filters.
            </div>
          ) : (
            filteredEvents.map((event) => (
              <div
                key={event.id}
                onClick={() => handleEventClick(event)}
              className={`bg-white rounded-lg shadow cursor-pointer transition-all hover:shadow-md border-l-4 ${
                selectedEvent?.id === event.id ? 'border-indigo-600 ring-1 ring-indigo-500' : 'border-transparent'
              }`}
            >
              <div className="p-4 flex flex-col h-full">
                <div className="flex justify-between items-start mb-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {event.eventType.replace(/_/g, ' ')}
                  </span>
                  {event.lfgEnabled && (
                    <span className="inline-flex items-center text-xs font-medium text-green-600">
                      <Users className="w-3 h-3 mr-1" />
                      LFG Active
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{event.title}</h3>
                <div className="flex items-center text-sm text-gray-500 mb-2">
                  <Calendar className="w-4 h-4 mr-1.5" />
                  {new Date(event.eventDate).toLocaleDateString()}
                </div>
              </div>
            </div>
            ))
          )}
        </div>

        {/* Event Details & LFG */}
        <div className="lg:col-span-3">
          {selectedEvent ? (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedEvent.title}</h2>
                <p className="text-gray-600 mb-4">{selectedEvent.description}</p>
                {selectedEvent.externalFormUrl && (
                  <a
                    href={selectedEvent.externalFormUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    RSVP to Event <ExternalLink className="ml-2 w-4 h-4" />
                  </a>
                )}
              </div>

              {selectedEvent.lfgEnabled && (
                <div className="p-6 bg-gray-50">
                  <div className="flex items-center mb-6">
                    <Users className="w-6 h-6 text-indigo-600 mr-2" />
                    <h3 className="text-xl font-bold text-gray-900">Looking For Group (LFG)</h3>
                  </div>

                  {/* Create Squad Form using react-hook-form */}
                  <form onSubmit={handleSquadSubmit(onSquadSubmit)} className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
                    <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                      <Plus className="w-4 h-4 mr-1" /> Create a Squad
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Squad Name *</label>
                        <input
                          {...registerSquad("name", { required: true })}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="e.g. Code Ninjas"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Max Members</label>
                        <input
                          type="number"
                          {...registerSquad("maxMembers")}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="4"
                        />
                      </div>
                      
                      {(selectedEvent.eventType === 'SEMESTER_PROJECT' || selectedEvent.eventType === 'FINAL_YEAR_PROJECT') && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Target Year</label>
                            <input
                              {...registerSquad("targetYear")}
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              placeholder="e.g. 4th Year"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Major/Field</label>
                            <input
                              {...registerSquad("targetMajor")}
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              placeholder="e.g. Software Engineering"
                            />
                          </div>
                        </>
                      )}
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Description / Looking for...</label>
                        <textarea
                          {...registerSquad("description")}
                          rows={2}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="What skills are you looking for?"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Post LFG Request
                    </button>
                  </form>

                  {/* List Squads */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-800 flex items-center mb-2">
                      <MessageCircle className="w-4 h-4 mr-1" /> Active Squads ({squads.length})
                    </h4>
                    {squads.length === 0 ? (
                      <p className="text-gray-500 italic text-sm">No squads looking for members right now. Be the first!</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {squads.map(squad => {
                          const isMember = squad.members.some(m => m.id === user?.id);
                          const isPending = squad.pendingMembers?.some(m => m.id === user?.id) || false;
                          const isCreator = squad.creator.id === user?.id;
                          const isFull = squad.maxMembers ? squad.members.length >= squad.maxMembers : false;
                          
                          return (
                            <div key={squad.id} className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm flex flex-col justify-between items-start h-full">
                              <div className="w-full flex flex-col justify-between items-start mb-4 h-full">
                                <div className="mb-4 sm:mb-0 w-full flex flex-col justify-between h-full">
                                  <div className="flex justify-between items-start w-full">
                                    <h5 className="font-bold text-gray-900 truncate max-w-[70%]">{squad.name}</h5>
                                    <div className="flex-shrink-0">
                                      {isMember ? (
                                        <span className="inline-flex items-center px-2 py-1 border border-transparent text-[10px] font-medium rounded-full text-indigo-700 bg-indigo-100">
                                          {isCreator ? "Creator" : "Joined"}
                                        </span>
                                      ) : isPending ? (
                                        <span className="inline-flex items-center px-2 py-1 border border-transparent text-[10px] font-medium rounded-full text-yellow-700 bg-yellow-100">
                                          Pending
                                        </span>
                                      ) : isFull ? (
                                        <span className="inline-flex items-center px-2 py-1 border border-transparent text-[10px] font-medium rounded-full text-gray-700 bg-gray-100">
                                          Full
                                        </span>
                                      ) : (
                                        <button
                                          onClick={() => handleJoinSquad(squad.id)}
                                          className="inline-flex items-center px-2 py-1 border border-transparent text-[10px] font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                        >
                                          Request Join
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="mt-1 flex items-center space-x-2">
                                    <p className="text-sm text-gray-600 line-clamp-2">{squad.description}</p>
                                  </div>
                                  
                                  {(isCreator || (isMember && !isCreator)) && (
                                    <div className="mt-2 flex items-center space-x-2">
                                      {isCreator && (
                                        <>
                                          <button onClick={() => setEditingSquad(squad)} className="text-gray-400 hover:text-indigo-600" title="Edit Squad">
                                            <Edit className="w-4 h-4" />
                                          </button>
                                          <button onClick={() => handleDeleteSquad(squad.id)} className="text-gray-400 hover:text-red-600" title="Delete Squad">
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </>
                                      )}
                                      {isMember && !isCreator && (
                                        <button onClick={() => handleLeaveSquad(squad.id)} className="text-gray-400 hover:text-red-600 flex items-center" title="Leave Squad">
                                          <LogOut className="w-4 h-4 mr-1" />
                                          <span className="text-xs">Leave</span>
                                        </button>
                                      )}
                                    </div>
                                  )}
                                  
                                  <div className="mt-2 flex flex-wrap gap-1">
                                    {squad.targetYear && <span className="bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0.5 rounded">Year: {squad.targetYear}</span>}
                                    {squad.targetMajor && <span className="bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0.5 rounded">Major: {squad.targetMajor}</span>}
                                  </div>
                                  
                                  <div className="mt-auto pt-3 flex items-center -space-x-2 overflow-hidden">
                                    {squad.members.map((member, idx) => (
                                      <div key={member.id} title={member.username} className={`inline-block h-6 w-6 rounded-full ring-2 ring-white bg-gray-300 flex items-center justify-center text-[10px] text-gray-700 font-bold z-${10-idx}`}>
                                        {member.username?.charAt(0) || member.email?.charAt(0) || '?'}
                                      </div>
                                    ))}
                                    <span className="ml-4 text-xs text-gray-500 font-medium pl-3">
                                      {squad.members.length} {squad.maxMembers ? `/ ${squad.maxMembers}` : ''} members
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Pending Requests Section for Creator */}
                              {isCreator && squad.pendingMembers && squad.pendingMembers.length > 0 && (
                                <div className="w-full mt-2 pt-3 border-t border-gray-100">
                                  <h6 className="text-[10px] font-semibold text-gray-700 mb-2 uppercase tracking-wider">Pending Join Requests:</h6>
                                  <div className="space-y-1">
                                    {squad.pendingMembers.map(pendingUser => (
                                      <div key={pendingUser.id} className="flex justify-between items-center bg-gray-50 p-1.5 rounded text-[11px]">
                                        <span className="text-gray-800 font-medium truncate pr-2">{pendingUser.username || pendingUser.email}</span>
                                        <button 
                                          onClick={() => handleApproveJoin(squad.id, pendingUser.id)}
                                          className="text-indigo-600 hover:text-indigo-800 text-[10px] font-semibold px-2 py-0.5 bg-indigo-50 rounded whitespace-nowrap"
                                        >
                                          Approve
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-64 flex flex-col items-center justify-center text-gray-500">
              <Calendar className="w-12 h-12 mb-3 text-gray-300" />
              <p>Select an event to view details and squads</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Event Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setIsCreateModalOpen(false)}></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                  Create New Campus Event
                </h3>
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                  <X className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
              
              <form onSubmit={handleEventSubmit(onCreateEventSubmit)}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Title *</label>
                    <input
                      {...registerEvent("title", { required: true })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="e.g. Fall Hackathon 2026"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description *</label>
                    <textarea
                      {...registerEvent("description", { required: true })}
                      rows={3}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Event Date *</label>
                      <input
                        type="datetime-local"
                        {...registerEvent("eventDate", { required: true })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Event Type *</label>
                      <select
                        {...registerEvent("eventType", { required: true })}
                        className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      >
                        <option value="SEMESTER_PROJECT">Semester Project</option>
                        <option value="FINAL_YEAR_PROJECT">Final Year Project</option>
                        <option value="HACKATHON">Hackathon</option>
                        <option value="WORKSHOP">Workshop</option>
                        <option value="SOCIAL">Social</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Location</label>
                    <input
                      {...registerEvent("location")}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="e.g. Main Auditorium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">External RSVP/Form URL</label>
                    <input
                      type="url"
                      {...registerEvent("externalFormUrl")}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="https://forms.gle/..."
                    />
                  </div>
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        {...registerEvent("lfgEnabled")}
                        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label className="font-medium text-gray-700">Enable Looking For Group (LFG)</label>
                      <p className="text-gray-500">Allow students to form squads and find teammates for this event.</p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Create Event
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Squad Modal */}
      {editingSquad && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setEditingSquad(null)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Edit Squad</h3>
                <button type="button" onClick={() => setEditingSquad(null)} className="text-gray-400 hover:text-gray-500">
                  <X className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
              <form onSubmit={handleSquadSubmit(handleEditSquadSubmit)}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Squad Name *</label>
                    <input defaultValue={editingSquad.name} {...registerSquad("name", { required: true })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea defaultValue={editingSquad.description} {...registerSquad("description")} rows={2} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Max Members</label>
                    <input type="number" defaultValue={editingSquad.maxMembers} {...registerSquad("maxMembers")} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                  </div>
                  {(selectedEvent?.eventType === 'SEMESTER_PROJECT' || selectedEvent?.eventType === 'FINAL_YEAR_PROJECT') && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Target Year</label>
                        <input defaultValue={editingSquad.targetYear} {...registerSquad("targetYear")} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Major/Field</label>
                        <input defaultValue={editingSquad.targetMajor} {...registerSquad("targetMajor")} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
                  <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 sm:ml-3 sm:w-auto sm:text-sm">
                    Save Changes
                  </button>
                  <button type="button" onClick={() => setEditingSquad(null)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
