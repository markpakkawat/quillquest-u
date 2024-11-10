import React from 'react';
import { 
  Edit3, 
  CheckCircle, 
  MessageCircle, 
  BarChart2, 
  Users, 
  Zap, 
  DollarSign, 
  TrendingUp 
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';

function Button({ children, className, ...props }) {
  return (
    <button
      className={`px-4 py-2 font-bold text-white bg-purple-600 rounded hover:bg-purple-700 focus:outline-none focus:shadow-outline ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

function Card({ children, className, ...props }) {
  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`} {...props}>
      {children}
    </div>
  );
}

function CardHeader({ children }) {
  return <div className="px-6 py-4">{children}</div>;
}

function CardTitle({ children, className }) {
  return <h3 className={`text-lg font-semibold ${className}`}>{children}</h3>;
}

function CardContent({ children }) {
  return <div className="px-6 py-4">{children}</div>;
}

export default function LandingPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-200 to-white">
      <Navbar />
      <main className="container mx-auto px-4 py-16 mt-10">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 text-purple-800">Master the Art of Argumentative Essay Writing</h1>
          <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
            QuillQuest: Your AI-powered companion for perfecting A2-B2 English argumentative essays. Enhance your writing skills with personalized guidance, real-time feedback, and interactive learning.
          </p>
          <Button className="text-lg px-8 w-auto" onClick={() => navigate('/register')}>Start Your Writing Journey</Button>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-purple-600">
                <Edit3 className="mr-2" />
                Guided Writing Experience
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Benefit from our section-by-section essay writing support, powered by advanced AI. Receive tailored guidance for crafting compelling introductions, well-structured body paragraphs, and impactful conclusions. Our system adapts to your writing style, helping you improve with each essay.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-purple-600">
                <CheckCircle className="mr-2" />
                Comprehensive Error Detection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Experience state-of-the-art error detection and correction recommendations. Our AI identifies and helps you fix spelling, punctuation, lexico-semantic, style, and typographical errors. Learn from your mistakes and watch your writing quality improve dramatically over time.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-purple-600">
                <MessageCircle className="mr-2" />
                Intelligent Writing Assistant
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Engage with our AI writing assistant throughout your writing process. Get instant answers to your questions, receive suggestions for improving your arguments, and learn valuable writing techniques. Our assistant is designed to guide you without compromising your unique voice and ideas.</p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-6 text-purple-800">Your Path to Writing Excellence</h2>
          <div className="flex flex-col md:flex-row justify-center items-center space-y-8 md:space-y-0 md:space-x-12">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <Edit3 className="w-10 h-10 text-purple-600" />
              </div>
              <p className="font-semibold text-lg mb-2">Compose</p>
              <p className="text-gray-600 text-center max-w-xs">Write your essay with AI-powered guidance, receiving real-time suggestions and feedback.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <Users className="w-10 h-10 text-purple-600" />
              </div>
              <p className="font-semibold text-lg mb-2">Discuss</p>
              <p className="text-gray-600 text-center max-w-xs">Engage with peers, share your essays, and participate in constructive discussions to broaden your perspective.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <BarChart2 className="w-10 h-10 text-purple-600" />
              </div>
              <p className="font-semibold text-lg mb-2">Assess</p>
              <p className="text-gray-600 text-center max-w-xs">Review your progress, analyze your writing statistics, and identify areas for continuous improvement.</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-8 mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center text-purple-800">Freemium Model: Access and Upgrade Options</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-purple-600">
                  <Zap className="mr-2" />
                  Free Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {['Basic essay topic generation', 'Limited guided writing support', 'Basic error detection', 'Access to community discussions'].map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-purple-600">
                  <DollarSign className="mr-2" />
                  Premium Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {[
                    'Comprehensive guided writing with LLaMA3-70B-8192',
                    'Advanced error detection and correction recommendations',
                    'Unlimited access to AI writing assistant',
                    'Detailed essay statistics and progress tracking'
                  ].map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-8 mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center text-purple-800">Why QuillQuest is a Viable Business</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-purple-600">
                  <TrendingUp className="mr-2" />
                  Growing Market Demand
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>The global e-learning market is expanding rapidly, with a particular focus on language learning and writing skills. QuillQuest taps into this growing demand by offering a specialized tool for argumentative essay writing.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-purple-600">
                  <Zap className="mr-2" />
                  Innovative AI Technology
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>By leveraging advanced AI models like LLaMA3-70B-8192, QuillQuest offers cutting-edge writing assistance that sets it apart from traditional learning tools, providing a unique value proposition in the market.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-purple-600">
                  <DollarSign className="mr-2" />
                  Scalable Freemium Model
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>The freemium model allows for rapid user acquisition while monetizing through premium features. This approach enables sustainable growth and recurring revenue streams as users upgrade to access advanced AI-powered tools.</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Improve Your Writing?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Join QuillQuest today and take your argumentative essay skills to the next level!
          </p>
          <Button className="text-lg px-8 w-auto" onClick={() => navigate('/register')}>Sign Up Now</Button>
        </div>
      </main>

      <footer className="bg-purple-200 py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2024 QuillQuest. All rights reserved.</p>
          <p className="mt-2">
            Developed by Micko Kok, Pakkawat Wassa, and Winanya Buakaew
          </p>
        </div>
      </footer>
    </div>
  );
}