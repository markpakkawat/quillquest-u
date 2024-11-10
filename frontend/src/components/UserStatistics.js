// UserStatistics.js
import React, { useState, useEffect } from 'react';
import { 
  Pencil, 
  FileText,
} from "lucide-react";
import EssayReviewStats from './EssayReviewStats';

const StatCard = ({ icon: Icon, title, value, subtitle }) => (
  <div className="bg-white rounded-2xl p-8 shadow-sm">
    <div className="flex flex-col items-center text-center space-y-3">
      <Icon className="h-6 w-6 text-purple-600" />
      <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
    </div>
  </div>
);

const UserStatistics = ({ statistics, postsCount, avgWordCount, loading }) => {
  console.log('UserStatistics props:', {
    statistics,
    postsCount,
    avgWordCount,
    hasWritingStyle: !!statistics?.writingStyle
  });

  if (loading) {
    return (
      <div className="w-full flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Basic Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <StatCard
          icon={Pencil}
          title="Essays Written"
          value={postsCount || 0}
          subtitle={`${statistics?.recentActivity?.completedPosts || 0} completed`}
        />
        <StatCard
          icon={FileText}
          title="AVG. Word Count"
          value={avgWordCount || 0}
          subtitle="words per essay"
        />
      </div>

      {/* Writing Style Analysis */}
      <div className="bg-white rounded-2xl p-8 shadow-sm">
        <h3 className="text-lg font-medium mb-6">Writing Analysis</h3>
        <EssayReviewStats 
          sections={[]}
          writingStyle={statistics?.writingStyle}
          currentErrors={statistics?.currentErrors}
          completionStatus={statistics?.completionStatus}
        />
      </div>
    </div>
  );
};

export default UserStatistics;