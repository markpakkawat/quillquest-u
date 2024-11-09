import React, { useState, useEffect } from 'react';
import Progress from "./Progress";
import { 
  TrendingUp,
  AlertCircle 
} from "lucide-react";

const calculateImprovements = (currentStats, previousStats) => {
  if (!previousStats) return null;

  const improvements = [];
  const areasForImprovement = [];

  // Calculate clarity improvement
  const clarityImprovement = 
    ((currentStats?.clarity?.score - previousStats?.clarity?.score) / 
    previousStats?.clarity?.score * 100).toFixed(1);

  // Check various metrics for improvements
  if (currentStats?.voice?.activeVoicePercentage > previousStats?.voice?.activeVoicePercentage) {
    improvements.push(`Active voice usage increased by ${
      (currentStats.voice.activeVoicePercentage - previousStats.voice.activeVoicePercentage).toFixed(1)
    }%`);
  } else {
    areasForImprovement.push('Increase use of active voice');
  }

  if (currentStats?.complexity?.sentenceStructure?.score > 
      previousStats?.complexity?.sentenceStructure?.score) {
    improvements.push('Improved sentence structure variety');
  } else {
    areasForImprovement.push('Work on varying sentence structure');
  }

  if (currentStats?.complexity?.wordChoice?.academicVocabularyScore > 
      previousStats?.complexity?.wordChoice?.academicVocabularyScore) {
    improvements.push('Enhanced vocabulary usage');
  } else {
    areasForImprovement.push('Incorporate more diverse vocabulary');
  }

  if (currentStats?.complexity?.paragraphCohesion?.score > 
      previousStats?.complexity?.paragraphCohesion?.score) {
    improvements.push('Better paragraph transitions');
  } else {
    areasForImprovement.push('Strengthen paragraph connections');
  }

  return {
    clarityImprovement: parseFloat(clarityImprovement) || 0,
    improvements,
    improvements: improvements.length > 0 ? improvements : ['Continue practicing to see improvements'],
    areasForImprovement: areasForImprovement.length > 0 ? areasForImprovement : ['No specific areas of concern']
  };
};

const EssayReviewStats = ({ sections, writingStyle }) => {
  const [stats, setStats] = useState(null);
  const [comparisonStats, setComparisonStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        if (!sections || !Array.isArray(sections)) {
          setLoading(false);
          return;
        }
  
        const currentSection = sections[sections.length - 1];
        const previousSection = sections[sections.length - 2];
  
        // Use the writingAnalysis from props or sections
        const currentStats = writingStyle || currentSection?.writingAnalysis || {
          tone: {
            type: "Formal",
            confidence: 85,
            characteristics: ["Professional", "Academic"]
          },
          voice: {
            type: "Active",
            activeVoicePercentage: 75,
            passiveVoiceInstances: 5
          },
          clarity: {
            score: 85,
            level: "High",
            strengths: ["Clear structure", "Coherent flow"],
            improvements: ["Reduce sentence length"]
          },
          complexity: {
            sentenceStructure: {
              score: 80,
              averageLength: 15,
              varietyScore: 75
            },
            wordChoice: {
              complexWordsPercentage: 20,
              academicVocabularyScore: 85
            },
            paragraphCohesion: {
              score: 85,
              transitionStrength: "Strong",
              logicalFlowScore: 80
            }
          }
        };

        const previousStats = previousSection?.writingAnalysis;
  
        setStats(currentStats);
        if (currentStats && previousStats) {
          setComparisonStats(calculateImprovements(currentStats, previousStats));
        } else {
          setComparisonStats({
            clarityImprovement: 0,
            improvements: ['First analysis - keep writing to see improvements'],
            areasForImprovement: ['Continue writing to identify focus areas']
          });
        }
      } catch (error) {
        console.error('Error loading essay review stats:', error);
      } finally {
        setLoading(false);
      }
    };
  
    loadStats();
}, [sections, writingStyle]);

  if (loading) {
    return (
      <div className="w-full flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Writing Style Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Writing Style</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span>Tone</span>
              <span className="font-medium">{stats.tone?.type || 'Formal'}</span>
            </div>
            <div className="flex justify-between">
              <span>Voice</span>
              <span className="font-medium">
                {stats.voice?.activeVoicePercentage || 75}% Active
              </span>
            </div>
            <div className="mt-2">
              <Progress value={stats.voice?.activeVoicePercentage || 75} />
            </div>
          </div>
        </div>

        {/* Clarity Score Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Clarity Score</h3>
          <div className="text-center">
            <div className="text-3xl font-bold">
              {stats.clarity?.score || 85}/100
            </div>
            {comparisonStats?.clarityImprovement > 0 && (
              <div className="mt-4 flex items-center justify-center text-sm text-green-600">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span>+{comparisonStats.clarityImprovement}% improvement</span>
              </div>
            )}
          </div>
        </div>

        {/* Complexity Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Complexity</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Structure</span>
                <span>
                  {stats.complexity?.sentenceStructure?.score || 80}/100
                </span>
              </div>
              <Progress 
                value={stats.complexity?.sentenceStructure?.score || 80} 
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Vocabulary</span>
                <span>
                  {stats.complexity?.wordChoice?.academicVocabularyScore || 85}/100
                </span>
              </div>
              <Progress 
                value={stats.complexity?.wordChoice?.academicVocabularyScore || 85} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Improvements Section */}
      {comparisonStats && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Writing Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-green-600">Strengths</h4>
              {comparisonStats.improvements.map((imp, idx) => (
                <div key={idx} className="flex items-center text-sm">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-2" />
                  <span>{imp}</span>
                </div>
              ))}
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-yellow-600">Focus Areas</h4>
              {comparisonStats.areasForImprovement.map((area, idx) => (
                <div key={idx} className="flex items-center text-sm">
                  <AlertCircle className="h-4 w-4 text-yellow-500 mr-2" />
                  <span>{area}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EssayReviewStats;