import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api';
import { User } from '../../types';
import { ScoreCard } from '../../components/ScoreCard';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import {
  Users,
  Database,
  Cpu,
  Activity,
  UserCheck,
  RefreshCw,
  Server,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  History,
  AlertCircle,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Role update state
  const [userToModify, setUserToModify] = useState<{ user: User; targetRole: string } | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchAdminData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [uList, sData] = await Promise.all([
        adminApi.getUsers(),
        adminApi.getSystemStats(),
      ]);
      setUsers(uList);
      setStats(sData);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to load admin telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleConfirmRoleChange = async () => {
    if (!userToModify) return;
    setUpdating(true);
    try {
      const updated = await adminApi.updateUserRole(userToModify.user.id, userToModify.targetRole);
      setUsers((prev) => prev.map((u) => (u.id === userToModify.user.id ? updated : u)));
      setUserToModify(null);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to update user role.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
              <UserCheck className="w-6 h-6" />
            </div>
            Admin & system telemetry
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Monitor real-time system metrics, manage user role privileges, and orchestrate analysis records and corpora.
          </p>
        </div>

        <button
          onClick={fetchAdminData}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-xs transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh telemetry
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ScoreCard
          title="Registered users"
          value={stats.total_users || users.length || 0}
          subtitle="Platform accounts"
          variant="default"
          icon={<Users className="w-4 h-4 text-purple-500" />}
        />
        <ScoreCard
          title="Inferences logged"
          value={(stats.total_reviews || 0).toLocaleString()}
          subtitle="Audit analyses stored"
          variant="default"
          icon={<Activity className="w-4 h-4 text-indigo-500" />}
        />
        <ScoreCard
          title="Datasets managed"
          value={stats.total_datasets || 0}
          subtitle="Training corpora uploaded"
          variant="default"
          icon={<Database className="w-4 h-4 text-emerald-500" />}
        />
        <ScoreCard
          title="Active inference model"
          value={stats.active_model_name || 'Logistic Regression'}
          subtitle={`${stats.total_models || 1} models in registry`}
          variant="default"
          icon={<Cpu className="w-4 h-4 text-amber-500" />}
        />
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/app/datasets"
          className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-500/50 transition-all group flex items-center justify-between shadow-xs"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-900 dark:text-white">Manage datasets</h4>
              <p className="text-[11px] text-slate-500">Upload and inspect training files</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          to="/app/models"
          className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-purple-500/50 transition-all group flex items-center justify-between shadow-xs"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-900 dark:text-white">Models & training</h4>
              <p className="text-[11px] text-slate-500">Benchmark models and toggle active</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          to="/app/history"
          className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-500/50 transition-all group flex items-center justify-between shadow-xs"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-900 dark:text-white">Analysis records</h4>
              <p className="text-[11px] text-slate-500">Audit all user review analyses</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* User Management Table */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-500" />
            <h3 className="text-xs font-semibold text-slate-900 dark:text-white">
              User accounts & access permissions
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {users.length} registered accounts
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span>Loading user accounts...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">User</th>
                  <th className="p-3">Email address</th>
                  <th className="p-3">Joined</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Role</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {users.map((u) => {
                  const targetRole = u.role === 'admin' ? 'user' : 'admin';
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-3 font-semibold text-slate-900 dark:text-white flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-xs font-semibold">
                          {u.full_name?.charAt(0) || u.email.charAt(0).toUpperCase()}
                        </div>
                        <span>{u.full_name || 'N/A'}</span>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-slate-500">{u.email}</td>
                      <td className="p-3 text-slate-500 text-[11px]">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${
                            u.role === 'admin'
                              ? 'bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => setUserToModify({ user: u, targetRole })}
                          className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          {u.role === 'admin' ? 'Demote to user' : 'Promote to admin'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Role Change Confirmation Modal */}
      <Modal
        isOpen={!!userToModify}
        onClose={() => setUserToModify(null)}
        title={
          userToModify?.targetRole === 'admin'
            ? 'Promote account to administrator'
            : 'Demote account to standard user'
        }
        description={`Are you sure you want to change permissions for "${userToModify?.user.email}" to ${userToModify?.targetRole}?`}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setUserToModify(null)}
            >
              Cancel
            </Button>
            <Button
              variant={userToModify?.targetRole === 'admin' ? 'primary' : 'danger'}
              size="sm"
              loading={updating}
              loadingText="Updating..."
              onClick={handleConfirmRoleChange}
            >
              Confirm role change
            </Button>
          </div>
        }
      >
        <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
          {userToModify?.targetRole === 'admin' ? (
            <p>
              Administrators have full access to model training pipelines, dataset uploads, user permissions, and raw system telemetry.
            </p>
          ) : (
            <p>
              Standard users can only access their personal review analyses, bulk testing jobs, and public verification endpoints.
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
};
