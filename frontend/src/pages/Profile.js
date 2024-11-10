import React, { useState, useEffect } from 'react';
import '../assets/css/index.css';
import Navbar from '../components/Navbar';
import api from '../services/api';
import SettingsIcon from '@mui/icons-material/Settings';
import { Link } from 'react-router-dom';

// const Notification = ({ message, type, onClose }) => {
//   if (!message) return null;

//   const notificationClass =
//     type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700';

  return (
    <div className={`space-x-2 border p-1 w-auto rounded-xl ${notificationClass}`} role="alert">
      <span>{message}</span>
    </div>
  );
};

const processLocalStats = (essaySections, errorStats, completenessStats) => {
  const currentSessionStats = {
    essaySections,
    errorStats,
    completenessStats,
    currentErrors: {},
    totalErrors: 0,
    errorTrends: [],
    sectionRates: {},
    commonMissingRequirements: [],
    completionStatus: {
      totalSections: essaySections.length,
      completedSections: completenessStats.filter(stat => stat.isComplete).length,
      completionRate: essaySections.length > 0 
        ? Math.round((completenessStats.filter(stat => stat.isComplete).length / essaySections.length) * 100)
        : 0
    }
  };

  if (errorStats.length > 0) {
    currentSessionStats.totalErrors = errorStats.reduce((sum, stat) => 
      sum + (stat.totalErrors || 0), 0
    );
    
    errorStats.forEach(stat => {
      if (stat.errorsByCategory) {
        Object.entries(stat.errorsByCategory).forEach(([category, count]) => {
          currentSessionStats.currentErrors[category] = 
            (currentSessionStats.currentErrors[category] || 0) + count;
        });
      }
    });
  }

  return {
    currentSession: currentSessionStats,
    historical: {
      qualityMetrics: {
        clarity: 0,
        complexity: 0,
        activeVoice: 0,
        errorRate: currentSessionStats.totalErrors / (essaySections.length || 1)
      }
    }
  };
};

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(null);
  const [email, setEmail] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [error, setError] = useState('');
  const [avatarColor, setAvatarColor] = useState('bg-purple-600');
  const [postsCount, setPostsCount] = useState(0);
  const [totalLikes, setTotalLikes] = useState(0);
  const [avgWordCount, setAvgWordCount] = useState(0);
  const [hasChanges, setHasChanges] = useState(false);
  const [userPosts, setUserPosts] = useState([]);
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [statisticsData, setStatisticsData] = useState({
    currentSession: {
      essaySections: [],
      errorStats: [],
      completenessStats: []
    },
    historical: null
  });

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/users/profile', {
        headers: {
          Authorization: `Bearer ${token}`, // Pass token in Authorization header
        },
      });
      setProfileData(response.data); // Set the profile data in state
      setUsername(response.data.username);
      setEmail(response.data.email);
      setAvatarColor(response.data.avatarColor || 'bg-purple-600'); // Set the avatar color from the response or default
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile');
    }
  };

  // Fetch user's posts count, total likes, and average word count
  const fetchPostsData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/posts/user', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      const sortedPosts = response.data.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
  
      const likesCount = sortedPosts.reduce((acc, post) => 
        acc + (post.likes?.length || 0), 0
      );
  
      const wordCount = sortedPosts.reduce((acc, post) => 
        acc + (post.content ? post.content.split(/\s+/).filter(word => word.length > 0).length : 0), 0
      );
  
      const avgWords = sortedPosts.length > 0 ? 
        Math.round(wordCount / sortedPosts.length) : 0;
  
      setUserPosts(sortedPosts);
      setPostsCount(sortedPosts.length);
      setTotalLikes(likesCount);
      setAvgWordCount(avgWords);
  
      return sortedPosts;
    } catch (err) {
      console.error('Error fetching posts data:', err);
      setError('Failed to load posts data');
    }
  };

  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          fetchProfile(),
          fetchPostsData(),
        ]);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load some data');
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchAllData();
  }, []);

  // Track changes to username, email, or avatarColor
  useEffect(() => {
    if (
      profileData &&
      (username !== profileData.username ||
        email !== profileData.email ||
        avatarColor !== profileData.avatarColor)
    ) {
      setHasChanges(true);
    } else {
      setHasChanges(false);
    }
  }, [username, email, avatarColor, profileData]);

  // Display loading or error messages
  if (!profileData && !error) {
    return <p>Loading profile...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

// In the return statement of Profile component, wrap the adjacent elements properly:

  return (
    <div className="bg-[white] min-h-screen pt-20 pb-5 px-5 flex flex-col items-center">
      <Navbar />
      <div className="w-full max-w-5xl rounded-lg overflow-y-auto p-5">
        <div className="space-y-8">  {/* Added wrapper div with spacing */}
          {/* Profile Section */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="p-8">
              <div className="flex flex-col md:flex-row items-center">
                <div className="flex flex-col md:items-start md:flex-row md:space-x-6 w-full">
                  <div className={`flex-shrink-0 ${avatarColor} w-40 h-40 rounded-full mx-auto md:mx-0`}></div>
                  {isEditing && (
                    <button
                      onClick={handleCustomize}
                      className="w-auto bg-white p-2 rounded-full shadow-md hover:bg-gray-100 mt-4 md:mt-0"
                      aria-label="Customize avatar"
                    >
                      <SettingsIcon className="w-5 h-5 text-gray-600" />
                    </button>
                  )}
                  <div className="mt-6 md:mt-0 md:ml-8 w-full">
                    {isEditing ? (
                      <>
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="bg-gray-50 w-full p-4 border rounded-2xl bg-[#D9D9D9] text-xl mb-4"
                          placeholder={profileData.username}
                        />
                        <div className='flex'>
                          <p className="text-2xl font-semibold">{profileData.email}</p>
                        </div>
                        <Notification
                          message={notification.message}
                          type={notification.type}
                          onClose={() => setNotification({ message: '', type: '' })}
                        />
                      </>
                    ) : (
                      <div className='flex-col mt-10 ml-10'>
                        <div className='flex'>
                          <p className="text-2xl font-semibold mb-4">{profileData?.username}</p>
                        </div>
                        <div className='flex'>
                          <p className="text-2xl font-semibold">{profileData?.email}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-center md:justify-end">
                {isEditing ? (
                  <div className='space-x-2'>
                    <button
                      onClick={handleCancel}
                      className="w-auto px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className={`w-auto px-4 py-2 rounded-xl ${hasChanges ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}
                      disabled={!hasChanges}
                    >
                      Save Changes
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-auto px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700"
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            </div>
          </div>

          
          {/* Posts Section */}
          <div className="mt-8">
            <h3 className="text-2xl font-semibold mb-4">All Posts</h3>
            {userPosts.length > 0 ? (
              <div className="space-y-4">
                {userPosts.map((post) => (
                  <div key={post._id} className="bg-white p-4 rounded-lg shadow">
                    <Link 
                      to={`/posts/${post._id}`} 
                      className="text-xl font-bold text-purple-600 mb-2 block hover:underline"
                    >
                      {post.title}
                    </Link>
                    <p className="text-sm text-gray-600 mb-1">
                      {new Date(post.createdAt).toLocaleString()}
                    </p>
                    <div 
                      className="max-w-2xl mx-auto p-6 text-justify whitespace-pre-wrap leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: post.content }} 
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p>No posts yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
