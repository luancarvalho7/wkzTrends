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
  const [activeTab, setActiveTab] = useState<'system' | 'plans' | 'business' | 'personal'>('system');
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

  const tabs = [
    { id: 'system' as const, label: 'Sistema' },
    { id: 'plans' as const, label: 'Planos' },
    { id: 'business' as const, label: 'Empresa' },
    { id: 'personal' as const, label: 'Pessoal' }
  ];

  const plans = [
    {
      id: 'plan1',
      name: 'Plano 1',
      price: null,
      features: ['3 perfis', '3 conteúdos/dia'],
      current: true
    },
    {
      id: 'plan2',
      name: 'Plano 2',
      price: null,
      features: ['5 perfis', '5 conteúdos/dia'],
      current: false
    },
    {
      id: 'plan3',
      name: 'Plano 3',
      price: null,
      features: ['Ilimitado'],
      current: false
    }
  ];

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
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent resize-none mt-1 overflow-hidden"
                  style={{ minHeight: '80px', maxHeight: '120px' }}
                  rows={field.isTextArea ? 6 : 4}
                  autoFocus
                  maxLength={500}
                />
              ) : (
                <input
                  type="text"
                  value={field.value}
                  onChange={(e) => updateField(fieldKey, e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent mt-1"
                  autoFocus
                  maxLength={100}
                />
              )}
              {validationError && (
                <p className="text-red-500 text-sm">{validationError}</p>
              )}
            </div>
          ) : (
            <div className="text-black mt-1 break-words max-w-full overflow-hidden">
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

        {/* Tabs Navigation */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-8 overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-4 py-4 text-sm font-medium transition-colors relative ${
                    activeTab === tab.id
                      ? 'text-gray-900 bg-gray-50 border-b-2 border-gray-900'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'system' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="space-y-6">
                  {renderField('toneOfVoice', true)}
                  <div className="border-t border-gray-100 pt-4">
                    {renderField('monitoredAccounts')}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'plans' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="grid gap-6 md:grid-cols-3">
                  {plans.map((plan) => (
                    <motion.div
                      key={plan.id}
                      className={`relative p-6 rounded-2xl transition-all ${
                        plan.current
                          ? 'bg-gray-900 text-white shadow-lg'
                          : 'bg-white border border-gray-200 hover:border-gray-300 hover:shadow-md'
                      }`}
                      whileHover={plan.current ? {} : { y: -4 }}
                      transition={{ duration: 0.2 }}
                    >
                      {plan.current && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <span className="text-xs bg-blue-500 text-white px-3 py-1 rounded-full font-medium shadow-md">
                            Plano Atual
                          </span>
                        </div>
                      )}
                      <div className="text-center mb-6">
                        <h4 className={`text-lg font-semibold mb-2 ${
                          plan.current ? 'text-white' : 'text-gray-900'
                        }`}>
                          {plan.name}
                        </h4>
                      </div>
                      <div className="space-y-3 mb-6">
                        {plan.features.map((feature, index) => (
                          <div key={index} className={`flex items-center justify-center text-base ${
                            plan.current ? 'text-gray-100' : 'text-gray-700'
                          }`}>
                            <Check className="w-5 h-5 mr-2 flex-shrink-0" />
                            <span className="font-medium">{feature}</span>
                          </div>
                        ))}
                      </div>
                      {!plan.current && (
                        <button
                          onClick={() => {
                            setShowPurchasePopup(true);
                            setTimeout(() => setShowPurchasePopup(false), 3000);
                          }}
                          className="w-full py-3 px-4 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all text-sm font-semibold shadow-sm hover:shadow-md"
                        >
                          Selecionar Plano
                        </button>
                      )}
                      {plan.current && (
                        <div className="w-full py-3 px-4 bg-white/10 text-white rounded-xl text-sm font-semibold text-center">
                          Plano Ativo
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'business' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="space-y-6">
                  {renderField('businessName')}
                  <div className="border-t border-gray-100 pt-4">
                    {renderField('instagram')}
                  </div>
                  <div className="border-t border-gray-100 pt-4">
                    {renderField('website')}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'personal' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="space-y-4">
                  <div className="py-3 border-b border-gray-100">
                    <div className="text-sm text-gray-600">Nome</div>
                    <div className="text-gray-900 mt-1 font-medium break-words">{userSettings?.name}</div>
                  </div>
                  <div className="py-3 border-b border-gray-100">
                    <div className="text-sm text-gray-600">Email</div>
                    <div className="text-gray-900 mt-1 font-medium break-all">{userSettings?.email}</div>
                  </div>
                  <div className="pt-4">
                    <motion.button 
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center py-3 px-4 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors font-medium"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <LogOut className="w-5 h-5 mr-2" />
                      <span>Sair</span>
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;