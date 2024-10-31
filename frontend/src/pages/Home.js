import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Navbar from '../components/Navbar';
import Post from '../components/Post.js';
import '../assets/css/index.css';
import logo from '../assets/images/logo-2.png';

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch posts from the backend
  const fetchPosts = async () => {
    try {
      const response = await api.get('/posts');
      const sortedPosts = response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setPosts(sortedPosts);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setLoading(false);
    }
  };

  const getPromptLabel = (daysRemaining) => {
    switch (daysRemaining) {
      case 7:
        return "Prompt of the Day";
      case 6:
        return "Yesterday's Prompt";
      default:
        return `${7 - daysRemaining} days ago`;
    }
  };

  // Fetch prompts from the backend
  const fetchPrompts = async () => {
    try {
      const response = await api.get('/prompts/all');
      const promptsWithDaysRemaining = response.data.map(prompt => {
        const now = new Date();
        const expiresAt = new Date(prompt.expiresAt);
        const daysRemaining = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));
        return { ...prompt, daysRemaining: Math.max(0, daysRemaining) };
      });
      setPrompts(promptsWithDaysRemaining);
    } catch (error) {
      console.error('Error fetching prompts:', error);
    }
  };

  useEffect(() => {
    fetchPosts();
    fetchPrompts();
  }, []);

  return (
    <div className="bg-[#f8f8f8] min-h-screen pt-20 pb-5 px-5">
      <style jsx>{`
        .ios-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .ios-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .ios-scrollbar::-webkit-scrollbar-thumb {
          background: transparent;
          border-radius: 3px;
        }

        .prompt-container:hover .ios-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.2);
        }
      `}</style>
      <Navbar />
      <div className="flex flex-col lg:flex-row gap-5 w-full max-w-6xl mx-auto mt-5">
        {/* Prompts Section */}
        <div className="rounded-lg w-full lg:w-[30%] bg-[#ffffff] p-5 max-h-[80vh] sticky top-24 prompt-container shadow-md">
          <div className="h-full overflow-y-auto ios-scrollbar">
            <ul role="list" className="divide-y divide-gray-200 dark:divide-gray-300">
              {prompts.map((prompt, index) => (
                <li key={index} className="p-4">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <img src={logo} alt="Logo" className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-semibold text-gray-900 text-left">
                        {getPromptLabel(prompt.daysRemaining)}
                      </h3>
                      <p className="text-sm text-gray-700 text-left">
                        {prompt.topic}
                      </p>
                      <div className="mt-1 self-start mr-auto px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-600 text-white">
                        {prompt.daysRemaining} days remaining
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Posts Section */}
        <div className="flex flex-col gap-5 items-center flex-1 w-full">
          {loading ? (
            <p>Loading...</p>
          ) : (
            posts.map((post) => <Post key={post._id} post={post} />)
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;