import React, { useState, useContext, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  HomeIcon, 
  ChatAlt2Icon, 
  PaperAirplaneIcon,
  ChartBarIcon,
  XIcon
} from '@heroicons/react/solid';
import { AuthContext } from '../context/AuthContext';
import EssayReviewStats from './EssayReviewStats';
import api from '../services/api';

export const EssayReview = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { auth } = useContext(AuthContext);
  const { allSections, essayInfo } = location.state || {};
  
  const [isPosting, setIsPosting] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [postingError, setPostingError] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  

  const fullEssayContent = allSections
    ?.map(section => localStorage.getItem(`essayContent_${section.id}`))
    .filter(Boolean)
    .join('\n\n');

    useEffect(() => {
      const loadStoredStats = () => {
        try {
          // Check if all sections have writing style analysis
          const hasAllStats = allSections?.every(section => 
            localStorage.getItem(`writingStyle_${section.id}`)
          );
          
          if (!hasAllStats) {
            console.warn('Some sections missing writing analysis');
          }
          
          setLoadingStats(false);
        } catch (error) {
          console.error('Error loading writing stats:', error);
          setLoadingStats(false);
        }
      };
    
      loadStoredStats();
    }, [allSections]);

  const handlePost = async () => {
    if (!auth?.token) {
      alert('Please log in to post your essay');
      navigate('/login', { state: { from: location } });
      return;
    }

    if (!fullEssayContent) {
      setPostingError('Cannot post empty essay');
      return;
    }

    if (!essayInfo?.title || !essayInfo?.postType) {
      setPostingError('Missing required essay information');
      return;
    }

    try {
      setIsPosting(true);
      setPostingError(null);
      
      const postData = {
        title: essayInfo.title,
        content: fullEssayContent,
        postType: essayInfo.postType,
        prompt: essayInfo.promptId || null,
        sections: allSections.map(section => ({
          title: section.title,
          content: localStorage.getItem(`essayContent_${section.id}`) || '',
          order: section.order
        })),
        statistics: {
          wordCount: fullEssayContent.split(/\s+/).length,
          completionTime: new Date() - new Date(essayInfo.startTime),
          sectionStats: allSections.map(section => ({
            sectionId: section.id,
            errors: JSON.parse(localStorage.getItem(`sectionErrors_${section.id}`) || '[]'),
            requirements: JSON.parse(localStorage.getItem(`sectionRequirements_${section.id}`) || '{}')
          }))
        }
      };

      const response = await api.post('/posts', postData);

      if (response.data) {
        // Clear ALL related data from localStorage
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (
            key.startsWith('essayContent_') ||
            key.startsWith('sectionRequirements_') ||
            key.startsWith('sectionErrors_') ||
            key === 'essaySections' ||
            key === 'essayInfo' ||
            key.startsWith('essay_') ||
            key.includes('section')
          ) {
            localStorage.removeItem(key);
          }
        });

        // Navigate to success page
        navigate('/home', { 
          replace: true,
          state: { 
            message: 'Essay posted successfully!',
            essayId: response.data._id
          }
        });
      }
    } catch (error) {
      if (error.response?.status === 401) {
        setPostingError('Your session has expired. Please log in again.');
        navigate('/login', { state: { from: location } });
      } else if (error.response?.status === 400) {
        setPostingError(error.response.data.message || 'Invalid essay data. Please check all fields.');
      } else if (error.response?.status === 413) {
        setPostingError('Essay content is too large. Please try shortening it.');
      } else {
        setPostingError('Failed to post essay. Please try again later.');
      }
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => navigate('/essaybuilder')} 
              className="text-gray-600 hover:text-purple-600 transition-colors hover:bg-purple-300"
            >
              <HomeIcon className="text-white h-6 w-6" />
            </button>
            <h1 className="text-2xl font-semibold truncate max-w-md">
              {essayInfo?.title}
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowStats(!showStats)}
              className={`p-2 rounded-full transition-colors ${
                showStats ? 'bg-purple-100 text-purple-600' : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              <ChartBarIcon className="h-6 w-6" />
            </button>
            <button
              onClick={handlePost}
              disabled={isPosting}
              className="bg-green-600 text-white px-6 py-2 rounded-full flex items-center space-x-2 
                hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PaperAirplaneIcon className="h-5 w-5" />
              <span>{isPosting ? 'Posting...' : 'Post Essay'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Error Message */}
      {postingError && (
        <div className="mt-8 bg-red-50 border-l-4 border-red-400 p-4 fixed top-20 right-4 max-w-md">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <XIcon className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{postingError}</p>
            </div>
            <button 
              onClick={() => setPostingError(null)}
              className="mt-0 mx-5 w-auto bg-purple-500"
            >
              <XIcon className="h-5 w-5 text-white-400 hover:text-red-500" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        <div className="space-y-8">
          {/* Statistics Section */}
          {showStats && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-6">Essay Analysis</h2>
                <EssayReviewStats sections={allSections} />
              </div>
            </div>
          )}

          {/* Essay Content */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-6">Essay Content</h2>
              <div className="prose max-w-none">
                {allSections?.map((section, index) => (
                  <div key={section.id} className="mb-8">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                      {section.title}
                    </h3>
                    <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {localStorage.getItem(`essayContent_${section.id}`)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EssayReview;