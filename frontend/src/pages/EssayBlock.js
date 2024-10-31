import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { 
  HomeIcon, 
  ChatAlt2Icon, 
  CheckCircleIcon, 
  EyeIcon, 
  EyeOffIcon,
  PlusIcon 
} from '@heroicons/react/solid';
import WritingAssistant from '../components/WritingAssistant';
import { checkEssayErrors } from '../utils/essayChecker';
import { checkSectionCompleteness, parseThesisPoints, generateBodySections } from '../utils/checkSectionCompleteness';
import CompletionButton from '../components/CompletionButton';
import EssayPreviewModal from '../components/EssayPreviewModal';
import SectionPreview from '../components/SectionPreview';
import { CompletionRequirementsModal } from '../components/CompletionRequirementsModal';





// Update the ERROR_CATEGORIES constant in EssayBlock.js
const ERROR_CATEGORIES = [
  'spelling',
  'punctuation',
  'lexicoSemantic',
  'stylistic',
  'typographical'
];

// Add this loading circle component
const LoadingCircle = () => (
  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const CHECK_COOLDOWN = 30; // 30 seconds cooldown

const ERROR_COLORS = {
  spelling: 'bg-red-200',
  punctuation: 'bg-yellow-200',
  lexicoSemantic: 'bg-orange-200',
  stylistic: 'bg-blue-200',
  typographical: 'bg-green-200'
};

const getCategoryDisplayName = (category) => {
  const displayNames = {
    spelling: 'Spelling',
    punctuation: 'Punctuation',
    lexicoSemantic: 'Meaning & Word Choice',
    stylistic: 'Style',
    typographical: 'Typography'
  };
  return displayNames[category] || category;
};


// SidebarItem component with connecting vertical lines
const SidebarItem = ({ 
  title, 
  progress, 
  isActive, 
  isLast, 
  id, 
  onSelect,
  onDelete,
  setCompletionRequirements,
  setShowRequirementsModal,
  isFirst 
}) => {
  const hasSavedContent = localStorage.getItem(`essayContent_${id}`)?.trim();
  const requirements = JSON.parse(localStorage.getItem(`sectionRequirements_${id}`) || 'null');
  const isBodyParagraph = title.toLowerCase().includes('body paragraph');
  const isConclusion = title.toLowerCase().includes('conclusion');
  
  const getCircleColor = () => {
    if (isActive) return 'bg-purple-600';
    return 'bg-[#F3E8FF]'; // Very light purple for inactive circles
  };

  const getTitleColor = () => {
    if (title.toLowerCase().includes('introduction')) return 'text-purple-600';
    if (title.toLowerCase().includes('conclusion')) return 'text-gray-700';
    if (isBodyParagraph) return 'text-blue-600';
    return 'text-gray-700';
  };
  
  return (
    <div className="relative cursor-pointer group" onClick={() => onSelect && onSelect()}>
      <div className="flex items-center py-2">
        <div className="relative w-12 flex-shrink-0">
          {/* Vertical line above the circle */}
          {!isFirst && (
            <div className="absolute left-[1.375rem] -top-4 bottom-1/2 w-0.5 bg-[#F3E8FF]" />
          )}
          
          {/* Circle */}
          <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
            <div className={`w-6 h-6 rounded-full ${getCircleColor()} 
              transition-colors duration-300
              flex items-center justify-center`}
            >
              <div className="w-3 h-3 rounded-full bg-white opacity-30" />
            </div>
          </div>
          
          {/* Vertical line below the circle */}
          {!isConclusion && (
            <div className="absolute left-[1.375rem] top-1/2 h-8 w-0.5 bg-[#F3E8FF]" />
          )}
        </div>

        {/* Content */}
        <div className="flex-grow flex items-center justify-between">
          <span className={`${getTitleColor()} font-medium`}>
            {title}
            {hasSavedContent && !progress && (
              <span className="ml-2 text-xs text-purple-400">
                (draft{requirements ? ' - incomplete' : ''})
              </span>
            )}
          </span>
          
          {isBodyParagraph && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm('Are you sure you want to delete this body paragraph?')) {
                  onDelete(id);
                }
              }}
              className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 
                hover:text-red-500 rounded-full hover:bg-red-50
                transition-all duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {requirements && !progress && (
        <div className="ml-12 text-xs mt-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCompletionRequirements({
                missing: requirements.missing,
                improvements: requirements.improvements,
                isComplete: false
              });
              setShowRequirementsModal(true);
            }}
            className="w-full text-left bg-red-50 p-2 rounded-md 
              hover:bg-red-100 transition-colors
              border border-red-200"
          >
            <div className="font-medium text-red-800">View Missing Requirements</div>
          </button>
        </div>
      )}
    </div>
  );
};

// Add Body Paragraph Button with vertical connecting lines
const AddBodyParagraphButton = ({ onClick }) => (
  <div className="relative">
    <div className="flex items-center py-2">
      <div className="relative w-12 flex-shrink-0">
        {/* Vertical line above */}
        <div className="absolute left-[1.375rem] -top-4 bottom-1/2 w-0.5 bg-[#F3E8FF]" />
        
        {/* Circle */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
          <div className="w-6 h-6 rounded-full bg-[#F3E8FF] flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-white opacity-30" />
          </div>
        </div>
        
        {/* Vertical line below */}
        <div className="absolute left-[1.375rem] top-1/2 h-8 w-0.5 bg-[#F3E8FF]" />
      </div>

      <button
        onClick={onClick}
        className="flex-grow bg-purple-600 rounded-lg py-3 px-4 
          text-white font-medium
          transform transition-all duration-200
          hover:bg-purple-700
          active:scale-[0.99]
          focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
      >
        <div className="flex items-center justify-center space-x-2">
          <span>Add Body Paragraph</span>
          <PlusIcon className="h-5 w-5" />
        </div>
      </button>
    </div>
  </div>
);

export default function EssayBlock() {
  const { sectionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { section, allSections, essayInfo } = location.state || {};
  const [highlightedContent, setHighlightedContent] = useState('');
  const [essayContent, setEssayContent] = useState('');
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [activeErrorCategory, setActiveErrorCategory] = useState('spelling');
  const [lastCheckTime, setLastCheckTime] = useState(0);
  const [score, setScore] = useState(0);
  const [showErrors, setShowErrors] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [showRequirementsModal, setShowRequirementsModal] = useState(false);
  const [completionRequirements, setCompletionRequirements] = useState(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isRevision] = useState(false);
  const [hasExistingBodyParagraphs, setHasExistingBodyParagraphs] = useState(false);
  const [existingBodyParagraphs, setExistingBodyParagraphs] = useState([]);

  useEffect(() => {
    if (allSections) {
      const bodyParagraphs = allSections.filter(s => 
        s.title.toLowerCase().includes('body paragraph')
      );
      setExistingBodyParagraphs(bodyParagraphs);
    }
  }, [allSections]);
  

  // Remove the duplicate useEffect and keep this single one
  useEffect(() => {
    // Only load content for the current section if we haven't loaded it yet
    const loadSectionContent = () => {
      const savedContent = localStorage.getItem(`essayContent_${sectionId}`);
      if (savedContent) {
        setEssayContent(savedContent);
      } else {
        // Only reset to empty if there's no saved content
        setEssayContent('');
      }
    };

    // Reset UI states but preserve content
    setHighlightedContent('');
    setErrors({});
    setShowErrors(false);
    setHasChecked(false);
    setScore(0);
    
    loadSectionContent();
  }, [sectionId]);

  useEffect(() => {
    if (showErrors && Object.keys(errors).length > 0) {
      const highlighted = createHighlightedText(essayContent, errors);
      setHighlightedContent(highlighted);
    }
  }, [errors, essayContent, showErrors]);

  useEffect(() => {
    if (allSections) {
      const bodyParagraphs = allSections.filter(s => 
        s.title.toLowerCase().includes('body paragraph')
      );
      setHasExistingBodyParagraphs(bodyParagraphs.length > 0);
    }
  }, [allSections]);

  useEffect(() => {
    const autoSaveTimer = setInterval(() => {
      if (sectionId) {
        // Save even if content is empty - this is the key change
        localStorage.setItem(`essayContent_${sectionId}`, essayContent);
      }
    }, 3000); // Auto-save every 3 seconds

    return () => clearInterval(autoSaveTimer);
  }, [essayContent, sectionId]);

  // In EssayBlock.js, modify handleContentChange
  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setEssayContent(newContent);
    
    // Save content
    localStorage.setItem(`essayContent_${sectionId}`, newContent);
    
    // Update section percentage
    const updatedSections = allSections.map(s => {
      if (s.id === sectionId) {
        return {
          ...s,
          percentage: newContent.trim() ? (s.percentage || 50) : 0
        };
      }
      return s;
    });
    
    // Save updated sections
    localStorage.setItem('essaySections', JSON.stringify(updatedSections));
    
    // Update state if location state exists
    if (location.state) {
      location.state.allSections = updatedSections;
    }
  };

  // In EssayBlock.js, modify the handleAddNewBodyParagraph function
  const handleAddNewBodyParagraph = () => {
    const conclusionIndex = allSections.findIndex(s => 
      s.title.toLowerCase().includes('conclusion')
    );
    
    const bodyParagraphs = allSections.filter(s => 
      s.title.toLowerCase().includes('body paragraph')
    );
    
    const newBodySection = {
      id: `body-${Date.now()}`,
      title: `Body Paragraph ${bodyParagraphs.length + 1}`,
      type: 'body',
      percentage: 0
    };
    
    let updatedSections;
    if (conclusionIndex !== -1) {
      updatedSections = [
        ...allSections.slice(0, conclusionIndex),
        newBodySection,
        ...allSections.slice(conclusionIndex)
      ];
    } else {
      updatedSections = [...allSections, newBodySection];
    }
    
    // Save the updated sections to localStorage
    localStorage.setItem('essaySections', JSON.stringify(updatedSections));
    
    setShowRequirementsModal(false);
    navigate(`/essayblock/${newBodySection.id}`, {
      state: {
        section: newBodySection,
        allSections: updatedSections,
        essayInfo
      }
    });
  };

  const handleDeleteBodyParagraph = (paragraphId) => {
    // Filter out the deleted section
    const updatedSections = allSections.filter(s => s.id !== paragraphId);
    
    // Renumber remaining body paragraphs
    const finalSections = updatedSections.map(s => {
      if (s.title.toLowerCase().includes('body paragraph')) {
        const bodyParagraphs = updatedSections.filter(sec => 
          sec.title.toLowerCase().includes('body paragraph')
        );
        const index = bodyParagraphs.findIndex(bp => bp.id === s.id) + 1;
        return {
          ...s,
          title: `Body Paragraph ${index}`
        };
      }
      return s;
    });
  
    // Remove the content and requirements from localStorage
    localStorage.removeItem(`essayContent_${paragraphId}`);
    localStorage.removeItem(`sectionRequirements_${paragraphId}`);
  
    // If the deleted section was the current section, navigate to another section
    if (paragraphId === sectionId) {
      const currentIndex = allSections.findIndex(s => s.id === sectionId);
      const nextSection = finalSections[Math.min(currentIndex, finalSections.length - 1)];
      
      navigate(`/essayblock/${nextSection.id}`, {
        state: {
          section: nextSection,
          allSections: finalSections,
          essayInfo
        }
      });
    } else {
      // Just update the state
      if (location.state) {
        location.state.allSections = finalSections;
      }
      navigate(`/essayblock/${sectionId}`, {
        state: {
          section,
          allSections: finalSections,
          essayInfo
        }
      });
    }
  };  

  const createHighlightedText = (text, errorList) => {
    if (!text || !errorList) return '';
    
    // Add CSS for striped pattern
    const stripeStyles = `
      <style>
        .error-overlap-2 {
          background: repeating-linear-gradient(
            45deg,
            var(--color1),
            var(--color1) 10px,
            var(--color2) 10px,
            var(--color2) 20px
          );
        }
        .error-overlap-3 {
          background: repeating-linear-gradient(
            -45deg,
            var(--color1),
            var(--color1) 8px,
            var(--color2) 8px,
            var(--color2) 16px,
            var(--color3) 16px,
            var(--color3) 24px
          );
        }
      </style>
    `;
  
    // Create an array of all error positions and their metadata
    let errorPositions = [];
    Object.entries(errorList).forEach(([category, errors]) => {
      errors.forEach(error => {
        const textToReplace = error.text;
        let startIndex = 0;
        while (startIndex < text.length) {
          const index = text.indexOf(textToReplace, startIndex);
          if (index === -1) break;
          
          errorPositions.push({
            start: index,
            end: index + textToReplace.length,
            category,
            text: textToReplace,
            message: error.message,
            color: ERROR_COLORS[category]
          });
          startIndex = index + 1;
        }
      });
    });
  
    // Sort positions by start index
    errorPositions.sort((a, b) => a.start - b.start);
  
    // Find overlapping regions
    let result = stripeStyles;
    let currentOverlaps = [];
  
    // Helper function to convert Tailwind color classes to RGB values
    const getColorValues = (colorClass) => {
      const colorMap = {
        'red-200': '254, 202, 202',
        'yellow-200': '255, 255, 0',
        'orange-200': '254, 128, 0',
        'blue-200': '191, 219, 254',
        'green-200': '187, 247, 208'
      };
      return colorMap[colorClass] || '200, 200, 200';
    };

    const processPosition = (pos) => {
      // Get all errors that overlap at this position
      currentOverlaps = errorPositions.filter(error => 
        error.start <= pos && error.end > pos
      );
  
      if (currentOverlaps.length === 0) {
        return text.charAt(pos);
      }
  
      // If this is the start of a new overlap region or a single error
      if (pos === currentOverlaps[0].start) {
        const endPos = Math.min(...currentOverlaps.map(e => e.end));
        const segment = text.slice(pos, endPos);
        
        if (currentOverlaps.length === 1) {
          // Single error
          return `<span class="${currentOverlaps[0].color} rounded px-1" title="${currentOverlaps[0].message}">${segment}</span>`;
        } else {
          // Multiple overlapping errors
          const messages = currentOverlaps.map(e => e.message).join('\n');
          const colors = currentOverlaps.map(e => e.color.replace('bg-', ''));
          
          return `<span class="rounded px-1 error-overlap-${currentOverlaps.length}" 
            style="--color1: rgb(${getColorValues(colors[0])}); 
                   --color2: rgb(${getColorValues(colors[1])}); 
                   ${colors[2] ? `--color3: rgb(${getColorValues(colors[2])});` : ''}"
            title="${messages}">${segment}</span>`;
        }
      }
      return '';
    };
  
    // Build the result string
    for (let i = 0; i < text.length; i++) {
      let processed = processPosition(i);
      if (processed) {
        result += processed;
        // Skip ahead if we just processed a span
        if (processed.includes('span')) {
          i = Math.min(...currentOverlaps.map(e => e.end)) - 1;
        }
      }
    }
  
    return result;
  };

  // Add this function to your EssayBlock component
  // Replace your current handleSectionSelect function with this version
  // Replace your current handleSectionSelect function with this simplified version
  const handleSectionSelect = (selectedSection) => {
    // Save current section's content before navigating, even if empty
    localStorage.setItem(`essayContent_${sectionId}`, essayContent);

    navigate(`/essayblock/${selectedSection.id}`, {
      state: {
        section: selectedSection,
        allSections,
        essayInfo
      }
    });
  };

  const toggleAssistant = () => setIsAssistantOpen(!isAssistantOpen);

  const handleCheck = async () => {
    if (!essayContent.trim()) {
      alert('Please write something before checking for errors.');
      return;
    }
  
    setIsChecking(true);
    try {
      const categorizedErrors = await checkEssayErrors(essayContent);
      setErrors(categorizedErrors);
      setHighlightedContent(createHighlightedText(essayContent, categorizedErrors));
      setShowErrors(true);
      setHasChecked(true);
  
      const firstCategoryWithErrors = ERROR_CATEGORIES.find(
        category => categorizedErrors[category]?.length > 0
      );
      if (firstCategoryWithErrors) {
        setActiveErrorCategory(firstCategoryWithErrors);
      }
  
      const totalErrors = Object.values(categorizedErrors).flat().length;
      const newScore = Math.max(0, score + (10 - totalErrors));
      setScore(newScore);
  
      if (totalErrors === 0) {
        alert('Great job! No errors found in this section. 🎉');
      }
    } catch (error) {
      console.error('Error checking essay:', error);
      alert('Sorry, there was a problem checking your essay. Please try again.');
    } finally {
      setIsChecking(false);
    }
  };


// Update the handleComplete function
const handleComplete = async () => {
  if (!essayContent.trim()) {
    alert('Please write some content before completing this section.');
    return;
  }

  // Save current content before proceeding
  localStorage.setItem(`essayContent_${sectionId}`, essayContent);
  
  setIsCompleting(true);
  try {
    const currentSectionIndex = allSections.findIndex(s => s.id === sectionId);
    const nextSectionIndex = currentSectionIndex + 1;
    const prevSectionId = currentSectionIndex > 0 ? allSections[currentSectionIndex - 1].id : null;
    const previousContent = prevSectionId ? localStorage.getItem(`essayContent_${prevSectionId}`) : null;
    const hasPreviousContent = localStorage.getItem(`essayContent_${sectionId}`)?.trim();

    // Now we can use hasPreviousContent since it's been declared
    const isIntroduction = section?.title.toLowerCase().includes('introduction');
    const isBodyParagraph = section?.title.toLowerCase().includes('body paragraph');
    const isConclusion = section?.title.toLowerCase().includes('conclusion');
    const isRevisionAttempt = hasPreviousContent && isRevision;

    const completenessAnalysis = await checkSectionCompleteness(
      essayContent, 
      section?.title,
      previousContent
    );

    // Initialize updatedSections at the beginning
    let updatedSections = allSections.map(s => 
      s.id === sectionId ? { ...s, percentage: 50 } : s
    );

    // Handle sections based on type and completeness
    if (isBodyParagraph) {
      // Check if there's a next body paragraph
      const nextBodyParagraph = nextSectionIndex < allSections.length && 
        allSections[nextSectionIndex].title.toLowerCase().includes('body paragraph');
      
      const conclusionSection = allSections.find(s => 
        s.title.toLowerCase().includes('conclusion')
      );
    
      if (completenessAnalysis.isComplete) {
        localStorage.removeItem(`sectionRequirements_${sectionId}`);
        
        const updatedSections = allSections.map(s => 
          s.id === sectionId ? { ...s, percentage: 100 } : s
        );
    
        setCompletionRequirements({
          isComplete: true,
          missing: [],
          improvements: [],
          hasBodyParagraphs: hasExistingBodyParagraphs,
          onAddNewBodyParagraph: handleAddNewBodyParagraph,
          onContinue: nextBodyParagraph ? () => {
            setShowRequirementsModal(false);
            navigate(`/essayblock/${updatedSections[nextSectionIndex].id}`, {
              state: {
                section: updatedSections[nextSectionIndex],
                allSections: updatedSections,
                essayInfo
              }
            });
          } : undefined,
          onMoveToConclusion: conclusionSection ? () => {
            setShowRequirementsModal(false);
            navigate(`/essayblock/${conclusionSection.id}`, {
              state: {
                section: conclusionSection,
                allSections: updatedSections,
                essayInfo
              }
            });
          } : undefined
        });
        setShowRequirementsModal(true);
        setIsCompleting(false);
        return;
      }
    
      // Handle incomplete body paragraph
      localStorage.setItem(`sectionRequirements_${sectionId}`, JSON.stringify({
        missing: completenessAnalysis.completionStatus.missing,
        improvements: completenessAnalysis.suggestedImprovements
      }));
      
      setCompletionRequirements({
        missing: completenessAnalysis.completionStatus.missing,
        improvements: completenessAnalysis.suggestedImprovements,
        isComplete: false,
        hasBodyParagraphs: hasExistingBodyParagraphs,
        onAddNewBodyParagraph: handleAddNewBodyParagraph,
        onMoveToConclusion: conclusionSection ? () => {
          setShowRequirementsModal(false);
          navigate(`/essayblock/${conclusionSection.id}`, {
            state: {
              section: conclusionSection,
              allSections: updatedSections,
              essayInfo
            }
          });
        } : undefined,
        onContinue: nextBodyParagraph ? () => {
          setShowRequirementsModal(false);
          navigate(`/essayblock/${updatedSections[nextSectionIndex].id}`, {
            state: {
              section: updatedSections[nextSectionIndex],
              allSections: updatedSections,
              essayInfo
            }
          });
        } : undefined
      });
      setShowRequirementsModal(true);
      setIsCompleting(false);
      return;
    }
    
    if (isConclusion) {
      const updatedSections = allSections.map(s => 
        s.id === sectionId ? { ...s, percentage: completenessAnalysis.isComplete ? 100 : 50 } : s
      );
    
      if (!completenessAnalysis.isComplete) {
        localStorage.setItem(`sectionRequirements_${sectionId}`, JSON.stringify({
          missing: completenessAnalysis.completionStatus.missing,
          improvements: completenessAnalysis.suggestedImprovements
        }));
      }
    
      setCompletionRequirements({
        missing: completenessAnalysis.completionStatus.missing,
        improvements: completenessAnalysis.suggestedImprovements,
        isComplete: completenessAnalysis.isComplete,
        onCompleteEssay: () => {
          setShowRequirementsModal(false);
          navigate('/essayreview', {
            state: {
              allSections: updatedSections,
              essayInfo
            }
          });
        }
      });
      setShowRequirementsModal(true);
      setIsCompleting(false);
      return;
    }

    // Handle introduction
    if (isIntroduction && !completenessAnalysis.isComplete) {
      // Save requirements first
      localStorage.setItem(`sectionRequirements_${sectionId}`, JSON.stringify({
        missing: completenessAnalysis.completionStatus.missing,
        improvements: completenessAnalysis.suggestedImprovements
      }));
    
      setCompletionRequirements({
        missing: completenessAnalysis.completionStatus.missing,
        improvements: completenessAnalysis.suggestedImprovements,
        isRevision: isRevisionAttempt,
        hasBodyParagraphs: hasExistingBodyParagraphs,
        isComplete: false,
        onAddBodyParagraph: () => {
          const conclusionIndex = allSections.findIndex(s => 
            s.title.toLowerCase().includes('conclusion')
          );
        
          const bodyParagraphs = allSections
            .filter(s => s.title.toLowerCase().includes('body paragraph'))
            .sort((a, b) => {
              const numA = parseInt(a.title.match(/\d+/)[0]);
              const numB = parseInt(b.title.match(/\d+/)[0]);
              return numA - numB;
            });
        
          const newBodySection = {
            id: `body-${Date.now()}`,
            title: `Body Paragraph ${bodyParagraphs.length + 1}`,
            type: 'body',
            percentage: 0
          };
        
          let newUpdatedSections;
          if (conclusionIndex !== -1) {
            newUpdatedSections = [
              ...allSections.slice(0, conclusionIndex),
              newBodySection,
              ...allSections.slice(conclusionIndex)
            ];
          } else {
            newUpdatedSections = [...allSections, newBodySection];
          }
        
          setShowRequirementsModal(false);
          navigate(`/essayblock/${newBodySection.id}`, {
            state: {
              section: newBodySection,
              allSections: newUpdatedSections,
              essayInfo
            }
          });
        }
      });
      
      setShowRequirementsModal(true);
      setIsCompleting(false);
      return;
    }

    // Handle complete introduction with existing body paragraphs
    if (isIntroduction && completenessAnalysis.isComplete && existingBodyParagraphs.length > 0) {
      localStorage.removeItem(`sectionRequirements_${sectionId}`);
      const updatedSections = allSections.map(s => 
        s.id === sectionId ? { ...s, percentage: 100 } : s
      );

      setCompletionRequirements({
        isComplete: true,
        hasBodyParagraphs: true,
        onKeepExisting: () => {
          setShowRequirementsModal(false);
          navigate(`/essayblock/${existingBodyParagraphs[0].id}`, {
            state: {
              section: existingBodyParagraphs[0],
              allSections: updatedSections,
              essayInfo
            }
          });
        },
        onRegenerateBodyParagraphs: async () => {
          try {
            const thesisPoints = await parseThesisPoints(essayContent);
            const newBodySections = await generateBodySections(thesisPoints.mainPoints);
            const filteredSections = updatedSections.filter(s => 
              !s.title.toLowerCase().includes('body paragraph')
            );
            const afterIntroIndex = filteredSections.findIndex(s => 
              s.title.toLowerCase().includes('introduction')
            ) + 1;
            const finalSections = [
              ...filteredSections.slice(0, afterIntroIndex),
              ...newBodySections,
              ...filteredSections.slice(afterIntroIndex)
            ];
            setShowRequirementsModal(false);
            navigate(`/essayblock/${newBodySections[0].id}`, {
              state: {
                section: newBodySections[0],
                allSections: finalSections,
                essayInfo
              }
            });
          } catch (error) {
            console.error('Error generating new body sections:', error);
            alert('Failed to generate new body paragraphs. Please try again.');
          }
        }
      });
      setShowRequirementsModal(true);
      setIsCompleting(false);
      return;
    }
  } catch (error) {
    console.error('Error during completion:', error);
    alert('There was an error processing the section. Please try again.');
  } finally {
    setIsCompleting(false);
  }
};

const renderErrorPanel = () => {
  if (!errors[activeErrorCategory]?.length) {
    return (
      <div className="p-4 bg-green-50 rounded-lg">
        <p className="text-green-600">
          Great work! No {activeErrorCategory.toLowerCase()} errors found.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 overflow-y-auto">
      {errors[activeErrorCategory].map((error, index) => (
        <div key={index} className="p-4 bg-white rounded-lg shadow">
          <p className="font-medium text-gray-800">{error.message}</p>
          {error.text && (
            <p className="mt-2 text-red-600 break-words">
              Text: "{error.text}"
            </p>
          )}
          {error.suggestions?.length > 0 && (
            <div className="mt-2">
              <p className="text-sm text-gray-600">Suggestions:</p>
              <ul className="list-disc list-inside">
                {error.suggestions.map((suggestion, idx) => (
                  <li key={idx} className="text-green-600 break-words">{suggestion}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2 text-purple-600 cursor-pointer" onClick={() => navigate('/essaybuilder', { state: { essayInfo } })}>
            <HomeIcon className="h-6 w-6" />
            <span>Return to Essay Builder</span>
          </div>
        </div>
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold">{section?.title}</h2>
        </div>
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold mb-2">Essay Information</h3>
          <p className="text-sm"><strong>Prompt:</strong> {essayInfo?.prompt}</p>
          <p className="text-sm"><strong>Title:</strong> {essayInfo?.title}</p>
          <p className="text-sm"><strong>Post Type:</strong> {essayInfo?.postType}</p>
        </div>
        
        {/* // Update the sidebar section rendering */}
        {/* Update the sidebar section rendering */}
        <div className="p-4 flex-grow overflow-auto">
          <h3 className="font-semibold mb-2">Essay Progress</h3>
          {allSections?.map((s, index) => {
            const isIntroduction = s.title.toLowerCase().includes('introduction');
            
            const isBodyParagraph = s.title.toLowerCase().includes('body paragraph');
            
            return (
              <React.Fragment key={s.id}>
                <SidebarItem 
                  id={s.id}
                  title={s.title} 
                  progress={s.percentage === 100}
                  isActive={s.id === sectionId}
                  isLast={isBodyParagraph || isIntroduction}
                  onSelect={() => handleSectionSelect(s)}
                  onDelete={handleDeleteBodyParagraph}
                  setCompletionRequirements={setCompletionRequirements}
                  setShowRequirementsModal={setShowRequirementsModal}
                />
                {s.percentage === 100 && s.id !== sectionId && (
                  <div className="ml-9 mt-1">
                    <SectionPreview 
                      sectionId={s.id}
                      title={s.title}
                    />
                  </div>
                )}
                
                {/* Add Body Paragraph Button after Introduction or last Body Paragraph */}
                {/* Add Body Paragraph Button after Introduction or last Body Paragraph */}
                {(isIntroduction || isBodyParagraph) && index === allSections.findIndex(sec => sec.title.toLowerCase().includes('conclusion')) - 1 && 
                allSections.filter(sec => sec.title.toLowerCase().includes('body paragraph')).length < 5 && (
                  <div className="relative cursor-pointer group py-2">
                    <div className={`w-6 h-6 rounded-full bg-purple-200 
                      flex items-center justify-center transition-colors
                      hover:bg-purple-500 absolute left-3 top-1/2 transform -translate-y-1/2`}
                    >
                      <div className="w-4 h-4 rounded-full bg-purple-600" style={{ opacity: 0.3 }} />
                    </div>
                    <button
                      onClick={() => {
                        const conclusionIndex = allSections.findIndex(s => 
                          s.title.toLowerCase().includes('conclusion')
                        );
                        
                        const bodyParagraphCount = allSections.filter(s => 
                          s.title.toLowerCase().includes('body paragraph')
                        ).length;

                        const newBodySection = {
                          id: `body-${Date.now()}`,
                          title: `Body Paragraph ${bodyParagraphCount + 1}`,
                          type: 'body',
                          percentage: 0
                        };
                        
                        let updatedSections;
                        if (conclusionIndex !== -1) {
                          updatedSections = [
                            ...allSections.slice(0, conclusionIndex),
                            newBodySection,
                            ...allSections.slice(conclusionIndex)
                          ];
                        } else {
                          updatedSections = [...allSections, newBodySection];
                        }
                        
                        navigate(`/essayblock/${sectionId}`, {
                          state: {
                            section,
                            allSections: updatedSections,
                            essayInfo
                          }
                        });
                      }}
                      className="w-full flex-1 flex items-center space-x-3 bg-white text-purple-600 border-2 border-dashed border-purple-600 rounded-full py-1 pl-12 pr-4 hover:bg-purple-50 transition-colors ml-6 text-sm"
                    >
                      <span className="font-medium">Add Body Paragraph</span>
                      <PlusIcon className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
        
      </div>

      {/* Main content */}
      <div className="flex-grow flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center">
          <h1 className="text-2xl font-semibold">{section?.title}</h1>
          <div className="flex items-center space-x-4">
            <EssayPreviewModal 
              sections={allSections} 
              essayInfo={essayInfo}
            />
            <button 
              className="bg-purple-600 text-white px-4 py-2 rounded-full flex items-center hover:bg-purple-500"
              onClick={toggleAssistant}
            >
              <ChatAlt2Icon className="h-5 w-5 mr-2" />
              WRITING ASSISTANT
            </button>
          </div>
        </header>

        {/* Main content area with fixed height */}
        <div className="flex-grow p-6 overflow-hidden h-[calc(100vh-16rem)]">
          {/* Add fixed height to grid container */}
          <div className="grid grid-cols-12 gap-6 h-[calc(100vh-20rem)]">
            {/* Text editor - add fixed height */}
            <div className={`${hasChecked && showErrors ? 'col-span-5' : 'col-span-12'} bg-white rounded-lg shadow overflow-hidden flex flex-col h-[calc(100vh-20rem)]`}>
              <div className="flex-1 p-4 overflow-hidden">
                <textarea
                  value={essayContent}
                  onChange={handleContentChange}
                  className="w-full h-full resize-none focus:outline-none font-mono overflow-auto"
                  placeholder={`Start writing your essay here...`}
                />
              </div>
              {hasChecked && (
                <div className="h-[120px] px-4 border-t border-gray-200 flex justify-center items-center">
                  <button
                    onClick={() => setShowErrors(!showErrors)}
                    className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500 hover:bg-purple-200 transition-colors"
                  >
                    {showErrors ? (
                      <>
                        <EyeOffIcon className="h-5 w-5 text-white" />
                        <span className="text-white">Hide Corrections</span>
                      </>
                    ) : (
                      <>
                        <EyeIcon className="h-5 w-5 text-white" />
                        <span className="text-white">Show Corrections</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {hasChecked && showErrors && (
              <>
                {/* Highlighted content - add fixed height */}
                <div className="col-span-4 bg-white rounded-lg shadow overflow-hidden flex flex-col h-[calc(100vh-20rem)]">
                  <div className="flex-1 p-4 overflow-auto">
                    <div
                      className="whitespace-pre-wrap font-mono"
                      dangerouslySetInnerHTML={{ __html: highlightedContent }}
                    />
                  </div>
                  <div className="h-[60px] px-4 py-3 border-t border-gray-200 flex items-center">
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(ERROR_COLORS)
                        .filter(([category]) => errors[category]?.length > 0)
                        .map(([category, colorClass]) => (
                          <div key={category} className="flex items-center space-x-1">
                            <span className={`inline-block w-3 h-3 rounded ${colorClass}`}></span>
                            <span className="text-xs text-gray-600">{getCategoryDisplayName(category)}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Error panel - add fixed height */}
                <div className="col-span-3 flex flex-col h-[calc(100vh-20rem)]">
                  {/* Category buttons - fixed height */}
                  <div className="bg-white rounded-lg p-4 shadow mb-4 h-[72px]">
                    <div className="flex space-x-2 overflow-x-auto">
                      {ERROR_CATEGORIES
                        .filter(category => errors[category]?.length > 0)
                        .map(category => (
                          <button
                            key={category}
                            onClick={() => setActiveErrorCategory(category)}
                            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                              activeErrorCategory === category
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-200 text-gray-700'
                            }`}
                          >
                            {getCategoryDisplayName(category)} ({errors[category]?.length})
                          </button>
                        ))}
                    </div>
                  </div>
                  {/* Error list container - calculate remaining height */}
                  <div className="bg-white rounded-lg shadow flex-1 overflow-y-auto">
                    <div className="p-4">
                      {renderErrorPanel()}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 p-3 flex items-center justify-end">
          <div className="flex items-center gap-3 mr-4">
            <button
              onClick={handleCheck}
              className="bg-blue-500 text-white px-12 py-4 rounded-full flex items-center text-lg disabled:opacity-50 hover:bg-blue-600 transition-colors"
              disabled={isChecking}
            >
              {isChecking ? (
                <>
                  <LoadingCircle />
                  <span className="ml-4">Checking...</span>
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-10 w-10 mr-2" />
                  <span>Check Grammar</span>
                </>
              )}
            </button>
            <button
              onClick={handleComplete}
              disabled={isCompleting}
              className="bg-green-500 text-white px-12 py-4 rounded-full flex items-center text-lg disabled:opacity-50 hover:bg-green-600 transition-colors"
            >
              {isCompleting ? (
                <>
                  <LoadingCircle />
                  <span className="ml-4">Completing...</span>
                </>
              ) : (
                <span>Complete</span>
              )}
            </button>
          </div>
        </footer>
        {/* Add this near the bottom of your render, before the WritingAssistant */}
        <CompletionRequirementsModal 
          isOpen={showRequirementsModal}
          onClose={() => setShowRequirementsModal(false)}
          requirements={completionRequirements}
          sectionTitle={section?.title}
        />

        <WritingAssistant 
          isOpen={isAssistantOpen} 
          onClose={toggleAssistant} 
          sectionType={section?.title}
          essayInfo={essayInfo}
          currentContent={essayContent}
        />
      </div>
    </div>
  );
}