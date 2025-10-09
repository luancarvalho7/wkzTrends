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
        <div className="py-2">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-400">{field.name}</div>
            <span className="text-xs text-gray-500">{monitoredAccounts.length}/3 contas</span>
          </div>
          
          {/* List of monitored accounts */}
          <div className="space-y-2 mb-3">
            {monitoredAccounts.length === 0 ? (
              <div className="text-gray-500 text-sm italic">Nenhuma conta adicionada</div>
            ) : (
              monitoredAccounts.map((account, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-100 rounded-lg px-3 py-2">
                  <span className="text-black">@{account}</span>
                  <button
                    onClick={() => removeMonitoredAccount(index)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
          
          {/* Add new account input */}
          {monitoredAccounts.length < 3 && (
            <div className="space-y-2">
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
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400"
                maxLength={30}
              />
              <button
                onClick={addMonitoredAccount}
                disabled={!newAccount.trim()}
                className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                Adicionar Conta
              </button>
            </div>
          )}
          
          {monitoredAccounts.length >= 3 && (
            <div className="text-xs text-gray-500 mt-2">
              Limite máximo de 3 contas atingido
            </div>
          )}
        </div>
      );
    }
    
    // Use textarea for fields marked as textarea or multiline
    const shouldUseTextArea = field.isTextArea || multiline;
    
    return (
      <div className="flex items-start justify-between py-2">
        <div className="flex-1">
          <div className="text-sm text-gray-400">{field.name}</div>
          {field.isEditing ? (
            <div className="space-y-2">
              {shouldUseTextArea ? (
                <textarea
                  value={field.value}
                  onChange={(e) => updateField(fieldKey, e.target.value)}
                  className="w-full bg-transparent text-black focus:outline-none resize-none mt-1"
                  rows={field.isTextArea ? 6 : 4}
                  autoFocus
                />
              ) : (
                <input
                  type="text"
                  value={field.value}
                  onChange={(e) => updateField(fieldKey, e.target.value)}
                  className="w-full bg-transparent text-black focus:outline-none mt-1"
                  autoFocus
                />
              )}
              {validationError && (
                <p className="text-red-500 text-sm">{validationError}</p>
              )}
            </div>
          ) : (
            <div className="text-black mt-1">
              {field.value || <span className="text-gray-500">Não definido</span>}
            </div>
          )}
        </div>
        <button
          onClick={() => field.isEditing ? handleSaveField(fieldKey) : toggleEdit(fieldKey)}
          className="ml-4 text-gray-400 hover:text-black transition-colors"
        >
          {field.isEditing ? (
            <Check className="w-4 h-4" />
          ) : (
            <Pencil className="w-4 h-4" />
          )}
        </button>
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
                    style={{ backgroundColor: '#F5F5F7' }}
                  >
                    <div className="p-2">
                      <div className="relative mb-2">
                        <input
                          type="text"
                          value={nicheSearch}
                          onChange={(e) => setNicheSearch(e.target.value)}
                          placeholder="Buscar nichos..."
                          className="w-full bg-gray-100 text-gray-900 pl-8 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
                        />
                        <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-500" />
                      </div>
                      <div className="max-h-60 overflow-y-auto">
                        {filteredNiches.map((niche) => (
                          <button
                            key={niche.id}
                            onClick={() => handleNicheSelect(niche)}
                            className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-colors ${
                              currentNicheId === niche.id
                                ? 'bg-gray-100 font-bold'
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center">
                              {niche.access ? (
                                <Check className="w-4 h-4 text-green-600 mr-2" />
                              ) : (
                                <Lock className="w-4 h-4 text-gray-500 mr-2" />
                              )}
                              <span className="text-gray-900">{niche.name}</span>
                            </div>
                            {!niche.access && (
                              <span className="text-sm font-medium text-gray-900">${niche.price}</span>
                            )}
                          </button>
                        ))}
                        
                        {/* Create New Niche Button */}
                        <button
                          onClick={handleCreateNewNiche}
                          className="w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-colors hover:bg-gray-50 border-t border-gray-200"
                        >
                          <div className="flex items-center">
                            <Plus className="w-4 h-4 text-gray-700 mr-2" />
                            <span className="text-black">Criar Novo Nicho</span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">$7</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* System Settings Section */}
        <div className="border-t border-gray-200">
          <button
            onClick={toggleSystemSection}
            className="w-full py-4 flex items-center justify-between text-left"
          >
            <span className="text-lg font-semibold">Configurações do Sistema</span>
            <ChevronDown
              className={`w-5 h-5 text-gray-600 transition-transform ${
                expandedSystemSection ? 'rotate-180' : ''
              }`}
            />
          </button>
          <AnimatePresence>
            {expandedSystemSection && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="space-y-4 pb-4">
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