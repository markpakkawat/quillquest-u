import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { XIcon } from '@heroicons/react/solid';
import { ChatGroq } from "@langchain/groq";
import ReactMarkdown from 'react-markdown';

const WritingAssistant = ({ isOpen, onClose, sectionType, essayInfo, currentContent }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [llm, setLLM] = useState(null);
  const chatContainerRef = useRef(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    const apiKey = process.env.REACT_APP_GROQ_API_KEY;
    if (apiKey) {
      const newLLM = new ChatGroq({
        apiKey: apiKey,
        model: "mixtral-8x7b-32768",
        temperature: 0.5,
        maxTokens: 1024,
        topP: 1,
      });
      setLLM(newLLM);
    }
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  
  const systemMessage = useMemo(() => ({
    role: 'system',
    content: `
ROLE AND BEHAVIOR:
You are a friendly AI writing assistant. Your goal is to help students think critically and improve their essay writing by asking thoughtful questions. Guide students in developing their own thoughts without giving away answers. Encourage critical thinking, avoid spoon-feeding, and maintain a conversational tone.

CRITICAL - OFF-TOPIC HANDLING:
When a user asks ANY question not directly related to their essay or writing process, respond ONLY with:
"I'm focused on helping you with your writing. Let's get back to your essay!"

OUTPUT FORMATTING RULES:
- Always start with an italicized greeting on its own line
- Add a blank line after greeting
- Use **bold** for emphasis and key terms
- Each question should be on its own line with a bullet point
- Add a blank line between questions
- End with an encouraging note on its own line

EXAMPLE PROPER FORMATTING:

*Welcome! Let's work on making your essay stronger.*

* **What central argument** do you want to develop in this section?

* **Which supporting evidence** could strengthen your point?

* **How does this connect** to your essay's main theme?

Keep going - you're building something great!

STRICT RULES:
- Maintain consistent spacing between elements
- Always include blank lines between questions
- Keep the visual hierarchy clear
- Never skip the formatting rules
- For off-topic questions, use only the redirect message with no additional text

REMEMBER: The formatting is as important as the content for readability.`
}), []);

const sendInitialMessage = useCallback(async () => {
  try {
    const userMessage = {
      role: 'user',
      content: `I need help with essay writing. I'm working on the ${sectionType} section of my essay addressing this prompt: "${essayInfo.prompt}". Here's my current content:
"${currentContent}"
Please provide guidance for developing this section.`
    };

    // Add context message to make it clear this is essay-related
    const contextMessage = {
      role: 'system',
      content: `This is an essay writing request. The student is working on their ${sectionType} and needs writing guidance. Treat this as an on-topic essay help request.`
    };

    const aiResponse = await llm.invoke([
      systemMessage,
      contextMessage,
      userMessage
    ]);

    setMessages([{ role: 'assistant', content: aiResponse.content }]);
  } catch (error) {
    console.error('Error sending initial message:', error);
    setMessages([{ 
      role: 'assistant', 
      content: 'Hello! How can I assist you with your essay today?' 
    }]);
  }
}, [llm, systemMessage, essayInfo, sectionType, currentContent]);

  useEffect(() => {
    if (isOpen && isInitialMount.current && llm) {
      sendInitialMessage();
      isInitialMount.current = false;
    }
  }, [isOpen, llm, sendInitialMessage]);

  // Add this useEffect to reset the chat when section changes
  useEffect(() => {
    isInitialMount.current = true;
    setMessages([]);
  }, [sectionType]);

  // And update the useEffect for initial message to also trigger on sectionType change
  useEffect(() => {
    if (isOpen && isInitialMount.current && llm) {
      sendInitialMessage();
      isInitialMount.current = false;
    }
  }, [isOpen, llm, sendInitialMessage, sectionType]); // Added sectionType dependency

  const handleSend = async () => {
    if (inputMessage.trim() === '' || !llm) return;
  
    const userMessage = { role: 'user', content: inputMessage };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInputMessage('');
  
    try {
      const contextMessage = {
        role: 'system',
        content: `The student is working on their ${sectionType} section for an essay about: "${essayInfo.prompt}". Maintain essay writing assistance context.`
      };
  
      const aiResponse = await llm.invoke([
        systemMessage,
        contextMessage,
        ...messages,
        userMessage
      ]);
  
      setMessages(prevMessages => [...prevMessages, { 
        role: 'assistant', 
        content: aiResponse.content 
      }]);
    } catch (error) {
      console.error('Error calling Groq API:', error);
      setMessages(prevMessages => [...prevMessages, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-lg transform transition-transform duration-300 ease-in-out">
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">Writing Assistant</h2>
          <button onClick={onClose} className="w-auto text-white bg-red-500 hover:bg-black">
            <XIcon className="h-6 w-6" />
          </button>
        </div>
        <div ref={chatContainerRef} className="flex-grow overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div key={index} className={`${message.role === 'user' ? 'text-right' : 'text-left'}`}>
              <div className={`inline-block p-2 rounded-lg ${message.role === 'user' ? 'bg-purple-100' : 'bg-gray-100'}`}>
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t">
          <div className="flex items-center">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
              className="flex-grow px-3 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Type your message..."
              rows="3"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WritingAssistant;