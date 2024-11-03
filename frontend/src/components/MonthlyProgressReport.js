import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer 
} from 'recharts';
import { TrendingUp, TrendingDown } from "lucide-react";
import Progress from "./Progress";

const MonthlyProgressReport = ({ monthlyStats = null }) => {
  // Default stats for new users
  const defaultStats = {
    qualityTrends: [],
    improvements: [],
    focusAreas: [],
    overallProgress: {
      errorReduction: 0,
      clarityImprovement: 0,
      activeVoiceIncrease: 0
    }
  };

  const data = monthlyStats || defaultStats;

  // If user has no posts, show welcome message
  if (!monthlyStats?.qualityTrends?.length) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Writing Statistics</h2>
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">
            Welcome! Start writing essays to see your progress and statistics here.
          </p>
          <button
            onClick={() => window.location.href = '/essay-builder'}
            className="bg-purple-600 text-white px-6 py-2 rounded-full hover:bg-purple-700 transition-colors"
          >
            Start Writing
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 bg-white rounded-2xl p-8 shadow-sm">
      <h2 className="text-xl font-semibold mb-6">Monthly Progress Report</h2>
      
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-sm text-gray-600 mb-2">Error Reduction</h3>
          <div className="text-2xl font-bold text-green-600">
            {data.overallProgress.errorReduction}%
          </div>
          <Progress value={data.overallProgress.errorReduction} className="mt-2" />
        </div>
        
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-sm text-gray-600 mb-2">Clarity Improvement</h3>
          <div className="text-2xl font-bold text-purple-600">
            {data.overallProgress.clarityImprovement}%
          </div>
          <Progress value={data.overallProgress.clarityImprovement} className="mt-2" />
        </div>
        
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-sm text-gray-600 mb-2">Active Voice Usage</h3>
          <div className="text-2xl font-bold text-blue-600">
            {data.overallProgress.activeVoiceIncrease}%
          </div>
          <Progress value={data.overallProgress.activeVoiceIncrease} className="mt-2" />
        </div>
      </div>

      {/* Quality Trends Chart */}
      <div className="mb-8">
        <h3 className="text-lg font-medium mb-4">Writing Quality Trends</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.qualityTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="clarity" 
                stroke="#8884d8" 
                name="Clarity Score"
              />
              <Line 
                type="monotone" 
                dataKey="complexity" 
                stroke="#82ca9d" 
                name="Complexity Score"
              />
              <Line 
                type="monotone" 
                dataKey="errors" 
                stroke="#ff7f7f" 
                name="Errors"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Improvements and Focus Areas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Top Improvements</h3>
          <div className="bg-gray-50 rounded-xl p-6 space-y-4">
            {data.improvements.map((improvement, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center">
                  <TrendingUp className="h-5 w-5 text-green-500 mr-2" />
                  <span>{improvement.area}</span>
                </div>
                <span className="font-medium text-green-600">
                  +{improvement.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Focus Areas</h3>
          <div className="bg-gray-50 rounded-xl p-6 space-y-4">
            {data.focusAreas.map((area, idx) => (
              <div key={idx} className="flex items-start">
                <TrendingDown className="h-5 w-5 text-yellow-500 mr-2 mt-1 flex-shrink-0" />
                <div>
                  <div className="font-medium">{area.name}</div>
                  <div className="text-sm text-gray-600">{area.suggestion}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyProgressReport;