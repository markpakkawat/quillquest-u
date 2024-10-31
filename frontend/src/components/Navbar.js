import React, { useState, useEffect, useContext, useRef } from 'react';
import { Link } from 'react-router-dom';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import HomeIcon from '@mui/icons-material/Home';
import EditIcon from '@mui/icons-material/Edit';
import '../assets/css/components/Navbar.css';
import logo from '../assets/images/logo-3.png';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import CloseIcon from '@mui/icons-material/Close';
import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward';

const Navbar = () => {
  const { auth, logout } = useContext(AuthContext);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [avatarColor, setAvatarColor] = useState('bg-purple-600');
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);
  const [error, setError] = useState('');
  const [isCreateHovered, setIsCreateHovered] = useState(false);

  // Toggle dropdown visibility
  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  // Toggle notifications visibility
  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  // Mark notification as read
  const handleMarkAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`, {}, {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });

      // Update the notification list to mark as read
      setNotifications((prevNotifications) =>
        prevNotifications.map((notification) =>
          notification._id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      await api.delete(`/notifications/${notificationId}`, {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });

      // Remove the notification from the list
      setNotifications((prevNotifications) =>
        prevNotifications.filter((notification) => notification._id !== notificationId)
      );
      setError(''); // Clear any previous errors
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await api.get('/notifications', {
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        });
        setNotifications(response.data);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    if (auth.user) {
      fetchNotifications();
    }
  }, [auth.user, auth.token]);

  // Fetch user profile data to get avatar color
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/users/profile', {
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        });
        setAvatarColor(response.data.avatarColor || 'bg-purple-600');
      } catch (error) {
        console.error('Error fetching profile data:', error);
      }
    };

    if (auth.user) {
      fetchProfile();
    }
  }, [auth.user, auth.token]);

  return (
    <nav className="flex justify-between items-center bg-[white] shadow-[0_2px_5px_rgba(0,0,0,0.1)] fixed top-[-5px] z-[1000] px-5 py-[5px] inset-x-0">
      <div className="flex items-center">
        <Link to="/home"><img src={logo} alt="Logo" className="h-[50px] mr-2.5" /></Link>
        <div className="text-3xl text-[#9500F0] font-['Righteous'] hidden sm:block">Quillquest</div>
      </div>

      <div className="flex items-center justify-end w-auto space-x-2">
        <button className="lg:hidden bg-[#D9D9D9] mt-0 text-black px-3 py-2 rounded-md hover:text-white hover:bg-[black]" onClick={toggleDropdown}>
          <Link to="/essayguidance" className=''> Create  <EditIcon /></Link>
        </button>


        <div className="hidden lg:flex items-center ">
          <Link 
            to="/home" 
            className={`bg-[#D9D9D9] pl-3 pr-2 py-2 rounded-l-xl ${isCreateHovered ? 'bg-[#D9D9D9] text-black' : 'bg-[#333] text-white'}`}
          > 
            Home <HomeIcon />
          </Link>
          <Link 
            to="/essayguidance" 
            className='bg-[#D9D9D9] pl-2 pr-3 py-2 hover:bg-[#333] hover:text-[white] rounded-r-xl'
            onMouseEnter={() => setIsCreateHovered(true)}
            onMouseLeave={() => setIsCreateHovered(false)}
          > 
            Create <EditIcon />
          </Link>
        </div>


        <div ref={notificationRef} className="relative">
          <button
            className="bg-transparent text-black cursor-pointer flex items-center justify-center h-10 w-10 m-2 p-0 border-[none]"
            aria-label="Notifications"
            onClick={toggleNotifications}
          >
            {notifications.some((notif) => !notif.isRead) ? (
              <NotificationsActiveIcon fontSize='large' />
            ) : (
              <NotificationsNoneIcon fontSize='large' />
            )}
          </button>
          {showNotifications && (
            <div className="md:50 absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg overflow-hidden z-50 top-16">
              <div className="p-4 border-b">
                <h4 className="text-lg font-semibold">Notifications</h4>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notification, index) => (
                    <div
                      key={index}
                      className={`p-4 cursor-pointer ${notification.isRead ? 'bg-gray-100' : 'bg-white font-bold hover:bg-gray-200'}`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-left self-start" onClick={() => handleMarkAsRead(notification._id)}>{notification.message}</span>
                        <div className="flex flex-col items-center space-y-2">
                          <Link to={`/posts/${notification.postId}?focusComment=${notification.commentId}`} className="bg-blue-500 text-white p-1 rounded-md hover:bg-blue-700">
                            <ArrowOutwardIcon fontSize='small'/>
                          </Link>
                          <button
                            className="bg-red-500 color-black hover:bg-[black] p-0"
                            onClick={() => deleteNotification(notification._id)}
                          >
                            <CloseIcon fontSize='small' />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-gray-500">No new notifications</div>
                )}
              </div>
            </div>
          )}
        </div>

        {auth.user && (
          <div ref={dropdownRef} className="relative">
            <button
              onClick={toggleDropdown}
              className={`${avatarColor} text-white font-bold w-10 h-10 flex items-center justify-center overflow-hidden text-xl rounded-full`}
            >
              {auth.user.username.charAt(0).toUpperCase()}
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-6 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                <Link
                  to="/profile"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={toggleDropdown}
                >
                  <span>Profile</span>
                </Link>
                <button
                  className="block w-full text-center px-4 py-2 mt-0 text-sm text-[white] hover:bg-[black]"
                  onClick={logout}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
