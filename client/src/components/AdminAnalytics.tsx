import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, TrendingUp, DollarSign, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  credits: number;
  productName: string;
  status: string;
  createdAt: string;
  user: {
    email: string;
    name: string;
  } | null;
}

interface AnalyticsData {
  summary: {
    totalRevenue: number;
    totalSales: number;
    averageOrderValue: number;
  };
  chartData: Array<{
    date: string;
    revenue: number;
    count: number;
  }>;
  transactions: Transaction[];
}

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/analytics', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-primary mr-2" />
          <span>Loading analytics...</span>
        </div>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card className="p-8">
        <p className="text-center text-muted-foreground">No analytics data available</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-3xl font-bold text-foreground">
                ${analytics.summary.totalRevenue.toFixed(2)}
              </p>
            </div>
            <DollarSign className="h-10 w-10 text-green-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Sales</p>
              <p className="text-3xl font-bold text-foreground">
                {analytics.summary.totalSales}
              </p>
            </div>
            <ShoppingBag className="h-10 w-10 text-blue-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Order Value</p>
              <p className="text-3xl font-bold text-foreground">
                ${analytics.summary.averageOrderValue.toFixed(2)}
              </p>
            </div>
            <TrendingUp className="h-10 w-10 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Charts */}
      {analytics.chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Revenue Over Time</h3>
              <Button variant="ghost" size="sm" onClick={fetchAnalytics}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))'
                  }}
                  formatter={(value: number) => `$${value.toFixed(2)}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  name="Revenue ($)"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Sales Count Chart */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Sales Count Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))'
                  }}
                />
                <Legend />
                <Bar
                  dataKey="count"
                  fill="hsl(var(--primary))"
                  name="Sales Count"
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* Transactions Table */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Recent Transactions</h3>
        <div className="overflow-x-auto">
          {analytics.transactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No transactions yet</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 text-sm font-semibold text-foreground">Date</th>
                  <th className="text-left p-3 text-sm font-semibold text-foreground">Customer</th>
                  <th className="text-left p-3 text-sm font-semibold text-foreground">Product</th>
                  <th className="text-right p-3 text-sm font-semibold text-foreground">Credits</th>
                  <th className="text-right p-3 text-sm font-semibold text-foreground">Amount</th>
                  <th className="text-center p-3 text-sm font-semibold text-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {analytics.transactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b hover:bg-muted/50">
                    <td className="p-3 text-sm text-muted-foreground">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-sm text-foreground">
                      <div>
                        <p className="font-medium">{transaction.user?.name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">{transaction.user?.email || 'N/A'}</p>
                      </div>
                    </td>
                    <td className="p-3 text-sm text-foreground">{transaction.productName}</td>
                    <td className="p-3 text-sm text-foreground text-right">{transaction.credits}</td>
                    <td className="p-3 text-sm text-foreground text-right font-semibold">
                      ${transaction.amount.toFixed(2)}
                    </td>
                    <td className="p-3 text-center">
                      <span className="inline-block px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                        {transaction.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}
