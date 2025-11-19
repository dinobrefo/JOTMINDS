import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { ArrowLeft, Search, Users, ClipboardList, TrendingUp, Eye, Wrench, X } from 'lucide-react';
import { getAllUsers, getAdminStats, getUserData, getAuthToken } from '../utils/api';
import { useAuth } from './AuthContext';
import { AdminDiagnostic } from './AdminDiagnostic';

interface AdminPanelProps {
  onBack: () => void;
  onLogout: () => void;
  onViewUserDashboard: (userId: string) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onBack, onLogout, onViewUserDashboard }) => {
  const { impersonatedUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDiagnostic, setShowDiagnostic] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('[AdminPanel] ===== FETCHING ADMIN DATA =====');
        console.log('[AdminPanel] Checking localStorage before fetch...');
        const adminToken = localStorage.getItem('admin_token');
        const adminUser = localStorage.getItem('admin_user');
        console.log('[AdminPanel] admin_token:', adminToken ? adminToken.substring(0, 30) + '...' : 'NOT FOUND');
        console.log('[AdminPanel] admin_user:', adminUser ? 'FOUND' : 'NOT FOUND');
        
        if (!adminToken || !adminUser) {
          console.error('[AdminPanel] ✗ No admin session found');
          setError('Admin session expired. Please log in again.');
          setLoading(false);
          setTimeout(() => {
            window.location.href = '/';
          }, 2000);
          return;
        }
        
        console.log('[AdminPanel] Calling getAllUsers()...');
        const usersData = await getAllUsers();
        console.log('[AdminPanel] Users data received:', usersData);
        
        console.log('[AdminPanel] Calling getAdminStats()...');
        const statsData = await getAdminStats();
        console.log('[AdminPanel] Stats data received:', statsData);

        console.log('[AdminPanel] ✓ Data fetched successfully');
        setUsers(usersData.users || []);
        setStats(statsData.stats || {});
      } catch (error) {
        console.error('[AdminPanel] ✗ Error fetching admin data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load admin data');
      } finally {
        setLoading(false);
        console.log('[AdminPanel] ===== FETCH COMPLETE =====');
      }
    };

    fetchData();
  }, []);

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#2C2E83' }}></div>
          <p>Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-cyan-50 via-violet-50 to-indigo-50 p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-red-600 text-center">⚠️ Error Loading Admin Panel</CardTitle>
            <CardDescription className="text-center">
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                There was an error loading the admin panel. This usually happens when:
              </p>
              <ul className="list-disc list-inside text-sm text-red-800 mt-2 space-y-1">
                <li>Your admin session has expired</li>
                <li>The authentication token is missing</li>
                <li>There's a connection issue with the server</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={() => window.location.reload()}
                className="flex-1"
                style={{ backgroundColor: '#2C2E83' }}
              >
                Refresh Page
              </Button>
              <Button
                onClick={onLogout}
                variant="outline"
                className="flex-1"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const roleColors: { [key: string]: string } = {
    'Student': '#1FC8E1',
    'Teacher': '#7B61FF',
    'Parent': '#10B981',
    'Professional': '#FF715B',
    'Organization': '#8B5CF6'
  };

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: 'linear-gradient(to bottom, #F8F9FA 0%, #FFFFFF 100%)' }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          {impersonatedUser ? (
            <Button
              variant="ghost"
              onClick={onBack}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin Panel
            </Button>
          ) : (
            <Button
              variant="ghost"
              onClick={onLogout}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Logout
            </Button>
          )}
          
          {impersonatedUser && (
            <Badge variant="outline" className="px-4 py-2" style={{ borderColor: '#FF715B', color: '#FF715B' }}>
              Viewing: {impersonatedUser.name}
            </Badge>
          )}
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl mb-2" style={{ color: '#2C2E83' }}>Admin Panel</h1>
          <p className="text-lg" style={{ color: '#6B7280' }}>
            Manage users and view platform statistics
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription>Total Users</CardDescription>
                <Users className="w-5 h-5" style={{ color: '#2C2E83' }} />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl" style={{ color: '#2C2E83' }}>{stats?.totalUsers || 0}</p>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription>Total Assessments</CardDescription>
                <ClipboardList className="w-5 h-5" style={{ color: '#1FC8E1' }} />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl" style={{ color: '#1FC8E1' }}>{stats?.totalAssessments || 0}</p>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription>Students</CardDescription>
                <Users className="w-5 h-5" style={{ color: '#10B981' }} />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl" style={{ color: '#10B981' }}>
                {stats?.usersByRole?.Student || 0}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription>Organizations</CardDescription>
                <TrendingUp className="w-5 h-5" style={{ color: '#FF715B' }} />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl" style={{ color: '#FF715B' }}>
                {stats?.usersByRole?.['Professional/Organization'] || 0}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Role Distribution */}
        <Card className="mb-8 shadow-md">
          <CardHeader>
            <CardTitle>User Distribution by Role</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats?.usersByRole || {}).map(([role, count]: any) => {
                const percentage = stats?.totalUsers > 0 ? (count / stats.totalUsers) * 100 : 0;
                return (
                  <div key={role}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">{role}</span>
                      <span className="text-sm">{count} users ({percentage.toFixed(0)}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: roleColors[role] || '#6B7280'
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* User Directory */}
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>User Directory</CardTitle>
                <CardDescription>Search and view all platform users</CardDescription>
              </div>
              <div className="w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Assessments</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            style={{
                              backgroundColor: `${roleColors[user.role]}20`,
                              color: roleColors[user.role]
                            }}
                          >
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.assessmentsCompleted?.length || 0}/3
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {user.organizationName || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewUserDashboard(user.id)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Dashboard
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {filteredUsers.length > 0 && (
              <div className="mt-4 text-sm text-gray-600">
                Showing {filteredUsers.length} of {users.length} users
              </div>
            )}
          </CardContent>
        </Card>

        {/* Diagnostic Button */}
        <div className="mt-8">
          <Button
            variant="outline"
            onClick={() => setShowDiagnostic(true)}
            className="flex-1"
          >
            <Wrench className="mr-2 h-4 w-4" />
            Run Diagnostic
          </Button>
        </div>

        {/* Diagnostic Modal */}
        {showDiagnostic && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDiagnostic(false)}
                className="absolute top-4 right-4 z-10 bg-white hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </Button>
              <AdminDiagnostic
                onClose={() => setShowDiagnostic(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};