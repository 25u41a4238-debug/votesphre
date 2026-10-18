import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  CheckCheck, 
  XCircle, 
  FileText, 
  Radio, 
  Award,
  ShieldCheck
} from 'lucide-react';
import { ElectionStatus, ApplicationStatus, VerificationStatus } from '../../types/index.ts';

interface StatusBadgeProps {
  status: ElectionStatus | ApplicationStatus | VerificationStatus | string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs font-medium px-2.5 py-1 gap-1.5',
    lg: 'text-sm font-semibold px-3 py-1.5 gap-2',
  }[size];

  switch (status) {
    case 'VOTING_OPEN':
      return (
        <span className={`inline-flex items-center rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 ${sizeClasses} ${className}`}>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
          </span>
          Voting Open
        </span>
      );

    case 'NOMINATION_OPEN':
      return (
        <span className={`inline-flex items-center rounded-full bg-blue-50 text-blue-700 border border-blue-200 ${sizeClasses} ${className}`}>
          <Radio className="w-3.5 h-3.5 text-blue-600" />
          Nominations Open
        </span>
      );

    case 'NOMINATION_CLOSED':
      return (
        <span className={`inline-flex items-center rounded-full bg-purple-50 text-purple-700 border border-purple-200 ${sizeClasses} ${className}`}>
          <Clock className="w-3.5 h-3.5 text-purple-600" />
          Nominations Closed
        </span>
      );

    case 'VOTING_CLOSED':
      return (
        <span className={`inline-flex items-center rounded-full bg-amber-50 text-amber-800 border border-amber-200 ${sizeClasses} ${className}`}>
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          Voting Closed
        </span>
      );

    case 'RESULTS_PUBLISHED':
      return (
        <span className={`inline-flex items-center rounded-full bg-teal-50 text-teal-800 border border-teal-200 ${sizeClasses} ${className}`}>
          <Award className="w-3.5 h-3.5 text-teal-600" />
          Results Certified & Published
        </span>
      );

    case 'DRAFT':
      return (
        <span className={`inline-flex items-center rounded-full bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses} ${className}`}>
          <FileText className="w-3.5 h-3.5 text-slate-500" />
          Draft
        </span>
      );

    case 'APPROVED':
    case 'VERIFIED':
      return (
        <span className={`inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses} ${className}`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          {status === 'VERIFIED' ? 'Identity Verified' : 'Approved'}
        </span>
      );

    case 'PENDING':
    case 'PENDING_REVIEW':
      return (
        <span className={`inline-flex items-center rounded-full bg-amber-50 text-amber-700 border border-amber-200 ${sizeClasses} ${className}`}>
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          {status === 'PENDING_REVIEW' ? 'Review Pending' : 'Pending Approval'}
        </span>
      );

    case 'REJECTED':
      return (
        <span className={`inline-flex items-center rounded-full bg-rose-50 text-rose-700 border border-rose-200 ${sizeClasses} ${className}`}>
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          Rejected
        </span>
      );

    case 'WITHDRAWN':
      return (
        <span className={`inline-flex items-center rounded-full bg-slate-100 text-slate-600 border border-slate-200 ${sizeClasses} ${className}`}>
          Withdrawn
        </span>
      );

    case 'UNVERIFIED':
      return (
        <span className={`inline-flex items-center rounded-full bg-rose-50 text-rose-700 border border-rose-200 ${sizeClasses} ${className}`}>
          <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
          Unverified
        </span>
      );

    default:
      return (
        <span className={`inline-flex items-center rounded-full bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses} ${className}`}>
          {status}
        </span>
      );
  }
};
