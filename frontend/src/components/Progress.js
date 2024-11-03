const Progress = ({ value = 0, className = "" }) => {
    return (
      <div className={`relative h-2 w-full bg-gray-200 rounded-full overflow-hidden ${className}`}>
        <div
          className="h-full bg-purple-600 transition-all duration-300 ease-in-out"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    );
  };
  
  export default Progress;