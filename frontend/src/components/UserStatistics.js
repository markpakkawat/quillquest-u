import React, { useState, useEffect } from 'react';
import { 
  Pencil, FileText, Clock, BookOpen, 
  AlertCircle, MessageCircle, Type, Layout,
  TrendingUp, TrendingDown 
} from "lucide-react";
import { formatWritingTime, getWritingStats } from '../utils/userStatistics';
import { ERROR_CATEGORIES } from '../utils/errorTracking';
import { 
  getErrorStats, 
  getWritingAnalysis 
} from '../utils/errorTracking';


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

const WritingMetricsCard = ({ title, icon: Icon, metrics, children }) => (
  <div className="bg-white rounded-2xl p-8 shadow-sm">
    <div className="flex items-center gap-3 mb-6">
      <Icon className="h-6 w-6 text-purple-600" />
      <h2 className="text-xl font-semibold">{title}</h2>
    </div>
    <div className="space-y-6">
      {children}
    </div>
  </div>
);

const UserStatistics = ({ statistics, postsCount, avgWordCount, loading }) => {
  const [basicStats, setBasicStats] = useState(null);
  const [writingStats, setWritingStats] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const getWritingTime = () => {
    try {
      const essaySections = JSON.parse(localStorage.getItem('essaySections') || '[]');
      if (!essaySections.length) return '0s';
  
      let totalDuration = 0;
      essaySections.forEach(section => {
        const startTime = localStorage.getItem(`startTime_${section.id}`);
        const endTime = localStorage.getItem(`endTime_${section.id}`) || new Date().toISOString();
        
        if (startTime) {
          const sectionDuration = new Date(endTime) - new Date(startTime);
          totalDuration += sectionDuration;
        }
      });
  
      const seconds = Math.floor(totalDuration / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
  
      if (hours > 0) {
        const remainingMinutes = minutes % 60;
        return `${hours}h ${remainingMinutes}m`;
      } else if (minutes > 0) {
        return `${minutes}m`;
      } else {
        return `${seconds}s`;
      }
    } catch (error) {
      console.error('Error calculating writing time:', error);
      return '0s';
    }
  };

// In UserStatistics.js, update the loadStats function:

// UserStatistics.js

useEffect(() => {
  const loadStats = async () => {
    try {
      const essaySections = JSON.parse(localStorage.getItem('essaySections') || '[]');
      if (!essaySections.length) {
        setBasicStats(null);
        setWritingStats(null);
        return;
      }

      const currentSection = essaySections[essaySections.length - 1];
      
      // Get writing analysis for the current section
      let writingStyle = null;
      if (currentSection) {
        try {
          if (currentSection.type === 'conclusion') {
            writingStyle = await getWritingAnalysis('conclusion');
          } else if (currentSection.type === 'body') {
            const timestamp = new Date(currentSection.createdAt).getTime();
            writingStyle = await getWritingAnalysis(`body-${timestamp}`);
          } else {
            writingStyle = await getWritingAnalysis(currentSection.id);
          }
        } catch (error) {
          console.warn('Failed to get writing analysis:', error);
          // Use default values if analysis fails
          writingStyle = getDefaultWritingStyle();
        }
      }

      // Get current word count
      const content = currentSection 
        ? localStorage.getItem(`essayContent_${currentSection.id}`)
        : '';
      const wordCount = content
        ? content.trim().split(/\s+/).filter(word => word.length > 0).length
        : 0;

      // Get stats from localStorage instead of API
      const stats = await getWritingStats();

      setBasicStats({
        postsCount: essaySections.length,
        averageWordCount: wordCount,
        completedEssays: stats.completionStatus?.completedSections || 0,
        completionRate: stats.completionStatus?.completionRate || 0,
        writingStyle,
        writingTime: getWritingTime()
      });

      setWritingStats(stats);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  loadStats();
  const interval = setInterval(loadStats, 1000);
  return () => clearInterval(interval);
}, []);

// Add this helper function
const getDefaultWritingStyle = () => ({
  tone: {
    type: 'Analyzing...',
    characteristics: []
  },
  voice: {
    activeVoicePercentage: 0,
    passiveVoiceInstances: 0
  },
  clarity: {
    score: 0,
    strengths: []
  },
  complexity: {
    sentenceStructure: {
      score: 0,
      averageLength: 0
    },
    wordChoice: {
      academicVocabularyScore: 0,
      complexWordsPercentage: 0
    },
    paragraphCohesion: {
      score: 0,
      transitionStrength: 'Analyzing...'
    }
  }
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
          value={getWritingTime()}
          subtitle="average per essay"
        />
        <StatCard
          icon={TrendingDown}
          title="Completion Rate"
          value={`${basicStats?.completionRate || 0}%`}
          subtitle="essays completed"
        />
      </div>

      {/* Writing Style Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Writing Style Card */}
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <MessageCircle className="h-6 w-6 text-purple-600" />
            <h2 className="text-xl font-semibold">Writing Style</h2>
          </div>
          <div className="space-y-6">
            <div>
              <p className="text-sm text-gray-600 mb-2">Tone</p>
              <p className="text-2xl font-bold text-gray-900">
                {basicStats?.writingStyle?.tone?.type || 'Analyzing...'}
              </p>
              {basicStats?.writingStyle?.tone?.characteristics?.map((char, idx) => (
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
                    {basicStats?.writingStyle?.voice?.activeVoicePercentage || 0}%
                  </span>
                </div>
                <Progress 
                  value={basicStats?.writingStyle?.voice?.activeVoicePercentage || 0} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Writing Clarity Card */}
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
                  {basicStats?.writingStyle?.clarity?.score || 0}
                </p>
                <span className="text-xl text-gray-500">/100</span>
              </div>
            </div>
            {basicStats?.writingStyle?.clarity?.strengths?.length > 0 && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Key Strengths</p>
                <div className="space-y-2">
                  {basicStats.writingStyle.clarity.strengths.map((strength, idx) => (
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

      {/* Writing Complexity Analysis */}
      <div className="bg-white rounded-2xl p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <Layout className="h-6 w-6 text-purple-600" />
          <h2 className="text-xl font-semibold">Complexity Analysis</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-4">
            <p className="text-gray-600">Sentence Structure</p>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Complexity</span>
                <span className="font-medium">
                  {basicStats?.writingStyle?.complexity?.sentenceStructure?.score || 0}/100
                </span>
              </div>
              <Progress 
                value={basicStats?.writingStyle?.complexity?.sentenceStructure?.score || 0} 
              />
              <p className="text-sm text-gray-500">
                Avg Length: {basicStats?.writingStyle?.complexity?.sentenceStructure?.averageLength || 0} words
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-gray-600">Vocabulary</p>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Academic Level</span>
                <span className="font-medium">
                  {basicStats?.writingStyle?.complexity?.wordChoice?.academicVocabularyScore || 0}/100
                </span>
              </div>
              <Progress 
                value={basicStats?.writingStyle?.complexity?.wordChoice?.academicVocabularyScore || 0} 
              />
              <p className="text-sm text-gray-500">
                Complex Words: {basicStats?.writingStyle?.complexity?.wordChoice?.complexWordsPercentage || 0}%
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-gray-600">Paragraph Structure</p>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Coherence</span>
                <span className="font-medium">
                  {basicStats?.writingStyle?.complexity?.paragraphCohesion?.score || 0}/100
                </span>
              </div>
              <Progress 
                value={basicStats?.writingStyle?.complexity?.paragraphCohesion?.score || 0} 
              />
              <p className="text-sm text-gray-500">
                Transitions: {basicStats?.writingStyle?.complexity?.paragraphCohesion?.transitionStrength || 'Analyzing...'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Current Essay Errors */}
      <div className="bg-white rounded-2xl p-8 shadow-sm">
        <h3 className="text-lg font-medium mb-6">Errors in Current Essay</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b pb-4">
            <span className="text-gray-600">Total Errors</span>
            <span className="font-medium">{writingStats?.totalErrors || 0}</span>
          </div>
          {Object.entries(writingStats?.currentErrors || {}).length > 0 ? (
            Object.entries(writingStats?.currentErrors || {})
              .map(([type, count], idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span>{ERROR_CATEGORIES[type]}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))
          ) : (
            <div className="text-center text-gray-500 py-4">
              No errors found in current essay
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserStatistics;