import React, { useState } from 'react';

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        {children}
      </div>
    </div>
  );
};

const EssayPreviewModal = ({ sections, essayInfo }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('preview');

  const getSectionContent = (sectionId) => {
    return localStorage.getItem(`essayContent_${sectionId}`) || '';
  };

  const getCompletedSections = () => {
    // Return all sections that have content, regardless of completion percentage
    return sections?.filter(section => {
      const content = localStorage.getItem(`essayContent_${section.id}`);
      return content && content.trim().length > 0;
    }) || [];
  };

  const handleDownload = () => {
    const completedSections = getCompletedSections();
    const content = completedSections
      .map(section => `${section.title}\n\n${getSectionContent(section.id)}`)
      .join('\n\n---\n\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${essayInfo?.title || 'essay'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-purple-500"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        View Full Essay
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold">Full Essay Preview</h2>
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              className="px-3 py-1 text-sm rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100"
            >
              Download
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white bg-red-500 hover:bg-black"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-col items-center py-2 border-b">
          <div className="flex gap-4">
            {['preview', 'outline'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-auto px-4 py-2 border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'bg-gray-500 cursor-default border-blue-500 text-white-600'
                    : 'border-transparent text-white-500 hover:bg-purple-500'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'preview' ? (
            <div className="space-y-8">
              {/* Essay Info */}
              <div className="prose max-w-none">
                <h1 className="text-2xl font-bold">{essayInfo?.title}</h1>
                <div className="text-gray-600">
                  <p><strong>Prompt:</strong> {essayInfo?.prompt}</p>
                  <p><strong>Type:</strong> {essayInfo?.postType}</p>
                </div>
              </div>

              {/* Essay Content */}
              {getCompletedSections().map((section) => (
                <div key={section.id} className="mb-8">
                  <h2 className="text-xl font-semibold mb-4">{section.title}</h2>
                  <div className="whitespace-pre-wrap font-serif">
                    {getSectionContent(section.id)}
                  </div>
                </div>
              ))}

              {/* Word Count */}
              <div className="text-sm text-gray-500 text-right">
                Word Count: {getCompletedSections()
                  .map(section => getSectionContent(section.id)
                    .trim()
                    .split(/\s+/)
                    .length)
                  .reduce((a, b) => a + b, 0)}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {getCompletedSections().map((section) => (
                <div key={section.id} className="border-l-2 border-purple-200 pl-4">
                  <h3 className="font-semibold">{section.title}</h3>
                  <p className="text-sm text-gray-600">
                    {getSectionContent(section.id).slice(0, 150)}...
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};

export default EssayPreviewModal;