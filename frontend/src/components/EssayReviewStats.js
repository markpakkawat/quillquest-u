import React, { useState, useEffect } from 'react';
import Progress from "./Progress";
import { TrendingUp, AlertCircle, Sparkles } from "lucide-react";
import { ERROR_CATEGORIES } from '../utils/errorTracking';
import { aggregateStyleAnalyses, getDefaultAnalysis } from '../utils/writing/writingAnalysis';

// Add these helper functions at the top of your file, after the imports
const getToneDescription = (type) => {
  switch(type?.toLowerCase()) {
    case 'formal':
      return "Your writing maintains a professional academic tone with appropriate formality and scholarly language";
    case 'informal':
      return "Consider using more formal language and academic expressions for scholarly writing";
    case 'neutral':
      return "Your writing maintains a balanced tone suitable for academic context";
    default:
      return "Analyzing your writing style and tone...";
  }
};

const getClarityDescription = (score) => {
  if (score >= 80) {
    return "Your ideas are expressed clearly with excellent organization and coherence";
  } else if (score >= 60) {
    return "Your writing is generally clear but could benefit from more precise expression";
  } else if (score >= 40) {
    return "Focus on making your ideas more clear and your arguments more structured";
  } else {
    return "Work on expressing ideas more clearly and organizing your thoughts";
  }
};

const getVoiceDescription = (percentage) => {
  if (percentage >= 80) {
    return "Excellent use of active voice, making your writing direct and engaging";
  } else if (percentage >= 60) {
    return "Good balance of active and passive voice, with room for more active constructions";
  } else if (percentage >= 40) {
    return "Consider using more active voice to make your writing more direct";
  } else {
    return "Try to reduce passive voice usage to make your writing more engaging";
  }
};

const getAcademicDescription = (score) => {
  if (score >= 80) {
    return "Strong academic writing style with sophisticated vocabulary and scholarly expressions";
  } else if (score >= 60) {
    return "Good academic tone with opportunities for more scholarly language";
  } else if (score >= 40) {
    return "Work on incorporating more academic vocabulary and formal expressions";
  } else {
    return "Focus on developing a more academic writing style and vocabulary";
  }
};

const StyleMetric = ({ label, value, description, color = "purple", showRawScore = true, metricSuffix = "%" }) => {
  const getDescription = () => {
    if (value >= 80) return "Excellent";
    if (value >= 70) return "Very Good";
    if (value >= 60) return "Good";
    if (value >= 50) return "Fair";
    return "Needs Improvement";
  };

  const getColorClass = () => {
    if (value >= 80) return "text-green-600";
    if (value >= 60) return "text-blue-600";
    if (value >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  const getBgColorClass = () => {
    if (value >= 80) return "bg-green-50";
    if (value >= 60) return "bg-blue-50";
    if (value >= 40) return "bg-yellow-50";
    return "bg-red-50";
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <div>
          <span className="text-sm font-medium text-gray-600">{label}</span>
          {showRawScore && (
            <span className="ml-2 text-xs text-gray-400">
              ({value.toFixed(1)}{metricSuffix})
            </span>
          )}
        </div>
        <div className={`px-2 py-1 rounded-full ${getBgColorClass()}`}>
          <span className={`text-sm font-medium ${getColorClass()}`}>
            {getDescription()}
          </span>
        </div>
      </div>
      <Progress 
        value={value} 
        color={color}
        className="h-2 bg-gray-100"
      />
      {description && (
        <div className="flex items-start mt-2 text-xs text-gray-500">
          <div className="w-1 h-1 bg-gray-400 rounded-full mt-1.5 mr-2 flex-shrink-0" />
          <p>{description}</p>
        </div>
      )}
      
      {/* Detailed Metrics */}
      <div className="grid grid-cols-3 gap-2 mt-2">
        {value >= 60 && (
          <div className={`px-2 py-1 rounded-md ${getBgColorClass()} text-center`}>
            <span className={`text-xs font-medium ${getColorClass()}`}>
              Target Met
            </span>
          </div>
        )}
        {value > 40 && value < 80 && (
          <div className="px-2 py-1 rounded-md bg-yellow-50 text-center">
            <span className="text-xs font-medium text-yellow-600">
              Room for Growth
            </span>
          </div>
        )}
        {value < 40 && (
          <div className="px-2 py-1 rounded-md bg-red-50 text-center">
            <span className="text-xs font-medium text-red-600">
              Needs Focus
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

const getDetailedMetrics = (writingStyle) => {
  return {
    clarity: {
      main: writingStyle?.clarity?.score || 0,
      details: {
        ideas: writingStyle?.clarity?.ideaClarity || 0,
        structure: writingStyle?.clarity?.structureScore || 0,
        readability: writingStyle?.clarity?.readabilityScore || 0
      }
    },
    voice: {
      main: writingStyle?.voice?.activeVoicePercentage || 0,
      details: {
        active: writingStyle?.voice?.activeVoicePercentage || 0,
        passive: writingStyle?.voice?.passiveVoiceInstances || 0,
        balance: writingStyle?.voice?.balanceScore || 0
      }
    },
    academic: {
      main: writingStyle?.complexity?.wordChoice?.academicVocabularyScore || 0,
      details: {
        vocabulary: writingStyle?.complexity?.wordChoice?.academicVocabularyScore || 0,
        complexity: writingStyle?.complexity?.sentenceStructure?.varietyScore || 0,
        formality: writingStyle?.tone?.formalityScore || 0
      }
    },
    cohesion: {
      main: writingStyle?.complexity?.paragraphCohesion?.score || 0,
      details: {
        flow: writingStyle?.complexity?.paragraphCohesion?.logicalFlowScore || 0,
        transitions: writingStyle?.complexity?.paragraphCohesion?.transitionScore || 0,
        structure: writingStyle?.complexity?.paragraphCohesion?.structureScore || 0
      }
    }
  };
};

const MetricDetails = ({ label, value, suffix = "%", trend }) => (
  <div className="text-xs">
    <div className="text-gray-500">{label}</div>
    <div className="flex items-center space-x-1">
      <span className="font-medium">{value.toFixed(1)}{suffix}</span>
      {trend && (
        <span className={trend > 0 ? "text-green-500" : "text-red-500"}>
          ({trend > 0 ? "+" : ""}{trend.toFixed(1)}%)
        </span>
      )}
    </div>
  </div>
);

const WritingStyleCard = ({ writingStyle }) => {
  const metrics = getDetailedMetrics(writingStyle);
  
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center space-x-2 mb-6">
        <Sparkles className="h-5 w-5 text-purple-600" />
        <h3 className="text-lg font-semibold">Writing Style Analysis</h3>
      </div>
      
      <div className="space-y-8">
        {/* Tone Indicator */}
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Writing Tone</span>
            <span className="text-purple-600 font-medium">
              {writingStyle?.tone?.type || 'Analyzing...'}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-2">
            {getToneDescription(writingStyle?.tone?.type)}
          </p>
          
          {/* Tone Metrics */}
          <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t border-purple-100">
            <MetricDetails 
              label="Formality"
              value={writingStyle?.tone?.formalityScore || 0}
            />
            <MetricDetails 
              label="Consistency"
              value={writingStyle?.tone?.consistencyScore || 0}
            />
            <MetricDetails 
              label="Academic Terms"
              value={metrics.academic.details.vocabulary}
            />
          </div>
        </div>

        {/* Main Metrics */}
        <div className="space-y-8">
          <StyleMetric 
            label="Clarity & Readability" 
            value={metrics.clarity.main}
            description={getClarityDescription(metrics.clarity.main)}
          />
          
          <div className="grid grid-cols-3 gap-4 px-2 py-1 bg-gray-50 rounded-lg text-center text-xs">
            <MetricDetails 
              label="Ideas"
              value={metrics.clarity.details.ideas}
            />
            <MetricDetails 
              label="Structure"
              value={metrics.clarity.details.structure}
            />
            <MetricDetails 
              label="Readability"
              value={metrics.clarity.details.readability}
            />
          </div>
          
          <StyleMetric 
            label="Active Voice Usage" 
            value={metrics.voice.main}
            description={getVoiceDescription(metrics.voice.main)}
            color="blue"
          />
          
          <div className="grid grid-cols-3 gap-4 px-2 py-1 bg-gray-50 rounded-lg text-center text-xs">
            <MetricDetails 
              label="Active Voice"
              value={metrics.voice.details.active}
            />
            <MetricDetails 
              label="Passive Instances"
              value={metrics.voice.details.passive}
              suffix=""
            />
            <MetricDetails 
              label="Balance"
              value={metrics.voice.details.balance}
            />
          </div>
          
          <StyleMetric 
            label="Academic Level" 
            value={metrics.academic.main}
            description={getAcademicDescription(metrics.academic.main)}
            color="green"
          />
          
          <div className="grid grid-cols-3 gap-4 px-2 py-1 bg-gray-50 rounded-lg text-center text-xs">
            <MetricDetails 
              label="Vocabulary"
              value={metrics.academic.details.vocabulary}
            />
            <MetricDetails 
              label="Complexity"
              value={metrics.academic.details.complexity}
            />
            <MetricDetails 
              label="Formality"
              value={metrics.academic.details.formality}
            />
          </div>
          
          <StyleMetric 
            label="Flow & Cohesion" 
            value={metrics.cohesion.main}
            description="Measures how well your ideas connect and flow together"
            color="indigo"
          />
          
          <div className="grid grid-cols-3 gap-4 px-2 py-1 bg-gray-50 rounded-lg text-center text-xs">
            <MetricDetails 
              label="Flow"
              value={metrics.cohesion.details.flow}
            />
            <MetricDetails 
              label="Transitions"
              value={metrics.cohesion.details.transitions}
            />
            <MetricDetails 
              label="Structure"
              value={metrics.cohesion.details.structure}
            />
          </div>
        </div>

        {/* Quick Tips remain the same */}
        {writingStyle?.clarity?.improvements?.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm font-medium text-gray-600 mb-2">Quick Tips</p>
            <ul className="space-y-1">
              {writingStyle.clarity.improvements.slice(0, 2).map((tip, idx) => (
                <li key={idx} className="text-sm text-gray-500 flex items-center">
                  <span className="w-1 h-1 bg-purple-400 rounded-full mr-2" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

const EssayReviewStats = ({ sections, writingStyle, essayId }) => {
  const [analysis, setAnalysis] = useState(null);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);

  useEffect(() => {
    const analyzeEssay = async () => {
      const essaySections = sections || JSON.parse(localStorage.getItem('essaySections') || '[]');
      const errorStats = JSON.parse(localStorage.getItem('errorStats') || '[]');
      const completenessStats = JSON.parse(localStorage.getItem('completenessStats') || '[]');

      const currentSectionIds = new Set(essaySections.map(section => section.id));
      
      const relevantErrorStats = essayId 
        ? errorStats.filter(stat => currentSectionIds.has(stat.sectionId))
        : errorStats;
        
      const relevantCompletenessStats = essayId
        ? completenessStats.filter(stat => currentSectionIds.has(stat.sectionId))
        : completenessStats;

      const errorPatterns = {};
      let totalErrors = 0;
      
      relevantErrorStats.forEach(stat => {
        if (!stat.timestamp || (lastUpdateTime && new Date(stat.timestamp) <= new Date(lastUpdateTime))) {
          return;
        }
        
        Object.entries(stat.errorsByCategory || {}).forEach(([category, count]) => {
          errorPatterns[category] = (errorPatterns[category] || 0) + count;
          totalErrors += count;
        });
      });

      const completionMetrics = {
        total: relevantCompletenessStats.length,
        completed: relevantCompletenessStats.filter(stat => stat.isComplete).length,
        rate: relevantCompletenessStats.length > 0 
          ? (relevantCompletenessStats.filter(stat => stat.isComplete).length / relevantCompletenessStats.length) * 100
          : 0,
        lastUpdated: Math.max(...relevantCompletenessStats.map(stat => new Date(stat.timestamp || 0)))
      };

      const sectionAnalyses = await Promise.all(
        essaySections.map(async section => {
          const analysisJson = localStorage.getItem(`writingStyle_${section.id}`);
          return analysisJson ? JSON.parse(analysisJson) : null;
        })
      );

      const aggregatedAnalysis = aggregateStyleAnalyses(sectionAnalyses.filter(Boolean)) || getDefaultAnalysis();

      const strengths = [];
      const suggestions = [];

      if (aggregatedAnalysis) {
        if (aggregatedAnalysis.tone?.type === 'Formal') {
          strengths.push('Maintains professional academic tone');
        }

        if (aggregatedAnalysis.voice?.activeVoicePercentage > 70) {
          strengths.push('Strong use of active voice');
        }

        if (aggregatedAnalysis.clarity?.score > 80) {
          strengths.push('Excellent clarity in writing');
        }

        if (aggregatedAnalysis.clarity?.improvements?.length > 0) {
          suggestions.push(...aggregatedAnalysis.clarity.improvements);
        }

        if (aggregatedAnalysis.complexity?.paragraphCohesion?.score < 70) {
          suggestions.push('Strengthen paragraph transitions and flow');
        }

        if (aggregatedAnalysis.complexity?.wordChoice?.academicVocabularyScore < 60) {
          suggestions.push('Incorporate more academic vocabulary');
        }
      }

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

      if (completionMetrics.rate > 80) {
        strengths.push('Excellent progress across sections');
      }

      setAnalysis({
        errorPatterns,
        completionMetrics,
        suggestions: [...new Set(suggestions)].slice(0, 3),
        strengths: [...new Set(strengths)].slice(0, 3),
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
    <div className="space-y-6">
      {/* Summary Cards - Quick Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h4 className="text-sm font-medium text-gray-500">Total Issues</h4>
          <div className="mt-2 flex justify-between items-end">
            <p className="text-2xl font-semibold text-gray-900">
              {analysis.totalErrors}
            </p>
            <span className={`text-sm ${analysis.totalErrors === 0 ? 'text-green-500' : 'text-yellow-500'}`}>
              {analysis.totalErrors === 0 ? 'Perfect!' : 'Need attention'}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h4 className="text-sm font-medium text-gray-500">Writing Style</h4>
          <div className="mt-2 flex justify-between items-end">
            <p className="text-2xl font-semibold text-gray-900">
              {analysis.writingStyle?.clarity?.score?.toFixed(0) || 0}%
            </p>
            <span className="text-sm text-purple-500">Overall Score</span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h4 className="text-sm font-medium text-gray-500">Academic Level</h4>
          <div className="mt-2 flex justify-between items-end">
            <p className="text-2xl font-semibold text-gray-900">
              {analysis.writingStyle?.complexity?.wordChoice?.academicVocabularyScore?.toFixed(0) || 0}%
            </p>
            <span className={`text-sm ${analysis.writingStyle?.complexity?.wordChoice?.academicVocabularyScore >= 70 ? 'text-green-500' : 'text-blue-500'}`}>
              {analysis.writingStyle?.complexity?.wordChoice?.academicVocabularyScore >= 70 ? 'Advanced' : 'Developing'}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h4 className="text-sm font-medium text-gray-500">Completion</h4>
          <div className="mt-2 flex justify-between items-end">
            <p className="text-2xl font-semibold text-gray-900">
              {analysis.completionMetrics?.rate?.toFixed(0) || 0}%
            </p>
            <span className="text-sm text-blue-500">Progress</span>
          </div>
        </div>
      </div>

      {/* Detailed Analysis Sections */}
      <div className="space-y-6">
        {/* Writing Style Analysis */}
        <WritingStyleCard writingStyle={analysis.writingStyle} />

        {/* Error Analysis */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center space-x-2 mb-6">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <h3 className="text-lg font-semibold">Error Analysis</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Error Categories */}
            <div className="space-y-4">
              {Object.entries(ERROR_CATEGORIES).map(([key, label]) => {
                const errorCount = analysis.errorPatterns[key] || 0;
                return (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{label}</span>
                      <span>{errorCount} {errorCount === 1 ? 'issue' : 'issues'}</span>
                    </div>
                    <Progress value={calculateProgress(errorCount)} color="red" />
                  </div>
                );
              })}
            </div>

            {/* Error Distribution Chart */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-4">Error Distribution</h4>
              <div className="space-y-2">
                {(() => {
                  // Calculate total errors here
                  const totalErrors = Object.values(analysis.errorPatterns)
                    .reduce((sum, count) => sum + (count || 0), 0);

                  return Object.entries(ERROR_CATEGORIES).map(([key, label]) => {
                    const errorCount = analysis.errorPatterns[key] || 0;
                    const percentage = totalErrors === 0 ? 0 : 
                      ((errorCount / totalErrors) * 100).toFixed(1);
                    
                    return (
                      <div key={key} className="flex items-center text-sm">
                        <div className="w-2 h-2 rounded-full bg-red-500 mr-2" />
                        <span className="flex-1">{label}</span>
                        <span className="text-gray-500">{percentage}%</span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Results */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Key Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="font-medium text-green-600 flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Writing Strengths
            </h4>
            <div className="bg-green-50 rounded-lg p-4 space-y-2">
              {analysis.strengths.map((strength, idx) => (
                <div key={idx} className="flex items-start text-sm">
                  <div className="w-1 h-1 bg-green-500 rounded-full mt-1.5 mr-2 flex-shrink-0" />
                  <span className="text-green-800">{strength}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-medium text-yellow-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              Areas for Improvement
            </h4>
            <div className="bg-yellow-50 rounded-lg p-4 space-y-2">
              {analysis.suggestions.map((suggestion, idx) => (
                <div key={idx} className="flex items-start text-sm">
                  <div className="w-1 h-1 bg-yellow-500 rounded-full mt-1.5 mr-2 flex-shrink-0" />
                  <span className="text-yellow-800">{suggestion}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EssayReviewStats;