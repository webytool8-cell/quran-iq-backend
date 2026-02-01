/**
 * Application Entry File
 * 
 * Includes:
 * 1. Utils (Agent, Auth, DB)
 * 2. Components (UI)
 * 3. Main App Logic
 */

/* =========================================
   UTILS: AUTH & CHAT AGENT (VIA API CLIENT)
   ========================================= */

const STORAGE_KEY = 'living_quran_user';

async function loginUser(email, password) {
    try {
        const user = await apiClient.login(email, password);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        return user;
    } catch (error) {
        throw new Error(error.message || "Invalid email or password.");
    }
}

async function registerUser(name, email, password) {
    try {
        const user = await apiClient.register(name, email, password);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        return user;
    } catch (error) {
        throw new Error(error.message || "Email already registered.");
    }
}

function logoutUser() {
    apiClient.logout();
    localStorage.removeItem(STORAGE_KEY);
}

async function getCurrentUser() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return null;

        const cachedUser = JSON.parse(stored);
        
        // Verify session is still valid with backend
        const user = await apiClient.verifySession();
        
        if (user) {
            // Update cached data with latest from server
            localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
            return user;
        }
        
        // Token expired or invalid
        localStorage.removeItem(STORAGE_KEY);
        return null;
    } catch (e) {
        console.warn('Session verification failed:', e);
        localStorage.removeItem(STORAGE_KEY);
        return null;
    }
}

async function saveChapterToDB(userId, title, content) {
    try {
        const chapter = await apiClient.createChapter(userId, title, content);
        return chapter;
    } catch (error) {
        console.error('Failed to save chapter:', error);
        throw error;
    }
}

async function getChaptersFromDB(userId) {
    try {
        const chapters = await apiClient.listChapters(userId);
        return chapters.sort((a, b) => 
            new Date(b.timestamp) - new Date(a.timestamp)
        );
    } catch (error) {
        console.error('Failed to load chapters:', error);
        return [];
    }
}

async function getQuranResponse(userQuestion, chatHistory) {
    try {
        console.log("Processing question:", userQuestion);
        
        const response = await apiClient.askQuestion(userQuestion, chatHistory);
        
        console.log("AI response received");
        return response.response;
    } catch (error) {
        console.error("Chat error:", error);
        
        // User-friendly error messages for mobile
        if (error.message.includes('network') || error.message.includes('timeout')) {
            return "Connection issue detected. Please check your internet and try again.";
        }
        
        if (error.message.includes('Unauthorized')) {
            return "Your session has expired. Please sign in again.";
        }
        
        return "We encountered an issue. Please try again in a moment.";
    }
}


/* =========================================
   COMPONENTS
   ========================================= */

function Toast({ message, type = 'error', onClose }) {
    React.useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[70] px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in-up ${
            type === 'error' ? 'bg-red-500 text-white' : 'bg-[var(--primary-accent)] text-white'
        }`}>
            <div className={type === 'error' ? 'icon-circle-alert' : 'icon-circle-check'}></div>
            <span className="font-ui font-medium text-sm">{message}</span>
            <button onClick={onClose} className="opacity-70 hover:opacity-100 ml-2">
                <div className="icon-x text-sm"></div>
            </button>
        </div>
    );
}

function LoadingState() {
    return (
        <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
            <svg className="w-32 h-32 mb-6" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" 
                    className="stroke-[var(--primary-accent)]/20" 
                    strokeWidth="2" fill="none"
                    strokeDasharray="251.2" 
                    strokeDashoffset="0">
                    <animate attributeName="stroke-dashoffset" 
                        from="0" to="251.2" dur="2s" repeatCount="indefinite"/>
                </circle>
                <text x="50" y="55" textAnchor="middle" 
                    className="font-arabic text-2xl fill-[var(--primary-accent)]"
                    style={{fontSize: '24px'}}>
                    بسم
                </text>
            </svg>
            <div 
                role="status" 
                aria-live="polite" 
                className="font-ui text-sm text-stone-500 animate-pulse"
            >
                Consulting sacred knowledge...
            </div>
        </div>
    );
}

function ProfileView({ user, stats, onLogout }) {
    return (
        <div className="px-6 py-8 pb-32 animate-fade-in">
            <header className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="font-ui font-bold text-3xl text-[var(--ink-color)] mb-2">My Profile</h1>
                    <p className="font-ui text-stone-500 text-sm">Manage your account and progress.</p>
                </div>
                <button 
                    onClick={onLogout}
                    className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors flex items-center gap-2 text-sm font-bold"
                >
                    <div className="icon-log-out text-lg"></div>
                    <span className="hidden sm:inline">Sign Out</span>
                </button>
            </header>

            <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm mb-8 flex flex-col md:flex-row items-center md:items-start gap-6">
                <div className="w-24 h-24 rounded-full bg-[var(--primary-accent)] text-white flex items-center justify-center font-bold font-ui text-4xl shadow-lg border-4 border-stone-50">
                    {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-center md:text-left flex-1">
                    <h2 className="font-ui font-bold text-2xl text-gray-800">{user.name}</h2>
                    <p className="text-gray-500 font-medium mb-4">{user.email}</p>
                    <div className="flex flex-wrap justify-center md:justify-start gap-2">
                        <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider border border-emerald-100">
                            Premium Member
                        </span>
                        <span className="px-3 py-1 rounded-full bg-stone-100 text-stone-600 text-xs font-bold uppercase tracking-wider">
                            Joined {new Date().getFullYear()}
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm text-center">
                    <div className="w-10 h-10 mx-auto bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-2">
                        <div className="icon-message-circle text-xl"></div>
                    </div>
                    <div className="font-bold text-2xl text-gray-800">{stats.inquiries || 0}</div>
                    <div className="text-xs text-stone-400 font-bold uppercase tracking-wider">Inquiries</div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm text-center">
                    <div className="w-10 h-10 mx-auto bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mb-2">
                        <div className="icon-bookmark text-xl"></div>
                    </div>
                    <div className="font-bold text-2xl text-gray-800">{stats.saved || 0}</div>
                    <div className="text-xs text-stone-400 font-bold uppercase tracking-wider">Saved</div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm text-center">
                    <div className="w-10 h-10 mx-auto bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mb-2">
                        <div className="icon-map text-xl"></div>
                    </div>
                    <div className="font-bold text-2xl text-gray-800">2</div>
                    <div className="text-xs text-stone-400 font-bold uppercase tracking-wider">Journeys</div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm text-center">
                    <div className="w-10 h-10 mx-auto bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mb-2">
                        <div className="icon-heart text-xl"></div>
                    </div>
                    <div className="font-bold text-2xl text-gray-800">14</div>
                    <div className="text-xs text-stone-400 font-bold uppercase tracking-wider">Duas Read</div>
                </div>
            </div>

            <h3 className="font-ui font-bold text-xl mb-4 text-gray-800">Account Settings</h3>
            <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-4 bg-white border border-stone-200 rounded-xl hover:border-[var(--primary-accent)] transition-colors group">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-stone-50 text-stone-500 flex items-center justify-center group-hover:bg-[var(--primary-accent)] group-hover:text-white transition-colors">
                            <div className="icon-bell text-lg"></div>
                        </div>
                        <div className="text-left">
                            <h4 className="font-bold text-gray-800 text-sm">Notifications</h4>
                            <p className="text-xs text-gray-400">Manage daily reminders</p>
                        </div>
                    </div>
                    <div className="icon-chevron-right text-stone-300"></div>
                </button>
                <button className="w-full flex items-center justify-between p-4 bg-white border border-stone-200 rounded-xl hover:border-[var(--primary-accent)] transition-colors group">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-stone-50 text-stone-500 flex items-center justify-center group-hover:bg-[var(--primary-accent)] group-hover:text-white transition-colors">
                            <div className="icon-lock text-lg"></div>
                        </div>
                        <div className="text-left">
                            <h4 className="font-bold text-gray-800 text-sm">Privacy & Security</h4>
                            <p className="text-xs text-gray-400">Change password, data usage</p>
                        </div>
                    </div>
                    <div className="icon-chevron-right text-stone-300"></div>
                </button>
                <button className="w-full flex items-center justify-between p-4 bg-white border border-stone-200 rounded-xl hover:border-[var(--primary-accent)] transition-colors group">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-stone-50 text-stone-500 flex items-center justify-center group-hover:bg-[var(--primary-accent)] group-hover:text-white transition-colors">
                            <div className="icon-circle-help text-lg"></div>
                        </div>
                        <div className="text-left">
                            <h4 className="font-bold text-gray-800 text-sm">Help & Support</h4>
                            <p className="text-xs text-gray-400">FAQ, contact us</p>
                        </div>
                    </div>
                    <div className="icon-chevron-right text-stone-300"></div>
                </button>
            </div>

            <div className="mt-8 pt-6 border-t border-stone-200">
                <h3 className="font-ui font-bold text-sm text-gray-400 uppercase tracking-wider mb-4">About App</h3>
                <div className="bg-stone-50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Version</span>
                        <span className="font-mono text-gray-400">{APP_CONFIG.version}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Privacy Policy</span>
                        <a 
                            href={APP_CONFIG.privacyPolicyUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[var(--primary-accent)] font-bold hover:underline flex items-center gap-1"
                        >
                            Read Policy <div className="icon-external-link text-xs"></div>
                        </a>
                    </div>
                     <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Contact Support</span>
                        <a 
                            href={`mailto:${APP_CONFIG.supportEmail}`}
                            className="text-[var(--primary-accent)] font-bold hover:underline"
                        >
                            {APP_CONFIG.supportEmail}
                        </a>
                    </div>
                </div>
                <div className="mt-6 text-center">
                    <p className="text-xs text-stone-300">
                        {APP_CONFIG.name} &copy; {new Date().getFullYear()}
                    </p>
                </div>
            </div>
        </div>
    );
}

function AuthModal({ isOpen, onClose, onLogin }) {
    const [isLogin, setIsLogin] = React.useState(true);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState('');
    const [name, setName] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            let user;
            if (isLogin) {
                user = await loginUser(email, password);
            } else {
                if (!name) throw new Error("Name is required.");
                user = await registerUser(name, email, password);
            }
            onLogin(user);
            onClose();
        } catch (err) {
            console.error(err);
            setError(err.message || "An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError('');
        
        try {
            // Simulate Network Delay
            await new Promise(r => setTimeout(r, 1000));
            
            const googleEmail = "karim.ahmed@example.com";
            const googleName = "Karim Ahmed";
            
            // 1. Check if user exists in DB
            const result = await trickleListObjects('users', 100, true);
            const users = result.items || [];
            let targetUser = users.find(u => u.objectData.email === googleEmail);

            // 2. If not, create new user in DB
            if (!targetUser) {
                targetUser = await trickleCreateObject('users', {
                    name: googleName,
                    email: googleEmail,
                    password: 'google-oauth-placeholder', // Dummy password for OAuth users
                    journeyProgress: JSON.stringify({}),
                    joinedAt: new Date().toISOString(),
                    provider: 'google'
                });
            }

            // 3. Process Login with REAL database ID
            const userData = { ...targetUser.objectData, id: targetUser.objectId };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
            onLogin(userData);
            onClose();
        } catch (err) {
            console.error("Google Login Error:", err);
            setError("Failed to initialize Google sign-in. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up">
                <div className="p-8 pb-0 text-center">
                    <div className="mb-6 flex justify-center">
                        <Logo className="h-16" />
                    </div>
                    <h2 className="font-ui font-bold text-2xl text-[var(--ink-color)]">
                        {isLogin ? 'Welcome Back' : 'Join Us'}
                    </h2>
                    <p className="text-gray-500 text-sm mt-2">
                        Your intelligent companion for wisdom.
                    </p>
                </div>

                <div className="p-8">
                    {error && (
                        <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-lg flex items-center gap-2">
                            <div className="icon-circle-alert"></div>
                            {error}
                        </div>
                    )}

                    <div className="space-y-3 mb-6">
                        <button 
                            type="button"
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            className="w-full py-3 bg-white border border-stone-200 hover:bg-stone-50 text-gray-700 font-bold rounded-xl transition-all flex justify-center items-center gap-3 relative group"
                        >
                            <div className="w-5 h-5 flex items-center justify-center">
                                <svg viewBox="0 0 24 24" className="w-full h-full">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05"/>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                </svg>
                            </div>
                            <span>Continue with Google</span>
                        </button>
                    </div>

                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-stone-200"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-gray-400 font-bold">Or continue with email</span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && (
                            <div>
                                <input 
                                    type="text" 
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="w-full px-5 py-4 rounded-xl bg-stone-50 border-none focus:ring-2 focus:ring-[var(--primary-accent)]/20 text-gray-800 placeholder-gray-400 font-medium transition-all"
                                    placeholder="Full Name"
                                />
                            </div>
                        )}
                        <div>
                            <input 
                                type="email" 
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full px-5 py-4 rounded-xl bg-stone-50 border-none focus:ring-2 focus:ring-[var(--primary-accent)]/20 text-gray-800 placeholder-gray-400 font-medium transition-all"
                                placeholder="Email Address"
                                required
                            />
                        </div>
                        <div>
                            <input 
                                type="password" 
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full px-5 py-4 rounded-xl bg-stone-50 border-none focus:ring-2 focus:ring-[var(--primary-accent)]/20 text-gray-800 placeholder-gray-400 font-medium transition-all"
                                placeholder="Password"
                                required
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full py-4 mt-2 bg-[var(--primary-accent)] hover:bg-[var(--secondary-accent)] hover:text-[var(--primary-accent)] text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-70 flex justify-center items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="icon-loader animate-spin"></div>
                                    <span>Processing...</span>
                                </>
                            ) : (
                                isLogin ? 'Sign In' : 'Create Account'
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center border-t border-stone-100 pt-6">
                        <p className="text-sm text-gray-500">
                            {isLogin ? "Don't have an account?" : "Already have an account?"}
                            <button 
                                onClick={() => { setIsLogin(!isLogin); setError(''); }}
                                className="ml-2 text-[var(--primary-accent)] font-bold hover:underline"
                            >
                                {isLogin ? "Sign Up" : "Log In"}
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function TableOfContents({ isOpen, onClose, chapters, currentChapterId, onSelectChapter, onNewChapter, user, onLogin, onLogout, onViewSaved }) {
    const [touchStart, setTouchStart] = React.useState(0);
    const [touchEnd, setTouchEnd] = React.useState(0);

    const handleTouchStart = (e) => {
        setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (touchStart - touchEnd > 100) {
            onClose(); // Swipe left to close
        }
    };

    React.useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; }
    }, [isOpen]);

    return (
        <React.Fragment>
            <div 
                className={`fixed inset-0 bg-stone-900/30 backdrop-blur-sm z-30 transition-opacity duration-300 lg:hidden
                ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            ></div>
            
            <aside 
                onTouchStart={handleTouchStart}
                onTouchMove={(e) => setTouchEnd(e.targetTouches[0].clientX)}
                onTouchEnd={handleTouchEnd}
                className={`
                fixed lg:static inset-y-0 left-0 z-40 w-[85vw] max-w-[320px] bg-[#FAF9F6] border-r border-stone-200 
                transform transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1) flex flex-col shadow-2xl lg:shadow-none
                ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-0 lg:border-none lg:overflow-hidden'}
                ${isOpen ? 'lg:w-[320px] lg:border-r' : ''} 
            `}>
                <div className="p-6 pt-12 lg:pt-8 pb-4">
                    <div className="flex items-center justify-between mb-8">
                         <h2 className="font-ui font-bold text-xs tracking-[0.2em] text-[var(--gold-accent)] uppercase">
                            Library
                        </h2>
                        <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-gray-600">
                            <div className="icon-x text-xl"></div>
                        </button>
                    </div>
                   
                    <button 
                        onClick={onNewChapter}
                        className="w-full flex items-center gap-3 bg-white border border-stone-200 p-4 rounded-xl shadow-sm hover:border-[var(--primary-accent)] hover:shadow-md transition-all group text-left"
                    >
                        <div className="w-10 h-10 rounded-full bg-[var(--paper-bg)] flex items-center justify-center text-[var(--primary-accent)] group-hover:bg-[var(--primary-accent)] group-hover:text-white transition-colors">
                            <div className="icon-plus text-lg"></div>
                        </div>
                        <div>
                            <span className="block font-ui font-bold text-sm text-gray-900">New Inquiry</span>
                            <span className="block text-xs text-gray-400">Ask a new question</span>
                        </div>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-2">
                    <div className="mb-6">
                        <button 
                            onClick={onViewSaved}
                            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-white hover:shadow-sm transition-all text-gray-600 hover:text-[var(--primary-accent)]"
                        >
                            <span className="flex items-center gap-3 font-ui text-sm font-bold">
                                <div className="icon-grid-2x2"></div>
                                View All Saved
                            </span>
                            <div className="icon-chevron-right text-xs opacity-50"></div>
                        </button>
                    </div>

                    <h3 className="px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Recent History</h3>

                    {chapters.length === 0 && (
                        <div className="text-stone-400 text-sm italic text-center py-6 px-4 border border-dashed border-stone-200 rounded-lg">
                            {user ? "Your history is empty." : "Sign in to save your journey."}
                        </div>
                    )}

                    {chapters.map((chapter) => (
                        <button 
                            key={chapter.id}
                            onClick={() => onSelectChapter(chapter.id)}
                            className={`
                                w-full text-left p-3 rounded-lg transition-all duration-200 group relative overflow-hidden
                                ${currentChapterId === chapter.id 
                                    ? 'bg-[var(--primary-accent)] text-white shadow-md' 
                                    : 'hover:bg-white hover:text-gray-900 text-gray-600'}
                            `}
                        >
                            <h3 className={`font-ui text-sm font-bold mb-1 truncate ${currentChapterId === chapter.id ? 'text-white' : 'text-gray-800'}`}>
                                {chapter.title}
                            </h3>
                            <div className={`flex items-center gap-2 text-[10px] ${currentChapterId === chapter.id ? 'text-white/70' : 'text-gray-400'}`}>
                                <div className="icon-clock text-[10px]"></div>
                                <span>{new Date(chapter.timestamp).toLocaleDateString()}</span>
                            </div>
                        </button>
                    ))}
                </div>

                <div className="p-6 border-t border-stone-200 bg-stone-50/50">
                    {user ? (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[var(--primary-accent)] text-white flex items-center justify-center font-bold font-ui shadow-sm border-2 border-white">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-gray-900">{user.name}</span>
                                    <span className="text-[10px] text-gray-500 uppercase tracking-wide">Member</span>
                                </div>
                            </div>
                            <button onClick={onLogout} className="text-gray-400 hover:text-red-600 transition-colors p-2" title="Sign Out">
                                <div className="icon-log-out text-lg"></div>
                            </button>
                        </div>
                    ) : (
                        <button 
                            onClick={onLogin}
                            className="w-full py-3 bg-white border border-stone-200 rounded-lg text-sm font-bold text-gray-700 hover:text-[var(--primary-accent)] hover:border-[var(--primary-accent)] shadow-sm transition-all flex items-center justify-center gap-2"
                        >
                            <div className="icon-user"></div>
                            Sign In / Register
                        </button>
                    )}
                </div>
            </aside>
        </React.Fragment>
    );
}

function BookPage({ chapter, onFollowUp }) {
    const rawContent = chapter.content || "";
    const isLoading = chapter.isLoading;

    // Parse suggestions from content if they exist
    let displayContent = rawContent;
    let suggestions = [];

    if (rawContent.includes(":::FOLLOW_UPS:::")) {
        const parts = rawContent.split(":::FOLLOW_UPS:::");
        displayContent = parts[0];
        
        // Only attempt to parse if the JSON string looks complete to avoid errors during streaming
        const jsonString = parts[1].trim();
        if (jsonString.endsWith(']')) {
            try {
                suggestions = JSON.parse(jsonString);
            } catch (e) {
                // Silently fail if JSON is still malformed during stream, or log if needed
                // console.warn("Parsing suggestions...", e); 
            }
        }
    }

    if (isLoading) {
        return <LoadingState />;
    }

    if (!displayContent) {
        return (
             <article className="animate-fade-in text-center py-20 px-6">
                 <div className="w-16 h-16 mx-auto bg-stone-100 rounded-full flex items-center justify-center mb-4 text-stone-400">
                     <div className="icon-file-question text-2xl"></div>
                 </div>
                 <h2 className="font-ui font-bold text-xl text-stone-600 mb-2">No Content Available</h2>
                 <p className="font-body text-lg text-stone-500 max-w-md mx-auto">
                     We could not retrieve the wisdom for this inquiry. Please try asking again.
                 </p>
             </article>
        );
    }

    const isVerseLike = (text) => {
        return /Surah|Ayat|\[\d+:\d+\]/.test(text) || (text.includes('"') && text.length > 20);
    };

    const isDeepQuestion = (text) => {
        return text.includes("Ask yourself:") || text.includes("Deep Question:");
    };

    return (
        <article className="animate-fade-in pb-32">
            <header className="mb-12 text-center border-b-2 border-[var(--gold-accent)] pb-8 mx-auto max-w-lg">
                <span className="block font-ui text-xs tracking-[0.3em] text-[var(--gold-accent)] uppercase mb-4">
                    Inquiry
                </span>
                <h1 className="font-body text-4xl md:text-5xl text-[var(--ink-color)] mb-4 leading-tight">
                    {chapter.title}
                </h1>
                <div className="flex justify-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-[var(--gold-accent)]"></div>
                    <div className="w-1 h-1 rounded-full bg-[var(--gold-accent)]"></div>
                    <div className="w-1 h-1 rounded-full bg-[var(--gold-accent)]"></div>
                </div>
            </header>

            <div className="prose-content font-body text-xl leading-9 md:text-2xl md:leading-10 text-gray-700">
                {displayContent.split('\n').map((para, idx) => {
                    const cleanPara = para.trim();
                    if (!cleanPara) return <br key={idx} />;
                    
                    const isArabic = /[\u0600-\u06FF]/.test(cleanPara) && cleanPara.length > 5;

                    if (isArabic) {
                        return (
                            <div key={idx} className="relative py-8 px-6 my-8 bg-white rounded-lg border border-stone-100 shadow-sm text-center group transition-all hover:shadow-md hover:border-[var(--primary-accent)]/20">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-[var(--paper-bg)] flex items-center justify-center">
                                    <div className="icon-star text-[var(--gold-accent)] text-xs"></div>
                                </div>
                                <p className="font-arabic text-4xl md:text-5xl leading-[2.8] md:leading-loose text-[var(--primary-accent)] dir-rtl mb-2">
                                    {cleanPara}
                                </p>
                            </div>
                        );
                    }

                    if (isDeepQuestion(cleanPara)) {
                         return (
                            <div key={idx} className="bg-gradient-to-br from-[var(--paper-bg)] to-amber-50 p-6 rounded-xl border border-amber-100/50 my-8 shadow-inner">
                                <div className="flex items-center gap-3 mb-2 text-amber-700 font-ui font-bold text-sm uppercase tracking-wider">
                                    <div className="icon-sparkles"></div>
                                    Inner Reflection
                                </div>
                                <p className="italic text-[var(--ink-color)] font-serif text-2xl">
                                    {cleanPara.replace('Deep Question:', '').replace('Ask yourself:', '').trim()}
                                </p>
                            </div>
                        );
                    }

                    if (isVerseLike(cleanPara)) {
                         return (
                            <blockquote key={idx} className="border-l-4 border-[var(--gold-accent)] pl-6 py-2 my-6 italic text-gray-600 bg-stone-50/50 rounded-r-lg">
                                {cleanPara}
                            </blockquote>
                        );
                    }

                    return <p key={idx}>{cleanPara}</p>;
                })}
            </div>

            {suggestions.length > 0 && (
                <div className="max-w-2xl mx-auto px-6 mt-12 animate-slide-up">
                    <div className="flex items-center gap-3 mb-4 opacity-60">
                         <div className="h-px flex-1 bg-stone-300"></div>
                         <span className="font-ui text-xs font-bold uppercase tracking-widest text-stone-400">Continue the Journey</span>
                         <div className="h-px flex-1 bg-stone-300"></div>
                    </div>
                    <div className="flex flex-col gap-3">
                        {suggestions.map((s, i) => (
                            <button 
                                key={i}
                                onClick={() => onFollowUp(s)}
                                className="w-full p-4 rounded-xl border border-stone-200 bg-white hover:border-[var(--primary-accent)] hover:shadow-md hover:-translate-y-0.5 transition-all text-left flex items-center justify-between group"
                            >
                                <span className="font-ui font-medium text-gray-700 group-hover:text-[var(--primary-accent)] transition-colors">{s}</span>
                                <div className="w-8 h-8 rounded-full bg-stone-50 text-stone-400 flex items-center justify-center group-hover:bg-[var(--primary-accent)] group-hover:text-white transition-all">
                                    <div className="icon-arrow-right text-sm"></div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="mt-16 flex items-center justify-center gap-4 opacity-30">
                <div className="h-px w-12 bg-gray-400"></div>
                <div className="icon-flower text-xl"></div>
                <div className="h-px w-12 bg-gray-400"></div>
            </div>
        </article>
    );
}

function CoverPage({ onSearch }) {
    const [input, setInput] = React.useState('');

    const suggestions = [
        { text: "Significance of Patience (Sabr)", icon: "icon-sun" },
        { text: "Story of Yusuf (Joseph)", icon: "icon-book-open" },
        { text: "Charity & Kindness", icon: "icon-heart-handshake" },
        { text: "Finding Peace", icon: "icon-moon" }
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        if (input.trim()) onSearch(input);
    };

    return (
        <div className="min-h-[85vh] flex flex-col items-center justify-center text-center animate-fade-in px-4 pb-20 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[var(--gold-accent)]/5 rounded-full blur-3xl -z-10"></div>
            
            <div className="relative z-10 mb-8 transform hover:scale-105 transition-transform duration-700">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-[var(--primary-accent)] to-[#0A2A20] rounded-3xl rotate-45 flex items-center justify-center shadow-2xl border-4 border-[#F7F5F0]">
                    <div className="-rotate-45">
                        <Logo className="h-14 w-auto brightness-0 invert" showText={false} />
                    </div>
                </div>
            </div>

            <h1 className="font-ui font-bold text-6xl md:text-7xl text-[var(--ink-color)] mb-4 tracking-tight">
                QuranIQ
            </h1>
            
            <div className="flex items-center gap-3 mb-8 opacity-60">
                <div className="h-px w-12 bg-[var(--gold-accent)]"></div>
                <div className="icon-star text-[var(--gold-accent)] text-xs"></div>
                <div className="h-px w-12 bg-[var(--gold-accent)]"></div>
            </div>

            <p className="font-body text-xl md:text-2xl text-stone-600 max-w-lg mx-auto mb-12 leading-relaxed">
                Intelligent wisdom for the modern soul. <br/>
                <span className="text-stone-400 text-lg">Ask anything about the Quran & Islamic teachings.</span>
            </p>

            <form onSubmit={handleSubmit} className="w-full max-w-2xl relative mb-16 group z-10">
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary-accent)]/5 via-[var(--gold-accent)]/10 to-[var(--primary-accent)]/5 blur-xl rounded-full scale-90 group-hover:scale-105 transition-transform duration-500 opacity-0 group-hover:opacity-100"></div>
                <div className="relative flex items-center bg-white border border-stone-200 rounded-full shadow-xl hover:shadow-2xl hover:border-[var(--primary-accent)]/30 transition-all duration-300 overflow-hidden p-2 pl-6 group-hover:-translate-y-1">
                    <div className="text-[var(--gold-accent)] mr-4">
                        <div className="icon-search text-2xl"></div>
                    </div>
                    <input 
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="What's on your mind today?"
                        className="w-full bg-transparent border-none focus:ring-0 py-4 text-xl font-body placeholder-gray-300 text-[var(--ink-color)]"
                    />
                    <button 
                        type="submit"
                        disabled={!input.trim()}
                        className="w-14 h-14 rounded-full bg-[var(--primary-accent)] text-white flex items-center justify-center hover:bg-[#0A2A20] transition-all disabled:opacity-0 disabled:scale-90 shadow-lg"
                    >
                        <div className="icon-arrow-right text-xl"></div>
                    </button>
                </div>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl w-full">
                {suggestions.map((s, i) => (
                    <button 
                        key={i}
                        onClick={() => onSearch(s.text)}
                        className="text-left p-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-stone-200/50 hover:bg-white hover:border-[var(--gold-accent)] hover:shadow-lg transition-all duration-300 group flex items-center gap-4"
                    >
                        <div className="w-12 h-12 rounded-xl bg-[#F7F5F0] flex items-center justify-center text-gray-400 group-hover:text-[var(--primary-accent)] group-hover:bg-emerald-50 transition-colors">
                            <div className={`${s.icon} text-xl`}></div>
                        </div>
                        <div>
                            <span className="block font-ui font-bold text-gray-700 group-hover:text-gray-900 text-sm md:text-base mb-0.5">
                                {s.text}
                            </span>
                            <span className="text-xs text-stone-400 font-medium group-hover:text-[var(--gold-accent)] transition-colors">Tap to ask</span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}

function BottomNavigation({ activeTab, onTabChange }) {
    // Order: Journey, Chat (Center), Dua
    const navItems = [
        { id: 'journeys', label: 'Journey', icon: 'icon-map' },
        { id: 'chat', label: 'Chat', icon: 'icon-message-circle', isCenter: true },
        { id: 'dua', label: 'Duʿāʾ', icon: 'icon-book-open' },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 nav-glass pb-safe z-50">
            <div className="flex items-center justify-around h-20 max-w-lg mx-auto relative px-2">
                {navItems.map((item) => {
                    const isActive = activeTab === item.id;

                    if (item.isCenter) {
                        return (
                            <button
                                key={item.id}
                                onClick={() => onTabChange(item.id)}
                                className="relative -top-6 group"
                            >
                                <div className={`
                                    w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 border-[6px] border-[var(--paper-bg)]
                                    ${isActive 
                                        ? 'bg-[var(--primary-accent)] text-white' 
                                        : 'bg-[var(--primary-accent)] text-white/90 hover:scale-105'
                                    }
                                `}>
                                    <div className={`${item.icon} text-2xl`}></div>
                                </div>
                                <span className={`
                                    absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold tracking-wide mt-1
                                    ${isActive ? 'text-[var(--primary-accent)]' : 'text-[var(--ink-secondary)]'}
                                `}>
                                    {item.label}
                                </span>
                            </button>
                        );
                    }

                    return (
                        <button
                            key={item.id}
                            onClick={() => onTabChange(item.id)}
                            className={`
                                flex flex-col items-center justify-center w-16 gap-1 transition-all duration-300
                                ${isActive ? 'text-[var(--primary-accent)]' : 'text-[var(--ink-secondary)] hover:text-[var(--primary-accent)]'}
                            `}
                        >
                            <div className={`${item.icon} text-2xl ${isActive ? 'stroke-2' : 'stroke-[1.5px]'}`}></div>
                            <span className="text-[10px] font-medium tracking-wide">
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function SavedView({ chapters, onSelectChapter }) {
    return (
        <div className="px-6 py-8 pb-32 animate-fade-in">
            <header className="mb-8">
                <h1 className="font-body text-3xl text-[var(--ink-color)] mb-2">Saved Inquiries</h1>
                <p className="font-ui text-stone-500 text-sm">Your personal collection of wisdom.</p>
            </header>

            {chapters.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
                    <div className="icon-bookmark text-4xl mb-4 text-stone-300"></div>
                    <p className="font-body text-lg text-stone-500">No saved chapters yet.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {chapters.map((chapter) => (
                        <button
                            key={chapter.id}
                            onClick={() => onSelectChapter(chapter.id)}
                            className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm hover:shadow-md hover:border-[var(--primary-accent)]/30 transition-all text-left group"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-ui text-[10px] tracking-widest uppercase text-[var(--gold-accent)]">
                                    {new Date(chapter.timestamp).toLocaleDateString()}
                                </span>
                                <div className="icon-chevron-right text-stone-300 group-hover:text-[var(--primary-accent)] transition-colors"></div>
                            </div>
                            <h3 className="font-body text-xl text-[var(--ink-color)] group-hover:text-[var(--primary-accent)] transition-colors line-clamp-2">
                                {chapter.title}
                            </h3>
                            <p className="font-ui text-sm text-stone-400 mt-2 line-clamp-2">
                                {chapter.content ? chapter.content.substring(0, 100) + '...' : 'Reading...'}
                            </p>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

const StepDetailView = ({ journey, step, onBack, onComplete, isCompleted }) => {
    // Advanced image mapping for header and body
    const getImagesForStep = (type) => {
        const assets = {
            quran: "https://images.unsplash.com/photo-1609599006353-e629aaabfeae?q=80&w=2000&auto=format&fit=crop", // Open Quran
            water: "https://images.unsplash.com/photo-1538582709238-0a503bd5ae04?q=80&w=2000&auto=format&fit=crop", // Natural waterfall/stream (Safe)
            mosque: "https://images.unsplash.com/photo-1564121211835-e8f785a66988?q=80&w=2000&auto=format&fit=crop", // White Mosque Architecture
            nature: "https://images.unsplash.com/photo-1501854140884-074bf86ee911?q=80&w=2000&auto=format&fit=crop", // Mountains/Sky (Safe)
            lantern: "https://images.unsplash.com/photo-1513581166391-887a96ddeafd?q=80&w=2000&auto=format&fit=crop" // Abstract Geometric Pattern (Safe replacement for Lantern)
        };

        switch(type) {
            case 'read': 
                return { header: assets.quran, body: assets.mosque };
            case 'action': 
                return { header: assets.nature, body: assets.water }; // Swapped to nature header for safety
            case 'practice': 
                return { header: assets.mosque, body: assets.lantern };
            case 'challenge': 
                return { header: assets.nature, body: assets.quran };
            case 'reflection': 
                return { header: assets.nature, body: assets.lantern };
            default: 
                return { header: assets.nature, body: assets.lantern };
        }
    };

    const images = getImagesForStep(step.type);

    return (
        <div className="bg-white min-h-screen pb-32 animate-fade-in absolute inset-0 z-50 overflow-y-auto">
            {/* Hero Header */}
            <div className="relative h-72 md:h-96 w-full overflow-hidden">
                <img 
                    src={images.header} 
                    alt="Step Cover" 
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                
                <button 
                    onClick={onBack}
                    className="absolute top-6 left-6 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                    <div className="icon-arrow-left text-xl"></div>
                </button>

                <div className="absolute bottom-0 left-0 p-6 md:p-10 w-full">
                     <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3 ${
                        step.type === 'read' ? 'bg-blue-500/20 text-blue-100 border border-blue-400/30' : 
                        step.type === 'action' ? 'bg-emerald-500/20 text-emerald-100 border border-emerald-400/30' : 
                        'bg-amber-500/20 text-amber-100 border border-amber-400/30'
                    }`}>
                        {step.type} &bull; {step.duration}
                    </span>
                    <h1 className="text-3xl md:text-4xl font-ui font-bold text-white mb-2 leading-tight">
                        {step.title}
                    </h1>
                    <p className="text-white/80 font-medium text-lg">{journey.title}</p>
                </div>
            </div>

            {/* Content Body */}
            <div className="max-w-3xl mx-auto px-6 py-10">
                <div className="prose prose-lg prose-stone mx-auto">
                    <p className="lead font-serif text-2xl text-stone-600 italic mb-8 border-l-4 border-[var(--gold-accent)] pl-6">
                        "{step.content}"
                    </p>
                    
                    <h3 className="font-ui font-bold text-2xl text-gray-800 mb-4">Detailed Guidance</h3>
                    <p className="font-body text-xl leading-relaxed text-gray-700 mb-6">
                        This step is crucial for your spiritual development. Take your time to truly internalize the meaning behind this action. 
                        In Islamic tradition, intention (Niyyah) is the foundation of every deed. Before you begin, pause and reset your heart's compass towards the Creator.
                    </p>

                    {/* Secondary Image in Body */}
                    <div className="my-10 relative group rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all">
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors z-10"></div>
                        <img 
                            src={images.body} 
                            alt="Reflection" 
                            className="w-full h-64 object-cover transform group-hover:scale-105 transition-transform duration-700"
                        />
                    </div>
                    
                    <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100 my-8 flex gap-4 items-start">
                        <div className="w-10 h-10 rounded-full bg-[var(--primary-accent)]/10 text-[var(--primary-accent)] flex-shrink-0 flex items-center justify-center">
                            <div className="icon-lightbulb text-xl"></div>
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 text-lg mb-1">Reflection Point</h4>
                            <p className="text-stone-600">
                                Ask yourself: "What is holding me back from fully embracing this practice?" Identifying the barrier is half the battle.
                            </p>
                        </div>
                    </div>

                    <p className="font-body text-xl leading-relaxed text-gray-700 mb-6">
                         Remember the words of the scholars who said that consistency, no matter how small, is beloved to Allah. Do not seek perfection immediately; seek progress and sincerity.
                         As you integrate this into your life, notice the subtle shifts in your mood and barakah (blessings) in your time.
                    </p>
                </div>

                {/* Action Footer in Detail View */}
                <div className="mt-12 pt-8 border-t border-stone-200 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold transition-all ${isCompleted ? 'bg-[var(--primary-accent)] text-white' : 'bg-stone-100 text-stone-400'}`}>
                            {isCompleted ? <div className="icon-check"></div> : step.id}
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900">Step Status</h4>
                            <p className="text-sm text-stone-500">{isCompleted ? 'Completed on ' + new Date().toLocaleDateString() : 'Pending Completion'}</p>
                        </div>
                    </div>

                    <button 
                        onClick={() => {
                            if (!isCompleted) onComplete(journey.id, step.id);
                        }}
                        disabled={isCompleted}
                        className={`px-8 py-4 rounded-xl font-bold text-sm shadow-md transition-all flex items-center gap-3 ${
                            isCompleted 
                            ? 'bg-stone-100 text-stone-400 cursor-default' 
                            : 'bg-[var(--primary-accent)] text-white hover:bg-emerald-900 hover:shadow-lg'
                        }`}
                    >
                        {isCompleted ? (
                            <>
                                <div className="icon-circle-check"></div>
                                Step Completed
                            </>
                        ) : (
                            <>
                                Mark as Complete
                                <div className="icon-arrow-right"></div>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

function JourneysView({ user, onUpdateProgress, onLogin }) {
    const [selectedJourneyId, setSelectedJourneyId] = React.useState(null);
    const [selectedStepId, setSelectedStepId] = React.useState(null);

    // Expanded Journey Content
    const JOURNEY_DATA = {
        1: {
            id: 1,
            title: "Finding Inner Peace (Sakinah)",
            subtitle: "Trust in Allah's Plan",
            description: "A guided spiritual path to disconnect from the chaos of the world and reconnect with the Source of Peace (As-Salam).",
            totalSteps: 6,
            gradient: "from-blue-50 to-indigo-50",
            accent: "text-blue-600",
            bgIcon: "bg-blue-100",
            icon: "icon-cloud-sun",
            steps: [
                { id: 1, title: "The Nature of Dunya", type: "read", duration: "5 min", content: "Understand that this world is designed to be imperfect. Peace begins when we stop expecting Jannah on Earth. 'Verily, in the remembrance of Allah do hearts find rest.' (13:28)" },
                { id: 2, title: "Purification (Wudu) with Intent", type: "action", duration: "3 min", content: "Perform ablution not just to clean the body, but to wash away the sins and heaviness of the soul. Let the water cool your anger and anxiety." },
                { id: 3, title: "Dhikr for Anxiety", type: "practice", duration: "10 min", content: "Sit in a quiet place. Repeat 'HasbunAllahu wa ni'mal wakeel' (Allah is sufficient for us) 100 times, feeling the weight transfer from your shoulders to His control." },
                { id: 4, title: "The Gratitude Journal", type: "action", duration: "5 min", content: "Write down 5 things you are grateful for today that money cannot buy. Shukur (Gratitude) increases blessings." },
                { id: 5, title: "Tahajjud Prayer", type: "challenge", duration: "20 min", content: "Wake up 20 minutes before Fajr. The peace found in the last third of the night is unmatched. Ask for what your heart truly needs." },
                { id: 6, title: "Complete Surrender (Tawakkul)", type: "reflection", duration: "10 min", content: "Close your eyes and visualize handing over your biggest worry to Allah. Trust that His plan is better than your dreams." }
            ]
        },
        2: {
            id: 2,
            title: "The Prayer Journey (Salah)",
            subtitle: "Mastering the Connection",
            description: "Transform your daily prayers from a routine obligation into a spiritually recharging conversation with your Creator.",
            totalSteps: 5,
            gradient: "from-purple-50 to-fuchsia-50",
            accent: "text-purple-600",
            bgIcon: "bg-purple-100",
            icon: "icon-moon-star",
            steps: [
                { id: 1, title: "The Call (Adhan)", type: "read", duration: "5 min", content: "When you hear the Adhan, stop everything. It is a personal invitation from the King of Kings. Respond to the call." },
                { id: 2, title: "Mastering Wudu", type: "action", duration: "4 min", content: "Perform Wudu slowly, conscious that each drop of water washes away minor sins. It is the armor of the believer." },
                { id: 3, title: "Understanding Al-Fatiha", type: "read", duration: "15 min", content: "The opening chapter is a direct dialogue. When you say 'Alhamdulillah', Allah replies 'My servant has praised Me'. Feel this connection." },
                { id: 4, title: "Khushoo in Ruku & Sujood", type: "practice", duration: "10 min", content: "Lengthen your bowing and prostration. The closest a servant is to their Lord is in Sujood. Pour your heart out there." },
                { id: 5, title: "Post-Prayer Dhikr", type: "practice", duration: "5 min", content: "Do not rush off. Stay for 33x SubhanAllah, 33x Alhamdulillah, 33x Allahu Akbar. Seal your prayer with light." }
            ]
        },
        3: {
            id: 3,
            title: "Prophetic Character (Akhlaq)",
            subtitle: "Walking in His Footsteps",
            description: "Adopt the manners and traits of the Prophet Muhammad (PBUH) to improve your relationships and inner state.",
            totalSteps: 4,
            gradient: "from-emerald-50 to-teal-50",
            accent: "text-emerald-600",
            bgIcon: "bg-emerald-100",
            icon: "icon-heart-handshake",
            steps: [
                { id: 1, title: "Truthfulness (Siddiq)", type: "read", duration: "5 min", content: "Speak the truth even if your voice shakes. Truthfulness leads to piety, and piety leads to Paradise." },
                { id: 2, title: "Smile as Charity", type: "action", duration: "1 day", content: "Make a conscious effort to smile at everyone you meet today. It is a Sunnah and a charity that softens hearts." },
                { id: 3, title: "Kindness to Kin", type: "challenge", duration: "10 min", content: "Call a relative you haven't spoken to in a while. Strengthening ties of kinship extends life and provision." },
                { id: 4, title: "Controlling Anger", type: "reflection", duration: "10 min", content: "When angry, change your posture (sit if standing). Seek refuge in Allah. The strong one is he who controls himself in anger." }
            ]
        }
    };

    // Calculate Progress from User Data
    const getProgress = (journeyId) => {
        if (!user || !user.journeyProgress) return { completed: [], currentStepId: 1 };
        try {
            const progressMap = typeof user.journeyProgress === 'string' 
                ? JSON.parse(user.journeyProgress) 
                : user.journeyProgress;
            return progressMap[journeyId] || { completed: [], currentStepId: 1 };
        } catch (e) {
            return { completed: [], currentStepId: 1 };
        }
    };

    const handleStepComplete = (journeyId, stepId) => {
        if (!user) {
            onLogin();
            return;
        }
        onUpdateProgress(journeyId, stepId);
    };

    const selectedJourney = selectedJourneyId ? JOURNEY_DATA[selectedJourneyId] : null;

    if (selectedJourney) {
        const userProgress = getProgress(selectedJourney.id);
        const completedSet = new Set(userProgress.completed);
        
        // Render Detail View if a step is selected
        if (selectedStepId) {
            const step = selectedJourney.steps.find(s => s.id === selectedStepId);
            if (step) {
                return <StepDetailView 
                    journey={selectedJourney} 
                    step={step} 
                    onBack={() => setSelectedStepId(null)} 
                    onComplete={(jid, sid) => {
                        handleStepComplete(jid, sid);
                        // Optional: Go back after completing? Or stay. Let's stay to show success state.
                    }}
                    isCompleted={completedSet.has(step.id)}
                />;
            }
        }

        return (
            <div className="px-4 py-8 pb-32 animate-fade-in min-h-full">
                <button 
                    onClick={() => setSelectedJourneyId(null)}
                    className="mb-6 flex items-center gap-2 text-gray-500 hover:text-[var(--primary-accent)] transition-colors font-bold text-sm"
                >
                    <div className="icon-arrow-left"></div>
                    Back to Journeys
                </button>

                <div className={`p-8 rounded-3xl bg-gradient-to-br ${selectedJourney.gradient} mb-8 relative overflow-hidden shadow-lg`}>
                    {/* Decorative Islamic Pattern SVG Overlay */}
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)", backgroundSize: "20px 20px" }}></div>
                    
                    <div className="relative z-10 text-center">
                        <div className={`w-20 h-20 mx-auto rounded-2xl ${selectedJourney.bgIcon} ${selectedJourney.accent} flex items-center justify-center shadow-sm mb-4`}>
                            <div className={`${selectedJourney.icon} text-4xl`}></div>
                        </div>
                        <h1 className="font-ui font-bold text-3xl text-gray-800 mb-2">{selectedJourney.title}</h1>
                        <p className="text-gray-600 mb-4 max-w-md mx-auto">{selectedJourney.description}</p>
                        
                        <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur px-4 py-2 rounded-full text-sm font-bold text-gray-700">
                             <div className="icon-trophy text-[var(--gold-accent)]"></div>
                             <span>{completedSet.size} / {selectedJourney.totalSteps} Completed</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-6 max-w-xl mx-auto relative">
                    <div className="absolute left-8 top-6 bottom-6 w-0.5 bg-stone-200 z-0"></div>

                    {selectedJourney.steps.map((step, idx) => {
                        const isCompleted = completedSet.has(step.id);
                        // A step is accessible if it's completed OR if it's the immediate next step
                        // (i.e. all previous steps are completed)
                        const allPreviousCompleted = selectedJourney.steps
                            .slice(0, idx)
                            .every(s => completedSet.has(s.id));
                        
                        const isCurrent = !isCompleted && allPreviousCompleted;
                        const isLocked = !isCompleted && !allPreviousCompleted;

                        return (
                            <div key={step.id} className={`relative flex gap-6 ${isLocked ? 'opacity-50 grayscale' : ''}`}>
                                <div className={`
                                    w-16 h-16 rounded-full flex-shrink-0 flex items-center justify-center z-10 border-4 border-[var(--paper-bg)] shadow-sm font-bold text-lg transition-all duration-300
                                    ${isCompleted 
                                        ? 'bg-[var(--primary-accent)] text-white' 
                                        : isCurrent 
                                            ? 'bg-white text-[var(--primary-accent)] border-[var(--primary-accent)] scale-110' 
                                            : 'bg-stone-100 text-stone-400'}
                                `}>
                                    {isCompleted ? <div className="icon-check"></div> : idx + 1}
                                </div>
                                
                                <div className={`flex-1 bg-white p-6 rounded-2xl border transition-all duration-300 ${isCurrent ? 'border-[var(--primary-accent)] shadow-lg ring-1 ring-[var(--primary-accent)]/20' : 'border-stone-100 shadow-sm'} mb-2`}>
                                    <div className="flex justify-between items-start mb-3">
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md flex items-center gap-1 ${
                                            step.type === 'read' ? 'bg-blue-50 text-blue-600' : 
                                            step.type === 'action' ? 'bg-emerald-50 text-emerald-600' : 
                                            step.type === 'practice' ? 'bg-amber-50 text-amber-600' :
                                            'bg-purple-50 text-purple-600'
                                        }`}>
                                            {step.type === 'read' && <div className="icon-book-open text-xs"></div>}
                                            {step.type === 'action' && <div className="icon-zap text-xs"></div>}
                                            {step.type === 'practice' && <div className="icon-repeat text-xs"></div>}
                                            {step.type}
                                        </span>
                                        <span className="text-xs text-stone-400 font-medium flex items-center gap-1">
                                            <div className="icon-clock text-[10px]"></div>
                                            {step.duration}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-lg text-gray-800 mb-2">{step.title}</h3>
                                    <p className="text-sm text-stone-500 leading-relaxed mb-4">{step.content}</p>
                                    
                                    {isCurrent && (
                                        <div className="mt-6 flex gap-3">
                                            {/* Checkbox-style Complete Button */}
                                            <button 
                                                onClick={() => handleStepComplete(selectedJourney.id, step.id)}
                                                className="flex-shrink-0 w-12 h-12 rounded-xl border-2 border-[var(--primary-accent)] bg-white hover:bg-emerald-50 text-[var(--primary-accent)] flex items-center justify-center transition-all group"
                                                title="Mark as Complete"
                                            >
                                                <div className="w-6 h-6 rounded border-2 border-current flex items-center justify-center group-hover:bg-[var(--primary-accent)] group-hover:text-white transition-colors">
                                                     <div className="icon-check opacity-0 group-hover:opacity-100 text-xs"></div>
                                                </div>
                                            </button>

                                            {/* Read More / View Details Button */}
                                            <button 
                                                onClick={() => setSelectedStepId(step.id)}
                                                className="flex-1 py-3 bg-[var(--primary-accent)] text-white rounded-xl font-bold text-sm hover:bg-emerald-900 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 group"
                                            >
                                                Read More & Begin
                                                <div className="icon-arrow-right group-hover:translate-x-1 transition-transform"></div>
                                            </button>
                                        </div>
                                    )}
                                    
                                    {(isCompleted || (!isCurrent && !isLocked)) && (
                                        <div className="mt-4 flex items-center justify-between">
                                            {isCompleted && (
                                                <div className="flex items-center gap-2 text-[var(--primary-accent)] text-xs font-bold">
                                                    <div className="icon-circle-check"></div>
                                                    Completed
                                                </div>
                                            )}
                                            <button 
                                                onClick={() => setSelectedStepId(step.id)}
                                                className="text-stone-400 hover:text-[var(--primary-accent)] text-xs font-bold flex items-center gap-1 ml-auto"
                                            >
                                                Review Step
                                                <div className="icon-chevron-right"></div>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    return (
        <div className="px-6 py-8 pb-32 animate-fade-in relative overflow-hidden">
            {/* Background ambient light */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-100/30 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2"></div>
            
             <header className="mb-10 text-center md:text-left relative z-10">
                <span className="text-xs font-bold font-ui text-[var(--gold-accent)] uppercase tracking-[0.2em] mb-3 block flex items-center gap-2 justify-center md:justify-start">
                    <div className="h-px w-8 bg-[var(--gold-accent)]"></div>
                    Your Spiritual Path
                </span>
                <h1 className="font-ui font-bold text-4xl text-[var(--ink-color)] mb-2">My Journeys</h1>
                <p className="font-body text-lg text-stone-500">Step-by-step guidance for the soul.</p>
            </header>

            <div className="space-y-8 relative">
                {/* Visual Path Connector Line */}
                <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-gradient-to-b from-stone-200 via-stone-300 to-transparent hidden md:block -z-10 border-l border-dashed border-stone-300"></div>

                {Object.values(JOURNEY_DATA).map((j) => {
                    const userProgress = getProgress(j.id);
                    const completedCount = userProgress.completed.length;
                    const progress = (completedCount / j.totalSteps) * 100;
                    
                    return (
                        <div key={j.id} className="relative group perspective-1000">
                            <div className="md:ml-20 bg-white rounded-3xl p-1 border border-stone-100 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
                                <div className={`relative rounded-[20px] p-6 overflow-hidden bg-gradient-to-br ${j.gradient}`}>
                                    {/* Abstract Decorative Shapes */}
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/40 rounded-full blur-2xl -mr-10 -mt-10 transition-transform duration-700 group-hover:scale-150"></div>
                                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/20 rounded-full blur-xl -ml-6 -mb-6"></div>
                                    
                                    <div className="flex items-start justify-between relative z-10 mb-6">
                                        <div className={`w-14 h-14 rounded-2xl ${j.bgIcon} ${j.accent} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                                            <div className={`${j.icon} text-2xl`}></div>
                                        </div>
                                        <div className="flex items-center gap-1 bg-white/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/50">
                                            <span className="text-xs font-bold text-stone-600">{completedCount}/{j.totalSteps} Steps</span>
                                        </div>
                                    </div>
                                    
                                    <h3 className="font-ui font-bold text-xl text-gray-800 mb-1 group-hover:text-[var(--primary-accent)] transition-colors">{j.title}</h3>
                                    <p className="text-sm font-medium text-gray-500 mb-6">{j.subtitle}</p>
                                    
                                    {/* Progress Bar */}
                                    <div className="relative h-2 bg-black/5 rounded-full overflow-hidden mb-4">
                                        <div 
                                            className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out ${j.accent.replace('text', 'bg')}`} 
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                    </div>
                                    
                                    <button 
                                        onClick={() => setSelectedJourneyId(j.id)}
                                        className="w-full py-3 bg-white rounded-xl text-sm font-bold text-gray-700 shadow-sm hover:bg-[var(--primary-accent)] hover:text-white transition-all flex items-center justify-center gap-2 group-hover:translate-x-1"
                                    >
                                        {completedCount === 0 ? 'Start Journey' : 'Continue Path'}
                                        <div className="icon-arrow-right"></div>
                                    </button>
                                </div>
                            </div>
                            
                            {/* Timeline Node for Desktop */}
                            <div className="hidden md:flex absolute left-8 top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-4 border-stone-200 z-10 group-hover:border-[var(--primary-accent)] transition-colors"></div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function DuaDetailView({ dua, category, onClose }) {
    const [isPlaying, setIsPlaying] = React.useState(false);
    const audioRef = React.useRef(null);

    const togglePlay = () => {
        if (!audioRef.current) return;
        
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            // Check if we need to start from offset
            if (dua.audioStartTime && audioRef.current.currentTime < dua.audioStartTime) {
                audioRef.current.currentTime = dua.audioStartTime;
            }
            
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => setIsPlaying(true))
                    .catch(error => {
                        console.error("Audio play failed:", error);
                        setIsPlaying(false);
                    });
            }
        }
    };

    // Images based on category AND keywords in title
    const getImages = (catName, duaTitle) => {
        // Strict mapping to trickle/assets where possible
        const assets = {
            morning: "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?q=80&w=2070&auto=format&fit=crop", // dua-morning.json
            night: "https://images.unsplash.com/photo-1532978879545-231464b8da22?q=80&w=2070&auto=format&fit=crop", // dua-night.json
            anxiety: "https://images.unsplash.com/photo-1518176258769-f227c798150e?q=80&w=2670&auto=format&fit=crop", // dua-anxiety.json
            travel: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop", // dua-travel.json
            hands: "https://images.unsplash.com/photo-1628156715003-85f2659d585d?q=80&w=2000&auto=format&fit=crop", // dua-hands.json
            globe: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2000&auto=format&fit=crop", // dua-globe.json
            book: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=2000&auto=format&fit=crop", // dua-book.json
            family: "https://images.unsplash.com/photo-1609220136736-443140cffec6?q=80&w=2000&auto=format&fit=crop", // dua-family.json
            general: "https://images.unsplash.com/photo-1519817650390-64a93db51149?q=80&w=2000&auto=format&fit=crop" // Fallback
        };
        
        const text = (duaTitle + " " + catName).toLowerCase();

        // Specific Keyword Matching
        if (text.includes('deed') || text.includes('accept') || text.includes('forgive') || text.includes('mercy')) 
            return { header: assets.hands, body: assets.night };
        
        if (text.includes('dunya') || text.includes('world') || text.includes('earth') || text.includes('universe')) 
            return { header: assets.globe, body: assets.general };
        
        if (text.includes('knowledge') || text.includes('wisdom') || text.includes('study') || text.includes('educat')) 
            return { header: assets.book, body: assets.morning };

        if (text.includes('family') || text.includes('parent') || text.includes('spouse') || text.includes('child') || text.includes('home')) 
            return { header: assets.family, body: assets.hands };

        // Category Fallbacks
        if (text.includes('morning')) return { header: assets.morning, body: assets.general };
        if (text.includes('evening') || text.includes('sleep') || text.includes('night')) return { header: assets.night, body: assets.general };
        if (text.includes('anxiety') || text.includes('hardship') || text.includes('patience') || text.includes('grief')) return { header: assets.anxiety, body: assets.hands };
        if (text.includes('travel') || text.includes('protection') || text.includes('security')) return { header: assets.travel, body: assets.general };
        
        return { header: assets.general, body: assets.anxiety };
    };

    const images = getImages(category.name, dua.title);

    return (
        <div className="bg-white min-h-screen pb-32 animate-fade-in absolute inset-0 z-50 overflow-y-auto">
             <div className="relative h-72 md:h-96 w-full overflow-hidden">
                <img 
                    src={images.header} 
                    alt="Dua Cover" 
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                
                <button 
                    onClick={onClose}
                    className="absolute top-6 left-6 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                    <div className="icon-arrow-left text-xl"></div>
                </button>

                <div className="absolute bottom-0 left-0 p-6 md:p-10 w-full">
                     <span className="inline-block px-3 py-1 rounded-full bg-[var(--primary-accent)]/80 backdrop-blur-sm text-white border border-white/20 text-[10px] font-bold uppercase tracking-wider mb-3">
                        {category.name}
                    </span>
                    <h1 className="text-3xl md:text-4xl font-ui font-bold text-white mb-2 leading-tight">
                        {dua.title}
                    </h1>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-6 py-10">
                <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200 mb-8 relative">
                    <div className="absolute -top-4 -right-4 w-12 h-12 bg-[var(--gold-accent)] rounded-full flex items-center justify-center shadow-lg text-white">
                        <div className="icon-quote text-2xl"></div>
                    </div>
                    <p className="font-arabic text-4xl leading-[2.2] text-right dir-rtl text-gray-800 mb-6 drop-shadow-sm">
                        {dua.arabic}
                    </p>
                </div>

                <div className="flex items-center justify-center mb-10">
                    <button 
                        onClick={togglePlay}
                        className="flex items-center gap-3 px-6 py-3 bg-[var(--primary-accent)] text-white rounded-full font-bold shadow-lg hover:bg-emerald-900 transition-all hover:scale-105 active:scale-95"
                    >
                        {isPlaying ? <div className="icon-pause text-xl"></div> : <div className="icon-play text-xl"></div>}
                        <span>{isPlaying ? "Pause Recitation" : "Play Recitation"}</span>
                    </button>
                    <audio 
                        ref={audioRef} 
                        src={dua.audio} 
                        onEnded={() => setIsPlaying(false)}
                        onLoadedMetadata={() => {
                             // Pre-seek to start time if defined
                             if (dua.audioStartTime && audioRef.current) {
                                 audioRef.current.currentTime = dua.audioStartTime;
                             }
                        }}
                        onError={(e) => {
                            console.error("Audio load error", e);
                            setIsPlaying(false);
                        }}
                        className="hidden"
                    ></audio>
                </div>

                <div className="prose prose-lg prose-stone mx-auto">
                     <h3 className="font-ui font-bold text-lg text-gray-500 uppercase tracking-widest mb-4">Transliteration</h3>
                     <p className="font-body text-xl italic text-gray-600 mb-8 bg-white p-4 rounded-xl border-l-4 border-[var(--primary-accent)] shadow-sm">
                        "{dua.transliteration}"
                     </p>

                     <h3 className="font-ui font-bold text-lg text-gray-500 uppercase tracking-widest mb-4">Translation</h3>
                     <p className="font-body text-2xl text-gray-900 leading-relaxed mb-8">
                        {dua.translation}
                     </p>

                     {/* Body Image */}
                    <div className="my-10 relative group rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all h-48 md:h-64">
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors z-10"></div>
                         <div className="absolute bottom-4 left-6 text-white z-20">
                            <div className="font-bold text-lg flex items-center gap-2 mb-1">
                                <div className="icon-info text-sm"></div>
                                Reference
                            </div>
                            <p className="opacity-90">{dua.reference}</p>
                        </div>
                        <img 
                            src={images.body} 
                            alt="Reflection" 
                            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                        />
                    </div>

                    <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 flex gap-4 items-start">
                        <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex-shrink-0 flex items-center justify-center mt-1">
                            <div className="icon-lightbulb text-sm"></div>
                        </div>
                        <div>
                            <h4 className="font-bold text-amber-800 text-lg mb-1">Benefit</h4>
                            <p className="text-amber-700/80 leading-relaxed">
                                {dua.benefit || "Recite this with conviction and presence of heart to seek Allah's aid and mercy."}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function DuaView() {
    const [selectedCategory, setSelectedCategory] = React.useState(null);
    const [selectedDua, setSelectedDua] = React.useState(null);

    // Helper to generate correct EveryAyah audio URL
    const getAudioUrl = (surah, ayah) => {
        const s = String(surah).padStart(3, '0');
        const a = String(ayah).padStart(3, '0');
        return `https://everyayah.com/data/Alafasy_128kbps/${s}${a}.mp3`;
    };

    const DUA_CONTENT = {
        "Protection & Security": [
            {
                id: 101,
                title: "Ayatul Kursi (Throne Verse)",
                arabic: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ",
                transliteration: "Allahu la ilaha illa Huwa, Al-Hayyul-Qayyum...",
                translation: "Allah - there is no deity except Him, the Ever-Living, the Sustainer of [all] existence...",
                reference: "Al-Baqarah 2:255",
                audio: getAudioUrl(2, 255),
                benefit: "The greatest verse in the Quran. Protection from all evil."
            },
            {
                id: 102,
                title: "The Absolver (Al-Ikhlas)",
                arabic: "قُلْ هُوَ اللَّهُ أَحَدٌ ۝ اللَّهُ الصَّمَدُ ۝ لَمْ يَلِدْ وَلَمْ يُولَدْ ۝ وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ",
                transliteration: "Qul Huwa-llahu Ahad. Allahus-Samad...",
                translation: "Say, 'He is Allah, [who is] One. Allah, the Eternal Refuge...'",
                reference: "Al-Ikhlas 112:1-4",
                audio: "https://everyayah.com/data/Alafasy_128kbps/112001.mp3", 
                benefit: "Equivalent to one-third of the Quran."
            },
            {
                id: 103,
                title: "Seek Refuge from Dawn (Al-Falaq)",
                arabic: "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ",
                transliteration: "Qul a'udhu bi-rabbil-falaq",
                translation: "Say, 'I seek refuge in the Lord of daybreak'",
                reference: "Al-Falaq 113:1",
                audio: getAudioUrl(113, 1),
                benefit: "Protection from envy and magic."
            },
            {
                id: 104,
                title: "Seek Refuge in Lord of Mankind",
                arabic: "قُلْ أَعُوذُ بِرَبِّ النَّاسِ",
                transliteration: "Qul a'udhu bi-rabbin-nas",
                translation: "Say, 'I seek refuge in the Lord of mankind'",
                reference: "An-Nas 114:1",
                audio: getAudioUrl(114, 1),
                benefit: "Protection from the whispers of shaytan."
            },
            {
                id: 105,
                title: "Sufficient is Allah",
                arabic: "حَسْبِيَ اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ ۖ عَلَيْهِ تَوَكَّلْتُ ۖ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ",
                transliteration: "Hasbiya Allahu la ilaha illa Huwa 'alayhi tawakkalt...",
                translation: "Sufficient for me is Allah; there is no deity except Him. On Him I have relied...",
                reference: "At-Tawbah 9:129",
                audio: getAudioUrl(9, 129),
                benefit: "Prophet (SAW) said whoever says this 7 times morning/evening, Allah will suffice him.",
                audioStartTime: 10.0 // Verse starts with "Fa in tawallaw..."
            }
        ],
        "Hardship & Patience": [
            {
                id: 201,
                title: "Dua of Yunus (AS)",
                arabic: "لَّا إِلَٰهَ إِلَّا أَنتَ سُبْحَانَكَ إِنِّي كُنتُ مِنَ الظَّالِمِينَ",
                transliteration: "La ilaha illa anta subhanaka inni kuntu minaz-zalimin",
                translation: "There is no deity except You; exalted are You. Indeed, I have been of the wrongdoers.",
                reference: "Al-Anbiya 21:87",
                audio: getAudioUrl(21, 87),
                benefit: "Relief from distress. No Muslim recites this without being answered.",
                audioStartTime: 17.0 // Verse is long about Dhun-Nun leaving in anger
            },
            {
                id: 202,
                title: "Dua of Ayyub (AS)",
                arabic: "أَنِّي مَسَّنِيَ الضُّرُّ وَأَنتَ أَرْحَمُ الرَّاحِمِينَ",
                transliteration: "Annee massaniya ad-durru wa anta arhamur-rahimeen",
                translation: "Indeed, adversity has touched me, and you are the Most Merciful of the merciful.",
                reference: "Al-Anbiya 21:83",
                audio: getAudioUrl(21, 83),
                benefit: "For healing from illness and relief from severe hardship.",
                audioStartTime: 4.5 // Starts with "Wa Ayyuba ith nada rabbahu..."
            },
            {
                id: 203,
                title: "Dua of Musa (AS) for Help",
                arabic: "رَبِّ إِنِّي لِمَا أَنزَلْتَ إِلَيَّ مِنْ خَيْرٍ فَقِيرٌ",
                transliteration: "Rabbi inni lima anzalta ilayya min khairin faqir",
                translation: "My Lord, indeed I am, for whatever good You would send down to me, in need.",
                reference: "Al-Qasas 28:24",
                audio: getAudioUrl(28, 24),
                benefit: "Recited when in need of provision, job, or spouse.",
                audioStartTime: 13.0 // Starts with "Fasaqa lahuma..."
            },
            {
                id: 204,
                title: "Complain Grief to Allah",
                arabic: "إِنَّمَا أَشْكُو بَثِّي وَhُزْنِي إِلَى اللَّهِ",
                transliteration: "Innama ashkoo baththee wahuznee ila Allah",
                translation: "I only complain of my suffering and my grief to Allah.",
                reference: "Yusuf 12:86",
                audio: getAudioUrl(12, 86),
                benefit: "Turning only to Allah in times of deep emotional pain.",
                audioStartTime: 3.5 // Starts with "Qala..."
            }
        ],
        "Guidance & Wisdom": [
            {
                id: 301,
                title: "Opening Prayer (Al-Fatiha)",
                arabic: "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ",
                transliteration: "Ihdinas-siratal-mustaqim",
                translation: "Guide us to the straight path.",
                reference: "Al-Fatiha 1:6",
                audio: getAudioUrl(1, 6),
                benefit: "The essential prayer for guidance in every rakat."
            },
            {
                id: 302,
                title: "Increase in Knowledge",
                arabic: "رَّبِّ زِدْنِي عِلْمًا",
                transliteration: "Rabbi zidni 'ilma",
                translation: "My Lord, increase me in knowledge.",
                reference: "Taha 20:114",
                audio: getAudioUrl(20, 114),
                benefit: "For success in studies and understanding.",
                audioStartTime: 18.0 // Dua is at the very end of 20:114
            },
            {
                id: 303,
                title: "Ease My Task (Musa AS)",
                arabic: "رَبِّ اشْرَحْ لِي صَدْرِي ۝ وَيَسِّرْ لِي أَمْرِي",
                transliteration: "Rabbish-rah li sadri. Wa yassir li amri.",
                translation: "My Lord, expand for me my breast. And ease for me my task.",
                reference: "Taha 20:25-26",
                audio: getAudioUrl(20, 25), 
                benefit: "For confidence in speech and removing anxiety before tasks.",
                audioStartTime: 3.0 // Starts with "Qala..."
            },
            {
                id: 304,
                title: "Firmness of Heart",
                arabic: "رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِن لَّدُنكَ رَحْمَةً",
                transliteration: "Rabbana la tuzigh qulubana ba'da idh hadaitana...",
                translation: "Our Lord, let not our hearts deviate after You have guided us...",
                reference: "Ali 'Imran 3:8",
                audio: getAudioUrl(3, 8),
                benefit: "For steadfastness in faith."
            }
        ],
        "Family & Home": [
            {
                id: 401,
                title: "Comfort of Eyes (Family)",
                arabic: "رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ",
                transliteration: "Rabbana hab lana min azwajina wa dhurriyatina qurrata a'yunin...",
                translation: "Our Lord, grant us from among our wives and offspring comfort to our eyes...",
                reference: "Al-Furqan 25:74",
                audio: getAudioUrl(25, 74),
                benefit: "For a righteous spouse and obedient children.",
                audioStartTime: 3.5 // Verse starts with "Wallatheena yaqooloona..."
            },
            {
                id: 402,
                title: "Parents Forgiveness",
                arabic: "رَبَّنَا اغْفِرْ لِي وَلِوَالِدَيَّ وَلِلْمُؤْمِنِينَ يَوْمَ يَقُومُ الْحِسَابُ",
                transliteration: "Rabbanagh-fir li wa li-walidayya wa lil-mu'minina yauma yaqumul-hisab",
                translation: "Our Lord, forgive me and my parents and the believers the Day the account is established.",
                reference: "Ibrahim 14:41",
                audio: getAudioUrl(14, 41),
                benefit: "Kindness and prayer for parents."
            },
            {
                id: 403,
                title: "Righteous Offspring",
                arabic: "رَبِّ هَبْ لِي مِن لَّدُنكَ ذُرِّيَّةً طَيِّبَةً ۖ إِنَّكَ سَمِيعُ الدُّعَاءِ",
                transliteration: "Rabbi hab li min ladunka dhurriyyatan tayyibatan...",
                translation: "My Lord, grant me from Yourself a good offspring. Indeed, You are the Hearer of supplication.",
                reference: "Ali 'Imran 3:38",
                audio: getAudioUrl(3, 38),
                benefit: "Prophet Zakariya's dua for children.",
                audioStartTime: 3.0 // Verse starts with "Hunalika da'a Zakariyya..."
            },
            {
                id: 404,
                title: "Safety of City/Home",
                arabic: "رَبِّ اجْعَلْ هَٰذَا الْبَلَدَ آمِنًا",
                transliteration: "Rabbij-'al hadhal-balada amina",
                translation: "My Lord, make this city [Makkah] secure.",
                reference: "Ibrahim 14:35",
                audio: getAudioUrl(14, 35),
                benefit: "Praying for the safety of one's home and land.",
                audioStartTime: 4.0 // Verse starts with "Wa ith qala Ibrahimu..."
            }
        ],
        "Dunya & Akhirah": [
            {
                id: 501,
                title: "Best of Both Worlds",
                arabic: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
                transliteration: "Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan...",
                translation: "Our Lord, give us in this world [that which is] good and in the Hereafter [that which is] good...",
                reference: "Al-Baqarah 2:201",
                audio: getAudioUrl(2, 201),
                benefit: "The most comprehensive dua, often recited during Tawaf.",
                audioStartTime: 5.5 // Verse starts with "Wa minhum man yaqoolu..."
            },
            {
                id: 502,
                title: "Forgiveness & Mercy",
                arabic: "رَبَّنَا ظَلَمْنَا أَنفُسَنَا وَإِن لَّمْ تَغْفِرْ لَنَا وَتَرْحَمْنَا لَنَكُونَنَّ مِنَ الْخَاسِرِينَ",
                transliteration: "Rabbana zalamna anfusana wa in lam taghfir lana...",
                translation: "Our Lord, we have wronged ourselves, and if You do not forgive us and have mercy upon us...",
                reference: "Al-A'raf 7:23",
                audio: getAudioUrl(7, 23),
                benefit: "Dua of Adam (AS), for repentance.",
                audioStartTime: 3.5 // Verse starts with "Qala..."
            },
            {
                id: 503,
                title: "Acceptance of Deeds",
                arabic: "رَبَّنَا تَقَبَّلْ مِنَّا ۖ إِنَّكَ أَنتَ السَّمِيعُ الْعَلِيمُ",
                transliteration: "Rabbana taqabbal minna innaka antas-sami'ul-'alim",
                translation: "Our Lord, accept [this] from us. Indeed You are the Hearing, the Knowing.",
                reference: "Al-Baqarah 2:127",
                audio: getAudioUrl(2, 127),
                benefit: "Recited after performing any good deed or worship.",
                audioStartTime: 12.0 // Verse 127 is long about Ibrahim raising foundations. Dua is at the end.
            },
            {
                id: 504,
                title: "Save Us From Error",
                arabic: "رَبَّنَا لَا تُؤَاخِذْنَا إِن نَّسِينَا أَوْ أَخْطَأْنَا",
                transliteration: "Rabbana la tu'akhidhna in nasina au akhta'na",
                translation: "Our Lord, do not impose blame upon us if we have forgotten or erred.",
                reference: "Al-Baqarah 2:286",
                audio: getAudioUrl(2, 286),
                benefit: "For Allah's mercy on our shortcomings.",
                audioStartTime: 13.0 // Verse 286 starts with "La yukallifullahu..."
            }
        ]
    };

    const categories = [
        { name: "Protection & Security", count: DUA_CONTENT["Protection & Security"].length, icon: "icon-shield-check", color: "text-blue-600", bg: "bg-blue-50" },
        { name: "Hardship & Patience", count: DUA_CONTENT["Hardship & Patience"].length, icon: "icon-heart-crack", color: "text-rose-500", bg: "bg-rose-50" },
        { name: "Guidance & Wisdom", count: DUA_CONTENT["Guidance & Wisdom"].length, icon: "icon-lightbulb", color: "text-amber-500", bg: "bg-amber-50" },
        { name: "Family & Home", count: DUA_CONTENT["Family & Home"].length, icon: "icon-home", color: "text-emerald-600", bg: "bg-emerald-50" },
        { name: "Dunya & Akhirah", count: DUA_CONTENT["Dunya & Akhirah"].length, icon: "icon-scale", color: "text-purple-600", bg: "bg-purple-50" },
    ];

    if (selectedDua && selectedCategory) {
        return <DuaDetailView dua={selectedDua} category={selectedCategory} onClose={() => setSelectedDua(null)} />;
    }

    if (selectedCategory) {
        const duas = DUA_CONTENT[selectedCategory.name] || [];
        return (
            <div className="px-4 py-8 pb-32 animate-fade-in">
                <button 
                    onClick={() => setSelectedCategory(null)}
                    className="mb-6 flex items-center gap-2 text-gray-500 hover:text-[var(--primary-accent)] transition-colors font-bold text-sm"
                >
                    <div className="icon-arrow-left"></div>
                    Back to Categories
                </button>

                <div className={`p-8 rounded-3xl ${selectedCategory.bg} mb-8 border border-stone-100`}>
                    <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-xl bg-white flex items-center justify-center shadow-sm ${selectedCategory.color}`}>
                            <div className={`${selectedCategory.icon} text-2xl`}></div>
                        </div>
                        <div>
                            <h1 className="font-ui font-bold text-2xl text-gray-800">{selectedCategory.name}</h1>
                            <p className="text-gray-600 text-sm">{selectedCategory.count} Authentic Adhkar</p>
                        </div>
                    </div>
                </div>

                {duas.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 italic">
                        Content for this category is being curated.
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {duas.map(dua => (
                            <button 
                                key={dua.id} 
                                onClick={() => setSelectedDua(dua)}
                                className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden text-left group w-full"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-5">
                                    <div className="icon-quote text-6xl text-[var(--primary-accent)]"></div>
                                </div>
                                <div className="flex justify-between items-start">
                                    <h3 className="font-ui font-bold text-lg text-[var(--primary-accent)] mb-6 group-hover:text-emerald-800 transition-colors">{dua.title}</h3>
                                    <div className="w-8 h-8 rounded-full bg-stone-50 flex items-center justify-center text-stone-400 group-hover:bg-[var(--primary-accent)] group-hover:text-white transition-all">
                                        <div className="icon-chevron-right text-sm"></div>
                                    </div>
                                </div>
                                
                                <p className="font-arabic text-2xl leading-[2.2] text-right dir-rtl text-gray-800 mb-6 line-clamp-2">
                                    {dua.arabic}
                                </p>
                                
                                <div className="space-y-3 mb-6">
                                    <p className="text-sm font-medium text-gray-500 italic bg-stone-50 p-3 rounded-lg line-clamp-2">
                                        "{dua.transliteration}"
                                    </p>
                                </div>
                                
                                <div className="flex items-center justify-between pt-4 border-t border-stone-100">
                                    <span className="text-xs font-bold text-stone-400 bg-stone-50 px-2 py-1 rounded">{dua.reference}</span>
                                    <div className="flex gap-2 text-xs font-bold text-[var(--primary-accent)] items-center">
                                        <div className="icon-book-open"></div>
                                        Read & Listen
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="px-6 py-8 pb-32 animate-fade-in">
             <header className="mb-10 text-center md:text-left">
                <span className="text-xs font-bold font-ui text-[var(--gold-accent)] uppercase tracking-[0.2em] mb-3 block flex items-center gap-2 justify-center md:justify-start">
                    <div className="icon-shield text-sm"></div>
                    Fortress of the Muslim
                </span>
                <h1 className="font-ui font-bold text-4xl text-[var(--ink-color)]">Daily Adhkar</h1>
            </header>

            {/* Featured Dua Card */}
            <div className="relative mb-10 group perspective-1000">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-200 to-orange-100 rounded-3xl transform rotate-1 transition-transform group-hover:rotate-2"></div>
                <div className="absolute inset-0 bg-white/40 backdrop-blur-sm rounded-3xl scale-[0.98] transform -rotate-1 transition-transform group-hover:-rotate-2"></div>
                
                <div className="relative bg-white border border-amber-100/50 p-8 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-500 text-center overflow-hidden">
                    {/* Decorative Pattern */}
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-300 via-orange-300 to-amber-300"></div>
                    <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none">
                         <div className="icon-sparkles text-[150px] text-amber-900"></div>
                    </div>

                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-100 text-[10px] font-bold text-amber-700 uppercase tracking-wide mb-6">
                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                        Dua of the Moment
                    </div>
                    
                    <p className="font-arabic text-3xl md:text-4xl text-gray-800 leading-[2.5] dir-rtl mb-6 drop-shadow-sm">
                        رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي
                    </p>
                    
                    <div className="w-16 h-px bg-amber-200 mx-auto mb-6"></div>
                    
                    <p className="font-body italic text-xl text-gray-600 mb-8 leading-relaxed">
                        "My Lord, expand for me my breast [with assurance] and ease for me my task."
                    </p>
                    
                    <div className="flex items-center justify-center gap-3">
                        <button 
                            onClick={() => setSelectedDua({
                                id: 99,
                                title: "For Ease in Tasks",
                                arabic: "رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي",
                                transliteration: "Rabbish-rah li sadri, wa yassir li amri",
                                translation: "My Lord, expand for me my breast [with assurance] and ease for me my task.",
                                reference: "Surah Taha [20:25-26]",
                                audio: "https://cdn.islamic.network/quran/audio/128/ar.alafasy/2373.mp3", // Surah Taha, Ayah 25 (includes 26 in typical recitation flow or just 25)
                                benefit: "Recite this before a speech, interview, or difficult task for clarity and confidence.",
                                audioStartTime: 3.0 // Starts with "Qala..."
                            }, setSelectedCategory({name: "General"}))}
                            className="px-5 py-2.5 rounded-xl bg-amber-50 text-amber-700 font-bold text-sm hover:bg-amber-100 transition-colors flex items-center gap-2"
                        >
                             <div className="icon-circle-play text-lg"></div>
                             Listen & Read
                        </button>
                    </div>
                    
                    <div className="mt-6 text-xs font-bold text-stone-400">
                        Surah Taha [20:25-26]
                    </div>
                </div>
            </div>

            <h3 className="font-ui font-bold text-xl mb-6 text-gray-800 flex items-center gap-2">
                <div className="w-1 h-6 rounded-full bg-[var(--primary-accent)]"></div>
                Explore Categories
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {categories.map((c, i) => (
                    <button 
                        key={i} 
                        onClick={() => setSelectedCategory(c)}
                        className="relative bg-white p-5 rounded-2xl border border-stone-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-left group overflow-hidden"
                    >
                        <div className={`absolute top-0 right-0 w-20 h-20 rounded-full ${c.bg} blur-2xl -mr-6 -mt-6 transition-transform group-hover:scale-150`}></div>
                        
                        <div className={`w-10 h-10 rounded-xl ${c.bg} ${c.color} flex items-center justify-center mb-4 relative z-10 group-hover:scale-110 transition-transform`}>
                            <div className={`${c.icon} text-lg`}></div>
                        </div>
                        
                        <div className="relative z-10">
                            <h4 className="font-bold text-sm md:text-base text-gray-700 group-hover:text-gray-900 mb-1 leading-tight">{c.name}</h4>
                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wide group-hover:text-[var(--primary-accent)] transition-colors">{c.count} Duas</span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}

/* =========================================
   MAIN APP
   ========================================= */

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, errorInfo) { console.error('ErrorBoundary:', error, errorInfo); }
  render() {
    if (this.state.hasError) return (
        <div className="flex items-center justify-center min-h-screen bg-red-50 text-red-900 p-8 text-center">
            <div>
                <div className="icon-triangle-alert text-4xl mb-4 mx-auto text-red-500"></div>
                <h1 className="text-xl font-bold mb-2">Something went wrong</h1>
                <p className="text-sm opacity-80 mb-4">Please reload the page.</p>
                <pre className="text-xs bg-red-100 p-4 rounded text-left overflow-auto max-w-sm mx-auto">
                    {this.state.error && this.state.error.toString()}
                </pre>
            </div>
        </div>
    );
    return this.props.children;
  }
}

function App() {
  try {
    const [user, setUser] = React.useState(null);
    const [chapters, setChapters] = React.useState([]);
    const [currentChapterId, setCurrentChapterId] = React.useState(null);
    const [isLoading, setIsLoading] = React.useState(false);
    const [showAuthModal, setShowAuthModal] = React.useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
    const [activeTab, setActiveTab] = React.useState('chat');
    
    // New states for error handling and pending queries
    const [toast, setToast] = React.useState(null); // { message, type }
    const [pendingQuery, setPendingQuery] = React.useState(null);
    const [bottomInput, setBottomInput] = React.useState('');

    React.useEffect(() => {
        const initSession = async () => {
            try {
                const currentUser = await getCurrentUser();
                if (currentUser) {
                    setUser(currentUser);
                    await loadUserChapters(currentUser.id);
                }
            } catch (err) {
                console.warn("Session initialization failed:", err);
                logoutUser();
                setUser(null);
                setChapters([]);
            }
        };
        initSession();
    }, []);

    const showToast = (message, type = 'error') => {
        setToast({ message, type });
    };

    const loadUserChapters = async (userId) => {
        setIsLoading(true);
        try {
            const dbChapters = await getChaptersFromDB(userId);
            dbChapters.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            setChapters(dbChapters);
        } catch (error) {
            console.error("Failed to load chapters", error);
            showToast("Failed to load your history.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogin = (userData) => {
        setUser(userData);
        loadUserChapters(userData.id);
        
        // Execute pending query if exists
        if (pendingQuery) {
            setPendingQuery(null);
            // Small delay to ensure state updates
            setTimeout(() => handleCreateChapter(pendingQuery), 500);
        }
    };

    const handleLogout = () => {
        logoutUser();
        setUser(null);
        setChapters([]);
        setCurrentChapterId(null);
    };

    const handleUpdateJourneyProgress = async (journeyId, stepId) => {
        if (!user || !user.id) {
            showToast("Please sign in to save progress.");
            return;
        }

        try {
            showToast("Saving progress...", "info");
            
            const updatedUser = await apiClient.updateJourneyProgress(
                user.id,
                journeyId,
                stepId
            );
            
            // Update local state
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
            setUser(updatedUser);
            
            showToast("Progress Saved! ✓", "success");
        } catch (error) {
            console.error("Failed to update progress", error);
            
            if (error.message.includes('network') || error.message.includes('timeout')) {
                showToast("Connection issue. Progress not saved.");
            } else {
                showToast("Failed to save progress. Please try again.");
            }
        }
    };

    const handleCreateChapter = async (query) => {
        if (!query || !query.trim()) return;

        if (!user) {
            setPendingQuery(query);
            setShowAuthModal(true);
            return;
        }

        const tempId = 'temp-' + Date.now();
        
        // 1. Setup temporary chapter with loading state
        const tempChapter = {
            id: tempId,
            title: query,
            content: '',
            timestamp: new Date().toISOString(),
            isLoading: true
        };

        setChapters(prev => [tempChapter, ...prev]);
        setCurrentChapterId(tempId);
        setActiveTab('chat'); 
        setBottomInput('');
        setIsLoading(true);

        try {
            const history = chapters.slice(0, 3).map(c => ({ 
                role: 'user', 
                content: `Previous topic: ${c.title}` 
            }));

            // 2. Fetch full response (simulated backend delay)
            const aiResponse = await getQuranResponse(query, history);
            const finalContent = aiResponse || "Reviewing the scriptures... Please try again momentarily.";
            
            // 3. Prepare for streaming
            // Initialize with empty string but isLoading false to switch view from Spinner to Text
            setChapters(prev => prev.map(c => 
                c.id === tempId ? { ...c, isLoading: false, content: '' } : c
            ));

            // 4. Stream the content
            const words = finalContent.split(" ");
            let currentStreamedText = "";

            for (let i = 0; i < words.length; i++) {
                currentStreamedText += (i > 0 ? " " : "") + words[i];
                
                // Update UI with current chunk
                setChapters(prev => prev.map(c => 
                    c.id === tempId ? { ...c, content: currentStreamedText } : c
                ));

                // Typing delay (randomized for realism)
                const delay = Math.floor(Math.random() * 30) + 30; // 30ms - 60ms
                await new Promise(resolve => setTimeout(resolve, delay));
            }

            // 5. Save final result to DB
            const savedChapter = await saveChapterToDB(user.id, query, finalContent);
            
            // Replace temp chapter with saved DB record
            setChapters(prev => prev.map(c => 
                c.id === tempId ? savedChapter : c
            ));
            setCurrentChapterId(savedChapter.id);

        } catch (error) {
            console.warn("Chapter creation workflow error:", error);
            showToast("Could not save your inquiry. Please try again.");
            setChapters(prev => prev.map(c => 
                c.id === tempId 
                ? { ...c, content: "We encountered an issue retrieving the wisdom you sought. Please check your connection and try again.", isLoading: false }
                : c
            ));
        } finally {
            setIsLoading(false);
        }
    };

    const activeChapter = chapters.find(c => c.id === currentChapterId);

    const renderView = () => {
        switch(activeTab) {
            case 'profile':
                if (!user) {
                    // Redirect if not logged in
                    setTimeout(() => setShowAuthModal(true), 100);
                    setActiveTab('chat');
                    return null;
                }
                return (
                    <ProfileView 
                        user={user} 
                        stats={{
                            inquiries: chapters.length,
                            saved: chapters.length // Mock saved count for now
                        }}
                        onLogout={() => {
                            handleLogout();
                            setActiveTab('chat');
                        }}
                    />
                );
            case 'saved':
                return (
                    <SavedView 
                        chapters={chapters} 
                        onSelectChapter={(id) => {
                            setCurrentChapterId(id);
                            setActiveTab('chat');
                            setIsSidebarOpen(false);
                        }} 
                    />
                );
            case 'journeys':
                return (
                    <JourneysView 
                        user={user} 
                        onUpdateProgress={handleUpdateJourneyProgress}
                        onLogin={() => setShowAuthModal(true)}
                    />
                );
            case 'dua':
                return <DuaView />;
            case 'chat':
            default:
                return (
                    <div className="pb-32">
                        {!activeChapter ? (
                            <CoverPage onSearch={handleCreateChapter} />
                        ) : (
                            <BookPage 
                                chapter={activeChapter} 
                                onFollowUp={(query) => {
                                    handleCreateChapter(query);
                                    // Smooth scroll to top when new chapter starts
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                            />
                        )}

                        <div className="fixed bottom-24 md:bottom-28 inset-x-0 p-4 lg:p-6 pointer-events-none z-45">
                            <div className="max-w-3xl mx-auto pointer-events-auto">
                            <div className={`
                                    transition-all duration-500 ease-out transform
                                    ${!activeChapter ? 'opacity-0 translate-y-4 hidden' : 'opacity-100 translate-y-0'}
                            `}>
                                    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-2 flex items-center gap-2 ring-1 ring-black/5">
                                        <input 
                                            type="text" 
                                            value={bottomInput}
                                            onChange={(e) => setBottomInput(e.target.value)}
                                            placeholder={isLoading ? "Reflecting..." : "Ask a follow-up question..."}
                                            className="flex-1 bg-transparent border-none focus:ring-0 px-4 py-3 text-lg font-body placeholder-gray-400 text-gray-800"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !isLoading) {
                                                    handleCreateChapter(bottomInput);
                                                }
                                            }}
                                            disabled={isLoading}
                                        />
                                        <button 
                                            disabled={isLoading || !bottomInput.trim()}
                                            onClick={() => handleCreateChapter(bottomInput)}
                                            className="w-10 h-10 rounded-xl bg-[var(--primary-accent)] text-white flex items-center justify-center hover:bg-emerald-900 transition-colors disabled:opacity-50 shadow-md"
                                        >
                                            {isLoading ? (
                                                <div className="icon-loader animate-spin"></div>
                                            ) : (
                                                <div className="icon-arrow-up"></div>
                                            )}
                                        </button>
                                    </div>
                            </div>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
      <div className="flex h-screen bg-[var(--paper-bg)] overflow-hidden font-body text-[var(--ink-color)] selection:bg-[var(--gold-accent)] selection:text-white" data-name="App">
        
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

        <AuthModal 
            isOpen={showAuthModal} 
            onClose={() => setShowAuthModal(false)}
            onLogin={handleLogin}
        />

        <TableOfContents 
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            chapters={chapters}
            currentChapterId={currentChapterId}
            onSelectChapter={(id) => {
                setCurrentChapterId(id);
                setActiveTab('chat');
                setIsSidebarOpen(false);
            }}
            onNewChapter={() => {
                setCurrentChapterId(null);
                setActiveTab('chat');
                setIsSidebarOpen(false);
            }}
            user={user}
            onLogin={() => {
                setShowAuthModal(true);
                setIsSidebarOpen(false);
            }}
            onLogout={handleLogout}
            onViewSaved={() => {
                setActiveTab('saved');
                setIsSidebarOpen(false);
            }}
        />

        <div className={`flex-1 flex flex-col h-full transition-transform duration-500 ease-out ${isSidebarOpen ? 'lg:pl-0' : ''}`}>
            
            <div className="sticky top-0 left-0 right-0 h-16 flex items-center justify-between px-4 lg:px-8 bg-[var(--paper-bg)]/80 backdrop-blur-md z-20 border-b border-stone-200/50 relative">
                <div className="flex items-center justify-start w-12">
                    <button 
                        onClick={() => setIsSidebarOpen(true)}
                        className="w-10 h-10 -ml-2 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors text-gray-600"
                    >
                        <div className="icon-menu text-xl"></div>
                    </button>
                </div>

                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                    <Logo className="h-8" showText={false} />
                </div>
                
                <div className="flex items-center justify-end w-12">
                {user ? (
                    <button 
                        onClick={() => setActiveTab('profile')}
                        className="w-9 h-9 rounded-full bg-[var(--gold-accent)] text-white flex items-center justify-center font-bold font-ui text-sm shadow-sm hover:scale-105 transition-transform border-2 border-white/50"
                    >
                        {user.name.charAt(0).toUpperCase()}
                    </button>
                ) : (
                    <button 
                        onClick={() => setShowAuthModal(true)}
                        className="px-4 py-2 rounded-lg bg-white border border-stone-200 text-sm font-bold text-gray-700 hover:text-[var(--primary-accent)] hover:border-[var(--primary-accent)] transition-all shadow-sm whitespace-nowrap"
                    >
                        Sign In
                    </button>
                )}
                </div>
            </div>

            <main className="flex-1 overflow-y-auto relative scroll-smooth w-full">
                <div className="max-w-3xl mx-auto min-h-full">
                    {renderView()}
                </div>
            </main>
        </div>

        <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      </div>
    );
  } catch (error) {
    console.error('App error:', error);
    return null;
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<ErrorBoundary><App /></ErrorBoundary>);