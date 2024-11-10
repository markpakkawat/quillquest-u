import React, { useState, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  HomeIcon, 
  ChatAlt2Icon, 
  PaperAirplaneIcon 
} from '@heroicons/react/solid';
import { AuthContext } from '../context/AuthContext';
import WritingAssistant from '../components/WritingAssistant';
import api from '../services/api';

export const EssayReview = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { auth } = useContext(AuthContext);
  const { allSections, essayInfo } = location.state || {};
  const [isPosting, setIsPosting] = useState(false);
  const [showWritingAssistant, setShowWritingAssistant] = useState(false);

  const fullEssayContent = allSections
    ?.map(section => localStorage.getItem(`essayContent_${section.id}`))
    .filter(Boolean)
    .join('\n\n');

    const handlePost = async () => {
      if (!auth?.token) {
        alert('Please log in to post your essay');
        navigate('/login', { state: { from: location } });
        return;
      }
    
      if (!fullEssayContent) {
        alert('Cannot post empty essay');
        return;
      }
    
      if (!essayInfo?.title || !essayInfo?.postType) {
        alert('Missing required essay information');
        return;
      }
    
      try {
        setIsPosting(true);
        
        const postData = {
          title: essayInfo.title,
          content: fullEssayContent,
          postType: essayInfo.postType,
          prompt: essayInfo.promptId || null
        };
    
        const response = await api.post('/posts', postData);
    
        if (response.data) {
          // Clear ALL related data from localStorage
          const keys = Object.keys(localStorage);
          keys.forEach(key => {
            // Clear essay content
            if (key.startsWith('essayContent_')) {
              localStorage.removeItem(key);
            }
            // Clear requirements
            if (key.startsWith('sectionRequirements_')) {
              localStorage.removeItem(key);
            }
            // Clear essay sections and info
            if (key === 'essaySections' || key === 'essayInfo') {
              localStorage.removeItem(key);
            }
            // Clear any other essay-related data
            if (key.startsWith('essay_') || key.includes('section')) {
              localStorage.removeItem(key);
            }
          });
    
          // First navigate to essay builder with null state to reset its state
          navigate('/essaybuilder', { 
            replace: true, 
            state: null
          });
    
          // Then navigate to home with success message
          navigate('/home', { 
            replace: true,
            state: { message: 'Essay posted successfully!' }
          });
        }
      } catch (error) {
        if (error.response?.status === 401) {
          alert('Your session has expired. Please log in again.');
          navigate('/login', { state: { from: location } });
        } else if (error.response?.status === 400) {
          alert(error.response.data.message || 'Invalid essay data. Please check all fields.');
        } else if (error.response?.status === 413) {
          alert('Essay content is too large. Please try shortening it.');
        } else {
          alert('Failed to post essay. Please try again later.');
        }
      } finally {
        setIsPosting(false);
      }
    };



  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => navigate('/essaybuilder')} 
              className="text-white-600 hover:bg-purple-400"
            >
              <HomeIcon className="h-6 w-6" />
            </button>
            <h1 className="text-2xl font-semibold">{essayInfo?.title}</h1>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handlePost}
              disabled={isPosting}
              className="bg-green-600 text-white px-6 py-2 rounded-full flex items-center disabled:opacity-50"
            >
              <PaperAirplaneIcon className="h-5 w-5 mr-2" />
              {isPosting ? 'Posting...' : 'Post Essay'}
            </button>
          </div>
        </header>

      {/* Error Message */}
      {postingError && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 fixed top-20 right-4 max-w-md">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <XIcon className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{postingError}</p>
            </div>
            <button 
              onClick={() => setPostingError(null)}
              className="ml-auto pl-3"
            >
              <XIcon className="h-5 w-5 text-red-400 hover:text-red-500" />
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
                <EssayReviewStats 
                  sections={allSections}
                  loading={loadingStats}
                />
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
                    <h2 className="text-xl font-semibold mb-4">{section.title}</h2>
                    <div className="whitespace-pre-wrap">
                      {localStorage.getItem(`essayContent_${section.id}`)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Writing Assistant Modal */}
      <WritingAssistant 
        isOpen={showWritingAssistant}
        onClose={() => setShowWritingAssistant(false)}
        content={fullEssayContent}
        essayInfo={essayInfo}
      />
    </div>
  );
};