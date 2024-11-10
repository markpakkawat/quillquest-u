import React, { useState, useEffect } from 'react';
import { PlusIcon, XIcon, HomeIcon,DocumentTextIcon } from '@heroicons/react/solid';
import { useNavigate, useLocation } from 'react-router-dom';

const ProgressCircle = ({ percentage }) => (
  <div className="relative w-8 h-8">
    <svg className="w-full h-full" viewBox="0 0 36 36">
      <circle cx="18" cy="18" r="16" fill="none" className="stroke-current text-purple-200" strokeWidth="2"></circle>
      <circle
        cx="18"
        cy="18"
        r="16"
        fill="none"
        className="stroke-current text-purple-600"
        strokeWidth="2"
        strokeDasharray="100"
        strokeDashoffset={100 - percentage}
        transform="rotate(-90 18 18)"
      ></circle>
    </svg>
    <div className="text-white absolute inset-0 flex items-center justify-center text-xs font-small text-purple-600">
      {percentage}%
    </div>
  </div>
);

const EssaySection = ({ title, percentage, isLast, onClick, onDelete, showDelete }) => {
  const isConclusion = title.toLowerCase().includes('conclusion');

  return (
    <div className="relative">
      <div className="flex items-center mb-4">
        {showDelete && (
          <button
            onClick={onDelete}
            className="w-auto mx-4 bg-red-500 text-white rounded-full p-2 hover:bg-red-300"
            aria-label="Delete paragraph"
          >
            <XIcon className="h-5 w-5" />
          </button>
        )}
        <button
          onClick={onClick}
          className="flex-grow flex items-center justify-between bg-purple-600 text-white 
            rounded-full py-2 px-4 z-10 relative hover:bg-purple-700 transition-colors"
        >
          <span>{title}</span>
          <ProgressCircle percentage={percentage} />
        </button>
        
      </div>
      {/* Only show the vertical line if it's not the conclusion */}
      {!isConclusion && (
        <div className="absolute left-1/2 top-full w-0.5 h-4 bg-purple-600 -translate-x-1/2"></div>
      )}
    </div>
  );
};

export default function EssayBuilder() {
  const navigate = useNavigate();
  const location = useLocation();

  const [sections, setSections] = useState(() => {
    // First check if we have sections in location state
    if (location.state?.allSections) {
      const stateSections = location.state.allSections;
      // Update percentages based on content
      return stateSections.map(section => {
        const content = localStorage.getItem(`essayContent_${section.id}`);
        const percentage = content?.trim() ? (section.percentage || 50) : 0;
        return {
          ...section,
          percentage
        };
      });
    }
    
    // Then check localStorage
    const savedSections = localStorage.getItem('essaySections');
    if (savedSections) {
      // When loading from localStorage, we need to also check content existence
      const parsedSections = JSON.parse(savedSections);
      return parsedSections.map(section => {
        const content = localStorage.getItem(`essayContent_${section.id}`);
        const percentage = content?.trim() ? (section.percentage || 50) : 0;
        return {
          ...section,
          percentage
        };
      });
    }
    
    // If we're starting fresh (no state and no localStorage)
    if (!location.state?.essayInfo) {
      // Clear everything for a fresh start
      localStorage.removeItem('essaySections');
      localStorage.removeItem('essayInfo');
      
      // Clear any other essay-related data
      for (let key of Object.keys(localStorage)) {
        if (key.startsWith('essayContent_') || 
            key.startsWith('sectionRequirements_') ||
            key.startsWith('essay_') ||
            key.includes('section')) {
          localStorage.removeItem(key);
        }
      }
    }

    // Return default sections for a new essay
    return [
      { id: 'intro', title: 'Introduction', percentage: 0 },
      { id: 'conclusion', title: 'Conclusion', percentage: 0 },
    ];
  });

  const [essayInfo, setEssayInfo] = useState(() => {
    // First check location state
    if (location.state?.essayInfo) {
      return location.state.essayInfo;
    }
    
    // Then check localStorage
    const savedEssayInfo = localStorage.getItem('essayInfo');
    if (savedEssayInfo) {
      return JSON.parse(savedEssayInfo);
    }
    
    // Default empty state
    return { prompt: '', title: '', postType: '' };
  });

  // Save sections to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('essaySections', JSON.stringify(sections));
  }, [sections]);

  // Save essay info to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('essayInfo', JSON.stringify(essayInfo));
  }, [essayInfo]);

  // Keep sections updated with latest content status
  useEffect(() => {
    const timer = setInterval(() => {
      setSections(prevSections => {
        const updatedSections = prevSections.map(section => {
          const content = localStorage.getItem(`essayContent_${section.id}`);
          const percentage = content?.trim() ? (section.percentage || 50) : 0;
          return {
            ...section,
            percentage
          };
        });
        
        // Only update state if there are actual changes
        if (JSON.stringify(updatedSections) !== JSON.stringify(prevSections)) {
          return updatedSections;
        }
        return prevSections;
      });
    }, 1000); // Check every second

    return () => clearInterval(timer);
  }, []);

  const addSection = () => {
    const newSection = { 
      id: `body-${Date.now()}`, 
      title: `Body Paragraph ${sections.filter(s => 
        s.title.toLowerCase().includes('body paragraph')
      ).length + 1}`, 
      percentage: 0,
      type: 'body'
    };
    
    // Find the conclusion section index
    const conclusionIndex = sections.findIndex(s => 
      s.title.toLowerCase().includes('conclusion')
    );
    
    // Insert the new section before the conclusion
    const updatedSections = [
      ...sections.slice(0, conclusionIndex),
      newSection,
      ...sections.slice(conclusionIndex)
    ];
    
    setSections(updatedSections);
    localStorage.setItem('essaySections', JSON.stringify(updatedSections));
  };

  const deleteSection = (index) => {
    const sectionToDelete = sections[index];
    
    // Remove content and requirements for the deleted section
    localStorage.removeItem(`essayContent_${sectionToDelete.id}`);
    localStorage.removeItem(`sectionRequirements_${sectionToDelete.id}`);
    
    // Update sections array
    const newSections = sections.filter((_, i) => i !== index).map((section, i) => {
      if (section.title.toLowerCase().includes('body paragraph')) {
        return {
          ...section,
          title: `Body Paragraph ${i - 1}` // -1 because Introduction is first
        };
      }
      return section;
    });
    
    setSections(newSections);
    localStorage.setItem('essaySections', JSON.stringify(newSections));
  };

  const handleSectionClick = (index) => {
    navigate(`/essayblock/${sections[index].id}`, { 
      state: { 
        section: sections[index], 
        allSections: sections,
        sectionIndex: index,
        essayInfo
      } 
    });
  };

  const handleNextClick = () => {
    navigate('/essayreview', {
      state: {
        allSections: sections,
        essayInfo
      }
    });
  };

  const handleCancel = () => {
    // Clear ALL section-related localStorage items
    sections.forEach(section => {
      localStorage.removeItem(`essayContent_${section.id}`);
      localStorage.removeItem(`sectionRequirements_${section.id}`);
    });
    
    // Clear essay data
    localStorage.removeItem('essaySections');
    localStorage.removeItem('essayInfo');
    
    // Clear any other potential essay-related items
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith('essay') || 
        key.startsWith('section') || 
        key.includes('Requirements') ||
        key.includes('Analysis')
      )) {
        localStorage.removeItem(key);
      }
    }
    
    navigate('/essayguidance');
  };

  return (
    <div className="space-y-2 min-h-screen flex flex-col items-center justify-center bg-purple-600 p-4">
      <div>
      <button
            onClick={handleCancel}
            className="bg-red-400 text-white w-[24rem] py-1 rounded-full hover:bg-red-600 
              transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 
              focus:ring-opacity-50 mt-0"
          >
            Back
          </button>
      </div>
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h1 className="text-2xl font-bold text-purple-600 mb-6">Essay Builder</h1>
        
        {/* Display essay info */}
        <div className="mb-4 text-sm bg-gray-100 p-3 rounded-md">
          <p><strong>Prompt:</strong> {essayInfo.prompt}</p>
          <p><strong>Title:</strong> {essayInfo.title}</p>
          <p><strong>Post Type:</strong> {essayInfo.postType}</p>
        </div>

        {/* Section list */}
        <div className="space-y-4">
          {sections.map((section, index) => {
            const isBodyParagraph = section.title.toLowerCase().includes('body paragraph');
            const isIntroduction = section.title.toLowerCase().includes('introduction');
            const isConclusion = section.title.toLowerCase().includes('conclusion');
            
            return (
              <React.Fragment key={section.id}>
                <EssaySection 
                  title={section.title} 
                  percentage={section.percentage}
                  onClick={() => handleSectionClick(index)}
                  onDelete={() => isBodyParagraph ? deleteSection(index) : null}
                  showDelete={isBodyParagraph}
                />
                
                {/* Add Body Paragraph button after Introduction or last Body Paragraph,
                    but only if we're not at the conclusion */}
                {!isConclusion && 
                 sections.filter(s => s.title.toLowerCase().includes('body paragraph')).length < 5 && 
                 ((isIntroduction && !sections.some(s => s.title.toLowerCase().includes('body paragraph'))) ||
                 (isBodyParagraph && sections[index + 1]?.title.toLowerCase().includes('conclusion'))) && (
                  <div className="relative">
                    <button
                      onClick={addSection}
                      className="w-full bg-white text-purple-600 border-2 border-dashed 
                        border-purple-600 rounded-full py-2 px-4 font-medium 
                        hover:bg-purple-100 transition-colors mb-4 flex items-center 
                        justify-center focus:outline-none focus:ring-2 focus:ring-purple-500 
                        focus:ring-opacity-50"
                    >
                      <PlusIcon className="w-5 h-5 mr-2" />
                      Add Body Paragraph
                    </button>
                    <div className="absolute left-1/2 top-full w-0.5 h-4 bg-purple-600 -translate-x-1/2" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Footer buttons */}
        <div className="flex justify-center mt-6">
          <button 
            onClick={handleNextClick}
            className="bg-purple-600 text-white w-auto px-8 py-2 rounded-full hover:bg-purple-700 
              transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 
              focus:ring-opacity-50"
          >
            Review
          </button>
        </div>
        
      </div>
    </div>
  );
}