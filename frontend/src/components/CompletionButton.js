import React from 'react';
import { FlagIcon } from '@heroicons/react/solid';

const CompletionButton = ({ onClick, isChecking }) => {
  return (
    <button
      onClick={onClick}
      disabled={isChecking}
      className={`
        bg-green-500 text-white px-6 py-2 rounded-full flex items-center
        hover:bg-green-600 transition-colors duration-200
        disabled:bg-green-400 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
      `}
    >
      {isChecking ? (
        <>
          <svg 
            className="animate-spin h-5 w-5 mr-2 text-white" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Checking...</span>
        </>
      ) : (
        <>
          <FlagIcon className="h-5 w-5 mr-2" />
          <span>Complete</span>
        </>
      )}
    </button>
  );
};

export default CompletionButton;