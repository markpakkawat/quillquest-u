import React from 'react';

export const SectionRequirements = ({ sectionId, sectionType }) => {
  const requirements = JSON.parse(localStorage.getItem(`sectionRequirements_${sectionType}`) || '{}');
  
  if (!requirements.requirements) return null;

  return (
    <div className="bg-white rounded-lg shadow p-4 mt-2 text-sm">
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-semibold text-gray-700">Section Requirements</h4>
        <div className="text-purple-600">
          Score: {requirements.scores.overallScore}/100
        </div>
      </div>

      <div className="space-y-2">
        {requirements.requirements.map((req, index) => (
          <div key={index} className={`p-2 rounded ${
            req.status === 'met' ? 'bg-green-50' : 
            req.status === 'partial' ? 'bg-yellow-50' : 'bg-red-50'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`font-medium ${
                req.status === 'met' ? 'text-green-700' : 
                req.status === 'partial' ? 'text-yellow-700' : 'text-red-700'
              }`}>
                {req.requirement}
              </span>
              <span className="text-xs uppercase">
                {req.status}
              </span>
            </div>
            {req.status !== 'met' && (
              <p className="text-gray-600 text-xs mt-1">
                {req.suggestion}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};