// frontend/src/components/Reply.js

import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import ThumbUpOffAltIcon from '@mui/icons-material/ThumbUpOffAlt';
import ThumbUpAltIcon from '@mui/icons-material/ThumbUpAlt';
import DeleteModal from './DeleteModal';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import '../assets/css/index.css';

const Reply = ({ commentId, onCommentsUpdate, onReplyUpdate }) => {
    const { auth } = useContext(AuthContext);
    const [replies, setReplies] = useState([]);
    const [newReply, setNewReply] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [avatarColors, setAvatarColors] = useState({}); // Store avatar colors for each user
    const [editingReplyId, setEditingReplyId] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [originalContent, setOriginalContent] = useState('');
    const [hasChanges, setHasChanges] = useState(false); // State to track if there are changes
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [replyToDelete, setReplyToDelete] = useState(null);

    // Fetch replies for the specific comment
    useEffect(() => {
        const fetchReplies = async () => {
            try {
                setLoading(true);
                const response = await api.get(`/comments/${commentId}/replies`, {
                    headers: {
                        Authorization: `Bearer ${auth.token}`,
                    },
                });
                setReplies(response.data);
                setLoading(false);
            } catch (err) {
                setError('Error loading replies');
                setLoading(false);
            }
        };

        fetchReplies();
    }, [commentId, auth.token]);

    // Fetch avatar colors for users
    useEffect(() => {
        const fetchAvatarColors = async () => {
            try {
                const userIds = [...new Set(replies.map(reply => reply.userId._id))];
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

        if (replies.length > 0) {
            fetchAvatarColors();
        }
    }, [replies, auth.token]);

    // Function to open delete modal for a reply
    const openDeleteModal = (replyId) => {
        setShowDeleteModal(true);
        setReplyToDelete(replyId);
    };

    // Function to close the delete modal
    const closeDeleteModal = () => {
        setShowDeleteModal(false);
        setReplyToDelete(null);
    };

    // Function to handle deleting a reply
    const handleDeleteReply = async () => {
        try {
            await api.delete(`/replies/${replyToDelete}`, {
                headers: {
                    Authorization: `Bearer ${auth.token}`,
                },
            });
            setReplies((prevReplies) => prevReplies.filter((reply) => reply._id !== replyToDelete));
            onReplyUpdate(); // Update the parent component's reply count
            closeDeleteModal(); // Close the modal after deletion
        } catch (err) {
            setError('Failed to delete reply');
        }
    };

    // Function to handle editing a reply
    const handleEditReply = (replyId, currentContent) => {
        setEditingReplyId(replyId);
        setEditContent(currentContent);
        setOriginalContent(currentContent);
    };

    // Function to submit the edited reply
    const handleEditSubmit = async (e) => {
        e.preventDefault();

        if (!editContent.trim()) {
            setError('Reply cannot be empty');
            return;
        }

        try {
            setLoading(true);
            const response = await api.put(
                `/replies/${editingReplyId}`,
                { content: editContent },
                {
                    headers: {
                        Authorization: `Bearer ${auth.token}`,
                    },
                }
            );
            setReplies((prevReplies) =>
                prevReplies.map((reply) =>
                    reply._id === editingReplyId ? { ...reply, content: response.data.content } : reply
                )
            );
            setEditingReplyId(null); // Reset editing state
            setLoading(false);
        } catch (err) {
            setError('Failed to edit reply');
            setLoading(false);
        }
    };

    // Function to cancel editing a reply
    const handleCancelEdit = () => {
        setEditingReplyId(null);
        setEditContent('');
    };

    // Submit a new reply
    const handleReplySubmit = async (e) => {
        e.preventDefault();

        if (!newReply.trim()) {
            setError('Reply cannot be empty');
            return;
        }

        try {
            setLoading(true);
            const response = await api.post(
                `/comments/${commentId}/replies`,
                { content: newReply, parentCommentId: commentId },
                {
                    headers: {
                        Authorization: `Bearer ${auth.token}`,
                    },
                }
            );

            // Add the new reply with the current user's data to the replies list
            const newReplyData = {
                ...response.data,
                userId: {
                    _id: auth.user.id,
                    username: auth.user.username,
                },
            };
            const updatedReplies = [...replies, newReplyData];
            setReplies(updatedReplies); // Append the new reply to the list
            onReplyUpdate(); // Update the total replies count in the parent component
            setNewReply(''); // Clear the input
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

    // Handle like functionality for replies
    const handleLikeReply = async (replyId) => {
        try {
            const response = await api.put(`/replies/${replyId}/like`, {}, {
                headers: {
                    Authorization: `Bearer ${auth.token}`,
                },
            });
            setReplies((prevReplies) =>
                prevReplies.map((reply) =>
                    reply._id === replyId ? { ...reply, likes: response.data.likes } : reply
                )
            );
        } catch (err) {
            console.error('Error liking the reply:', err);
        }
    };

    const handleUnlikeReply = async (replyId) => {
        try {
            const response = await api.put(`/replies/${replyId}/unlike`, {}, {
                headers: {
                    Authorization: `Bearer ${auth.token}`,
                },
            });
            setReplies((prevReplies) =>
                prevReplies.map((reply) =>
                    reply._id === replyId ? { ...reply, likes: response.data.likes } : reply
                )
            );
        } catch (err) {
            console.error('Error unliking the reply:', err);
        }
    };

    return (
        <div className="reply-section bg-white p-4 shadow-md rounded-lg">
            <h4 className="text-md font-semibold mb-4">Replies</h4>

            {/* Display error if any */}
            {error && <p className="text-red-500">{error}</p>}

            {/* Reply List */}
            <div className="reply-list space-y-4">
                {loading && <p>Loading replies...</p>}
                {replies.length > 0 ? (
                    replies.map((reply) => (
                        <div key={reply._id} className="reply-item p-2 bg-[transparent] rounded-md">
                            <div className='flex mt-0'>
                                <div className={`${avatarColors[reply.userId._id] || 'bg-purple-600'} text-[white] font-[bold] w-10 h-10 flex items-center justify-center mr-5 rounded-[50%]`}>
                                    <span className='font-sans font-bold'>
                                        {reply.userId.username.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div className='flex flex-col items-baseline'>
                                    <p className="font-semibold">{reply.userId?.username}</p>
                                    <p className="text-xs text-gray-500"> • {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}</p>
                                    {editingReplyId === reply._id ? (
                                        <form onSubmit={handleEditSubmit} className="mt-2 mb-5">
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
                                        <p className='my-5'>{reply.content}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center mt-0 ml-5 space-x-5">
                                {reply.likes && reply.likes.includes(auth.user.id) ? (
                                    <ThumbUpAltIcon
                                        onClick={() => handleUnlikeReply(reply._id)}
                                        className="bg-transparent text-base text-[#9500F0] cursor-pointer border-[none] hover:no-underline"
                                    />
                                ) : (
                                    <ThumbUpOffAltIcon
                                        onClick={() => handleLikeReply(reply._id)}
                                        className="bg-transparent text-base text-[#9500F0] cursor-pointer border-[none] hover:no-underline"
                                    />
                                )}
                                <span className='text-lg font-mono'>{reply.likes ? reply.likes.length : 0}</span>
                                {reply.userId._id === auth.user.id && (
                                    <>
                                        <EditIcon
                                            onClick={() => handleEditReply(reply._id, reply.content)}
                                            className="text-blue-500 cursor-pointer mx-5 hover:bg-gray-100 hover:rounded-lg"
                                        />
                                        <DeleteIcon
                                            onClick={() => openDeleteModal(reply._id)}
                                            className="text-red-500 cursor-pointer mx-5 hover:bg-gray-400 hover:rounded-lg"
                                        />
                                    </>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <p>No replies yet. Be the first to reply!</p>
                )}
            </div>

            {/* New Reply Form */}
            <form onSubmit={handleReplySubmit} className="mb-4 mt-4">
                <textarea
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    rows="2"
                    value={newReply}
                    onChange={(e) => setNewReply(e.target.value)}
                    placeholder="Add your reply..."
                />
                <button
                    type="submit"
                    className="w-auto mt-2 px-4 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    disabled={loading}
                >
                    {loading ? 'Posting...' : 'Post Reply'}
                </button>
            </form>

            {/* Delete Modal */}
            {showDeleteModal && (
                <DeleteModal
                    onConfirm={handleDeleteReply}
                    onCancel={closeDeleteModal}
                />
            )}
        </div>
    );
};

export default Reply;
