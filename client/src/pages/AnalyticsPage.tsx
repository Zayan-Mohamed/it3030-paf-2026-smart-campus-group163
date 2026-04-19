import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { Download, Calendar, Filter } from 'lucide-react';
import '../styles/Dashboard.css';
import api from '../lib/api';

const COLORS = ['#0891b2', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

export const AnalyticsPage = () => {
  const [timeRange, setTimeRange] = useState('6M');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics(timeRange);
  }, [timeRange]);

  const fetchAnalytics = async (range: string) => {
    try {
      setLoading(true);
      const response = await api.get(`/api/admin/analytics?timeRange=${range}`);
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!data) return;

    // A simple CSV export logic
    const headers = ['Metric', 'Value', 'Trend'];
    const rows = [
      ['Total Users', data.kpis?.totalUsers, data.kpis?.usersTrend],
      ['Total Facilities', data.kpis?.totalFacilities, data.kpis?.facilitiesTrend],
      ['Monthly Bookings', data.kpis?.monthlyBookings, data.kpis?.bookingsTrend],
      ['Avg Resolution Time', data.kpis?.avgResolutionTime, data.kpis?.resolutionTrend]
    ];

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(v => `"${v || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `analytics_export_${timeRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && !data) {
    return <div className="p-8 text-center text-gray-500">Loading analytics...</div>;
  }

  if (!data) {
    return <div className="p-8 text-center text-red-500">Failed to load analytics data.</div>;
  }

  return (
    <div className="dashboard-layout">
      <main className="dashboard-main p-6 overflow-y-auto w-full">
        <div className="flex justify-between items-end mb-8 border-b pb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Analytics & Reports</h1>
            <p className="text-gray-500 mt-2">Detailed insights into system usage, bookings, and incidents</p>
          </div>
          <div className="flex gap-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="flex items-center gap-2 px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50 bg-white"
            >
              <option value="1M">Last 1 Month</option>
              <option value="3M">Last 3 Months</option>
              <option value="6M">Last 6 Months</option>
              <option value="1Y">Last 1 Year</option>
            </select>
            <button onClick={fetchAnalytics.bind(null, timeRange)} className="flex items-center gap-2 px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50 bg-white">
              <Filter size={18} />
              <span>Refresh</span>
            </button>
            <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              <Download size={18} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Top KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total Active Users', value: data.kpis?.totalUsers, trend: data.kpis?.usersTrend, positive: data.kpis?.usersPositive },
            { label: 'Total Facilities', value: data.kpis?.totalFacilities, trend: data.kpis?.facilitiesTrend, positive: data.kpis?.facilitiesPositive },
            { label: 'Total Bookings', value: data.kpis?.monthlyBookings, trend: data.kpis?.bookingsTrend, positive: data.kpis?.bookingsPositive },
            { label: 'Avg Resolution Time', value: data.kpis?.avgResolutionTime, trend: data.kpis?.resolutionTrend, positive: data.kpis?.resolutionPositive },
          ].map((kpi, i) => (
            <div key={i} className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
              <p className="text-gray-500 text-sm mb-1">{kpi.label}</p>
              <h3 className="text-2xl font-bold text-gray-800">{kpi.value || '0'}</h3>
              <p className={`text-sm mt-2 ${kpi.positive ? 'text-green-600' : 'text-red-600'}`}>
                {kpi.trend} from last period
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Monthly Bookings Area Chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold mb-6 text-gray-700">Booking Trends Overview</h3>
            <div className="h-80 w-full">
              {data.bookingTrends && data.bookingTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.bookingTrends}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="students" stackId="1" stroke="#0891b2" fill="#0891b2" opacity={0.8} name="Students" />
                    <Area type="monotone" dataKey="staff" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" opacity={0.8} name="Staff & Admins" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">No data available</div>
              )}
            </div>
          </div>

          {/* Facility Usage Pie Chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold mb-6 text-gray-700">Facility Popularity</h3>
            <div className="h-80 w-full">
              {data.facilityPopularity && data.facilityPopularity.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.facilityPopularity}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {data.facilityPopularity.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">No data available</div>
              )}
            </div>
          </div>

          {/* Incident Trends Bar Chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold mb-6 text-gray-700">Incident Resolution Trends</h3>
            <div className="h-80 w-full">
              {data.incidentTrends && data.incidentTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.incidentTrends}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="open" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Open Incidents" />
                    <Bar dataKey="resolved" fill="#10b981" radius={[4, 4, 0, 0]} name="Resolved Incidents" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">No data available</div>
              )}
            </div>
          </div>

          {/* System Performance Line Chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold mb-6 text-gray-700">System Peak Usage</h3>
            <div className="h-80 w-full">
              {data.systemPeakUsage && data.systemPeakUsage.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.systemPeakUsage}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="students" stroke="#0891b2" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} name="Active Sessions" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">No data available</div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
