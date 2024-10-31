// frontend/src/components/Comment.js

import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import Reply from '../components/Reply';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ThumbUpOffAltIcon from '@mui/icons-material/ThumbUpOffAlt';
import ThumbUpAltIcon from '@mui/icons-material/ThumbUpAlt';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import '../assets/css/index.css';
import { formatDistanceToNow } from 'date-fns';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import DeleteModal from '../components/DeleteModal';
import { useLocation } from 'react-router-dom';

const Comment = ({ postId, onCommentsUpdate, onReplyUpdate }) => {
  const { auth } = useContext(AuthContext); // Access auth context for user and token
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showReplies, setShowReplies] = useState({});
  const [avatarColors, setAvatarColors] = useState({}); // Store avatar colors for each user
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [hasChanges, setHasChanges] = useState(false); // State to track if there are changes
  const location = useLocation();


  // Fetch comments for the specific post
  useEffect(() => {
    const fetchComments = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/comments/posts/${postId}/comments`, {
          headers: {
            Authorization: `Bearer ${auth.token}`, // Pass token in Authorization header
          },
        });
        setComments(response.data);
        onCommentsUpdate(response.data); // Update the total comments count in the parent component
        setLoading(false);
      } catch (err) {
        setError('Error loading comments');
        setLoading(false);
      }
    };

    fetchComments();
  }, [postId, auth.token]);

  // Fetch avatar colors for users
  useEffect(() => {
    const fetchAvatarColors = async () => {
      try {
        const userIds = [...new Set(comments.map(comment => comment.userId._id))];
        const colors = {};
        await Promise.all(userIds.map(async (userId) => {
          const response = await api.get(`/users/${userId}/profile`, {
            headers: {
              Authorization: `Bearer ${auth.token}`,
            },
          });
          colors[userId] = response.data.avatarColor || 'bg-purple-600';
        }));
        setAvatarColors(colors);
      } catch (err) {
        console.error('Error fetching avatar colors:', err);
      }
    };

    if (comments.length > 0) {
      fetchAvatarColors();
    }
  }, [comments, auth.token]);

  // Function to open delete modal for a comment
  const openDeleteModal = (commentId) => {
    setShowDeleteModal(true);
    setCommentToDelete(commentId);
  };

  // Function to close the delete modal
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setCommentToDelete(null);
  };

  // Function to handle deleting a comment
  const handleDeleteComment = async () => {
    try {
      await api.delete(`/comments/${commentToDelete}`, {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });

      // Remove the deleted comment from the comments list
      const updatedComments = comments.filter((comment) => comment._id !== commentToDelete);
      setComments(updatedComments);
      onCommentsUpdate(updatedComments); // Update the parent component's comment count
      closeDeleteModal(); // Close the modal after deletion
    } catch (err) {
      setError('Failed to delete the comment');
      console.error('Error deleting the comment:', err);
    }
  };

  // Function to handle editing a comment
  const handleEditComment = (commentId, currentContent) => {
    setEditingCommentId(commentId);
    setEditContent(currentContent);
    setOriginalContent(currentContent);
  };

  // Function to submit the edited comment
  const handleEditSubmit = async (e) => {
    e.preventDefault();

    if (!editContent.trim()) {
      setError('Comment cannot be empty');
      return;
    }

    try {
      setLoading(true);
      const response = await api.put(
        `/comments/${editingCommentId}`,
        { content: editContent },
        {
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        }
      );

      // Update the comment in the comments list
      const updatedComments = comments.map((comment) =>
        comment._id === editingCommentId ? { ...comment, content: response.data.content } : comment
      );
      setComments(updatedComments);
      onCommentsUpdate(updatedComments); // Update the total comments count in the parent component
      setEditingCommentId(null); // Reset editing state
      setLoading(false);
    } catch (err) {
      setError('Failed to edit comment');
      setLoading(false);
    }
  };

  // Function to cancel editing a comment
  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditContent('');
  };

  // Submit a new comment
  const handleCommentSubmit = async (e) => {
    e.preventDefault();

    if (!newComment.trim()) {
      setError('Comment cannot be empty');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post(
        `/comments/posts/${postId}/comments`,
        { content: newComment },
        {
          headers: {
            Authorization: `Bearer ${auth.token}`, // Pass token in Authorization header
          },
        }
      );

      // Add the new comment with the current user's data to the comments list
      const newCommentData = {
        ...response.data,
        userId: {
          _id: auth.user.id,
          username: auth.user.username,
        },
      };

      const updatedComments = [...comments, newCommentData];
      setComments(updatedComments); // Append the new comment to the list
      onCommentsUpdate(updatedComments); // Update the total comments count in the parent component
      setNewComment(''); // Clear the input
      setLoading(false);
    } catch (err) {
      setError('Failed to submit comment');
      setLoading(false);
    }
  };
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const focusCommentId = params.get('focusComment');

    if (focusCommentId) {
      setShowReplies((prev) => ({
        ...prev,
        [focusCommentId]: true,
      }));
    }
  }, [location.search]);
  
  const toggleReplies = (commentId) => {
    setShowReplies((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  // Handle like functionality for comments
  const handleLikeComment = async (commentId) => {
    try {
      const response = await api.put(`/comments/${commentId}/like`, {}, {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });
      setComments((prevComments) =>
        prevComments.map((comment) =>
          comment._id === commentId ? { ...comment, likes: response.data.likes } : comment
        )
      );
    } catch (err) {
      console.error('Error liking the comment:', err);
    }
  };

  const handleUnlikeComment = async (commentId) => {
    try {
      const response = await api.put(`/comments/${commentId}/unlike`, {}, {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });
      setComments((prevComments) =>
        prevComments.map((comment) =>
          comment._id === commentId ? { ...comment, likes: response.data.likes } : comment
        )
      );
    } catch (err) {
      console.error('Error unliking the comment:', err);
    }
  };

  const handleReplySubmit = async (commentId, replyContent) => {
    if (!replyContent.trim()) {
      setError('Reply cannot be empty');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post(
        `/comments/${commentId}/replies`,
        { content: replyContent },
        {
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        }
      );

      setComments((prevComments) => {
        const updatedComments = prevComments.map((comment) => {
          if (comment._id === commentId) {
            return {
              ...comment,
              replies: [...comment.replies, response.data],
            };
          }
          return comment;
        });
        onCommentsUpdate(updatedComments); // Update the total comments count in the parent component
        if (onReplyUpdate) {
          onReplyUpdate();
        }
        return updatedComments;
      });

      setLoading(false);
    } catch (err) {
      setError('Failed to submit reply');
      setLoading(false);
    }
  };

  // Track changes to editContent and originalContent to determine if there are changes
  useEffect(() => {
    if (editContent !== originalContent) {
      setHasChanges(true);
    } else {
      setHasChanges(false);
    }
  }, [editContent, originalContent]);

  return (
    <div className="comment-section bg-white p-4 shadow-lg rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Comments</h3>

      {/* Display error if any */}
      {error && <p className="text-red-500">{error}</p>}
      {/* New Comment Form */}
      <form onSubmit={handleCommentSubmit} className="mb-4">
        <textarea
          className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          rows="3"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add your comment..."
        />
        <button
          type="submit"
          className="w-auto mt-2 px-4 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          disabled={loading}
        >
          {loading ? 'Posting...' : 'Post Comment'}
        </button>
      </form>
      {/* Comment List */}

      <div className="comment-list space-y-4 mb-4">
        {loading && <p>Loading comments...</p>}
        {comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment._id} className="flex flex-col p-2 bg-[transparent] rounded-md hover:bg-gray-50">
              <div className='flex mt-3'>
                <div className={`${avatarColors[comment.userId._id] || 'bg-purple-600'} text-[white] font-[bold] w-10 h-10 flex items-center justify-center mr-5 rounded-[50%]`}>
                  <span className='font-sans font-bold'>
                    {comment.userId.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className='flex flex-col items-baseline'>
                  <p className="font-semibold">{comment.userId?.username}</p>
                  <p className="text-xs text-gray-500"> • {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</p>
                  {editingCommentId === comment._id ? (
                    <form onSubmit={handleEditSubmit} className="mt-2">
                      <textarea
                        className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                        rows="2"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                      />
                      <div className="flex mt-2 space-x-2">
                        <button
                          type="submit"
                          className={`w-auto px-4 py-2 rounded-xl ${hasChanges ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}
                          disabled={loading || !hasChanges}
                        >
                          {loading ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="w-auto px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700"
                          disabled={loading}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <p className='mt-5'>{comment.content}</p>
                  )}
                </div>
              </div>

              <div className="flex mt-5 ml-5 space-x-5">
                <div className='flex space-x-2'>
                  <div className='space-x-2'>
                    {comment.likes.includes(auth.user.id) ? (
                      <ThumbUpAltIcon
                        onClick={() => handleUnlikeComment(comment._id)}
                        className="bg-transparent text-base text-[#9500F0] cursor-pointer border-[none] hover:no-underline"
                      />
                    ) : (
                      <ThumbUpOffAltIcon
                        onClick={() => handleLikeComment(comment._id)}
                        className="bg-transparent text-base text-[#9500F0] cursor-pointer border-[none] hover:no-underline"
                      />
                    )}
                    <span className='text-lg font-mono mt-5 mr-0 p-2'>{comment.likes.length}</span>
                  </div>
                  <div className='flex'>
                    <button
                      className="w-auto h-auto ml-3 p-0 m-0 bg-[transparent] text-black text-sm"
                      onClick={() => toggleReplies(comment._id)}
                    >
                      {showReplies[comment._id] ? (
                        <ExpandLessIcon />
                      ) : (
                        <div className='space-x-2 '>
                          <ChatBubbleOutlineIcon className='bg-transparent text-base text-[#9500F0] cursor-pointer border-[none]' />
                          <span className='text-lg font-mono mt-5 mr-0 p-2'>{comment.replies.length}</span>
                        </div>
                      )}
                      {showReplies[comment._id] ? ' Collapse' : ''}
                    </button>
                  </div>
                </div>


                <div className='flex'>
                  {comment.userId._id === auth.user.id && (
                    <div className='space-x-5'>
                      <EditIcon
                        onClick={() => handleEditComment(comment._id, comment.content)}
                        className="text-blue-500 cursor-pointer hover:bg-gray-100 hover:rounded-lg"
                      />
                      <DeleteIcon
                        onClick={() => openDeleteModal(comment._id)}
                        className="text-red-500 cursor-pointer hover:bg-gray-400 hover:rounded-lg"
                      />
                    </div>
                  )}
                </div>

              </div>

              {showReplies[comment._id] && (
                <div className="flex flex-col">
                  <Reply commentId={comment._id} onCommentsUpdate={setComments} onReplyUpdate={onReplyUpdate} />
                </div>
              )}
            </div>
          ))
        ) : (
          <p>No comments yet. Be the first to comment!</p>
        )}
      </div>
      {/* Delete Modal */}
      {showDeleteModal && (
        <DeleteModal
          onConfirm={handleDeleteComment}
          onCancel={closeDeleteModal}
        />
      )}
    </div>
  );
};

export default Comment;
