export const CompletionRequirementsModal = ({ 
  isOpen, 
  onClose, 
  requirements, 
  sectionTitle,
  isRevision = false,
  hasBodyParagraphs = false,
  onAcceptChanges,
  onAddBodyParagraph,
  onCompleteEssay,
  meetsRequirements = false
}) => {
  if (!isOpen || !requirements) return null;

  const isIntroduction = sectionTitle?.toLowerCase().includes('introduction');
  const isBodyParagraph = sectionTitle?.toLowerCase().includes('body paragraph');
  const isConclusion = sectionTitle?.toLowerCase().includes('conclusion');

  const renderButtons = () => {
    const buttons = [];

    // Common "Continue Writing" button for all scenarios
    buttons.push(
      <button
        key="continue-writing"
        onClick={onClose}
        className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
      >
        Continue Writing
      </button>
    );

    if (isRevision) {
      // Revision scenarios
      buttons.push(
        <button
          key="accept-changes"
          onClick={onAcceptChanges}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Accept Changes
        </button>
      );

      if (!hasBodyParagraphs && (isIntroduction || isBodyParagraph)) {
        buttons.push(
          <button
            key="add-body"
            onClick={onAddBodyParagraph}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Add Body Manual Paragraph
          </button>
        );
      }
    } else {
      // Initial writing scenarios
      if (isIntroduction) {
        if (requirements.isComplete) {  // Introduction is complete
          if (!hasBodyParagraphs) {  // No existing body paragraphs
            buttons.push(
              <button
                key="generate-body"
                onClick={requirements.onRegenerateBodyParagraphs}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Generate Body Paragraphs from Thesis
              </button>
            );
          } else {  // Has existing body paragraphs
            buttons.push(
              <button
                key="generate-body"
                onClick={requirements.onRegenerateBodyParagraphs}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Regenerate Paragraphs from New Thesis
              </button>
            );
            buttons.push(
              <button
                key="keep-existing"
                onClick={requirements.onKeepExisting}
                className="px-4 py-2 border-2 border-purple-600 text-purple-600 rounded hover:bg-purple-50"
              >
                Keep Existing Paragraphs
              </button>
            );
          }
        } else {  // Introduction is incomplete
          buttons.push(
            <button
              key="add-body"
              onClick={requirements.onAddBodyParagraph}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Add Manual Body Paragraph
            </button>
          );
        }
      } else if (isBodyParagraph) {
        // For body paragraphs (both complete and incomplete)
        if (requirements.onContinue) {  // Only show if there's a next body paragraph
          buttons.push(
            <button
              key="next-section"
              onClick={requirements.onContinue}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Next Body Paragraph
            </button>
          );
        }
        
        if (requirements.onAddNewBodyParagraph) {  // Only show Add New if the function exists
          buttons.push(
            <button
              key="add-body"
              onClick={requirements.onAddNewBodyParagraph}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Add New Body Paragraph
            </button>
          );
        }
      } else if (isConclusion) {
        if (meetsRequirements) {
          buttons.push(
            <button
              key="complete-essay"
              onClick={onCompleteEssay}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Complete Essay
            </button>
          );
        } else {
          buttons.push(
            <button
              key="complete-essay"
              onClick={requirements.onCompleteEssay}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Complete Essay
            </button>
          );
        }
      }
    }

    return buttons;
};

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">
            {isRevision ? `Revise ${sectionTitle}` : `Complete ${sectionTitle}`}
          </h2>
        </div>
        
        <div className="p-6 space-y-4">
          <p className="text-gray-700">
            {isRevision 
              ? "Review your changes to this section:"
              : requirements.isComplete 
                ? "Section requirements have been met:"
                : "This section has missing requirements:"}
          </p>
          
          <div className={`$'bg-blue-50' p-4 rounded-lg`}>
            <h3 className={`font-medium ${requirements.isComplete ? 'text-green-800' : 'text-red-800'} mb-2`}>
              "Requirements Overview:"
            </h3>
            <ul className="list-disc pl-5 space-y-2">
              {requirements.missing && requirements.missing.map((item, index) => (
                <li key={index} className={requirements.isComplete ? 'text-green-700' : 'text-red-700'}>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Special handling for completed introduction with existing body paragraphs */}
          {isIntroduction && requirements?.isComplete && hasBodyParagraphs && (
            <div className="bg-yellow-50 p-4 rounded-lg mt-4">
              <h3 className="font-medium text-yellow-800 mb-2">Existing Body Paragraphs Found</h3>
              <p className="text-yellow-700 mb-4">
                You have revised your introduction successfully! You have existing body paragraphs. Would you like to:
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={requirements.onKeepExisting}
                  className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Continue with existing body paragraphs
                </button>
                <button
                  onClick={requirements.onRegenerateBodyParagraphs}
                  className="w-full px-4 py-3 border-2 border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
                >
                  Generate new body paragraphs based on revised thesis
                </button>
              </div>
              <p className="text-sm text-yellow-600 mt-2">
                Note: Generating new paragraphs will remove all existing body paragraphs.
              </p>
            </div>
          )}
                    
          {requirements.improvements?.length > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-2">Suggested Improvements:</h3>
              <ul className="list-disc pl-5 space-y-2">
                {requirements.improvements.map((item, index) => (
                  <li key={index} className="text-blue-700">{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
          {renderButtons()}
        </div>
      </div>
    </div>
  );
};