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
import WritingAssistant from '../components/WritingAssistant';
import EssayReviewStats from './EssayReviewStats';
import api from '../services/api';

export const EssayReview = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { auth } = useContext(AuthContext);
  const { allSections, essayInfo } = location.state || {};
  
  const [isPosting, setIsPosting] = useState(false);
  const [showWritingAssistant, setShowWritingAssistant] = useState(false);
  const [previousEssays, setPreviousEssays] = useState([]);
  const [showStats, setShowStats] = useState(true);
  const [postingError, setPostingError] = useState(null);
  const [loadingPrevious, setLoadingPrevious] = useState(true);

  const fullEssayContent = allSections
    ?.map(section => localStorage.getItem(`essayContent_${section.id}`))
    .filter(Boolean)
    .join('\n\n');

  useEffect(() => {
    const fetchPreviousEssays = async () => {
      try {
        const response = await api.get('/posts/user');
        // Get last 5 essays excluding the current one
        const essays = response.data
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5);
        setPreviousEssays(essays);
      } catch (error) {
        console.error('Error fetching previous essays:', error);
      } finally {
        setLoadingPrevious(false);
      }
    };

    fetchPreviousEssays();
  }, []);
  
// Update the handlePost function in EssayReview.js
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
    
    // Text analysis
    const text = fullEssayContent.trim();
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const sentences = text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0);
    const paragraphs = text.split(/\n\s*\n/).filter(para => para.trim().length > 0);
    
    // Calculate required metrics
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length || 0;
    const longWords = words.filter(word => word.length > 6).length;
    const complexityScore = Math.min(Math.max(((longWords / words.length) * 100) || 0, 0), 100);
    const avgWordsPerSentence = sentences.length > 0 ? words.length / sentences.length : 0;
    
    // Ensure all required fields are numbers and within valid ranges
    const postData = {
      title: essayInfo.title,
      content: fullEssayContent,
      postType: essayInfo.postType,
      prompt: essayInfo.promptId || null,
      statistics: {
        overall: {
          wordCount: words.length,
          sentenceCount: sentences.length,
          paragraphCount: paragraphs.length,
          averageWordsPerSentence: parseFloat(avgWordsPerSentence.toFixed(2)),
          totalErrors: 0,
          requirementsMet: allSections?.filter(s => 
            localStorage.getItem(`essayContent_${s.id}`)?.trim().length > 0).length || 0,
          requirementsTotal: allSections?.length || 0
        },
        writingMetrics: {
          clarity: {
            score: parseFloat(complexityScore.toFixed(2)),
            strengths: [],
            improvements: []
          },
          complexity: {
            sentenceStructure: {
              score: parseFloat(avgWordLength.toFixed(2)),
              averageLength: parseFloat(avgWordsPerSentence.toFixed(2))
            },
            wordChoice: {
              complexWordsPercentage: parseFloat(((longWords / words.length) * 100).toFixed(2)),
              academicVocabularyScore: 0
            },
            paragraphCohesion: {
              score: parseFloat((words.length / Math.max(paragraphs.length, 1)).toFixed(2)),
              transitionStrength: 'moderate'
            }
          },
          tone: {
            type: 'neutral',
            characteristics: []
          },
          voice: {
            activeVoicePercentage: 0,
            passiveInstances: 0
          }
        },
        improvements: [],
        commonMissingRequirements: [],
        overallProgress: {
          errorReduction: 0,
          clarityImprovement: 0
        }
      }
    };

    // Validate numbers before sending
    const validateNumbers = (obj) => {
      for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          validateNumbers(obj[key]);
        } else if (typeof obj[key] === 'number' && isNaN(obj[key])) {
          obj[key] = 0;
        }
      }
    };

    validateNumbers(postData.statistics);

    const response = await api.post('/posts', postData);

    if (response.data) {
      // Clear localStorage and navigate as before
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('essayContent_') || 
            key.startsWith('sectionRequirements_') || 
            key.startsWith('sectionErrors_') || 
            key === 'essaySections' || 
            key === 'essayInfo' || 
            key.startsWith('essay_') || 
            key.includes('section')) {
          localStorage.removeItem(key);
        }
      });

      navigate('/home', { 
        replace: true,
        state: { 
          message: 'Essay posted successfully!',
          essayId: response.data._id
        }
      });
    }
  } catch (error) {
    console.error('Post error:', error);
    const errorMessage = error.response?.data?.error || 
                        error.response?.data?.message || 
                        error.message || 
                        'An error occurred while posting';
    setPostingError(errorMessage);
    
    if (error.response?.status === 401) {
      navigate('/login', { state: { from: location } });
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
              className="text-gray-600 hover:text-purple-600 transition-colors"
            >
              <HomeIcon className="h-6 w-6" />
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
              onClick={() => setShowWritingAssistant(true)}
              className="text-gray-600 hover:text-purple-600 transition-colors p-2"
            >
              <ChatAlt2Icon className="h-6 w-6" />
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
                  currentContent={fullEssayContent}
                  previousEssays={previousEssays}
                  loading={loadingPrevious}
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