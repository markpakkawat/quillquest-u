import React, { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import TextEditor from '../components/TextEditor';
import '../assets/css/index.css';
import { ChatGroq } from "@langchain/groq";
import api from '../services/api';
import Draggable from 'react-draggable';

const CreatePost = () => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [apiKeyError, setApiKeyError] = useState(false);
  const [editorContent, setEditorContent] = useState('');
  const [title, setTitle] = useState('');
  const editorContainerRef = useRef(null);
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [postType, setPostType] = useState('discussion');


  // Remove this line if you're not using editorWidth
  const [editorWidth] = useState('100%');

  const [argumentSuggestion, setArgumentSuggestion] = useState('');
  const [sentenceSuggestion, setSentenceSuggestion] = useState('');
  const [showArgumentPopup, setShowArgumentPopup] = useState(false);
  const [showSentencePopup, setShowSentencePopup] = useState(false);

  const [errors, setErrors] = useState([]);
  const [isChecking, setIsChecking] = useState(false);
  const editorRef = useRef(null);

  const [prompts, setPrompts] = useState([]);

  const [showStatistics, setShowStatistics] = useState(false);

  const calculateTextStatistics = (text, errorCount) => {
    // Helper function to count syllables in a word
    const countSyllables = (word) => {
        word = word.toLowerCase();
        if (word.length <= 3) return 1; // Words of length <= 3 usually have one syllable
        word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, ''); // Remove silent 'e'
        word = word.replace(/^y/, ''); // Remove starting 'y'
        const syllableMatches = word.match(/[aeiouy]{1,2}/g); // Count vowel groups
        return syllableMatches ? syllableMatches.length : 1;
    };
    
    // Remove HTML tags and trim the text
    const cleanText = text.replace(/<[^>]*>/g, '').trim();
    
    const characters = cleanText.length;
    const wordsArray = cleanText.split(/\s+/).filter(word => word.length > 0);
    const words = wordsArray.length;
    const sentences = cleanText.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0).length;
    
    const averageWordLength = words > 0 ? (characters / words) : 0;
    const averageSentenceLength = sentences > 0 ? (words / sentences) : 0;

    // Count total syllables
    const syllables = wordsArray.reduce((total, word) => total + countSyllables(word), 0);
    
    // Flesch-Kincaid Grade Level calculation
    const gradeLevel = sentences > 0 && words > 0
      ? 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59
      : 0;
    
    // Interpret the grade level
    let readabilityLevel;
    if (gradeLevel <= 5) readabilityLevel = "5th grade (Very easy to read)";
    else if (gradeLevel <= 8) readabilityLevel = "8th grade (Easy to read)";
    else if (gradeLevel <= 12) readabilityLevel = "12th grade (Fairly difficult to read)";
    else if (gradeLevel <= 16) readabilityLevel = "College level (Difficult to read)";
    else readabilityLevel = "Graduate level (Very difficult to read)";
  
    return {
      characters,
      words,
      sentences,
      averageWordLength: averageWordLength.toFixed(1),
      averageSentenceLength: averageSentenceLength.toFixed(1),
      syllables,
      gradeLevel: gradeLevel.toFixed(1),
      readabilityLevel,
      errorCount: errorCount || 0
    };
};

  
  const [textStatistics, setTextStatistics] = useState(calculateTextStatistics(''));

  useEffect(() => {
    setTextStatistics(calculateTextStatistics(editorContent, errors.length));
  }, [editorContent, errors]);
  

  const toggleStatistics = () => {
    setShowStatistics(!showStatistics);
  };

  const TextStatistics = ({ statistics }) => (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-bold mb-2">Text Statistics</h3>
      <p>Characters: {statistics.characters}</p>
      <p>Words: {statistics.words}</p>
      <p>Sentences: {statistics.sentences}</p>
      <p>Average Word Length: {statistics.averageWordLength} characters</p>
      <p>Average Sentence Length: {statistics.averageSentenceLength} words</p>
      <p>Readability: Grade {statistics.gradeLevel} ({statistics.readabilityLevel})</p>
      <p>Errors Found: {statistics.errorCount}</p>
    </div>
  );

  useEffect(() => {
    if (prompts.length === 0) {
      const fetchPrompts = async () => {
        try {
          const response = await api.get('/prompts/all');
          setPrompts(response.data);
        } catch (error) {
          console.error('Error fetching prompts:', error);
        }
      };
      fetchPrompts();
    }
  }, [prompts]);

  const handlePostTypeSelection = (type) => {
    setPostType(type);
  };

  const generateOutline = useCallback(async () => {
    if (!title.trim()) {
      alert("Please enter a title or topic before generating an outline.");
      return;
    }
  
    try {
      const apiKey = process.env.REACT_APP_GROQ_API_KEY;
      if (!apiKey) {
        throw new Error("Groq API key not found");
      }
  
      const llm = new ChatGroq({
        apiKey: apiKey,
        model: "llama3-8b-8192",
        temperature: 0,
        maxTokens: undefined,
        maxRetries: 2,
      });
  
      const aiMsg = await llm.invoke([
        {
          role: "system",
          content: "Generate an outline of an essay based on the user's title or topic. Only generate an essay outline, no greetings. Ensure the outline only guides the user to think. Use a simple structure with Roman numerals for main points and letters for subpoints.",
        },
        { role: "user", content: title },
      ]);
      console.log("Generated outline:", aiMsg.content);
  
      // Process the outline to create HTML content
      const processedResult = aiMsg.content.split('\n').map(line => {
        if (line.trim().match(/^[IVX]+\./)) {
          return `<h2>${line.trim()}</h2>`;
        } else if (line.trim().match(/^[A-Z]\./)) {
          return `<p style="margin-left: 20px;">${line.trim()}</p>`;
        } else {
          return `<p>${line.trim()}</p>`;
        }
      }).join('');
  
      // Insert the outline into the editor
      if (editorRef.current && editorRef.current.editor) {
        const editor = editorRef.current.editor;
        editor.commands.setContent(processedResult);
      }
  
      setEditorContent(processedResult);
      setApiKeyError(false);
    } catch (error) {
      console.error("Outline generation error:", error);
      if (error.message.includes("API key")) {
        setApiKeyError(true);
      } else {
        setEditorContent("<p>Error: Outline generation failed</p>");
      }
    }
  }, [title]);

  const generateSuggestion = useCallback(async (type) => {
    if (type === 'argument' && !title.trim()) {
      alert("Please enter a title before generating an argument suggestion.");
      return;
    }
    if (type === 'sentence' && !editorContent.trim()) {
      alert("Please enter some content before generating a next sentence suggestion.");
      return;
    }

    try {
      const apiKey = process.env.REACT_APP_GROQ_API_KEY;
      if (!apiKey) {
        throw new Error("Groq API key not found");
      }

      const llm = new ChatGroq({
        apiKey: apiKey,
        model: "llama3-8b-8192",
        temperature: 0.7,
        maxTokens: 150,
        maxRetries: 2,
      });

      let systemPrompt, userPrompt;

      if (type === 'argument') {
        systemPrompt = `You are an expert essay writer and critical thinker. Your task is to generate a list 3 options of strong, relevant arguments based on the given essay title. Follow these guidelines:
        1. Analyze the title to identify the main topic and potential stance.
        2. Propose a logical, well-reasoned argument that could support a position related to the title.
        3. Ensure the argument is specific and could be supported by potential evidence or examples and is in question form. The argument should be to guide the users and make them think not allow to copy paste it into the essay.
        4. Keep the suggestion concise, around 2-3 sentences max 100 words.
        5. Use language that would flow well in an academic essay.
        6. Never show greetings, never show anything EXCEPT the list of sentences, no "Here are three potential arguments that could be used in an essay on the topic:".
        Example:
        User: Animals hunt other animals, that is life.
        You: 
        1. Physical Adaptations: 
        Do the unique physical adaptations of cats, such as their retractable claws and flexible spine, provide a distinct advantage in their ability to stalk and capture prey?

        2. Enviromental Adapation and Hunting Instincts: 
        Can the success of feral cat populations in controlling pest populations be attributed to their natural hunting instincts and ability to adapt to their environment?

        3. Stealth and Intelligence: 
        Is the stealth and patience required for hunting a key factor in the development of cats' intelligence and problem-solving abilities, making them formidable predators?
        `;
        

        userPrompt = `Here's the essay title:

        "${title}"

        Based on this title, suggest a strong argument that could be used in the essay.`;
      } else {
        systemPrompt = `You are an expert in essay writing and maintaining logical flow. Your task is to generate a list 3 options of logical next sentences that continues the essay's flow seamlessly. Follow these guidelines:
        1. Analyze the current content and identify the direction of the argument or narrative.
        2. Propose a sentence that naturally follows from the last paragraph or sentence.
        3. Ensure the suggested sentence adds value, either by extending an idea, providing a transition, or introducing a new related point.
        4. Match the tone and style of the existing content.
        5. Keep the suggestion concise and impactful.
        6. No greetings, no explanations, only show the list of sentences, no "here are the sentences".
        Example:
        User: Animals hunt other animals, that is life.
        You: 
        1. This primal instinct has shaped the evolution of species, driving the development of unique adaptations and strategies for survival.

        2. The hierarchical structure of the food chain, with predators at the top and prey at the bottom, is a direct result of this fundamental drive. 

        3. From the majestic lioness stalking her prey to the industrious ant working together to capture its own, hunting is a ubiquitous and fascinating aspect of the animal kingdom.`;

        userPrompt = `Here's the current essay content:

        "${editorContent}"

        Based on this, suggest a logical next sentence to continue the essay's flow.`;
      }

      const aiMsg = await llm.invoke([
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ]);

      if (type === 'argument') {
        setArgumentSuggestion(aiMsg.content);
        setShowArgumentPopup(true);
      } else {
        setSentenceSuggestion(aiMsg.content);
        setShowSentencePopup(true);
      }
    } catch (error) {
      console.error(`${type} suggestion generation error:`, error);
      if (error.message.includes("API key")) {
        setApiKeyError(true);
      } else {
        alert(`Error: ${type} suggestion generation failed`);
      }
    }
  }, [title, editorContent]);

  const findTextPosition = (doc, text) => {
    let from = -1;
    let to = -1;
    const regex = new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    
    doc.descendants((node, pos) => {
      if (node.isText) {
        let match;
        while ((match = regex.exec(node.text)) !== null) {
          from = pos + match.index;
          to = from + match[0].length;
          return false; // Stop at the first match
        }
      }
    });
    
    return { from, to };
  };

  const checkForErrors = useCallback(async () => {
    if (!editorContent.trim() || isChecking) return;
  
    console.log("Checking content:", editorContent);
  
    setIsChecking(true);
    try {
      const apiKey = process.env.REACT_APP_GROQ_API_KEY;
      if (!apiKey) {
        throw new Error("Groq API key not found");
      }
  
      const llm = new ChatGroq({
        apiKey: apiKey,
        model: "llama3-8b-8192",
        temperature: 0,
        maxTokens: 3000,
        maxRetries: 2,
      });
  
      console.log("Sending request to LLM...");
  
      const aiMsg = await llm.invoke([
        {
          role: "system",
          content: `You are an expert proofreader and editor with a keen eye for detail. Your task is to perform an exhaustive check of the given text, identifying EVERY SINGLE issue including but not limited to:
          1. Spelling errors (pay extra attention to commonly misspelled words)
          2. Grammatical mistakes
          3. Punctuation errors
          4. Sentence structure problems
          5. Clarity and coherence issues
          6. Redundancy or wordiness
          7. Inconsistencies in tense or voice
          8. Improper word choice
          Be extremely thorough and identify every single error, no matter how minor. Do not overlook any misspellings, even if they might be proper nouns. For each issue, provide:
          - 'text': the exact problematic text (word, phrase, or complete sentence including punctuation)
          - 'message': detailed description of the error and suggestion for improvement
          - 'suggestion': the corrected text
          Provide your response in JSON format with an array of objects. If no errors are found, return an empty array. Always return a valid JSON array.`,
        },
        { role: "user", content: editorContent },
      ]);
  
      console.log("Raw LLM response:", aiMsg.content);
  
      let parsedErrors;
      try {
        parsedErrors = JSON.parse(aiMsg.content);
        if (!Array.isArray(parsedErrors)) {
          throw new Error("Parsed result is not an array");
        }
      } catch (parseError) {
        console.error("Error parsing LLM response:", parseError);
        parsedErrors = [];
      }
  
      console.log("Parsed errors:", parsedErrors);
  
      if (editorRef.current && editorRef.current.editor) {
        const editor = editorRef.current.editor;
        
        // Clear previous highlights
        editor.chain().focus().unsetAllMarks().run();
        
        // Apply new highlights
        parsedErrors.forEach(error => {
          const { from, to } = findTextPosition(editor.state.doc, error.text);
          if (from !== -1 && to !== -1) {
            editor.chain()
              .focus()
              .setTextSelection({ from, to })
              .setMark('highlight')
              .run();
          }
        });
        
        // Reset cursor position
        editor.commands.setTextSelection({ from: 0, to: 0 });
      }
  
      setErrors(parsedErrors);
  
      if (parsedErrors.length === 0) {
        console.log("No errors detected by LLM");
      }
  
    } catch (error) {
      console.error("Error checking content:", error);
      setErrors([]);
    } finally {
      setIsChecking(false);
    }
  }, [editorContent, isChecking]);
  
  const handleErrorFix = useCallback((index) => {
    const error = errors[index];
    if (!error || !editorRef.current || !editorRef.current.editor) return;
  
    const editor = editorRef.current.editor;
    
    const { from, to } = findTextPosition(editor.state.doc, error.text);
    if (from !== -1 && to !== -1) {
      editor
        .chain()
        .focus()
        .setTextSelection({ from, to })
        .unsetMark('highlight')
        .deleteSelection()
        .insertContent(error.suggestion)
        .run();
  
      const newContent = editor.getHTML();
      setEditorContent(newContent);
  
      // Remove the fixed error from the errors array
      setErrors(prevErrors => prevErrors.filter((_, i) => i !== index));
    }
  }, [errors]);

  const toggleDropdown = () => {
    if (!dropdownOpen && prompts.length === 0) {
      const fetchPrompts = async () => {
        try {
          const response = await api.get('/prompts/all'); // Remove the extra '/api'
          setPrompts(response.data);
        } catch (error) {
          console.error('Error fetching prompts:', error);
        }
      };
      fetchPrompts();
    }
    setDropdownOpen(!dropdownOpen);
  };

  // Function to handle prompt selection
  const handlePromptSelect = (prompt) => {
    setSelectedPrompt(prompt);
    toggleDropdown();
  };

  const handleEditorChange = (content) => {
    setEditorContent(content);
  };

  const handlePost = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const postData = {
        title: title,
        content: editorContent,
        postType: postType,
        prompt: selectedPrompt ? selectedPrompt._id : null,
        createdAt: new Date()
      };

      const response = await api.post('/posts', postData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Post created successfully:', response.data);
      setEditorContent('');
      navigate('/home');
    } catch (err) {
      console.error('Error creating post:', err);
    }
  };

  const handleArgumentSuggest = () => generateSuggestion('argument');
  const handleSentenceSuggest = () => generateSuggestion('sentence');

  const SuggestionPopup = ({ show, onClose, title, content }) => (
    show && (
      <Draggable
        handle=".handle"
        defaultPosition={{x: -320, y: 0}}
        bounds="parent"
      >
        <div className="absolute right-0 top-0 w-80 z-20">
          <div className="bg-white border border-gray-300 rounded shadow-lg">
            <div className="handle bg-gray-200 p-2 cursor-move flex justify-between items-center">
              <h3 className="font-bold">{title}</h3>
            </div>
            <div className="p-4 text-left">
              {content ? (
                content.split('\n').map((line, index) => (
                  <React.Fragment key={index}>
                    {line}
                    {index < content.split('\n').length - 1 && <br />}
                  </React.Fragment>
                ))
              ) : (
                <p>No suggestion available</p>
              )}
            </div>
            <button
                onClick={onClose}
                className="text-gray-600 hover:text-gray-800 text-white"
              >
              Close
            </button>
          </div>
        </div>
      </Draggable>
    )
  );

  return (
    <div className="flex w-full h-screen">
      <div className="flex flex-col w-full relative">
        {/* Header Section */}
        <div className="flex items-center h-12 p-2 bg-gray-300 text-center border-b border-gray-400">
          <div className="w-1/12 ">
            <Link to="/home"
              className="rounded-full w-auto px-4 py-1 text-sm bg-purple-600 bg-opacity-100 text-white hover:no-underline hover:bg-opacity-80"
            >
              Home
            </Link>
          </div>
          <div className="w-9/12 flex flex-col flex-grow text-left ml-4 mt-6">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border-0 shadow-none bg-white placeholder-gray-700 font-bold py-1 px-3 focus:outline-none focus:bg-gray-100 hover:bg-gray-100"
              id="title"
              placeholder="Enter your essay title or topic"
            />
          </div>
          <div className="w-2/12">
            <button 
              type="button" 
              className="w-auto px-4 py-1 text-sm bg-purple-600 bg-opacity-100 text-white hover:bg-opacity-80"
            >
              Writing Assistant
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex w-full flex-grow overflow-hidden">
          <div ref={editorContainerRef} className="flex-grow overflow-y-auto overflow-x-hidden p-4">
            <div style={{ width: editorWidth, maxWidth: '100%' }}>
              <TextEditor 
                ref={editorRef}
                initialContent={editorContent}
                onContentChange={handleEditorChange}
                errors={errors}
                className="overflow-x-hidden"
                editorStyles={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}
              />
              {apiKeyError && (
                <p className="text-red-500 mt-2">
                  Error: Groq API key not found. Please set the REACT_APP_GROQ_API_KEY environment variable.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer Section */}
        <div className="p-2 bg-gray-200 text-center border-t border-gray-300">
          <div className='flex mt-auto'>
            {/* Post Type Selection Buttons */}
            <div className="w-6/12 inline-flex border-4 border-black-600 rounded-md" role="group">
              <button 
                type="button" 
                className={`text-sm font-medium border-4 ${
                  postType === 'discussion' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-white text-purple-600 hover:bg-purple-400 hover:text-white'
                }`}
                onClick={() => handlePostTypeSelection('discussion')}
              >
                Discussion
              </button>
              <button 
                type="button" 
                className={`text-sm font-medium border-4 ${
                  postType === 'advice' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-white text-purple-600 hover:bg-purple-400 hover:text-white'
                }`}
                onClick={() => handlePostTypeSelection('advice')}
              >
                Advice and Feedback
              </button>
            </div>
            {/* Dropdown Menu */}
            <div className='flex-grow text-right relative'> 
            <button 
              onClick={toggleDropdown}
              className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center" 
              type="button"
            >
              {selectedPrompt ? selectedPrompt.topic : "Select Prompt"}
              <svg className="w-2.5 h-2.5 ms-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4"/>
              </svg>
            </button>

              {dropdownOpen && (
                <div className="absolute right-0 bottom-full mb-2 z-10 bg-white divide-y divide-gray-100 rounded-lg shadow w-64 max-h-60 overflow-y-auto">
                  <ul className="py-2 text-sm text-gray-700">
                    {prompts.length > 0 ? (
                      prompts.map((prompt, index) => (
                        <li key={index}>
                          <button 
                            onClick={() => handlePromptSelect(prompt)}
                            className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                          >
                            {prompt.topic}
                          </button>
                        </li>
                      ))
                    ) : (
                      <li><p className="px-4 py-2">No prompts available</p></li>
                    )}
                  </ul>
                </div>
              )}
            </div>
            {/* Post Button */}
            <div className='flex-grow text-right'> 
              <button 
                type="button" 
                className="w-auto px-4 py-1 text-sm mr-4 bg-purple-600 bg-opacity-100 text-white hover:bg-opacity-80 transition"
                onClick={handlePost}
              >
                Post
              </button>
            </div>
          </div>
        </div>

        {/* Suggestion Popups */}
        <SuggestionPopup
          show={showArgumentPopup}
          onClose={() => setShowArgumentPopup(false)}
          title="Argument Suggestion"
          content={argumentSuggestion}
        />
        <SuggestionPopup
          show={showSentencePopup}
          onClose={() => setShowSentencePopup(false)}
          title="Next Sentence Suggestion"
          content={sentenceSuggestion}
        />
      </div>

      {/* Right Sidebar */}
      <div className="w-2/12 min-w-[200px] border-l border-gray-400 p-4 overflow-y-auto relative z-10">
        <div className="flex flex-col space-y-4">
          {/* Outline Insertion Button */}
          <div className="flex items-center justify-between">
            <p>Outline Insertion</p>
            <button 
              type="button"
              onClick={generateOutline}
              className="btn hover:bg-purple-400 w-auto text-sm px-2 py-1"
            >
              Insert
            </button>
          </div>
          {/* Argument Suggestion */}
          <div className="flex items-center justify-between">
            <p>Argument Suggestion</p>
            <button 
              type="button"
              onClick={handleArgumentSuggest}
              className="btn hover:bg-purple-400 w-auto text-sm px-2 py-1">
              Suggest
            </button>

          </div>
          {/* Next Sentence Suggestion */}
          <div className="flex items-center justify-between relative">
            <p>Next Sentence Suggestion</p>
            <button 
              type="button" 
              onClick={handleSentenceSuggest}
              className="btn hover:bg-purple-400 w-auto text-sm px-2 py-1">
              Suggest
            </button>
          </div>
          {/* Dashboard */}
          <div className="flex items-center justify-between">
            <p>Text Statistics</p>
            <button 
              onClick={toggleStatistics}
              className="btn hover:bg-purple-400 w-auto text-sm px-2 py-1"
            >
              {showStatistics ? 'Hide' : 'Show'} Statistics
            </button>
          </div>
          {showStatistics && <TextStatistics statistics={textStatistics} />}
          {/* Error Correction Section */}
          <div className="mt-4">
            <h3 className="font-bold mb-2">Error Correction</h3>
            <button 
              onClick={checkForErrors}
              className="mb-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Check for Errors
            </button>
            {isChecking ? (
              <p>Checking for errors...</p>
            ) : errors.length > 0 ? (
              errors.map((error, index) => (
                <div key={index} className="mb-2 p-2 bg-red-100 rounded">
                  <p>{error.message}</p>
                  <button 
                    onClick={() => handleErrorFix(index)}
                    className="mt-1 text-sm text-blue-600 hover:text-blue-800"
                  >
                    Apply Suggestion
                  </button>
                </div>
              ))
            ) : (
              <p>No errors detected. If you believe this is incorrect, please try again or report this issue.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;