export interface NotificationDto {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  category: string;
  createdAt: string;
  isRead: boolean;
}
