import React, { useState, useEffect } from 'react';
import { getBasicStats, getWritingStats } from '../utils/userStatistics';
import { 
  Pencil, FileText, Clock, BookOpen, 
  AlertCircle, MessageCircle, Type, Layout,
  TrendingUp, TrendingDown 
} from "lucide-react";

const Progress = ({ value = 0, className = "" }) => (
  <div className={`relative h-2 w-full bg-gray-200 rounded-full overflow-hidden ${className}`}>
    <div
      className="h-full bg-purple-600 transition-all duration-300 ease-in-out"
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    />
  </div>
);

const StatCard = ({ icon: Icon, title, value, subtitle }) => (
  <div className="bg-white rounded-2xl p-8 shadow-sm">
    <div className="flex flex-col items-center text-center space-y-3">
      <Icon className="h-6 w-6 text-purple-600" />
      <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {subtitle && (
        <p className="text-sm text-gray-500">{subtitle}</p>
      )}
    </div>
  </div>
);

const UserStatistics = () => {
  const [basicStats, setBasicStats] = useState(null);
  const [writingStats, setWritingStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [basic, writing] = await Promise.all([
          getBasicStats(),
          getWritingStats()
        ]);

        // Process error data combining grammar and requirement errors
        const errorData = {
          grammarErrors: writing?.commonErrors || [],
          requirementErrors: writing?.commonMissingRequirements || [],
          totalErrors: (writing?.commonErrors?.length || 0) + 
                      (writing?.commonMissingRequirements?.length || 0)
        };

        // Calculate error reduction only from existing posts
        const errorReduction = writing?.posts?.length > 1 
          ? calculateErrorReduction(writing.posts) 
          : 0;

        setBasicStats(basic);
        setWritingStats({
          ...writing,
          errorReduction,
          errorData,
          areasForImprovement: [
            ...writing?.commonErrors?.map(error => ({
              area: error.category,
              suggestion: error.suggestions?.[0] || 'Review this type of error'
            })) || [],
            ...writing?.commonMissingRequirements?.map(req => ({
              area: req.requirement,
              suggestion: req.improvements?.[0] || 'Focus on this requirement'
            })) || []
          ]
        });
      } catch (error) {
        console.error('Error fetching statistics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const calculateErrorReduction = (posts) => {
    if (!posts || posts.length < 2) return 0;
    
    const firstPost = posts[0];
    const lastPost = posts[posts.length - 1];

    if (!firstPost || !lastPost) return 0;

    const firstErrors = firstPost.totalErrors || 0;
    const lastErrors = lastPost.totalErrors || 0;

    if (firstErrors === 0) return 0;
    
    return Math.round(((firstErrors - lastErrors) / firstErrors) * 100);
  };

  if (loading) {
    return (
      <div className="w-full flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  // If user has no posts, show welcome message
  if (!basicStats?.postsCount) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-sm">
        <h2 className="text-xl font-semibold mb-6">Welcome to Writing Statistics!</h2>
        <div className="text-center py-6 space-y-4">
          <p className="text-gray-600">
            Start writing essays to track your progress and see improvements in:
          </p>
          <ul className="space-y-3">
            <li className="flex items-center gap-2 justify-center">
              <div className="w-2 h-2 rounded-full bg-purple-600" />
              <span>Writing clarity and style</span>
            </li>
            <li className="flex items-center gap-2 justify-center">
              <div className="w-2 h-2 rounded-full bg-purple-600" />
              <span>Grammar and error reduction</span>
            </li>
            <li className="flex items-center gap-2 justify-center">
              <div className="w-2 h-2 rounded-full bg-purple-600" />
              <span>Section requirements completion</span>
            </li>
          </ul>
          <button
            onClick={() => window.location.href = '/essay-builder'}
            className="mt-6 bg-purple-600 text-white px-6 py-2 rounded-full hover:bg-purple-700 transition-colors"
          >
            Start Your First Essay
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Pencil}
          title="Essays Written"
          value={basicStats?.postsCount || 0}
          subtitle={`${basicStats?.completedEssays || 0} completed`}
        />
        <StatCard
          icon={FileText}
          title="AVG. Word Count"
          value={basicStats?.averageWordCount || 0}
          subtitle="words per essay"
        />
        <StatCard
          icon={Clock}
          title="Writing Time"
          value={`${basicStats?.averageWritingTime || 0}m`}
          subtitle="average per essay"
        />
        {writingStats?.posts?.length > 1 && (
          <StatCard
            icon={TrendingDown}
            title="Error Reduction"
            value={`${writingStats?.errorReduction || 0}%`}
            subtitle="from first essay"
          />
        )}
      </div>

      {/* Writing Style Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Writing Style */}
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <MessageCircle className="h-6 w-6 text-purple-600" />
            <h2 className="text-xl font-semibold">Writing Style</h2>
          </div>
          <div className="space-y-6">
            <div>
              <p className="text-sm text-gray-600 mb-2">Tone</p>
              <p className="text-2xl font-bold text-gray-900">
                {writingStats?.writingMetrics?.tone?.dominant || 'N/A'}
              </p>
              {writingStats?.writingMetrics?.tone?.characteristics?.map((char, idx) => (
                <div key={idx} className="flex items-center gap-2 mt-2">
                  <div className="w-2 h-2 rounded-full bg-purple-600" />
                  <span className="text-gray-600">{char}</span>
                </div>
              ))}
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Active Voice Usage</p>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span>Active Voice</span>
                  <span className="text-lg font-semibold">
                    {writingStats?.writingMetrics?.voice?.activePercentage || 0}%
                  </span>
                </div>
                <Progress 
                  value={writingStats?.writingMetrics?.voice?.activePercentage || 0} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Clarity Score */}
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Type className="h-6 w-6 text-purple-600" />
            <h2 className="text-xl font-semibold">Writing Clarity</h2>
          </div>
          <div className="space-y-6">
            <div>
              <p className="text-sm text-gray-600 mb-2">Clarity Score</p>
              <div className="flex items-center gap-4">
                <p className="text-3xl font-bold text-gray-900">
                  {writingStats?.writingMetrics?.clarity?.score || 0}
                </p>
                <span className="text-xl text-gray-500">/100</span>
              </div>
            </div>
            {writingStats?.writingMetrics?.clarity?.strengths?.length > 0 && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Key Strengths</p>
                <div className="space-y-2">
                  {writingStats.writingMetrics.clarity.strengths.map((strength, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-gray-600">{strength}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Areas for Improvement */}
      {writingStats?.areasForImprovement?.length > 0 && (
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <AlertCircle className="h-6 w-6 text-yellow-500" />
            <h2 className="text-xl font-semibold">Areas for Improvement</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {writingStats.areasForImprovement.map((area, idx) => (
              <div 
                key={idx} 
                className="flex items-start gap-4 p-6 bg-yellow-50 rounded-xl"
              >
                <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">{area.area}</p>
                  <p className="text-sm text-gray-600 mt-1">{area.suggestion}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Writing Complexity Analysis */}
      <div className="bg-white rounded-2xl p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <Layout className="h-6 w-6 text-purple-600" />
          <h2 className="text-xl font-semibold">Complexity Analysis</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sentence Structure */}
          <div className="space-y-4">
            <p className="text-gray-600">Sentence Structure</p>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Complexity</span>
                <span className="font-medium">
                  {writingStats?.writingMetrics?.complexity?.sentenceStructure?.score || 0}/100
                </span>
              </div>
              <Progress 
                value={writingStats?.writingMetrics?.complexity?.sentenceStructure?.score || 0} 
              />
              <p className="text-sm text-gray-500">
                Avg Length: {writingStats?.writingMetrics?.complexity?.sentenceStructure?.averageLength || 0} words
              </p>
            </div>
          </div>

          {/* Vocabulary */}
          <div className="space-y-4">
            <p className="text-gray-600">Vocabulary</p>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Academic Level</span>
                <span className="font-medium">
                  {writingStats?.writingMetrics?.complexity?.wordChoice?.academicVocabularyScore || 0}/100
                </span>
              </div>
              <Progress 
                value={writingStats?.writingMetrics?.complexity?.wordChoice?.academicVocabularyScore || 0} 
              />
              <p className="text-sm text-gray-500">
                Complex Words: {writingStats?.writingMetrics?.complexity?.wordChoice?.complexWordsPercentage || 0}%
              </p>
            </div>
          </div>

          {/* Paragraph Structure */}
          <div className="space-y-4">
            <p className="text-gray-600">Paragraph Structure</p>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Coherence</span>
                <span className="font-medium">
                  {writingStats?.writingMetrics?.complexity?.paragraphCohesion?.score || 0}/100
                </span>
              </div>
              <Progress 
                value={writingStats?.writingMetrics?.complexity?.paragraphCohesion?.score || 0} 
              />
              <p className="text-sm text-gray-500">
                Transitions: {writingStats?.writingMetrics?.complexity?.paragraphCohesion?.dominantTransitionStrength || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserStatistics;