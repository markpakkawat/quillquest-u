import api from '../services/api';

// Constants for categorizing errors and requirements
export const ERROR_CATEGORIES = {
  spelling: 'Spelling',
  punctuation: 'Punctuation',
  lexicoSemantic: 'Word Choice & Meaning',
  stylistic: 'Style',
  typographical: 'Typography'
};

export const SECTION_TYPES = {
  introduction: 'Introduction',
  bodyParagraph: 'Body Paragraph',
  conclusion: 'Conclusion'
};

// Save error statistics for an essay section
export const saveErrorStats = async (sectionId, errorStats, sectionType) => {
  try {
    const errorCount = Object.values(errorStats).reduce((sum, errors) => 
      sum + errors.length, 0
    );

    const stats = {
      sectionId,
      sectionType,
      timestamp: new Date().toISOString(),
      totalErrors: errorCount,
      errorsByCategory: Object.entries(errorStats).reduce((acc, [category, errors]) => {
        acc[category] = errors.length;
        return acc;
      }, {}),
      // Store full error details for detailed analysis
      detailedErrors: errorStats
    };

    // Store in localStorage for persistence
    const existingStats = JSON.parse(localStorage.getItem('errorStats') || '[]');
    existingStats.push(stats);
    localStorage.setItem('errorStats', JSON.stringify(existingStats));

    // Could also send to API if needed
    // await api.post('/essays/error-stats', stats);

    return stats;
  } catch (error) {
    console.error('Error saving error stats:', error);
    throw error;
  }
};

// Save section completeness statistics
export const saveCompletenessStats = async (sectionId, completenessStats, sectionType) => {
  try {
    const stats = {
      sectionId,
      sectionType,
      timestamp: new Date().toISOString(),
      isComplete: completenessStats.isComplete,
      metRequirements: completenessStats.completionStatus.met.length,
      missingRequirements: completenessStats.completionStatus.missing.length,
      // Store full completeness details
      details: completenessStats
    };

    // Store in localStorage
    const existingStats = JSON.parse(localStorage.getItem('completenessStats') || '[]');
    existingStats.push(stats);
    localStorage.setItem('completenessStats', JSON.stringify(existingStats));

    return stats;
  } catch (error) {
    console.error('Error saving completeness stats:', error);
    throw error;
  }
};

// Get error statistics for display
export const getErrorStats = () => {
  try {
    const errorStats = JSON.parse(localStorage.getItem('errorStats') || '[]');
    const completenessStats = JSON.parse(localStorage.getItem('completenessStats') || '[]');

    // Calculate trends and improvements
    const trends = {
      // Error reduction percentage
      errorReduction: calculateErrorReduction(errorStats),
      // Most common error types
      commonErrors: findCommonErrors(errorStats),
      // Section completion rates
      completionRates: calculateCompletionRates(completenessStats),
      // Common missing requirements
      commonMissingRequirements: findCommonMissingRequirements(completenessStats)
    };

    return trends;
  } catch (error) {
    console.error('Error getting stats:', error);
    return null;
  }
};

// Helper functions
const calculateErrorReduction = (stats) => {
  if (stats.length < 2) return 0;
  
  const firstFive = stats.slice(0, 5);
  const lastFive = stats.slice(-5);
  
  const earlyAvg = firstFive.reduce((sum, stat) => sum + stat.totalErrors, 0) / firstFive.length;
  const recentAvg = lastFive.reduce((sum, stat) => sum + stat.totalErrors, 0) / lastFive.length;
  
  if (earlyAvg === 0) return 0;
  return Math.round(((earlyAvg - recentAvg) / earlyAvg) * 100);
};

const findCommonErrors = (stats) => {
  const errorCounts = {};
  
  stats.forEach(stat => {
    Object.entries(stat.errorsByCategory).forEach(([category, count]) => {
      errorCounts[category] = (errorCounts[category] || 0) + count;
    });
  });
  
  return Object.entries(errorCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([category, count]) => ({
      category: ERROR_CATEGORIES[category],
      count
    }));
};

const calculateCompletionRates = (stats) => {
  const sectionStats = {};
  
  stats.forEach(stat => {
    if (!sectionStats[stat.sectionType]) {
      sectionStats[stat.sectionType] = {
        total: 0,
        complete: 0
      };
    }
    
    sectionStats[stat.sectionType].total++;
    if (stat.isComplete) {
      sectionStats[stat.sectionType].complete++;
    }
  });
  
  return Object.entries(sectionStats).reduce((acc, [type, data]) => {
    acc[type] = Math.round((data.complete / data.total) * 100);
    return acc;
  }, {});
};

const findCommonMissingRequirements = (stats) => {
  const requirements = {};
  
  stats.forEach(stat => {
    stat.details.completionStatus.missing.forEach(req => {
      requirements[req] = (requirements[req] || 0) + 1;
    });
  });
  
  return Object.entries(requirements)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([requirement, count]) => ({
      requirement,
      frequency: Math.round((count / stats.length) * 100)
    }));
};