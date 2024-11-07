import React, { useState, useEffect } from 'react';
import '../assets/css/index.css';
import Navbar from '../components/Navbar';
import api from '../services/api';
import SettingsIcon from '@mui/icons-material/Settings';
import { Link } from 'react-router-dom';
import UserStatistics from '../components/UserStatistics';

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
  const [statisticsData, setStatisticsData] = useState({
    currentSession: {
      essaySections: [],
      errorStats: [],
      completenessStats: []
    },
    historical: null
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchStatistics = async () => {
    try {
      const essaySections = JSON.parse(localStorage.getItem('essaySections') || '[]');
      const errorStats = JSON.parse(localStorage.getItem('errorStats') || '[]');
      const completenessStats = JSON.parse(localStorage.getItem('completenessStats') || '[]');

      const token = localStorage.getItem('token');
      const response = await api.get('/users/writing-stats', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setStatisticsData({
        currentSession: {
          essaySections,
          errorStats,
          completenessStats
        },
        historical: response.data
      });
    } catch (error) {
      console.error('Error fetching statistics:', error);
      setStatisticsData({
        currentSession: {
          essaySections: [],
          errorStats: [],
          completenessStats: []
        },
        historical: null
      });
    }
  };

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/users/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setProfileData(response.data);
      setUsername(response.data.username);
      setEmail(response.data.email);
      setAvatarColor(response.data.avatarColor || 'bg-purple-600');
    } catch (err) {
      console.error('Error fetching profile:', err);
      throw err;
    }
  };

  const fetchPostsData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/posts/user', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      let userPosts = response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setUserPosts(userPosts);
      setPostsCount(userPosts.length);

      const totalLikesCount = userPosts.reduce((acc, post) => acc + (post.likes ? post.likes.length : 0), 0);
      setTotalLikes(totalLikesCount);

      const totalWords = userPosts.reduce((acc, post) => acc + (post.content ? post.content.split(' ').length : 0), 0);
      const averageWordCount = userPosts.length > 0 ? Math.round(totalWords / userPosts.length) : 0;
      setAvgWordCount(averageWordCount);
    } catch (err) {
      console.error('Error fetching posts data:', err);
      throw err;
    }
  };

  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          fetchProfile(),
          fetchPostsData(),
          fetchStatistics()
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

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.put(
        '/users/profile',
        {
          username: username || profileData.username,
          email: email || profileData.email,
          avatarColor,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setProfileData(response.data);
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Failed to save profile');
    }
  };

  const handleCancel = () => {
    setUsername(profileData.username);
    setEmail(profileData.email);
    setAvatarColor(profileData.avatarColor || 'bg-purple-600');
    setIsEditing(false);
  };

  const handleCustomize = () => {
    const colors = ['bg-purple-600', 'bg-blue-600', 'bg-green-600', 'bg-red-600', 'bg-yellow-600'];
    const currentIndex = colors.indexOf(avatarColor);
    const nextIndex = (currentIndex + 1) % colors.length;
    setAvatarColor(colors[nextIndex]);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  if (error) {
    return <p className="text-center text-red-500 mt-8">{error}</p>;
  }

  return (
    <div className="bg-[white] min-h-screen pt-20 pb-5 px-5 flex flex-col items-center">
      <Navbar />
      <div className="w-full max-w-5xl rounded-lg overflow-y-auto p-5">
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
                        className="w-full p-4 border rounded-2xl bg-[#D9D9D9] text-xl mb-4"
                        placeholder={profileData.username}
                      />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-4 border rounded-2xl bg-[#D9D9D9] text-xl"
                        placeholder={profileData.email}
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
        
        <UserStatistics 
          statistics={statisticsData}
          postsCount={postsCount}
          avgWordCount={avgWordCount}
          loading={isLoading}
        />
        
        <div className="mt-8">
          <h3 className="text-2xl font-semibold mb-4">All Posts</h3>
          {userPosts.length > 0 ? (
            <div className="space-y-4">
              {userPosts.map((post) => (
                <div key={post._id} className="bg-white p-4 rounded-lg shadow">
                  <Link to={`/posts/${post._id}`} className="text-xl font-bold text-purple-600 mb-2 block hover:underline">
                    {post.title}
                  </Link>
                  <p className="text-sm text-gray-600 mb-1">{new Date(post.createdAt).toLocaleString()}</p>
                  <div className="max-w-2xl mx-auto p-6 text-justify whitespace-pre-wrap leading-relaxed" dangerouslySetInnerHTML={{ __html: post.content }} />
                </div>
              ))}
            </div>
          ) : (
            <p>No posts yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;