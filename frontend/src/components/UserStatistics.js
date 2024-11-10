import React from 'react';
import { 
  Pencil, 
  FileText,
  ChevronRight,
  Sparkles,
  LineChart,
  BookOpen
} from "lucide-react";
import { useNavigate } from 'react-router-dom';
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

const WelcomeGuide = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      {/* Welcome Message */}
      <div className="bg-white rounded-2xl p-8 shadow-sm">
        <div className="flex items-center space-x-3 mb-6">
          <Sparkles className="h-6 w-6 text-purple-600" />
          <h2 className="text-2xl font-semibold">Welcome to Your Writing Journey!</h2>
        </div>
        <p className="text-gray-600 mb-8">
          Start tracking your writing progress and see improvements in real-time. Our AI-powered analysis will help you enhance your writing skills.
        </p>
        
        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-purple-50 p-6 rounded-xl">
            <LineChart className="h-8 w-8 text-purple-600 mb-3" />
            <h3 className="font-medium mb-2">Track Progress</h3>
            <p className="text-sm text-gray-600">Monitor your writing improvements over time</p>
          </div>
          
          <div className="bg-purple-50 p-6 rounded-xl">
            <BookOpen className="h-8 w-8 text-purple-600 mb-3" />
            <h3 className="font-medium mb-2">Writing Analysis</h3>
            <p className="text-sm text-gray-600">Get detailed feedback on your writing style</p>
          </div>
          
          <div className="bg-purple-50 p-6 rounded-xl">
            <Pencil className="h-8 w-8 text-purple-600 mb-3" />
            <h3 className="font-medium mb-2">Error Tracking</h3>
            <p className="text-sm text-gray-600">Identify and fix common writing mistakes</p>
          </div>
        </div>
        
        {/* CTA Button */}
        <button
          onClick={() => navigate('/essayguidance')}
          className="w-full bg-purple-600 text-white p-4 rounded-xl hover:bg-purple-700 transition-all
            flex items-center justify-center space-x-2 group"
        >
          <span>Start Your First Essay</span>
          <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};

const UserStatistics = ({ statistics, postsCount, avgWordCount, loading }) => {
  const hasData = postsCount > 0 || (statistics?.recentActivity?.totalPosts > 0);

  if (loading) {
    return (
      <div className="w-full flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  if (!hasData) {
    return <WelcomeGuide />;
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