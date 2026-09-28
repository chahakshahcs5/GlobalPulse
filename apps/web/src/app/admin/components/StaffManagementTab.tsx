'use client';

import React, { useState } from 'react';
import { Users, Bot, UserPlus } from 'lucide-react';
import { useNewsroomStaff } from '../../../lib/news-store';

interface StaffManagementTabProps {
  onSuccess: (message: string) => void;
}

export function StaffManagementTab({ onSuccess }: StaffManagementTabProps) {
  const { staff, updateRole, inviteStaff } = useNewsroomStaff();

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'journalist' | 'editor' | 'ai_agent' | 'admin'>(
    'journalist'
  );
  const [inviteClientType, setInviteClientType] = useState<'human' | 'ai_agent'>('human');

  const handleInviteStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) {
      alert('Please provide name and email.');
      return;
    }
    try {
      await inviteStaff({
        name: inviteName.trim(),
        email: inviteEmail.trim(),
        role: inviteRole,
        clientType: inviteClientType,
      });
      setIsInviteOpen(false);
      onSuccess(`Staff member "${inviteName}" invited with role "${inviteRole}"!`);
      setInviteName('');
      setInviteEmail('');
    } catch (err) {
      console.error('Failed to invite staff:', err);
      alert('Failed to invite staff member.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Newsroom Contributors & Autonomous Agents
          </h2>
          <p className="text-xs text-slate-500">
            Manage human editors, credentialed investigative journalists, and external AI agents
            connecting via Model Context Protocol.
          </p>
        </div>
        <button
          onClick={() => setIsInviteOpen(!isInviteOpen)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>{isInviteOpen ? 'Close' : '+ Register Contributor'}</span>
        </button>
      </div>

      {/* Invite / Register Contributor Drawer */}
      {isInviteOpen && (
        <div className="p-5 rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase text-blue-700 dark:text-blue-300">
            Register New Newsroom Contributor / Autonomous Agent
          </h3>
          <form
            onSubmit={handleInviteStaff}
            className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs"
          >
            <div>
              <label className="block text-slate-500 mb-1">Full Name / Agent Alias</label>
              <input
                type="text"
                required
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="e.g. Elena Rostova or Gemini Flash Agent"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="elena@globalpulse.news"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as any)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              >
                <option value="journalist">Journalist (Authoring)</option>
                <option value="editor">Editor (Review & Publish)</option>
                <option value="ai_agent">AI Agent (Autonomous MCP)</option>
                <option value="admin">Newsroom Administrator</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-500 mb-1">Type</label>
              <select
                value={inviteClientType}
                onChange={(e) => setInviteClientType(e.target.value as any)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              >
                <option value="human">Human Contributor</option>
                <option value="ai_agent">Autonomous AI Agent</option>
              </select>
            </div>
            <div className="sm:col-span-4 flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer"
              >
                Grant Newsroom Credentials
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Staff Roster Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3 font-semibold">User / Agent Name</th>
                <th className="p-3 font-semibold">Email / Endpoint</th>
                <th className="p-3 font-semibold">Client Type</th>
                <th className="p-3 font-semibold">Assigned Role</th>
                <th className="p-3 font-semibold text-right">Permissions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {staff.map((u) => {
                const isAi = u.clientType === 'ai_agent' || u.id.includes('agent');
                return (
                  <tr
                    key={u.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                  >
                    <td className="p-3 font-semibold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        {isAi ? (
                          <Bot className="w-4 h-4 text-indigo-500" />
                        ) : (
                          <Users className="w-4 h-4 text-slate-400" />
                        )}
                        <span>{u.name}</span>
                      </div>
                    </td>
                    <td className="p-3 text-slate-500 font-mono text-[11px]">{u.email}</td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          isAi
                            ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {isAi ? 'Autonomous AI' : 'Human Web'}
                      </span>
                    </td>
                    <td className="p-3">
                      <select
                        value={u.role}
                        onChange={async (e) => {
                          await updateRole(u.id, e.target.value);
                          onSuccess(`Updated role for "${u.name}" to ${e.target.value}`);
                        }}
                        className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                      >
                        <option value="journalist">journalist</option>
                        <option value="editor">editor</option>
                        <option value="ai_agent">ai_agent</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className="p-3 text-right text-slate-400 text-[11px] font-mono">
                      {u.role === 'admin'
                        ? 'news:*'
                        : u.role === 'editor'
                          ? 'news:read, news:write, news:publish'
                          : 'news:read, news:write'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
