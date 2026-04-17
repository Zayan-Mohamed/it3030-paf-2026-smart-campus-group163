import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { Client } from '@stomp/stompjs';
import type { StompSubscription } from '@stomp/stompjs';
import type { Notification } from '../types';
import { useAuth } from './AuthContext';

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    loading: boolean;
    connected: boolean;
    markAsRead: (id: number) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const API_BASE_URL = 'http://localhost:8080';
const WS_ENDPOINT = 'ws://localhost:8080/ws-notifications';

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
    const { token, user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [connected, setConnected] = useState<boolean>(false);

    const clientRef = useRef<Client | null>(null);
    const subscriptionRef = useRef<StompSubscription | null>(null);

    /**
     * Fetch initial notifications from REST API
     */
    const fetchNotifications = useCallback(async () => {
        if (!token) {
            console.log('[Notifications] No token, skipping fetch');
            return;
        }

        console.log('[Notifications] Fetching notifications from API...');
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/notifications/unread`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('[Notifications] API Response status:', response.status);

            if (response.ok) {
                const data: Notification[] = await response.json();
                console.log('[Notifications] Fetched', data.length, 'notifications:', data);
                setNotifications(data);
                setUnreadCount(data.filter(n => !n.isRead).length);
            } else {
                console.error('[Notifications] API returned error:', response.status, await response.text());
            }
        } catch (error) {
            console.error('[Notifications] Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    }, [token]);

    /**
     * Fetch unread count from REST API
     */
    const fetchUnreadCount = useCallback(async () => {
        if (!token) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/notifications/count`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setUnreadCount(data.count);
            }
        } catch (error) {
            console.error('Failed to fetch unread count:', error);
        }
    }, [token]);

    /**
     * Connect to WebSocket for real-time notifications
     */
    useEffect(() => {
        if (!token || !user) {
            return;
        }

        // Create STOMP client
        const client = new Client({
            brokerURL: WS_ENDPOINT,
            connectHeaders: {
                'Authorization': `Bearer ${token}`
            },
            debug: (str) => {
                console.log('[STOMP Debug]', str);
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        client.onConnect = () => {
            console.log('[WebSocket] Connected successfully!');
            setConnected(true);

            // Subscribe to user-specific notification queue
            const destination = `/user/${user.email}/queue/notifications`;
            console.log('[WebSocket] Subscribing to:', destination);
            
            const subscription = client.subscribe(
                destination,
                (message) => {
                    try {
                        console.log('[WebSocket] Raw message received:', message.body);
                        const notification: Notification = JSON.parse(message.body);
                        console.log('[WebSocket] Parsed notification:', notification);

                        // Add new notification to the list
                        setNotifications(prev => {
                            console.log('[WebSocket] Adding notification to list. Current count:', prev.length);
                            return [notification, ...prev];
                        });
                        setUnreadCount(prev => {
                            console.log('[WebSocket] Incrementing unread count from', prev, 'to', prev + 1);
                            return prev + 1;
                        });
                    } catch (error) {
                        console.error('[WebSocket] Failed to parse notification:', error);
                    }
                }
            );

            console.log('[WebSocket] Subscription created:', subscription.id);
            subscriptionRef.current = subscription;
        };

        client.onDisconnect = () => {
            console.log('WebSocket disconnected');
            setConnected(false);
        };

        client.onStompError = (frame) => {
            console.error('STOMP error:', frame);
        };

        // Activate the client
        client.activate();
        clientRef.current = client;

        // Cleanup on unmount
        return () => {
            if (subscriptionRef.current) {
                subscriptionRef.current.unsubscribe();
            }
            if (clientRef.current) {
                clientRef.current.deactivate();
            }
        };
    }, [token, user]);

    /**
     * Fetch initial notifications on mount
     */
    useEffect(() => {
        fetchNotifications();
        fetchUnreadCount();
    }, [fetchNotifications, fetchUnreadCount]);

    /**
     * Mark a notification as read
     */
    const markAsRead = async (id: number) => {
        if (!token) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/notifications/${id}/read`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                // Update local state
                setNotifications(prev =>
                    prev.map(n => n.id === id ? { ...n, isRead: true } : n)
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    /**
     * Mark all notifications as read
     */
    const markAllAsRead = async () => {
        if (!token) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/notifications/read-all`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                // Update local state
                setNotifications(prev =>
                    prev.map(n => ({ ...n, isRead: true }))
                );
                setUnreadCount(0);
            }
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
        }
    };

    /**
     * Refresh notifications manually
     */
    const refreshNotifications = async () => {
        await fetchNotifications();
        await fetchUnreadCount();
    };

    const value: NotificationContextType = {
        notifications,
        unreadCount,
        loading,
        connected,
        markAsRead,
        markAllAsRead,
        refreshNotifications
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
