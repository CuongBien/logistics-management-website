"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import * as signalR from "@microsoft/signalr";
import { useSession } from "next-auth/react";
import { NotificationDto } from "@/types/notification";
import { fetchApi } from "@/lib/api-client";

interface NotificationContextType {
  notifications: NotificationDto[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);

  useEffect(() => {
    // Fetch initial notifications
    const loadNotifications = async () => {
      try {
        const data = await fetchApi<NotificationDto[]>("wms", "/notifications?limit=50");
        if (data) setNotifications(data);
      } catch (error) {
        console.error("Failed to load notifications", error);
      }
    };

    if (session?.accessToken) {
      loadNotifications();
    }
  }, [session?.accessToken]);

  useEffect(() => {
    if (!session?.accessToken) return;

    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(`/api/wms/hubs/notification`, {
        accessTokenFactory: () => session.accessToken as string,
      })
      .withAutomaticReconnect()
      .build();

    setConnection(newConnection);
  }, [session?.accessToken]);

  useEffect(() => {
    let isMounted = true;

    if (connection) {
      const startConnection = async () => {
        try {
          await connection.start();
          if (isMounted) {
            console.log("Connected to Notification Hub");
            connection.on("ReceiveNotification", (notification: NotificationDto) => {
              setNotifications((prev) => [notification, ...prev].slice(0, 50));
            });
          } else {
            await connection.stop();
          }
        } catch (e) {
          console.log("Connection failed: ", e);
        }
      };

      startConnection();
    }

    return () => {
      isMounted = false;
      if (connection) {
        connection.off("ReceiveNotification");
        connection.stop().catch(e => console.log("Error stopping connection: ", e));
      }
    };
  }, [connection]);

  const markAsRead = async (id: string) => {
    try {
      await fetchApi("wms", `/notifications/${id}/read`, { method: "POST" });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetchApi("wms", `/notifications/mark-all-read`, { method: "POST" });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Failed to mark all notifications as read", error);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};
