import React, { useState, useEffect } from 'react';
import Progress from "./Progress";
import { TrendingUp, AlertCircle } from "lucide-react";
import { ERROR_CATEGORIES } from '../utils/errorTracking';

const EssayReviewStats = ({ sections, writingStyle }) => {
  const [analysis, setAnalysis] = useState(null);

  useEffect(() => {
    // Get the latest section's data
    const essaySections = JSON.parse(localStorage.getItem('essaySections') || '[]');
    const errorStats = JSON.parse(localStorage.getItem('errorStats') || '[]');
    const completenessStats = JSON.parse(localStorage.getItem('completenessStats') || '[]');

    // Calculate error patterns
    const errorPatterns = {};
    errorStats.forEach(stat => {
      Object.entries(stat.errorsByCategory || {}).forEach(([category, count]) => {
        errorPatterns[category] = (errorPatterns[category] || 0) + count;
      });
    });

    // Calculate completion metrics
    const completionMetrics = {
      total: completenessStats.length,
      completed: completenessStats.filter(stat => stat.isComplete).length,
      rate: completenessStats.length > 0 
        ? (completenessStats.filter(stat => stat.isComplete).length / completenessStats.length) * 100
        : 0
    };

    // Organize the suggestions based on actual errors
    const suggestions = [];
    Object.entries(errorPatterns).forEach(([category, count]) => {
      if (count > 0) {
        switch(category) {
          case 'stylistic':
            suggestions.push('Improve formal academic writing style');
            break;
          case 'lexicoSemantic':
            suggestions.push('Use more precise and clear language');
            break;
          case 'punctuation':
            suggestions.push('Review punctuation rules and consistency');
            break;
          case 'spelling':
            suggestions.push('Double-check spelling and word usage');
            break;
          case 'typographical':
            suggestions.push('Review for typographical accuracy');
            break;
        }
      }
    });

    // Identify strengths based on completion and error patterns
    const strengths = [];
    if (completionMetrics.rate > 80) {
      strengths.push('Strong section completion rate');
    }
    if (Object.values(errorPatterns).reduce((a, b) => a + b, 0) < 3) {
      strengths.push('Good overall accuracy');
    }
    if (!errorPatterns.spelling || errorPatterns.spelling < 2) {
      strengths.push('Strong spelling accuracy');
    }

    setAnalysis({
      errorPatterns,
      completionMetrics,
      suggestions: suggestions.length > 0 ? suggestions : ['Keep writing to receive specific suggestions'],
      strengths: strengths.length > 0 ? strengths : ['Analysis in progress...']
    });
  }, [sections]);

  if (!analysis) {
    return null;
  }

  // Helper function to calculate progress value
  const calculateProgress = (errorCount) => {
    const maxErrors = 12; // Maximum errors shown in the screenshot
    return Math.min(100, (errorCount / maxErrors) * 100);
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
                    <span>{errorCount} issues</span>
                  </div>
                  <Progress 
                    value={calculateProgress(errorCount)}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Completion Status */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Completion Status</h3>
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">
                {analysis.completionMetrics.rate.toFixed(1)}%
              </div>
              <p className="text-sm text-gray-600">
                {analysis.completionMetrics.completed} of {analysis.completionMetrics.total} sections complete
              </p>
            </div>
          </div>
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