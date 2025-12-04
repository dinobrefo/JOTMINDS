import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { KidsModeWrapper } from './KidsModeWrapper';
import { User } from '../../types/index';

/**
 * DEMO COMPONENT - For testing Kids Mode without needing a real user account
 * 
 * This creates a mock student user aged 8 years old to demonstrate Kids Mode
 */

interface KidsModeDemoProps {
  onBack?: () => void;
}

export function KidsModeDemo({ onBack }: KidsModeDemoProps) {
  const [isActive, setIsActive] = useState(false);
  
  console.log('[KidsModeDemo] Component rendered. isActive:', isActive);

  // Force light mode for Kids Mode Demo
  useEffect(() => {
    const htmlElement = document.documentElement;
    const hadDarkClass = htmlElement.classList.contains('dark');
    
    // Remove dark mode when entering Kids Mode Demo
    htmlElement.classList.remove('dark');
    
    // Restore dark mode when leaving
    return () => {
      if (hadDarkClass) {
        htmlElement.classList.add('dark');
      }
    };
  }, []);

  // Create a demo student user aged 8
  const demoUser: User = {
    id: 'demo-kid-001',
    email: 'demo.kid@jotminds.com',
    name: 'Alex',
    phone: '',
    role: 'student',
    age: 8,
    dateOfBirth: '2017-01-01',
    educationLevel: 'Elementary',
    school: 'Demo Elementary School',
    createdAt: new Date().toISOString(),
    // Mock completed assessments to show progress
    assessments: []
  };

  const handleLogout = () => {
    setIsActive(false);
  };

  if (isActive) {
    return <KidsModeWrapper user={demoUser} onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ 
      background: 'linear-gradient(135deg, #667eea 0%, #FF6B9D 50%, #FEC163 100%)',
      colorScheme: 'light'
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl shadow-2xl p-12 max-w-2xl w-full text-center relative"
      >
        {/* Back Button */}
        {onBack && (
          <button
            onClick={onBack}
            className="absolute top-4 left-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-xl font-bold text-gray-700 transition-colors"
          >
            ← Back
          </button>
        )}

        {/* Demo Header */}
        <div className="mb-8">
          <motion.div
            className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-7xl"
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            🎨
          </motion.div>
          
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            Kids Mode Demo
          </h1>
          
          <p className="text-xl text-gray-600 mb-2">
            Welcome to the JotMinds Kids Mode Experience!
          </p>
          
          <p className="text-lg text-gray-500">
            This demo shows how the platform looks for children aged 6-10
          </p>
        </div>

        {/* Demo Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-purple-50 rounded-2xl p-6 border-4 border-purple-200">
            <div className="text-4xl mb-2">👤</div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">Demo User</h3>
            <p className="text-gray-600">Alex, Age 8</p>
          </div>

          <div className="bg-pink-50 rounded-2xl p-6 border-4 border-pink-200">
            <div className="text-4xl mb-2">🎮</div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">Features</h3>
            <p className="text-gray-600">Quizzes, Stars, Badges</p>
          </div>

          <div className="bg-blue-50 rounded-2xl p-6 border-4 border-blue-200">
            <div className="text-4xl mb-2">🎤</div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">Audio</h3>
            <p className="text-gray-600">Text-to-Speech Narration</p>
          </div>

          <div className="bg-green-50 rounded-2xl p-6 border-4 border-green-200">
            <div className="text-4xl mb-2">🎉</div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">Mascot</h3>
            <p className="text-gray-600">Jot the Friendly Guide</p>
          </div>
        </div>

        {/* Features List */}
        <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-6 mb-8 text-left">
          <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
            ✨ What You'll Experience
          </h3>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-center gap-2">
              <span className="text-2xl">📚</span>
              <span>Visual emoji-based quiz questions</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-2xl">⭐</span>
              <span>Earn stars and unlock badges</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-2xl">🎨</span>
              <span>Bright colors and fun animations</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-2xl">🔊</span>
              <span>Audio narration for all content</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-2xl">🎉</span>
              <span>Celebration screens with confetti</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-2xl">🔒</span>
              <span>Parent PIN protection (PIN: 1234)</span>
            </li>
          </ul>
        </div>

        {/* Launch Button */}
        <motion.button
          className="w-full py-6 px-8 rounded-3xl text-3xl font-bold text-white shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #FF6B9D 50%, #FEC163 100%)',
            border: '4px solid white'
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsActive(true)}
        >
          🚀 Launch Kids Mode Demo
        </motion.button>

        {/* Note */}
        <p className="text-sm text-gray-500 mt-6">
          💡 Tip: To exit, click the logout button and enter PIN: <strong>1234</strong>
        </p>
      </motion.div>
    </div>
  );
}
