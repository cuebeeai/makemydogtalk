import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Shield, Plus, Minus, RefreshCw, Search, Coins, TrendingUp, Users } from "lucide-react";
import AdminAnalytics from "./AdminAnalytics";

interface AdminUser {
  id: string;
  email: string;
  name: string;
  credits: number;
  adminCredits: number;
  totalCredits: number;
  purchasedCredits: number;
  createdAt: string;
}

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<'analytics' | 'users'>('analytics');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [creditAmounts, setCreditAmounts] = useState<Record<string, number>>({});
  const { toast } = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/users', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users);
      setFilteredUsers(data.users);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      setFilteredUsers(
        users.filter(
          (user) =>
            user.email.toLowerCase().includes(query) ||
            user.name.toLowerCase().includes(query)
        )
      );
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  const handleGiveCredits = async (userId: string) => {
    const credits = creditAmounts[userId] || 1;

    if (credits <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a positive number",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/admin/give-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ userId, credits }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to give credits');
      }

      toast({
        title: "Success",
        description: data.message,
      });

      // Refresh users list
      fetchUsers();

      // Reset credit amount input
      setCreditAmounts({ ...creditAmounts, [userId]: 1 });
    } catch (error: any) {
      console.error('Error giving credits:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to give credits",
        variant: "destructive",
      });
    }
  };

  const handleRemoveCredits = async (userId: string) => {
    const credits = creditAmounts[userId] || 1;

    if (credits <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a positive number",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/admin/remove-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ userId, credits }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove credits');
      }

      toast({
        title: "Success",
        description: data.message,
      });

      // Refresh users list
      fetchUsers();

      // Reset credit amount input
      setCreditAmounts({ ...creditAmounts, [userId]: 1 });
    } catch (error: any) {
      console.error('Error removing credits:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove credits",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-primary mr-2" />
          <span>Loading admin panel...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h2 className="text-2xl font-bold text-foreground">Admin Panel</h2>
              <p className="text-sm text-muted-foreground">
                Sales analytics and user management
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <Button
          variant={activeTab === 'analytics' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('analytics')}
          className="gap-2"
        >
          <TrendingUp className="h-4 w-4" />
          Sales Analytics
        </Button>
        <Button
          variant={activeTab === 'users' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('users')}
          className="gap-2"
        >
          <Users className="h-4 w-4" />
          User Management
        </Button>
      </div>

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <AdminAnalytics />
      )}

      {/* User Management Tab */}
      {activeTab === 'users' && (
        <>
          {/* Search */}
          <Card className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </Card>

          {/* Users List */}
          <div className="space-y-4">
            {filteredUsers.length === 0 ? (
              <Card className="p-8">
                <p className="text-center text-muted-foreground">
                  {searchQuery ? "No users found matching your search" : "No users yet"}
                </p>
              </Card>
            ) : (
              filteredUsers.map((user) => (
                <Card key={user.id} className="p-6">
                  <div className="space-y-4">
                    {/* User Info */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground">
                          {user.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Joined: {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Credits Summary */}
                      <div className="flex gap-4 text-right">
                        <div>
                          <p className="text-2xl font-bold text-primary">
                            {user.totalCredits}
                          </p>
                          <p className="text-xs text-muted-foreground">Total Credits</p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-foreground">
                            {user.purchasedCredits}
                          </p>
                          <p className="text-xs text-muted-foreground">Purchased</p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-accent">
                            {user.adminCredits}
                          </p>
                          <p className="text-xs text-muted-foreground">Admin</p>
                        </div>
                      </div>
                    </div>

                    {/* Credit Management */}
                    <div className="flex items-center gap-2 pt-4 border-t">
                      <Coins className="h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        min="1"
                        placeholder="Amount"
                        value={creditAmounts[user.id] || ""}
                        onChange={(e) =>
                          setCreditAmounts({
                            ...creditAmounts,
                            [user.id]: parseInt(e.target.value) || 1,
                          })
                        }
                        className="w-24"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleGiveCredits(user.id)}
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Give Credits
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveCredits(user.id)}
                        disabled={user.adminCredits === 0}
                        className="gap-2"
                      >
                        <Minus className="h-4 w-4" />
                        Remove Credits
                      </Button>
                      {user.adminCredits === 0 && (
                        <span className="text-xs text-muted-foreground italic">
                          No admin credits to remove
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
