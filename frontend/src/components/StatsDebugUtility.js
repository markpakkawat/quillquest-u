import React, { useEffect, useState } from 'react';

const StatsDebugUtility = () => {
  const [debugData, setDebugData] = useState({
    essaySections: null,
    errorStats: null,
    completenessStats: null,
    currentSectionWritingStyle: null
  });

  useEffect(() => {
    // Get all relevant data from localStorage
    const essaySections = JSON.parse(localStorage.getItem('essaySections') || '[]');
    const errorStats = JSON.parse(localStorage.getItem('errorStats') || '[]');
    const completenessStats = JSON.parse(localStorage.getItem('completenessStats') || '[]');
    
    // Get current section's writing style if there is a current section
    const currentSection = essaySections[essaySections.length - 1];
    const currentSectionWritingStyle = currentSection 
      ? JSON.parse(localStorage.getItem(`writingStyle_${currentSection.id}`) || 'null')
      : null;

    setDebugData({
      essaySections,
      errorStats,
      completenessStats,
      currentSectionWritingStyle
    });
  }, []);

  return (
    <div className="p-4 bg-gray-50 rounded-lg space-y-4">
      <h2 className="text-lg font-bold">Statistics Debug Information</h2>
      
      <div className="space-y-2">
        <h3 className="font-medium">Essay Sections</h3>
        <pre className="bg-white p-2 rounded text-sm overflow-auto">
          {JSON.stringify(debugData.essaySections, null, 2)}
        </pre>
      </div>

      <div className="space-y-2">
        <h3 className="font-medium">Error Stats</h3>
        <pre className="bg-white p-2 rounded text-sm overflow-auto">
          {JSON.stringify(debugData.errorStats, null, 2)}
        </pre>
      </div>

      <div className="space-y-2">
        <h3 className="font-medium">Completeness Stats</h3>
        <pre className="bg-white p-2 rounded text-sm overflow-auto">
          {JSON.stringify(debugData.completenessStats, null, 2)}
        </pre>
      </div>

      <div className="space-y-2">
        <h3 className="font-medium">Current Section Writing Style</h3>
        <pre className="bg-white p-2 rounded text-sm overflow-auto">
          {JSON.stringify(debugData.currentSectionWritingStyle, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default StatsDebugUtility;