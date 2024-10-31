import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api'; // Ensure this is the correct API service you're using
import Comment from '../components/Comment';
import Reply from '../components/Reply';
import { AuthContext } from '../context/AuthContext';
import ThumbUpOffAltIcon from '@mui/icons-material/ThumbUpOffAlt';
import ThumbUpAltIcon from '@mui/icons-material/ThumbUpAlt';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import '../assets/css/index.css';
import Navbar from '../components/Navbar';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import DeleteModal from '../components/DeleteModal';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

const PostDetail = () => {
  const { id } = useParams(); // Get the post ID from the URL parameter
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // To handle errors
  const { auth } = useContext(AuthContext);
  const [likes, setLikes] = useState(0); // Check post's liked
  const [hasLiked, setHasLiked] = useState(false); // Check if user already liked the post
  const [comments, setComments] = useState(0);
  const [showReplies, setShowReplies] = useState({});
  const [avatarColor, setAvatarColor] = useState('bg-purple-600');
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false); // Modal visibility state

  // Function to like a post
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

  // Function to unlike a post
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

  // Function to fetch the post details from the backend
  const fetchPost = async () => {
    try {
      const response = await api.get(`/posts/${id}`); // Fetch post by ID
      setPost(response.data); // Store the post data in state
      setLikes(response.data.likes.length); // Set initial number of likes
      setHasLiked(response.data.likes.includes(auth.user.id)); // Check if the current user has liked the post
      // Calculate total number of comments and replies
      const totalCommentsAndReplies = response.data.comments.length + response.data.comments.reduce((acc, comment) => {
        return acc + (comment.replies ? comment.replies.length : 0);
      }, 0);
      setComments(totalCommentsAndReplies);
      setEditedTitle(response.data.title);
      setEditedContent(response.data.content);
      setLoading(false); // Set loading to false once data is loaded

      // Fetch user avatar color
      const userProfileResponse = await api.get(`/users/${response.data.userId._id}/profile`, {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });
      setAvatarColor(userProfileResponse.data.avatarColor || 'bg-purple-600');
    } catch (error) {
      console.error('Error fetching post:', error);
      setError('Failed to load the post');
      setLoading(false); // Set loading to false in case of an error
    }
  };

  // UseEffect to run the fetch function when the component is mounted or when the ID changes
  useEffect(() => {
    fetchPost();
  }, [id]);

  // Function to update comments count when a new comment or reply is added
  const updateCommentsCount = (newComments) => {
    const totalCommentsAndReplies = newComments.length + newComments.reduce((acc, comment) => {
      return acc + (comment.replies ? comment.replies.length : 0);
    }, 0);
    setComments(totalCommentsAndReplies);
  };

  // Function to handle reply submission and update the count without refreshing
  const handleReplyUpdate = () => {
    fetchPost();
  };

  // Function to handle post editing
  const handleEdit = () => {
    setIsEditing(true);
  };

  // Function to save the edited post
  const handleSaveEdit = async () => {
    try {
      const token = localStorage.getItem('token');
      await api.put(
        `/posts/${id}`,
        {
          title: editedTitle,
          content: editedContent,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setPost({ ...post, title: editedTitle, content: editedContent });
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving post:', err);
      setError('Failed to save the post');
    }
  };

  // Function to cancel editing
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedTitle(post.title);
    setEditedContent(post.content);
  };

 // Function to handle post deletion
 const handleDelete = async () => {
  try {
    const token = localStorage.getItem('token');
    await api.delete(`/posts/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    navigate('/home'); // Redirect to home after successful deletion
  } catch (err) {
    console.error('Error deleting post:', err);
    setError('Failed to delete the post');
  }
};

// Function to open delete modal
const handleOpenDeleteModal = () => {
  setShowDeleteModal(true);
};

// Function to close delete modal
const handleCloseDeleteModal = () => {
  setShowDeleteModal(false);
};

  // Loading state
  if (loading) {
    return <p>Loading post...</p>;
  }

  // Error handling
  if (error) {
    return <p>{error}</p>;
  }

  // If post is not found or undefined
  if (!post) {
    return <p>Post not found.</p>;
  }

  // Display the post details
  return (
    <div className="bg-[white] min-h-screen pt-20 pb-5 px-5">
      <Navbar />
      <div className="w-full max-w-5xl mx-auto mt-5">
        <Link to="/home" className="block text-purple-600 mb-5">← Back to Home</Link>
        <div className="bg-white p-5 rounded-lg">
          <div className='flex items-center mb-5'>
            <div className={`${avatarColor} text-white font-bold w-10 h-10 flex items-center justify-center overflow-hidden text-xl rounded-full mr-5`}>
              {post.userId.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <div className='flex'>
                <span className='font-semibold text-black'>{post.userId?.username || 'Unknown'}</span>
              </div>
              <span className='text-gray-500 text-sm'>Posted on: {new Date(post.createdAt).toLocaleString()}</span>
            </div>
          </div>
          {isEditing ? (
            <div className="flex flex-col mb-5">
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="bg-white w-full p-2 border rounded-md mb-4"
              />
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full h-full p-2 border rounded-md"
                rows="20"
              />
              <div className="flex space-x-2 mt-0 justify-end">
                <button
                  onClick={handleSaveEdit}
                  className="w-auto px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                  Save Changes
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="w-auto px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className='flex'>
                <h2 className="text-black font-bold text-2xl mb-4">{post.title}</h2>
              </div>
              <div className="flex mb-4">
                {post.postType && <div className="bg-[#9500F0] text-white text-sm inline-block px-4 py-1 rounded-full">{post.postType}</div>}
              </div>
              <div className="max-w-2xl mx-auto p-6 text-justify whitespace-pre-wrap leading-relaxed" dangerouslySetInnerHTML={{ __html: post.content }} />
            </>
          )}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center">
              {hasLiked ? (
                <ThumbUpAltIcon onClick={handleUnlike} className="text-[#9500F0] cursor-pointer mr-3" />
              ) : (
                <ThumbUpOffAltIcon onClick={handleLike} className="text-[#9500F0] cursor-pointer mr-3" />
              )}
              <span className="mr-5 font-mono">{likes}</span>
              <ChatBubbleOutlineIcon className="text-[#9500F0] cursor-pointer mr-3" />
              <span className='mr-5 font-mono'>{comments}</span>
            </div>
            {!isEditing && auth.user.id === post.userId._id && (
              <div className='flex items-center'>
                <button onClick={handleEdit} 
                className='mr-5 h-[50px] text-md w-auto mt-0 px-2 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700'>
                Edit
              </button>
              <button 
              onClick={handleOpenDeleteModal}
              className='h-[50px] text-md w-auto mt-0 px-2 py-2 bg-red-400 text-white rounded-md hover:bg-black'>
                <DeleteOutlineIcon/>
              </button>
              </div>
              
            )}
          </div>
          <hr className="my-5" />
          {/* Comments Section */}
          <Comment postId={post._id} onCommentsUpdate={updateCommentsCount} onReplyUpdate={handleReplyUpdate} />
        </div>
        {/* Show Delete Modal if needed */}
      {showDeleteModal && (
        <DeleteModal
          onConfirm={handleDelete}
          onCancel={handleCloseDeleteModal}
        />
      )}
      </div>
    </div>
  );
};

export default PostDetail;
