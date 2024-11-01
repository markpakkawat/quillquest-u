import React from 'react';

const EmailVerificationInstructions = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-purple-500 p-4">
      <div className="bg-white shadow-md rounded-lg p-6 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-purple-700 mb-4">Verify Your Email</h1>
        <p className="text-gray-700">We have sent a verification link to your email address. Please check your inbox and click the link to verify your email.</p>
      </div>
    </div>
  );
};

export default EmailVerificationInstructions;
