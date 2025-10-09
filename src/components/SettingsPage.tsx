import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, ChevronRight, LogOut, Pencil, Check, ChevronDown, Search, Lock, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getUserSettings, updateUserSetting } from '../services/settings';
import { UserSettings, Niche } from '../types/settings';

interface EditableField {
  name: string;
  value: string;
  isEditing: boolean;
  apiField: string;
  isTextArea?: boolean;
  isArray?: boolean;
  validate?: (value: string) => string | null;
}

interface SettingsPageProps {
  onPageChange: (page: 'feed' | 'settings') => void;
  setIsLoading: (loading: boolean) => void;
}

const validateUrl = (url: string): string | null => {
  if (!url) return null;
  try {
    new URL(url.startsWith('http') ? url : `https://${url}`);
    return null;
  } catch {
    return 'Please enter a valid URL';
  }
};

const SettingsPage: React.FC<SettingsPageProps> = ({ onPageChange, setIsLoading }) => {
  const [isNicheDropdownOpen, setIsNicheDropdownOpen] = useState(false);
  const [selectedNiche, setSelectedNiche] = useState('');
  const [currentNicheId, setCurrentNicheId] = useState<string>('');
  const [nicheSearch, setNicheSearch] = useState('');
  const [expandedSection, setExpandedSection] = useState<'business' | 'personal' | null>(null);
  const [expandedSystemSection, setExpandedSystemSection] = useState(false);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPurchasePopup, setShowPurchasePopup] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [monitoredAccounts, setMonitoredAccounts] = useState<string[]>([]);
  const [newAccount, setNewAccount] = useState('');
  const [fields, setFields] = useState<Record<string, EditableField>>({
    businessName: { 
      name: 'Nome da Empresa', 
      value: '', 
      isEditing: false,
      apiField: 'business_name'
    },
    instagram: { 
      name: 'Instagram', 
      value: '', 
      isEditing: false,
      apiField: 'business_instagram_username'
    },
    website: { 
      name: 'Site', 
      value: '', 
      isEditing: false,
      apiField: 'business_website',
      validate: validateUrl
    },
    toneOfVoice: {
      name: 'Tom de voz',
      value: '',
      isEditing: false,
      apiField: 'tone_of_voice',
      isTextArea: true
    },
    monitoredAccounts: {
      name: 'Contas monitoradas',
      value: '[]',
      isEditing: false,
      apiField: 'monitored_accounts',
      isArray: true
    },
  });

  const loadUserSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const settings = await getUserSettings();
      setUserSettings(settings);
      
      if (settings.current_feed_niche) {
        setCurrentNicheId(settings.current_feed_niche);
        const currentNiche = settings.niches.find(niche => niche.id === settings.current_feed_niche);
        if (currentNiche) {
          setSelectedNiche(currentNiche.name);
        }
      }
      
      setFields({
        businessName: { 
          name: 'Nome da Empresa', 
          value: settings.business_name || '', 
          isEditing: false,
          apiField: 'business_name'
        },
        instagram: { 
          name: 'Instagram', 
          value: settings.business_instagram_username || '', 
          isEditing: false,
          apiField: 'business_instagram_username'
        },
        website: { 
          name: 'Site', 
          value: settings.business_website || '', 
          isEditing: false,
          apiField: 'business_website',
          validate: validateUrl
        },
        toneOfVoice: {
          name: 'Tom de voz',
          value: settings.tone_of_voice || '',
          isEditing: false,
          apiField: 'tone_of_voice',
          isTextArea: true
        },
        monitoredAccounts: {
          name: 'Contas monitoradas',
          value: '[]',
          isEditing: false,
          apiField: 'monitored_accounts',
          isArray: true
        },
      });
      
      // Initialize monitored accounts from settings
      if (settings.monitored_accounts) {
        try {
          const accounts = typeof settings.monitored_accounts === 'string' 
            ? JSON.parse(settings.monitored_accounts)
            : settings.monitored_accounts;
          setMonitoredAccounts(Array.isArray(accounts) ? accounts : []);
        } catch {
          setMonitoredAccounts([]);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setIsPageLoading(false);
      setIsLoading(false);
    }
  }, [setIsLoading]);

  useEffect(() => {
    loadUserSettings();
  }, [loadUserSettings]);

  const sortedNiches = userSettings?.niches.sort((a, b) => {
    if (a.access && !b.access) return -1;
    if (!a.access && b.access) return 1;
    return a.name.localeCompare(b.name);
  }) || [];

  const filteredNiches = sortedNiches.filter(niche => 
    niche.name.toLowerCase().includes(nicheSearch.toLowerCase())
  );

  const toggleEdit = (fieldKey: string) => {
    setFields(prev => ({
      ...prev,
      [fieldKey]: {
        ...prev[fieldKey],
        isEditing: !prev[fieldKey].isEditing,
      }
    }));
    setValidationErrors(prev => ({ ...prev, [fieldKey]: '' }));
  };

  const handleSaveField = async (fieldKey: string) => {
    const field = fields[fieldKey];
    
    // Special handling for monitored accounts
    if (fieldKey === 'monitoredAccounts') {
      setIsLoading(true);
      try {
        await updateUserSetting(field.apiField, JSON.stringify(monitoredAccounts));
        toggleEdit(fieldKey);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update setting');
      } finally {
        setIsLoading(false);
      }
      return;
    }
    
    if (field.validate) {
      const error = field.validate(field.value);
      if (error) {
        setValidationErrors(prev => ({ ...prev, [fieldKey]: error }));
        return;
      }
    }

    setIsLoading(true);
    try {
      const value = field.value;
      if (field.apiField === 'business_website' && value && !value.startsWith('http')) {
        field.value = `https://${value}`;
      }
      
      await updateUserSetting(field.apiField, field.value);
      toggleEdit(fieldKey);
      
      if (userSettings) {
        setUserSettings({
          ...userSettings,
          [field.apiField]: field.value
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update setting');
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (fieldKey: string, value: string) => {
    setFields(prev => ({
      ...prev,
      [fieldKey]: {
        ...prev[fieldKey],
        value,
      }
    }));
    setValidationErrors(prev => ({ ...prev, [fieldKey]: '' }));
  };

  const handleNicheSelect = async (niche: Niche) => {
    if (!niche.access) {
      setShowPurchasePopup(true);
      setTimeout(() => setShowPurchasePopup(false), 3000);
      return;
    }

    if (niche.id === currentNicheId) {
      setIsNicheDropdownOpen(false);
      setNicheSearch('');
      return;
    }

    setIsLoading(true);
    try {
      await updateUserSetting('current_feed_niche', niche.id);
      setSelectedNiche(niche.name);
      setCurrentNicheId(niche.id);
      setIsNicheDropdownOpen(false);
      setNicheSearch('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update niche');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNewNiche = () => {
    setShowPurchasePopup(true);
    setTimeout(() => setShowPurchasePopup(false), 3000);
  };

  const handleLogout = () => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };
  
  const addMonitoredAccount = () => {
    const account = newAccount.trim();
    if (account && monitoredAccounts.length < 3 && !monitoredAccounts.includes(account)) {
      const updatedAccounts = [...monitoredAccounts, account];
      setMonitoredAccounts(updatedAccounts);
      setNewAccount('');
      
      // Save to backend immediately
      updateUserSetting('monitored_accounts', JSON.stringify(updatedAccounts))
        .catch(err => {
          setError(err instanceof Error ? err.message : 'Failed to update monitored accounts');
        });
    }
  };
  
  const removeMonitoredAccount = (index: number) => {
    const updatedAccounts = monitoredAccounts.filter((_, i) => i !== index);
    setMonitoredAccounts(updatedAccounts);
    
    // Save to backend immediately
    updateUserSetting('monitored_accounts', JSON.stringify(updatedAccounts))
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Failed to update monitored accounts');
      });
  };

  const toggleSection = (section: 'business' | 'personal') => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const toggleSystemSection = () => {
    setExpandedSystemSection(!expandedSystemSection);
  };

  const renderField = (fieldKey: string, multiline: boolean = false) => {
    const field = fields[fieldKey];
    const validationError = validationErrors[fieldKey];
    
    // Special handling for monitored accounts
    if (fieldKey === 'monitoredAccounts') {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-gray-700">{field.name}</div>
            <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">{monitoredAccounts.length}/3</span>
          </div>
          
          {/* List of monitored accounts */}
          <div className="space-y-2">
            {monitoredAccounts.length === 0 ? (
              <div className="text-gray-400 text-sm italic bg-gray-50 rounded-xl p-4 text-center">
                Nenhuma conta monitorada
              </div>
            ) : (
              monitoredAccounts.map((account, index) => (
                <motion.div 
                  key={index} 
                  className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl px-4 py-3 border border-blue-100"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <span className="text-gray-800 font-medium">@{account}</span>
                  <motion.button
                    onClick={() => removeMonitoredAccount(index)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-100 p-1 rounded-full transition-all"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                </motion.div>
              ))
            )}
          </div>
          
          {/* Add new account input */}
          {monitoredAccounts.length < 3 && (
            <div className="space-y-3">
              <input
                type="text"
                value={newAccount}
                onChange={(e) => setNewAccount(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addMonitoredAccount();
                  }
                }}
                placeholder="Digite o nome da conta (sem @)"
                className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                maxLength={30}
              />
              <motion.button
                onClick={addMonitoredAccount}
                disabled={!newAccount.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Adicionar Conta
              </motion.button>
            </div>
          )}
          
          {monitoredAccounts.length >= 3 && (
            <div className="text-xs text-gray-500 text-center bg-amber-50 border border-amber-200 rounded-xl p-3">
              Limite máximo de 3 contas atingido
            </div>
          )}
        </div>
      );
    }
    
    // Use textarea for fields marked as textarea or multiline
    const shouldUseTextArea = field.isTextArea || multiline;
    
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-gray-700">{field.name}</div>
          <motion.button
            onClick={() => field.isEditing ? handleSaveField(fieldKey) : toggleEdit(fieldKey)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {field.isEditing ? (
              <Check className="w-4 h-4 text-green-600" />
            ) : (
              <Pencil className="w-4 h-4 text-gray-500" />
            )}
          </motion.button>
        </div>
        <div className="flex-1">
          {field.isEditing ? (
            <div className="space-y-3">
              {shouldUseTextArea ? (
                <textarea
                  value={field.value}
                  onChange={(e) => updateField(fieldKey, e.target.value)}
                  className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all"
                  rows={field.isTextArea ? 6 : 4}
                  autoFocus
                  placeholder={field.name}
                />
              ) : (
                <input
                  type="text"
                  value={field.value}
                  onChange={(e) => updateField(fieldKey, e.target.value)}
                  className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  autoFocus
                  placeholder={field.name}
                />
              )}
              {validationError && (
                <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-2">{validationError}</p>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-4 border-2 border-transparent hover:border-gray-200 transition-all">
              {field.value ? (
                <div className="text-gray-900">{field.value}</div>
              ) : (
                <span className="text-gray-400 italic">Não definido</span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (isPageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F5F7' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen text-black p-4" style={{ backgroundColor: '#F5F5F7' }}>
        <div className="container mx-auto">
          <div className="flex items-center mb-8">
            <button onClick={() => onPageChange('feed')} className="text-gray-900">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-semibold ml-4">Settings</h1>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: '#F5F5F7' }}>
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Settings Header */}
        <div className="pt-6 pb-8">
          <div className="flex items-center mb-6">
            <motion.button 
              className="p-2 rounded-full bg-white shadow-sm hover:shadow-md transition-all"
              onClick={() => onPageChange('feed')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </motion.button>
            <div className="ml-4">
              <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
              <p className="text-gray-600 text-sm">Personalize sua experiência</p>
            </div>
          </div>
        </div>

        {/* Purchase Popup */}
        <AnimatePresence>
          {showPurchasePopup && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-4 right-4 bg-gray-900 text-black px-6 py-4 rounded-lg shadow-lg z-50"
            >
              Você poderá comprar em breve...
            </motion.div>
          )}
        </AnimatePresence>

        {/* Niche Section */}
        <section className="mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Nicho de Espionagem</h3>
            <div className="relative">
              <motion.button
                onClick={() => setIsNicheDropdownOpen(!isNicheDropdownOpen)}
                className="w-full flex items-center justify-between py-3 px-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="text-left">
                  <div className="text-lg font-semibold text-gray-900">
                    {selectedNiche || 'Selecione um nicho'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {selectedNiche ? 'Nicho ativo' : 'Clique para escolher'}
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isNicheDropdownOpen ? 'rotate-180' : ''}`} />
              </motion.button>

            <AnimatePresence>
              {isNicheDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg overflow-hidden z-50"
                  style={{ backgroundColor: 'white' }}
                >
                  <div className="p-4">
                    <div className="relative mb-4">
                      <input
                        type="text"
                        value={nicheSearch}
                        onChange={(e) => setNicheSearch(e.target.value)}
                        placeholder="Buscar nichos..."
                        className="w-full bg-gray-50 text-gray-900 pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white border border-gray-200"
                      />
                      <Search className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-1">
                      {filteredNiches.map((niche) => (
                        <motion.button
                          key={niche.id}
                          onClick={() => handleNicheSelect(niche)}
                          className={`w-full text-left px-4 py-3 rounded-xl flex items-center justify-between transition-all ${
                            currentNicheId === niche.id
                              ? 'bg-blue-50 border-2 border-blue-200 font-semibold'
                              : 'hover:bg-gray-50 border border-transparent'
                          }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-center">
                            {niche.access ? (
                              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                            ) : (
                              <Lock className="w-4 h-4 text-gray-400 mr-3" />
                            )}
                            <div>
                              <div className="text-gray-900 font-medium">{niche.name}</div>
                              {!niche.access && <div className="text-xs text-gray-500">Premium</div>}
                            </div>
                          </div>
                          {!niche.access && (
                            <span className="text-sm font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">${niche.price}</span>
                          )}
                        </motion.button>
                      ))}
                      
                      {/* Create New Niche Button */}
                      <motion.button
                        onClick={handleCreateNewNiche}
                        className="w-full text-left px-4 py-3 rounded-xl flex items-center justify-between transition-all hover:bg-gray-50 border-t border-gray-200 mt-2"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center">
                          <Plus className="w-4 h-4 text-blue-600 mr-3" />
                          <div>
                            <div className="text-gray-900 font-medium">Criar Novo Nicho</div>
                            <div className="text-xs text-gray-500">Personalizado para você</div>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-purple-600 bg-purple-100 px-2 py-1 rounded-full">$7</span>
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            </div>
          </div>
        </section>

        {/* System Settings Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6">
          <motion.button
            onClick={toggleSystemSection}
            className="w-full p-6 flex items-center justify-between text-left hover:bg-gray-50 rounded-2xl transition-colors"
            whileHover={{ scale: 1.005 }}
            whileTap={{ scale: 0.995 }}
          >
            <div>
              <span className="text-lg font-semibold text-gray-900">Configurações do Sistema</span>
              <p className="text-sm text-gray-500 mt-1">Tom de voz e contas monitoradas</p>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-gray-400 transition-transform ${
                expandedSystemSection ? 'rotate-180' : ''
              }`}
            />
          </motion.button>
          <AnimatePresence>
            {expandedSystemSection && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-6 space-y-6 border-t border-gray-100">
                  {renderField('toneOfVoice', true)}
                  {renderField('monitoredAccounts')}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Business Info Section */}
        <div className="border-t border-gray-200">
          <button
            onClick={() => toggleSection('business')}
            className="w-full py-4 flex items-center justify-between text-left"
          >
            <span className="text-lg font-semibold">Informações da Empresa</span>
            <ChevronDown
              className={`w-5 h-5 text-gray-600 transition-transform ${
                expandedSection === 'business' ? 'rotate-180' : ''
              }`}
            />
          </button>
          <AnimatePresence>
            {expandedSection === 'business' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="space-y-4 pb-4">
                  {renderField('businessName')}
                  {renderField('instagram')}
                  {renderField('website')}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Personal Info Section */}
        <div className="border-t border-gray-200">
          <button
            onClick={() => toggleSection('personal')}
            className="w-full py-4 flex items-center justify-between text-left"
          >
            <span className="text-lg font-semibold">Informações Pessoais</span>
            <ChevronDown
              className={`w-5 h-5 text-gray-600 transition-transform ${
                expandedSection === 'personal' ? 'rotate-180' : ''
              }`}
            />
          </button>
          <AnimatePresence>
            {expandedSection === 'personal' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="space-y-3 pb-4">
                  <div className="py-2">
                    <div className="text-sm text-gray-600">Nome</div>
                    <div className="text-gray-900 mt-1">{userSettings?.name}</div>
                  </div>
                  <div className="py-2">
                    <div className="text-sm text-gray-600">Email</div>
                    <div className="text-gray-900 mt-1">{userSettings?.email}</div>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center py-2 text-red-500"
                  >
                    <LogOut className="w-5 h-5 mr-2" />
                    <span>Sair</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;