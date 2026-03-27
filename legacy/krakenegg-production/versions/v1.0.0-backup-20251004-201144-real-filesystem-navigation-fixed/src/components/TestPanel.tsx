import React, { useState } from 'react';
import { verifyRealFiles } from '../tests/realFileVerification';

interface TestPanelProps {
  onClose: () => void;
}

export const TestPanel: React.FC<TestPanelProps> = ({ onClose }) => {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<boolean | null>(null);

  const runTest = async () => {
    setTesting(true);
    setResult(null);

    try {
      const passed = await verifyRealFiles();
      setResult(passed);
    } catch (error) {
      console.error('Test failed:', error);
      setResult(false);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-semibold text-white mb-4">Real File Verification Test</h2>

        <p className="text-white/80 mb-6">
          This test will verify whether the application is loading real files from your system or mock files.
          Check the browser console for detailed results.
        </p>

        <div className="space-y-4">
          <button
            onClick={runTest}
            disabled={testing}
            className="w-full bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 text-white py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            {testing ? 'Running Test...' : 'Run Real File Test'}
          </button>

          {result !== null && (
            <div className={`p-4 rounded-lg border ${
              result
                ? 'bg-green-500/20 border-green-400/30 text-green-100'
                : 'bg-red-500/20 border-red-400/30 text-red-100'
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {result ? '✅' : '❌'}
                </span>
                <span className="font-medium">
                  {result ? 'REAL FILES CONFIRMED' : 'LIKELY MOCK FILES'}
                </span>
              </div>
              <p className="text-sm mt-1 opacity-80">
                Check browser console for detailed test results
              </p>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full bg-gray-500/20 hover:bg-gray-500/30 border border-gray-400/30 text-white py-2 px-4 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};