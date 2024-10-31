import React, { useState, useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import ThumbUpOffAltIcon from '@mui/icons-material/ThumbUpOffAlt';
import ThumbUpAltIcon from '@mui/icons-material/ThumbUpAlt';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import '../assets/css/index.css'
import { formatDistanceToNow } from 'date-fns';

const Post = ({ post }) => {
  const { auth } = useContext(AuthContext);
  const [likes, setLikes] = useState(post.likes.length);
  const [commentsCount, setCommentsCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(post.likes.includes(auth.user.id)); // Check if user already liked the post
  const [avatarColor, setAvatarColor] = useState('bg-purple-600');

  // Fetch user profile data to get avatar color
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get(`/users/${post.userId._id}/profile`, {
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        });
        setAvatarColor(response.data.avatarColor || 'bg-purple-600');
      } catch (error) {
        console.error('Error fetching profile data:', error);
      }
    };

    if (post.userId) {
      fetchProfile();
    }
  }, [post.userId, auth.token]);

  // Calculate total comments and replies count
  useEffect(() => {
    if (post.comments) {
      const totalReplies = post.comments.reduce((acc, comment) => acc + (comment.replies?.length || 0), 0);
      setCommentsCount(post.comments.length + totalReplies);
    }
  }, [post.comments]);

  // // Function to like a post
  const handleLike = async () => {
    try {
      const response = await api.put(`/posts/${post._id}/like`, {}, {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });
      setLikes(response.data.likes);
      setHasLiked(true);
    } catch (err) {
      console.error('Error liking the post:', err);
    }
  };

  // // Function to unlike a post
  const handleUnlike = async () => {
    try {
      const response = await api.put(`/posts/${post._id}/unlike`, {}, {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });
      setLikes(response.data.likes);
      setHasLiked(false);
    } catch (err) {
      console.error('Error unliking the post:', err);
    }
  };
  return (

    <div className='rounded-[10px] bg-[white] shadow-[0_2px_8px_rgba(0,0,0,0.1)] w-[90%] max-w-[800px] mb-5 p-5 ;'>
    <Link to={`/posts/${post._id}`} className='hover:no-underline'>
      <div className="flex items-center mb-[15px]">
        <div className="flex">
          <div className={`${avatarColor} text-[white] font-[bold] w-10 h-10 flex items-center justify-center mr-5 rounded-[50%]`}>
            <span className='font-sans font-bold'>
              {post.userId.username.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex flex-col items-baseline">
            <span className="font-semibold text-black">{post.userId.username}</span>
            <span className="text-[gray] text-[0.85rem]"> • {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
          </div>
        </div>
      </div>
      <h2 className="text-black font-bold text-2xl text-left mt-0 mb-[15px] mx-0">{post.title}</h2>
      <div className="text-base leading-normal text-[#333]">
        <div className="flex mb-2.5">
          {post.postType && <div className="bg-[#9500F0] text-white text-[0.9rem] inline-block px-4 py-1 rounded-[1rem]">{post.postType}</div>}
        </div>
        <div dangerouslySetInnerHTML={{ __html: post.content }} />
      </div>
    </Link>

      <div className="flex justify-between mt-5">
      <span>
        {hasLiked ? (
          <ThumbUpAltIcon onClick={handleUnlike} className="bg-transparent text-base text-[#9500F0] cursor-pointer m-5 border-[none] hover:no-underline"/>
        ) : (
          <ThumbUpOffAltIcon onClick={handleLike} className="bg-transparent text-base text-[#9500F0] cursor-pointer m-5 border-[none] hover:no-underline"/>
        )}
        <span className='font-mono text-lg'>{likes}</span>
        <Link to={`/posts/${post._id}`}><ChatBubbleOutlineIcon className="bg-transparent text-base text-[#9500F0] cursor-pointer m-5 border-[none] hover:no-underline"/></Link>
        <span className='font-mono text-lg'>
          {commentsCount}
        </span>
        </span>
      </div>

    </div>
  );
};

export default Post;
