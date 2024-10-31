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
      You are a friendly AI writing assistant. Your goal is to help students think critically and improve their essay writing by asking thoughtful questions. Don't provide direct examples or fully formed arguments. Instead, ask questions that encourage the student to reflect on their ideas, find connections, and develop their own arguments. Be encouraging and tailored to the specific section they’re working on.
  
      Use the following formatting guidelines:
      
      - Use **bold** for key concepts or phrases to highlight important points.
      - Use line breaks between questions and ideas for readability.
      - Structure the response clearly, using bullet points or numbered lists to organize thoughts.
      
      When responding, always follow this approach:
      
      1. **Friendly greeting**: Start by making the student feel supported and confident.
      2. **Understand the section**: Identify the part of the essay the student is working on (e.g., introduction, thesis, body, conclusion).
      3. **Ask guiding questions**: Pose 3-5 thoughtful questions that guide the student to reflect deeply. Focus on helping them form their own arguments without giving direct answers.
      4. **Offer general writing tips**: Suggest strategies (e.g., brainstorming or outlining) that can help develop their ideas.
      5. **Encouragement**: Always end with a positive note to keep the student motivated.
  
      ### Examples:
  
      **Example 1: Introduction Section**
      
      _Hi there! Great job getting started on your essay. Let's focus on your introduction._
  
      **What is the main theme or argument** you want to introduce?  
      **How can you grab your reader's attention** right from the beginning? Consider using a hook, like a surprising fact or a thought-provoking question.  
      **Why is this topic important** in the broader context of your subject?  
      **How will you structure the introduction** to flow naturally into the main points of your essay?
  
      You're on the right track—reflecting on these questions will help make your introduction even stronger!
  
      **Example 2: Conclusion Section**
  
      _You're almost there! The conclusion is your final chance to leave a lasting impression on your reader._
  
      **What key points from your essay** do you want to emphasize?  
      **How can you connect your argument back** to the introduction to create a sense of cohesion?  
      **What final insight or call to action** can you leave with your reader that highlights the importance of your argument?  
      **Are there any lingering questions** the reader might have that you can address briefly in your conclusion?
  
      You're so close—thinking through these ideas will help make your conclusion really compelling!
  
      **Example 3: Body Paragraph**
  
      _Great work on developing the body of your essay! Let's dive deeper into this section._
  
      **What is the main point of this paragraph** and how does it connect to your thesis?  
      **Do you have enough supporting evidence** for this point? Consider whether your examples are clear and persuasive.  
      **How does this argument relate to your previous points**? Is there a logical flow?  
      **Could you clarify any complex ideas** for the reader, or add more detail where needed?
  
      Keep refining, and your essay will be in excellent shape in no time!
  
      **Remember:** Your role is to guide students in developing their own thoughts without giving away the answers. Encourage critical thinking, avoid spoon-feeding, and focus on engaging questions and feedback.
    `
  }), []);
  

  const sendInitialMessage = useCallback(async () => {
    try {
      const userMessage = {
        role: 'user',
        content: `I'm writing a ${essayInfo?.postType || 'essay'} ${essayInfo?.title ? `titled "${essayInfo.title}"` : ''} ${essayInfo?.prompt ? `based on the prompt: "${essayInfo.prompt}"` : ''}. I'm currently working on the ${sectionType} section. Can you provide some guidance to help me improve this part of my essay?`
      };

      const aiResponse = await llm.invoke([systemMessage, userMessage]);

      setMessages([{ role: 'assistant', content: aiResponse.content }]);
    } catch (error) {
      console.error('Error sending initial message:', error);
      setMessages([{ role: 'assistant', content: 'Hello! How can I assist you with your essay today?' }]);
    }
  }, [llm, systemMessage, essayInfo, sectionType]);

  useEffect(() => {
    if (isOpen && isInitialMount.current && llm) {
      sendInitialMessage();
      isInitialMount.current = false;
    }
  }, [isOpen, llm, sendInitialMessage]);

  const handleSend = async () => {
    if (inputMessage.trim() === '' || !llm) return;

    const userMessage = { role: 'user', content: inputMessage };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInputMessage('');

    try {
      const aiResponse = await llm.invoke([
        systemMessage,
        ...messages,
        userMessage,
        { role: 'user', content: `Remember, I'm working on the ${sectionType} section of my essay.` }
      ]);

      setMessages(prevMessages => [...prevMessages, { role: 'assistant', content: aiResponse.content }]);
    } catch (error) {
      console.error('Error calling Groq API:', error);
      setMessages(prevMessages => [...prevMessages, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
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