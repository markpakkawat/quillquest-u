const Prompt = require('../models/Prompt');
const { generatePrompt } = require('../utils/promptGenerator');

exports.getLatestPrompt = async (req, res) => {
  try {
    const latestPrompt = await Prompt.findOne().sort({ createdAt: -1 });
    res.json(latestPrompt);
  } catch (error) {
    console.error('Error fetching latest prompt:', error);
    res.status(500).json({ message: 'Error fetching latest prompt', error: error.message });
  }
};

exports.getAllPrompts = async (req, res) => {
  try {
    const prompts = await Prompt.find().sort({ createdAt: -1 });
    res.json(prompts);
  } catch (error) {
    console.error('Error fetching prompts:', error);
    res.status(500).json({ message: 'Error fetching prompts', error: error.message });
  }
};

exports.generateNewPrompt = async (req, res) => {
  try {
    const newPromptTopic = await generatePrompt();
    const newPrompt = new Prompt({ 
      topic: newPromptTopic,
      expiresAt: new Date(+new Date() + 7*24*60*60*1000) // 7 days from now
    });
    await newPrompt.save();
    res.status(201).json(newPrompt);
  } catch (error) {
    console.error('Error generating new prompt:', error);
    res.status(500).json({ message: 'Error generating new prompt', error: error.message });
  }
};