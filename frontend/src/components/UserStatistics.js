// UserStatistics.js
import React, { useState, useEffect } from 'react';
import { 
  Pencil, 
  FileText,
  Target,
  Activity,
  BarChart2,
  AlertTriangle
} from "lucide-react";
import Progress from "./Progress";
import { ERROR_CATEGORIES } from '../utils/errorTracking';
import EssayReviewStats from './EssayReviewStats';

const MetricCard = ({ icon: Icon, label, value, color, subtitle }) => (
  <div className="flex items-center space-x-4 p-4 bg-white rounded-lg">
    <div className={`p-2 rounded-full ${color}`}>
      <Icon className="h-5 w-5 text-white" />
    </div>
    <div className="flex-1">
      <p className="text-sm font-medium text-gray-600">{label}</p>
      <div className="mt-2">
        <Progress value={value} className="h-2" />
      </div>
      {subtitle && (
        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
      )}
    </div>
    <span className="font-semibold">{value.toFixed(1)}%</span>
  </div>
);

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
  const [loadingStats, setLoadingStats] = useState(true);

  // Create sections for EssayReviewStats from the most recent writing stats
  const createSections = () => {
    if (!statistics?.qualityMetrics) return [];

    return [{
      id: 'latest',
      type: 'latest',
      writingAnalysis: {
        tone: {
          type: "Formal",
          confidence: statistics.qualityMetrics.clarity || 85,
          characteristics: ["Professional", "Academic"]
        },
        voice: {
          type: "Active",
          activeVoicePercentage: statistics.qualityMetrics.activeVoice || 0,
          passiveVoiceInstances: statistics.qualityMetrics.errorRate || 0
        },
        clarity: {
          score: statistics.qualityMetrics.clarity || 0,
          level: statistics.qualityMetrics.clarity > 80 ? "High" : 
                 statistics.qualityMetrics.clarity > 60 ? "Moderate" : "Low",
          strengths: statistics.improvement?.strengths || [],
          improvements: statistics.improvement?.areas || []
        },
        complexity: {
          sentenceStructure: {
            score: statistics.qualityMetrics.complexity || 0,
            averageLength: 15,
            varietyScore: statistics.qualityMetrics.complexity || 0
          },
          wordChoice: {
            complexWordsPercentage: statistics.qualityMetrics.complexity || 0,
            academicVocabularyScore: statistics.qualityMetrics.complexity || 0
          },
          paragraphCohesion: {
            score: statistics.qualityMetrics.complexity || 0,
            transitionStrength: "Strong",
            logicalFlowScore: statistics.qualityMetrics.complexity || 0
          }
        }
      }
    }];
  };

  const [sections, setSections] = useState([]);

  useEffect(() => {
    if (statistics?.qualityMetrics) {
      setSections(createSections());
    }
    setLoadingStats(false);
  }, [statistics]);

  if (loading) {
    return (
      <div className="w-full flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  return (
    <div className="mt-5 space-y-8">
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

      {/* Writing Quality Metrics */}
      {statistics?.qualityMetrics && (
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <h3 className="text-lg font-medium mb-6">Writing Quality Metrics</h3>
          <div className="space-y-4">
            <MetricCard
              icon={Target}
              label="Clarity Score"
              value={statistics.qualityMetrics.clarity || 0}
              color="bg-blue-500"
              subtitle="Measures how clear and understandable your writing is"
            />
            
            <MetricCard
              icon={Activity}
              label="Active Voice Usage"
              value={statistics.qualityMetrics.activeVoice || 0}
              color="bg-green-500"
              subtitle="Percentage of sentences using active voice"
            />
            
            <MetricCard
              icon={BarChart2}
              label="Writing Complexity"
              value={statistics.qualityMetrics.complexity || 0}
              color="bg-purple-500"
              subtitle="Balance of simple and complex sentence structures"
            />
            
            {statistics.qualityMetrics.errorRate !== undefined && (
              <MetricCard
                icon={AlertTriangle}
                label="Error Rate"
                value={100 - (statistics.qualityMetrics.errorRate || 0)}
                color="bg-yellow-500"
                subtitle="Accuracy score based on grammar and style"
              />
            )}
          </div>
        </div>
      )}

      {/* Writing Style Analysis */}
      {sections.length > 0 && (
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <h3 className="text-lg font-medium mb-6">Detailed Writing Analysis</h3>
          <EssayReviewStats 
              sections={[]} 
              writingStyle={statistics.writingStyle}
            />
        </div>
      )}
    </div>
  );
};

export default UserStatistics;