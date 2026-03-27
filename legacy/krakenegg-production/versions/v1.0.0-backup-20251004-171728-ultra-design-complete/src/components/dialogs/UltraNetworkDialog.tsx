import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wifi,
  Globe,
  Server,
  Lock,
  User,
  Key,
  Folder,
  Star,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Shield
} from 'lucide-react';

interface UltraNetworkDialogProps {
  onClose: () => void;
}

const UltraNetworkDialog = ({ onClose }: UltraNetworkDialogProps) => {
  const [activeTab, setActiveTab] = useState('connect');
  const [connectionType, setConnectionType] = useState('ftp');
  const [showPassword, setShowPassword] = useState(false);
  const [connection, setConnection] = useState({
    name: '',
    host: '',
    port: '',
    username: '',
    password: '',
    path: '/',
    passive: true,
    ssl: false
  });

  const [savedConnections] = useState([
    {
      id: '1',
      name: 'My FTP Server',
      type: 'ftp',
      host: 'ftp.example.com',
      username: 'user@example.com',
      favorite: true
    },
    {
      id: '2',
      name: 'Web Server',
      type: 'sftp',
      host: '192.168.1.100',
      username: 'webmaster',
      favorite: false
    },
    {
      id: '3',
      name: 'Backup Server',
      type: 'ftps',
      host: 'backup.company.com',
      username: 'backup-user',
      favorite: true
    }
  ]);

  const connectionTypes = [
    {
      id: 'ftp',
      name: 'FTP',
      description: 'File Transfer Protocol',
      icon: Globe,
      defaultPort: '21'
    },
    {
      id: 'sftp',
      name: 'SFTP',
      description: 'SSH File Transfer Protocol',
      icon: Lock,
      defaultPort: '22'
    },
    {
      id: 'ftps',
      name: 'FTPS',
      description: 'FTP over SSL/TLS',
      icon: Shield,
      defaultPort: '990'
    }
  ];

  const handleConnectionTypeChange = (type: string) => {
    setConnectionType(type);
    const typeConfig = connectionTypes.find(t => t.id === type);
    setConnection(prev => ({
      ...prev,
      port: typeConfig?.defaultPort || '',
      ssl: type === 'ftps'
    }));
  };

  const handleConnect = () => {
    console.log('Connecting to:', connection);
    onClose();
  };

  const renderConnectTab = () => (
    <div className="space-y-6">
      {/* Connection type */}
      <div>
        <h4 className="text-sm font-semibold text-mac26-text-primary-light dark:text-mac26-text-primary-dark mb-3">
          Connection Type
        </h4>
        <div className="grid grid-cols-3 gap-3">
          {connectionTypes.map(type => {
            const Icon = type.icon;
            return (
              <motion.button
                key={type.id}
                className={`p-4 rounded-xl border-2 text-center transition-all duration-200 ${
                  connectionType === type.id
                    ? 'border-mac26-blue-500 bg-mac26-blue-500/10'
                    : 'border-mac26-border-secondary-light dark:border-mac26-border-secondary-dark hover:border-mac26-blue-500/50'
                }`}
                onClick={() => handleConnectionTypeChange(type.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon size={24} className={`mx-auto mb-2 ${
                  connectionType === type.id ? 'text-mac26-blue-500' : 'text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark'
                }`} />
                <p className="text-sm font-medium text-mac26-text-primary-light dark:text-mac26-text-primary-dark">
                  {type.name}
                </p>
                <p className="text-xs text-mac26-text-tertiary-light dark:text-mac26-text-tertiary-dark">
                  {type.description}
                </p>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Connection details */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-mac26-text-primary-light dark:text-mac26-text-primary-dark mb-2">
            Server Address
          </label>
          <input
            type="text"
            value={connection.host}
            onChange={(e) => setConnection(prev => ({ ...prev, host: e.target.value }))}
            placeholder="ftp.example.com"
            className="w-full ultra-input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-mac26-text-primary-light dark:text-mac26-text-primary-dark mb-2">
            Port
          </label>
          <input
            type="text"
            value={connection.port}
            onChange={(e) => setConnection(prev => ({ ...prev, port: e.target.value }))}
            placeholder="21"
            className="w-full ultra-input"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-mac26-text-primary-light dark:text-mac26-text-primary-dark mb-2">
            Username
          </label>
          <input
            type="text"
            value={connection.username}
            onChange={(e) => setConnection(prev => ({ ...prev, username: e.target.value }))}
            placeholder="username"
            className="w-full ultra-input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-mac26-text-primary-light dark:text-mac26-text-primary-dark mb-2">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={connection.password}
              onChange={(e) => setConnection(prev => ({ ...prev, password: e.target.value }))}
              placeholder="password"
              className="w-full ultra-input pr-10"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-mac26-text-tertiary-light dark:text-mac26-text-tertiary-dark hover:text-mac26-text-secondary-light dark:hover:text-mac26-text-secondary-dark"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-mac26-text-primary-light dark:text-mac26-text-primary-dark mb-2">
          Initial Directory (Optional)
        </label>
        <input
          type="text"
          value={connection.path}
          onChange={(e) => setConnection(prev => ({ ...prev, path: e.target.value }))}
          placeholder="/home/user/"
          className="w-full ultra-input"
        />
      </div>

      {/* Advanced options */}
      <div>
        <h4 className="text-sm font-semibold text-mac26-text-primary-light dark:text-mac26-text-primary-dark mb-3">
          Advanced Options
        </h4>
        <div className="space-y-3">
          <motion.label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="text-sm text-mac26-text-primary-light dark:text-mac26-text-primary-dark">
                Passive mode
              </span>
              <p className="text-xs text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark">
                Recommended for firewalls and NAT
              </p>
            </div>
            <input
              type="checkbox"
              checked={connection.passive}
              onChange={(e) => setConnection(prev => ({ ...prev, passive: e.target.checked }))}
              className="ultra-switch"
            />
          </motion.label>

          {connectionType === 'ftps' && (
            <motion.label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="text-sm text-mac26-text-primary-light dark:text-mac26-text-primary-dark">
                  Use explicit SSL
                </span>
                <p className="text-xs text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark">
                  Start with plain FTP, then upgrade to SSL
                </p>
              </div>
              <input
                type="checkbox"
                checked={connection.ssl}
                onChange={(e) => setConnection(prev => ({ ...prev, ssl: e.target.checked }))}
                className="ultra-switch"
              />
            </motion.label>
          )}
        </div>
      </div>

      {/* Save connection */}
      <div className="p-4 bg-mac26-bg-secondary-light dark:bg-mac26-bg-secondary-dark rounded-lg">
        <motion.label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" className="ultra-checkbox" />
          <div>
            <span className="text-sm text-mac26-text-primary-light dark:text-mac26-text-primary-dark">
              Save this connection
            </span>
            <p className="text-xs text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark">
              Store connection details for quick access
            </p>
          </div>
        </motion.label>
      </div>
    </div>
  );

  const renderBookmarksTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-mac26-text-primary-light dark:text-mac26-text-primary-dark">
          Saved Connections
        </h4>
        <motion.button
          className="px-3 py-1.5 bg-mac26-blue-500 hover:bg-mac26-blue-600 text-white rounded-lg text-sm font-medium transition-colors duration-150 flex items-center gap-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus size={14} />
          New
        </motion.button>
      </div>

      <div className="space-y-2">
        <AnimatePresence>
          {savedConnections.map((conn, index) => (
            <motion.div
              key={conn.id}
              className="p-4 bg-mac26-bg-secondary-light dark:bg-mac26-bg-secondary-dark rounded-lg hover:bg-mac26-hover-light dark:hover:bg-mac26-hover-dark transition-colors duration-150 cursor-pointer group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ x: 4 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-mac26-blue-500/10 flex items-center justify-center">
                  <Server size={16} className="text-mac26-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h5 className="text-sm font-medium text-mac26-text-primary-light dark:text-mac26-text-primary-dark truncate">
                      {conn.name}
                    </h5>
                    <span className="text-xs px-2 py-0.5 bg-mac26-bg-tertiary-light dark:bg-mac26-bg-tertiary-dark rounded-full text-mac26-text-tertiary-light dark:text-mac26-text-tertiary-dark uppercase">
                      {conn.type}
                    </span>
                    {conn.favorite && (
                      <Star size={12} className="text-mac26-orange-500 fill-current" />
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark">
                    <span>{conn.username}@{conn.host}</span>
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex gap-2">
                  <motion.button
                    className="p-1.5 rounded-lg hover:bg-mac26-blue-500/10 text-mac26-blue-500"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    title="Edit"
                  >
                    <Edit size={14} />
                  </motion.button>
                  <motion.button
                    className="p-1.5 rounded-lg hover:bg-mac26-red-500/10 text-mac26-red-500"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );

  const isFormValid = connection.host && connection.username && connection.password;

  return (
    <div className="w-full max-w-2xl">
      {/* Header */}
      <div className="p-6 border-b border-mac26-border-secondary-light dark:border-mac26-border-secondary-dark">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-mac26-green-500/10 flex items-center justify-center">
            <Wifi size={24} className="text-mac26-green-500" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-mac26-text-primary-light dark:text-mac26-text-primary-dark">
              Network Connection
            </h3>
            <p className="text-sm text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark">
              Connect to FTP, SFTP, and other network servers
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-mac26-border-secondary-light dark:border-mac26-border-secondary-dark">
        {[
          { id: 'connect', label: 'Connect', icon: Globe },
          { id: 'bookmarks', label: 'Bookmarks', icon: Star }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <motion.button
              key={tab.id}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all duration-150 ${
                activeTab === tab.id
                  ? 'text-mac26-blue-500 border-b-2 border-mac26-blue-500'
                  : 'text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark hover:text-mac26-text-primary-light dark:hover:text-mac26-text-primary-dark'
              }`}
              onClick={() => setActiveTab(tab.id)}
              whileHover={{ y: activeTab === tab.id ? 0 : -1 }}
            >
              <Icon size={16} />
              {tab.label}
            </motion.button>
          );
        })}
      </div>

      {/* Content */}
      <div className="p-6">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'connect' ? renderConnectTab() : renderBookmarksTab()}
        </motion.div>
      </div>

      {/* Footer */}
      {activeTab === 'connect' && (
        <div className="flex justify-end gap-3 p-6 border-t border-mac26-border-secondary-light dark:border-mac26-border-secondary-dark">
          <motion.button
            className="px-4 py-2 text-sm font-medium text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark hover:bg-mac26-hover-light dark:hover:bg-mac26-hover-dark rounded-lg transition-colors duration-150"
            onClick={onClose}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Cancel
          </motion.button>
          <motion.button
            disabled={!isFormValid}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-150 flex items-center gap-2 ${
              isFormValid
                ? 'bg-mac26-green-500 hover:bg-mac26-green-600 text-white'
                : 'bg-mac26-bg-tertiary-light dark:bg-mac26-bg-tertiary-dark text-mac26-text-tertiary-light dark:text-mac26-text-tertiary-dark cursor-not-allowed'
            }`}
            onClick={handleConnect}
            whileHover={isFormValid ? { scale: 1.02 } : {}}
            whileTap={isFormValid ? { scale: 0.98 } : {}}
          >
            <Wifi size={14} />
            Connect
          </motion.button>
        </div>
      )}
    </div>
  );
};

export default UltraNetworkDialog;