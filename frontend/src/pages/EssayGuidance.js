import React, { useState, useEffect } from 'react';
import { ChevronDownIcon } from '@heroicons/react/solid';
import { useNavigate } from 'react-router-dom';
import { HomeIcon } from '@heroicons/react/solid';
import api from '../services/api';

export default function EssayGuidance() {
  const [title, setTitle] = useState('');
  const [postType, setPostType] = useState('discussion');
  const [prompts, setPrompts] = useState([]);
  const [selectedPrompt, setSelectedPrompt] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        setLoading(true);
        console.log('Attempting to fetch prompts...');
        const response = await api.get('/prompts/all');
        console.log('Prompts received:', response.data);
        setPrompts(response.data);
        setError(null);
      } catch (error) {
        console.error('Error fetching prompts:', {
          message: error?.message || 'Unknown error',
          status: error?.response?.status,
          statusText: error?.response?.statusText,
          data: error?.response?.data,
          config: {
            url: error?.config?.url,
            method: error?.config?.method,
            baseURL: error?.config?.baseURL
          }
        });
        setError('Failed to load prompts. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchPrompts();
  }, []);
  
  useEffect(() => {
    // Clear all essay-related data when component mounts
    localStorage.removeItem('essaySections');
    localStorage.removeItem('essayInfo');
    
    // Clear any other essay-related data
    for (let key of Object.keys(localStorage)) {
      if (key.startsWith('essayContent_') || 
          key.startsWith('sectionRequirements_') ||
          key.startsWith('essay_') ||
          key.includes('section')) {
        localStorage.removeItem(key);
      }
    }
  }, []);

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
  };

  const handlePostTypeSelection = (type) => {
    setPostType(type);
  };

  const handlePromptSelection = (e) => {
    setSelectedPrompt(e.target.value);
  };

  const handleNext = () => {
    const essayInfo = {
      title,
      postType,
      prompt: prompts.find(p => p._id === selectedPrompt)?.topic || ''
    };
    navigate('/essaybuilder', { state: { essayInfo } });
  };

  return (
    <div className="flex-col space-y-5 min-h-screen flex items-center justify-center bg-purple-600 p-4">
      {/* Add this button */}
      <div>
        <button
        onClick={() => navigate('/home')}
        className="bg-white text-purple-600 px-4 py-2 rounded-full 
          hover:bg-purple-50 transition-colors flex items-center space-x-2 w-auto"
      >
        <HomeIcon className="h-5 w-5" />
        <span>Back to Home</span>
      </button>
      </div>
      
      
      {/* Rest of your existing content */}
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6 space-y-6">
        <div className="space-y-2">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={handleTitleChange}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div className="space-y-2">
          <span className="mb-4 block text-sm font-medium text-gray-700">Post Type</span>
          <div className="flex rounded-md shadow-sm">
            <button
              type="button"
              onClick={() => handlePostTypeSelection('discussion')}
              className={`w-1/2 py-2 px-4 mt-0 text-sm font-medium rounded-l-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:z-10 ${
                postType === 'discussion'
                  ? 'bg-purple-100 text-purple-600'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Discussion
            </button>
            <button
              type="button"
              onClick={() => handlePostTypeSelection('advice')}
              className={`w-1/2 py-2 px-4 mt-0 text-sm font-medium rounded-r-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:z-10 ${
                postType === 'advice'
                  ? 'bg-purple-100 text-purple-600'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Advice and Feedback
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="prompt" className="block text-sm font-medium text-gray-700">
            Prompt
          </label>
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded-md">
              {error}
            </div>
          )}
          <div className="relative">
            {loading ? (
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-500">
                Loading prompts...
              </div>
            ) : (
              <>
                <select
                  id="prompt"
                  value={selectedPrompt}
                  onChange={handlePromptSelection}
                  className="hover:bg-gray-100 cursor-pointer block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md appearance-none"
                >
                  <option value="">Select a Prompt . . .</option>
                  {prompts.map((prompt) => (
                    <option key={prompt._id} value={prompt._id}>
                      {prompt.topic}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
                </div>
              </>
            )}
          </div>
          {prompts.length === 0 && !loading && !error && (
            <p className="text-sm text-gray-500">No prompts available</p>
          )}
        </div>

        <button
          type="button"
          onClick={handleNext}
          disabled={loading || !selectedPrompt}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
            loading || !selectedPrompt
              ? 'bg-purple-400 cursor-not-allowed'
              : 'bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500'
          }`}
        >
          {loading ? 'Loading...' : 'Next'}
        </button>
      </div>
    </div>
  );
}