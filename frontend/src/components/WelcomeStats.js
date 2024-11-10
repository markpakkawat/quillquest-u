// src/components/WelcomeStats.jsx
const WelcomeStats = () => {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-sm">
        <h2 className="text-xl font-semibold mb-6">Welcome to QuillQuest!</h2>
        <div className="space-y-6">
          <p className="text-gray-600">
            Track your writing progress and see improvements in:
          </p>
          <ul className="space-y-4">
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-600" />
              <span>Writing clarity and style</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-600" />
              <span>Grammar and error reduction</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-600" />
              <span>Vocabulary improvements</span>
            </li>
          </ul>
          <div className="pt-4">
            <button
              onClick={() => window.location.href = '/essay-builder'}
              className="bg-purple-600 text-white px-6 py-2 rounded-full hover:bg-purple-700 transition-colors"
            >
              Start Your First Essay
            </button>
          </div>
        </div>
      </div>
    );
  };