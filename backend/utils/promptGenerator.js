const { ChatGroq } = require("@langchain/groq");

exports.generatePrompt = async () => {
  try {
    if (!process.env.REACT_APP_GROQ_API_KEY) {
      throw new Error('REACT_APP_GROQ_API_KEY is not configured');
    }

    const llm = new ChatGroq({
      apiKey: process.env.REACT_APP_GROQ_API_KEY,
      model: "llama3-70b-8192",
      temperature: 0.7,
      maxTokens: 100,
    });

    const systemMessage = {
      role: "system",
      content: `You are a helpful assistant that generates argumentative essay topic prompts. Generate only the prompt. 
      Ensure the prompt is only one sentence length and is curt. 
      Example: Does Technology Make Us More Alone?`
    };

    const userMessage = {
      role: "user",
      content: "Generate a thought-provoking essay topic prompt suitable for high school or college students. The topic should be specific, engaging, and encourage critical thinking."
    };

    const response = await llm.invoke([systemMessage, userMessage]);
    
    if (!response.content) {
      throw new Error('Generated prompt is empty');
    }

    return response.content.trim();
  } catch (error) {
    console.error('Error generating prompt with GROQ:', error);
    throw error;
  }
};