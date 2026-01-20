import { Bell, Check } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getNotifications, markNotificationAsRead } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function Notifications() {
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  const { data: notifications, isLoading, error } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
    enabled: !!user,
  });

  const mutation = useMutation({
    mutationFn: (notificationId: number) => markNotificationAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleMarkAsRead = (notificationId: number) => {
    mutation.mutate(notificationId);
  };

  if (authLoading || isLoading) {
    return (
      <Layout>
        <div className="p-4 md:p-8">
          <div className="flex items-center gap-4 mb-8">
            <Bell className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Notifications</h1>
          </div>
          <div className="bg-card border rounded-lg p-8 text-center">
            <p className="text-muted-foreground">Loading notifications...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="p-4 md:p-8">
          <div className="flex items-center gap-4 mb-8">
            <Bell className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Notifications</h1>
          </div>
          <div className="bg-card border rounded-lg p-8 text-center">
            <p className="text-destructive">Error loading notifications.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 md:p-8">
        <div className="flex items-center gap-4 mb-8">
          <Bell className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Notifications</h1>
        </div>
        <div className="bg-card border rounded-lg">
          {notifications?.data && notifications.data.length > 0 ? (
            <ul className="divide-y">
              {notifications.data.map((notification: any) => (
                <li key={notification.id} className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{notification.message}</p>
                    <p className="text-sm text-muted-foreground">{notification.type}</p>
                  </div>
                  {!notification.is_read && (
                    <Button variant="ghost" size="icon" onClick={() => handleMarkAsRead(notification.id)}>
                      <Check className="w-5 h-5" />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">You have no new notifications.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
