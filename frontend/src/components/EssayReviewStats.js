import React, { useState, useEffect } from 'react';
import Progress from "./Progress";
import { TrendingUp, AlertCircle } from "lucide-react";
import { ERROR_CATEGORIES } from '../utils/errorTracking';
import { aggregateStyleAnalyses, getDefaultAnalysis } from '../utils/writing/writingAnalysis';

const EssayReviewStats = ({ sections, writingStyle, essayId }) => {
  const [analysis, setAnalysis] = useState(null);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);

  useEffect(() => {
    const analyzeEssay = async () => {
      // Get all relevant stats with fallbacks
      const essaySections = sections || JSON.parse(localStorage.getItem('essaySections') || '[]');
      const errorStats = JSON.parse(localStorage.getItem('errorStats') || '[]');
      const completenessStats = JSON.parse(localStorage.getItem('completenessStats') || '[]');

      // Filter stats to only include current essay sections if reviewing a specific essay
      const currentSectionIds = new Set(essaySections.map(section => section.id));
      
      const relevantErrorStats = essayId 
        ? errorStats.filter(stat => currentSectionIds.has(stat.sectionId))
        : errorStats;
        
      const relevantCompletenessStats = essayId
        ? completenessStats.filter(stat => currentSectionIds.has(stat.sectionId))
        : completenessStats;

      // Calculate error patterns
      const errorPatterns = {};
      let totalErrors = 0;
      
      relevantErrorStats.forEach(stat => {
        if (!stat.timestamp || (lastUpdateTime && new Date(stat.timestamp) <= new Date(lastUpdateTime))) {
          return; // Skip outdated stats
        }
        
        Object.entries(stat.errorsByCategory || {}).forEach(([category, count]) => {
          errorPatterns[category] = (errorPatterns[category] || 0) + count;
          totalErrors += count;
        });
      });

      // Calculate completion metrics
      const completionMetrics = {
        total: relevantCompletenessStats.length,
        completed: relevantCompletenessStats.filter(stat => stat.isComplete).length,
        rate: relevantCompletenessStats.length > 0 
          ? (relevantCompletenessStats.filter(stat => stat.isComplete).length / relevantCompletenessStats.length) * 100
          : 0,
        lastUpdated: Math.max(...relevantCompletenessStats.map(stat => new Date(stat.timestamp || 0)))
      };

      // Gather writing style analyses from each section
      const sectionAnalyses = await Promise.all(
        essaySections.map(async section => {
          const analysisJson = localStorage.getItem(`writingStyle_${section.id}`);
          return analysisJson ? JSON.parse(analysisJson) : null;
        })
      );

      // Aggregate writing style analyses
      const aggregatedAnalysis = aggregateStyleAnalyses(sectionAnalyses.filter(Boolean)) || getDefaultAnalysis();

      // Generate strengths and suggestions based on both error patterns and writing style
      const strengths = [];
      const suggestions = [];

      // Add strengths based on writing style
      if (aggregatedAnalysis) {
        // Tone-based strengths
        if (aggregatedAnalysis.tone?.type === 'Formal') {
          strengths.push('Maintains professional academic tone');
        }

        // Voice-based strengths
        if (aggregatedAnalysis.voice?.activeVoicePercentage > 70) {
          strengths.push('Strong use of active voice');
        }

        // Clarity-based strengths
        if (aggregatedAnalysis.clarity?.score > 80) {
          strengths.push('Excellent clarity in writing');
        }

        // Add writing style suggestions
        if (aggregatedAnalysis.clarity?.improvements?.length > 0) {
          suggestions.push(...aggregatedAnalysis.clarity.improvements);
        }

        // Add complexity-based suggestions
        if (aggregatedAnalysis.complexity?.paragraphCohesion?.score < 70) {
          suggestions.push('Strengthen paragraph transitions and flow');
        }

        if (aggregatedAnalysis.complexity?.wordChoice?.academicVocabularyScore < 60) {
          suggestions.push('Incorporate more academic vocabulary');
        }
      }

      // Add error-based suggestions
      Object.entries(errorPatterns).forEach(([category, count]) => {
        if (count > 0) {
          switch(category) {
            case 'spelling':
              suggestions.push('Review spelling and proofread carefully');
              break;
            case 'punctuation':
              suggestions.push('Check punctuation usage and sentence structure');
              break;
            case 'lexicoSemantic':
              suggestions.push('Improve word choice and clarity');
              break;
            case 'stylistic':
              suggestions.push('Enhance writing style and tone');
              break;
            case 'typographical':
              suggestions.push('Review formatting and layout');
              break;
          }
        }
      });

      // Add completion-based strengths
      if (completionMetrics.rate > 80) {
        strengths.push('Excellent progress across sections');
      }

      // Update analysis state
      setAnalysis({
        errorPatterns,
        completionMetrics,
        suggestions: [...new Set(suggestions)].slice(0, 3), // Remove duplicates and limit to top 3
        strengths: [...new Set(strengths)].slice(0, 3), // Remove duplicates and limit to top 3
        writingStyle: aggregatedAnalysis,
        totalErrors,
        timestamp: new Date().toISOString()
      });

      setLastUpdateTime(new Date().toISOString());
    };

    analyzeEssay();
    
    return () => {
      if (essayId) {
        localStorage.removeItem(`analysisCache_${essayId}`);
      }
    };
  }, [sections, essayId, writingStyle]);

  if (!analysis) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  const calculateProgress = (errorCount) => {
    const baseMax = 10;
    const actualMax = Math.max(baseMax, ...Object.values(analysis.errorPatterns));
    return Math.min(100, (errorCount / actualMax) * 100);
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Error Analysis */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Error Analysis</h3>
          <div className="space-y-4">
            {Object.entries(ERROR_CATEGORIES).map(([key, label]) => {
              const errorCount = analysis.errorPatterns[key] || 0;
              return (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{label}</span>
                    <span>{errorCount} {errorCount === 1 ? 'issue' : 'issues'}</span>
                  </div>
                  <Progress value={calculateProgress(errorCount)} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Writing Style Analysis */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Writing Style</h3>
          {analysis.writingStyle ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Tone</p>
                  <p className="font-medium">{analysis.writingStyle.tone?.type || 'Analyzing...'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Clarity Score</p>
                  <p className="font-medium">{analysis.writingStyle.clarity?.score || 0}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active Voice</p>
                  <p className="font-medium">{analysis.writingStyle.voice?.activeVoicePercentage || 0}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Academic Level</p>
                  <p className="font-medium">
                    {analysis.writingStyle.complexity?.wordChoice?.academicVocabularyScore || 0}%
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Writing style analysis not available</p>
          )}
        </div>
      </div>

      {/* Analysis Results */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Analysis Results</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="font-medium text-green-600">Writing Strengths</h4>
            {analysis.strengths.map((strength, idx) => (
              <div key={idx} className="flex items-center text-sm">
                <TrendingUp className="h-4 w-4 text-green-500 mr-2" />
                <span>{strength}</span>
              </div>
            ))}
          </div>
          
          <div className="space-y-3">
            <h4 className="font-medium text-yellow-600">Suggestions</h4>
            {analysis.suggestions.map((suggestion, idx) => (
              <div key={idx} className="flex items-center text-sm">
                <AlertCircle className="h-4 w-4 text-yellow-500 mr-2" />
                <span>{suggestion}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EssayReviewStats;