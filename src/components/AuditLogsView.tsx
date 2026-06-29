import React from 'react';
import { Terminal } from 'lucide-react';
import { AuditLog } from '../types';

interface AuditLogsViewProps {
  auditLogs?: AuditLog[];
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = React.memo(({ auditLogs }) => {
  return (
    <div className="lg:col-span-5 bg-slate-900/60 backdrop-blur-md border border-slate-800 p-5 rounded-2xl text-left" id="audit_logs">
      <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono mb-4 flex items-center gap-1.5">
        <Terminal className="h-4 w-4 text-rose-400" /> Live System Audit Logs
      </h3>
      <div className="space-y-3 max-h-44 overflow-y-auto pr-1">
        {auditLogs && auditLogs.length > 0 ? (
          auditLogs.map((log) => (
            <div key={log.id} className="p-2 bg-slate-950 rounded-lg border border-slate-900 text-[10px] font-mono text-left leading-relaxed">
              <div className="flex justify-between text-slate-500 mb-0.5">
                <span className="text-rose-400 font-bold">{log.action.toUpperCase()}</span>
                <span>{log.timestamp}</span>
              </div>
              <p className="text-slate-300">{log.details}</p>
            </div>
          ))
        ) : (
          <p className="text-xs text-slate-500 text-center py-10 font-mono">No audits registered.</p>
        )}
      </div>
    </div>
  );
});

AuditLogsView.displayName = 'AuditLogsView';
