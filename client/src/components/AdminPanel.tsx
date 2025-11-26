import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Shield, Plus, Minus, RefreshCw, Search, Coins, TrendingUp, Users, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
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

type SortField = 'name' | 'email' | 'totalCredits' | 'purchasedCredits' | 'adminCredits' | 'createdAt';
type SortDirection = 'asc' | 'desc';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<'analytics' | 'users'>('analytics');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [creditAmounts, setCreditAmounts] = useState<Record<string, number>>({});
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
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
    let result = [...users];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (user) =>
          user.email.toLowerCase().includes(query) ||
          user.name.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Handle date sorting
      if (sortField === 'createdAt') {
        aValue = new Date(aValue as string).getTime();
        bValue = new Date(bValue as string).getTime();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredUsers(result);
  }, [searchQuery, users, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to descending for numbers/dates, ascending for text
      setSortField(field);
      setSortDirection(field === 'name' || field === 'email' ? 'asc' : 'desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="h-4 w-4 text-primary" />
    ) : (
      <ArrowDown className="h-4 w-4 text-primary" />
    );
  };

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
          {/* Search and Stats */}
          <Card className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span>Total Users: <strong className="text-foreground">{users.length}</strong></span>
                <span>|</span>
                <span>Showing: <strong className="text-foreground">{filteredUsers.length}</strong></span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={fetchUsers}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </Card>

          {/* Users Table */}
          <Card className="overflow-hidden">
            {filteredUsers.length === 0 ? (
              <div className="p-8">
                <p className="text-center text-muted-foreground">
                  {searchQuery ? "No users found matching your search" : "No users yet"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="text-left p-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('name')}
                          className="gap-2 font-semibold -ml-2"
                        >
                          Name
                          <SortIcon field="name" />
                        </Button>
                      </th>
                      <th className="text-left p-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('email')}
                          className="gap-2 font-semibold -ml-2"
                        >
                          Email
                          <SortIcon field="email" />
                        </Button>
                      </th>
                      <th className="text-right p-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('totalCredits')}
                          className="gap-2 font-semibold ml-auto"
                        >
                          Total Credits
                          <SortIcon field="totalCredits" />
                        </Button>
                      </th>
                      <th className="text-right p-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('purchasedCredits')}
                          className="gap-2 font-semibold ml-auto"
                        >
                          Purchased
                          <SortIcon field="purchasedCredits" />
                        </Button>
                      </th>
                      <th className="text-right p-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('adminCredits')}
                          className="gap-2 font-semibold ml-auto"
                        >
                          Admin
                          <SortIcon field="adminCredits" />
                        </Button>
                      </th>
                      <th className="text-left p-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('createdAt')}
                          className="gap-2 font-semibold -ml-2"
                        >
                          Joined
                          <SortIcon field="createdAt" />
                        </Button>
                      </th>
                      <th className="text-center p-4">
                        <span className="text-sm font-semibold">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user, index) => (
                      <tr
                        key={user.id}
                        className={`border-b transition-colors hover:bg-muted/50 ${
                          index % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                        }`}
                      >
                        <td className="p-4">
                          <span className="font-medium text-foreground">{user.name}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-muted-foreground">{user.email}</span>
                        </td>
                        <td className="p-4 text-right">
                          <span className="text-lg font-bold text-primary">{user.totalCredits}</span>
                        </td>
                        <td className="p-4 text-right">
                          <span className="font-semibold text-foreground">{user.purchasedCredits}</span>
                        </td>
                        <td className="p-4 text-right">
                          <span className="font-semibold text-accent">{user.adminCredits}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-muted-foreground">
                            {new Date(user.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </td>
                        <td className="p-4">
                          {editingUserId === user.id ? (
                            <div className="flex items-center gap-2 justify-center">
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
                                className="w-20 h-8"
                                autoFocus
                              />
                              <Button
                                size="sm"
                                onClick={() => {
                                  handleGiveCredits(user.id);
                                  setEditingUserId(null);
                                }}
                                className="h-8 px-2"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  handleRemoveCredits(user.id);
                                  setEditingUserId(null);
                                }}
                                disabled={user.adminCredits === 0}
                                className="h-8 px-2"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingUserId(null)}
                                className="h-8 px-2 text-xs"
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <div className="flex justify-center">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingUserId(user.id);
                                  if (!creditAmounts[user.id]) {
                                    setCreditAmounts({ ...creditAmounts, [user.id]: 1 });
                                  }
                                }}
                                className="gap-2 h-8"
                              >
                                <Coins className="h-4 w-4" />
                                Manage Credits
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
