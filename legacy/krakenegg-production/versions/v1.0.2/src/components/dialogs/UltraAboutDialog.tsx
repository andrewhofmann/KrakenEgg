import { motion } from 'framer-motion';
import { X, ExternalLink, Heart, Code, Zap, Shield } from 'lucide-react';
import CompactDialog from './CompactDialog';

interface UltraAboutDialogProps {
  onClose: () => void;
}

const UltraAboutDialog = ({ onClose }: UltraAboutDialogProps) => {
  const handleOpenWebsite = () => {
    // In a real app, this would open the website
    console.log('Opening KrakenEgg website...');
  };

  const handleOpenGitHub = () => {
    // In a real app, this would open the GitHub repository
    console.log('Opening GitHub repository...');
  };

  return (
    <CompactDialog
      title="About KrakenEgg"
      icon={<span className="text-sm">🦑</span>}
      iconColor="bg-gradient-to-br from-mac26-blue-500 to-mac26-purple-500"
      onClose={onClose}
      onConfirm={onClose}
      confirmText="OK"
      size="md"
      hideCancel={true}
    >
      <div className="space-y-6">
        {/* App Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-mac26-blue-500 to-mac26-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-3xl">🦑</span>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-mac26-text-primary-light dark:text-mac26-text-primary-dark">
              KrakenEgg
            </h2>
            <p className="text-sm text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark">
              Ultra File Manager
            </p>
          </div>
        </div>

        {/* Version Info */}
        <div className="bg-mac26-bg-secondary-light dark:bg-mac26-bg-secondary-dark rounded-lg p-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark">Version:</span>
            <span className="text-sm font-medium text-mac26-text-primary-light dark:text-mac26-text-primary-dark">1.0.2</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark">Build:</span>
            <span className="text-sm font-medium text-mac26-text-primary-light dark:text-mac26-text-primary-dark">2024.10.06</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark">Platform:</span>
            <span className="text-sm font-medium text-mac26-text-primary-light dark:text-mac26-text-primary-dark">macOS (Tauri)</span>
          </div>
        </div>

        {/* Description */}
        <div className="text-center space-y-3">
          <p className="text-sm text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark leading-relaxed">
            A modern, keyboard-driven Total Commander clone designed primarily for macOS.
            Features a clean, keyboard-first dual-pane file manager interface with 100%
            feature parity to Total Commander plus modern enhancements.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 p-2 bg-mac26-bg-secondary-light dark:bg-mac26-bg-secondary-dark rounded-md">
            <Zap size={14} className="text-mac26-blue-500" />
            <span className="text-xs text-mac26-text-primary-light dark:text-mac26-text-primary-dark">High Performance</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-mac26-bg-secondary-light dark:bg-mac26-bg-secondary-dark rounded-md">
            <Code size={14} className="text-mac26-green-500" />
            <span className="text-xs text-mac26-text-primary-light dark:text-mac26-text-primary-dark">Open Source</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-mac26-bg-secondary-light dark:bg-mac26-bg-secondary-dark rounded-md">
            <Shield size={14} className="text-mac26-purple-500" />
            <span className="text-xs text-mac26-text-primary-light dark:text-mac26-text-primary-dark">Secure & Safe</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-mac26-bg-secondary-light dark:bg-mac26-bg-secondary-dark rounded-md">
            <Heart size={14} className="text-mac26-red-500" />
            <span className="text-xs text-mac26-text-primary-light dark:text-mac26-text-primary-dark">Made with Love</span>
          </div>
        </div>

        {/* Links */}
        <div className="space-y-2">
          <button
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-mac26-bg-secondary-light dark:bg-mac26-bg-secondary-dark hover:bg-mac26-hover-light dark:hover:bg-mac26-hover-dark rounded-lg transition-colors duration-150 text-sm text-mac26-text-primary-light dark:text-mac26-text-primary-dark"
            onClick={handleOpenWebsite}
          >
            <ExternalLink size={14} />
            Visit Website
          </button>
          <button
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-mac26-bg-secondary-light dark:bg-mac26-bg-secondary-dark hover:bg-mac26-hover-light dark:hover:bg-mac26-hover-dark rounded-lg transition-colors duration-150 text-sm text-mac26-text-primary-light dark:text-mac26-text-primary-dark"
            onClick={handleOpenGitHub}
          >
            <Code size={14} />
            View Source Code
          </button>
        </div>

        {/* Copyright */}
        <div className="text-center pt-2 border-t border-mac26-border-secondary-light dark:border-mac26-border-secondary-dark">
          <p className="text-xs text-mac26-text-tertiary-light dark:text-mac26-text-tertiary-dark">
            Copyright © 2024 KrakenEgg Team
          </p>
        </div>
      </div>
    </CompactDialog>
  );
};

export default UltraAboutDialog;