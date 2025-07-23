"use client"; // Needed for client-side hooks

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { FaTimes, FaDog, FaChartLine, FaWallet, FaFileAlt, FaComments, FaChartBar, FaPlug, FaExpand } from 'react-icons/fa';
// Temporarily using Solana wallet adapter until ICP wallet is implemented
import { useWallet } from '@solana/wallet-adapter-react';
import ChatInterface from './components/ChatInterface';
import MemecoinsExplorer from './components/MemecoinsExplorer';
import SolanaWalletButton from './components/SolanaWalletButton';

// Window position interface
interface WindowPosition {
  x: number;
  y: number;
}

// Window size interface
interface WindowSize {
  width: number;
  height: number;
}

// Open window state interface
interface OpenWindow {
  id: string;
  position: WindowPosition;
  size: WindowSize;
  zIndex: number;
}

export default function Home() {
  const { connected, publicKey, disconnect } = useWallet(); 
  const [appStarted, setAppStarted] = useState(false);
  const [chatMode, setChatMode] = useState(false);
  const [openWindows, setOpenWindows] = useState<OpenWindow[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [nextZIndex, setNextZIndex] = useState(10);
  const [dragging, setDragging] = useState<string | null>(null);
  const [resizing, setResizing] = useState<string | null>(null);
  const [startPos, setStartPos] = useState<{x: number, y: number} | null>(null);
  const [startWindowPos, setStartWindowPos] = useState<{x: number, y: number} | null>(null);
  const [resizeStart, setResizeStart] = useState<{width: number, height: number} | null>(null);
  const [dragOffset, setDragOffset] = useState<{x: number, y: number}>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <FaDog /> },
    { id: 'memecoins', label: 'Memecoins', icon: <FaChartLine /> },
    { id: 'stats', label: 'Stats', icon: <FaChartBar /> },
    { id: 'chat', label: 'Chat', icon: <FaComments /> },
    { id: 'whitepaper', label: 'Whitepaper', icon: <FaFileAlt /> },
    { id: 'wallet', label: 'Wallet', icon: <FaWallet /> },
  ];

  // Get default window size for a given type
  const getDefaultWindowSize = (id: string): WindowSize => {
    switch(id) {
      case 'chat':
        return { width: 700, height: 650 };
      default:
        return { width: 500, height: 400 };
    }
  };

  const toggleWindow = (id: string) => {
    console.log("Toggle window:", id);
    // Check if window is already open
    const existingWindowIndex = openWindows.findIndex(w => w.id === id);
    
    if (existingWindowIndex !== -1) {
      // Close window - use functional update form to ensure latest state
      console.log("Closing window:", id);
      setOpenWindows((prevWindows) => {
        return prevWindows.filter(w => w.id !== id);
      });
      
      if (activeWindowId === id) {
        setActiveWindowId(null);
      }
    } else {
      // Open new window
      const windowSize = getDefaultWindowSize(id);
      const containerWidth = containerRef.current?.clientWidth || window.innerWidth;
      const containerHeight = containerRef.current?.clientHeight || window.innerHeight;
      
      const newWindow: OpenWindow = {
        id,
        position: {
          x: (containerWidth / 2) - (windowSize.width / 2),
          y: (containerHeight / 2) - (windowSize.height / 2)
        },
        size: windowSize,
        zIndex: nextZIndex
      };
      
      // Use functional update form to ensure latest state
      setOpenWindows((prevWindows) => [...prevWindows, newWindow]);
      setActiveWindowId(id);
      setNextZIndex(prev => prev + 1);
    }
  };

  const bringToFront = (id: string) => {
    setActiveWindowId(id);
    setOpenWindows(openWindows.map(window => {
      if (window.id === id) {
        return { ...window, zIndex: nextZIndex };
      }
      return window;
    }));
    setNextZIndex(nextZIndex + 1);
  };

  const startDrag = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const window = getWindowByID(id);
    if (!window) return;
    
    // Store the initial mouse position and window position
    setStartPos({ x: e.clientX, y: e.clientY });
    setStartWindowPos({ x: window.position.x, y: window.position.y });
    setDragging(id);
    bringToFront(id);
  };

  const startResize = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const window = getWindowByID(id);
    if (!window) return;
    
    setStartPos({ x: e.clientX, y: e.clientY });
    setResizeStart({
      width: window.size.width,
      height: window.size.height
    });
    setResizing(id);
    bringToFront(id);
  };

  const onDrag = (e: MouseEvent) => {
    if (!dragging || !startPos || !startWindowPos) return;
    
    setOpenWindows(prevWindows => prevWindows.map(window => {
      if (window.id === dragging) {
        return {
          ...window,
          position: {
            x: startWindowPos.x + (e.clientX - startPos.x),
            y: startWindowPos.y + (e.clientY - startPos.y)
          }
        };
      }
      return window;
    }));
  };

  const onResize = (e: MouseEvent) => {
    if (!resizing || !resizeStart || !startPos) return;
    
    const deltaX = e.clientX - startPos.x;
    const deltaY = e.clientY - startPos.y;
    
    setOpenWindows(prevWindows => prevWindows.map(window => {
      if (window.id === resizing) {
        return {
          ...window,
          size: {
            width: Math.max(300, resizeStart.width + deltaX),
            height: Math.max(200, resizeStart.height + deltaY)
          }
        };
      }
      return window;
    }));
  };

  const stopDrag = () => {
    setDragging(null);
  };

  const stopResize = () => {
    setResizing(null);
    setResizeStart(null);
  };

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', onDrag);
      window.addEventListener('mouseup', stopDrag);
    }
    
    return () => {
      window.removeEventListener('mousemove', onDrag);
      window.removeEventListener('mouseup', stopDrag);
    };
  }, [dragging, openWindows, dragOffset]);

  useEffect(() => {
    if (resizing) {
      window.addEventListener('mousemove', onResize);
      window.addEventListener('mouseup', stopResize);
    }
    
    return () => {
      window.removeEventListener('mousemove', onResize);
      window.removeEventListener('mouseup', stopResize);
    };
  }, [resizing, openWindows, resizeStart]);

  const getWindowByID = (id: string) => {
    return openWindows.find(w => w.id === id);
  };

  const renderWindow = (id: string) => {
    const windowData = getWindowByID(id);
    if (!windowData) return null;

    const windowStyle = {
      position: 'absolute' as const,
      left: `${windowData.position.x}px`,
      top: `${windowData.position.y}px`,
      width: `${windowData.size.width}px`,
      height: id === 'chat' ? `${windowData.size.height}px` : 'auto',
      zIndex: windowData.zIndex,
      transition: dragging === id || resizing === id ? 'none' : 'all 0.2s ease-out'
    };

    const isActive = activeWindowId === id;
    const activeClass = isActive ? 'ring-2 ring-purple-500' : '';

    switch(id) {
      case 'dashboard':
        return (
          <div 
            className={`bg-white rounded-lg shadow-xl overflow-hidden transition-all duration-300 ${activeClass}`}
            style={windowStyle}
          >
            <div 
              className="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-3 flex justify-between items-center cursor-move select-none rounded-t-lg"
              onMouseDown={(e) => startDrag(e, id)}
            >
              <div className="flex items-center text-white">
                <FaDog className="mr-2 text-white" />
                <h2 className="text-lg font-bold text-white">Dashboard</h2>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleWindow(id);
                }}
                className="bg-red-600 hover:bg-red-700 p-1.5 rounded-full text-white transition-colors z-50"
              >
                <FaTimes size={14} />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Dashboard widgets */}
                <div className="bg-gradient-to-br from-purple-100/50 to-purple-200 p-4 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">Total Value</h3>
                  <p className="text-2xl font-bold text-purple-600">$0.00</p>
                </div>
                <div className="bg-gradient-to-br from-purple-100/50 to-purple-200 p-4 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">24h Change</h3>
                  <p className="text-2xl font-bold text-green-600">+0.00%</p>
                </div>
                <div className="md:col-span-2 bg-gradient-to-br from-purple-100/50 to-purple-200 p-4 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">Active Positions</h3>
                  <p className="text-2xl font-bold text-purple-600">0</p>
                </div>
              </div>
            </div>
            {/* Resize handle */}
            <div 
              className="absolute bottom-0 right-0 w-8 h-8 cursor-nwse-resize z-30 flex items-center justify-center"
              onMouseDown={(e) => {
                e.stopPropagation();
                startResize(e, id);
              }}
            >
              <FaExpand className="text-black/50 rotate-45" size={14} />
            </div>
          </div>
        );
      case 'chat':
        return (
          <div 
            className={`bg-white rounded-lg shadow-xl overflow-hidden transition-all duration-300 ${activeClass}`}
            style={{
              ...windowStyle,
              width: `${Math.max(windowData.size.width, 500)}px`,
              height: `${Math.max(windowData.size.height, 500)}px`,
            }}
          >
            <div 
              className="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-3 flex justify-between items-center cursor-move select-none rounded-t-lg"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                startDrag(e, id);
              }}
            >
              <div className="flex items-center">
                <FaComments className="mr-2 text-white" />
                <h2 className="text-lg font-bold text-white">Chat</h2>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleWindow(id);
                }}
                className="bg-red-600 hover:bg-red-700 p-1.5 rounded-full text-white transition-colors z-50"
              >
                <FaTimes size={14} />
              </button>
            </div>
            <div 
              className="h-[calc(100%-48px)] overflow-hidden"
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
            >
              <ChatInterface />
            </div>
            {/* Resize handle */}
            <div 
              className="absolute bottom-0 right-0 w-8 h-8 cursor-nwse-resize z-30 flex items-center justify-center"
              onMouseDown={(e) => {
                e.stopPropagation();
                startResize(e, id);
              }}
            >
              <FaExpand className="text-black/50 rotate-45" size={14} />
            </div>
          </div>
        );
      case 'memecoins':
        return (
          <div 
            className={`bg-white rounded-lg shadow-xl overflow-hidden transition-all duration-300 ${activeClass}`}
            style={windowStyle}
          >
            <div 
              className="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-3 flex justify-between items-center cursor-move select-none rounded-t-lg"
              onMouseDown={(e) => startDrag(e, id)}
            >
              <div className="flex items-center text-white">
                <FaChartLine className="mr-2 text-white" />
                <h2 className="text-lg font-bold text-white">Memecoins</h2>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleWindow(id);
                }}
                className="bg-red-600 hover:bg-red-700 p-1.5 rounded-full text-white transition-colors z-50"
              >
                <FaTimes size={14} />
              </button>
            </div>
            <div className="p-4 max-h-[500px] overflow-auto">
              <MemecoinsExplorer />
            </div>
            {/* Resize handle */}
            <div 
              className="absolute bottom-0 right-0 w-8 h-8 cursor-nwse-resize z-30 flex items-center justify-center"
              onMouseDown={(e) => {
                e.stopPropagation();
                startResize(e, id);
              }}
            >
              <FaExpand className="text-black/50 rotate-45" size={14} />
            </div>
          </div>
        );
      case 'stats':
        return (
          <div 
            className={`bg-white rounded-lg shadow-xl overflow-hidden transition-all duration-300 ${activeClass}`}
            style={windowStyle}
          >
            <div 
              className="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-3 flex justify-between items-center cursor-move select-none rounded-t-lg"
              onMouseDown={(e) => startDrag(e, id)}
            >
              <div className="flex items-center text-white">
                <FaChartBar className="mr-2 text-white" />
                <h2 className="text-lg font-bold text-white">Statistics</h2>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleWindow(id);
                }}
                className="bg-red-600 hover:bg-red-700 p-1.5 rounded-full text-white transition-colors z-50"
              >
                <FaTimes size={14} />
              </button>
            </div>
            <div className="p-6">
              <div className="bg-gradient-to-br from-purple-100/50 to-purple-200 p-4 rounded-lg shadow-sm mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Top Gainers</h3>
                <p className="text-gray-600">No data available</p>
              </div>
              <div className="bg-gradient-to-br from-purple-100/50 to-purple-200 p-4 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Market Overview</h3>
                <p className="text-gray-600">No data available</p>
              </div>
            </div>
            {/* Resize handle */}
            <div 
              className="absolute bottom-0 right-0 w-8 h-8 cursor-nwse-resize z-30 flex items-center justify-center"
              onMouseDown={(e) => {
                e.stopPropagation();
                startResize(e, id);
              }}
            >
              <FaExpand className="text-black/50 rotate-45" size={14} />
            </div>
          </div>
        );
      case 'whitepaper':
        return (
          <div 
            className={`bg-white rounded-lg shadow-xl overflow-hidden transition-all duration-300 ${activeClass}`}
            style={windowStyle}
          >
            <div 
              className="bg-gradient-to-r from-icp-teal to-icp-teal-dark text-white p-3 flex justify-between items-center cursor-move"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                startDrag(e, id);
              }}
            >
              <div className="flex items-center">
                <FaFileAlt className="mr-2" />
                <h2 className="text-xl font-bold">Whitepaper</h2>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleWindow(id);
                }}
                className="bg-red-600 hover:bg-red-700 p-1.5 rounded-full text-white transition-colors z-50"
              >
                <FaTimes size={14} />
              </button>
            </div>
            <div className="p-6 overflow-auto max-h-[500px]">
              <h1 className="text-2xl font-bold text-gray-800 mb-3">Sniffle: Advanced Memecoin Intelligence System for Internet Computer</h1>
              
              <h2 className="text-xl font-bold text-gray-800 mt-6 mb-3">Executive Summary</h2>
              <div className="prose prose-sm">
                <p className="mb-3">Sniffle is a revolutionary AI-powered platform engineered specifically for the Internet Computer ecosystem, providing traders with unprecedented early access to emerging meme tokens before significant price movements occur. By leveraging advanced AI analysis and conversational intelligence, Sniffle synthesizes sophisticated social media analytics with on-chain Internet Computer data to identify high-potential opportunities during their inception phase, allowing users to position themselves advantageously in the market.</p>
                <p className="mb-3">Our platform democratizes access to valuable pre-pump intelligence previously available only to well-connected insiders and sophisticated traders within the Internet Computer ecosystem. Sniffle's unique profit-sharing business model aligns our incentives directly with user success, creating a symbiotic relationship where we only succeed when our users profit.</p>
              </div>

              <h2 className="text-xl font-bold text-gray-800 mt-6 mb-3">Technology Infrastructure</h2>
              
              <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">Real-Time Data Acquisition Network</h3>
              <div className="prose prose-sm">
                <ul className="list-disc pl-5 mb-4">
                  <li><strong>Internet Computer-Focused Social Listening:</strong> Proprietary system continuously monitors Twitter/X for early mentions of emerging Internet Computer meme tokens</li>
                  <li><strong>Advanced Filtering Matrix:</strong>
                    <ul className="list-disc pl-5 mt-1">
                      <li>Engagement threshold verification (filtering for authentic interaction patterns)</li>
                      <li>Account credibility scoring (bot detection and influence assessment)</li>
                      <li>Internet Computer-specific semantic analysis (context-aware keyword processing for ICP ecosystem)</li>
                      <li>Temporal signal amplification detection (identifying organic growth patterns on Internet Computer)</li>
                    </ul>
                  </li>
                  <li><strong>Operational Parameters:</strong> High-frequency scanning at 3-5 minute intervals with intelligent rate limiting to ensure comprehensive coverage</li>
                </ul>
              </div>

              <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">Cognitive Analysis Engine</h3>
              <div className="prose prose-sm">
                <ul className="list-disc pl-5 mb-4">
                  <li><strong>Data Aggregation:</strong> Scraper collects Internet Computer token data from exchanges, scrapes Twitter for token-related tweets and sentiment.</li>
                  <li><strong>AI Analysis:</strong> Advanced ML models analyze tweets and token data, determines risk score, investment potential, and provides rationale for each token.</li>
                  <li><strong>Intelligent Agent:</strong> Answers user queries with the latest token data and in-depth analysis using Retrieval-Augmented Generation.</li>
                </ul>
              </div>

              <h2 className="text-xl font-bold text-gray-800 mt-6 mb-3">Internet Computer Integration</h2>
              <div className="prose prose-sm">
                <ul className="list-disc pl-5 mb-4">
                  <li><strong>Network Details:</strong>
                    <ul className="list-disc pl-5 mt-1">
                      <li>Network: Internet Computer (Mainnet)</li>
                      <li>Canister ID: [Your Canister ID]</li>
                      <li>Block Explorer: dashboard.internetcomputer.org</li>
                    </ul>
                  </li>
                  <li><strong>Wallet Integration:</strong>
                    <ul className="list-disc pl-5 mt-1">
                      <li>Internet Identity and other popular Internet Computer wallet support</li>
                      <li>Seamless connection to Internet Computer network</li>
                      <li>Real-time ICP balance and transaction monitoring</li>
                    </ul>
                  </li>
                </ul>
              </div>

              <h2 className="text-xl font-bold text-gray-800 mt-6 mb-3">Strategic Advantages</h2>
              <div className="prose prose-sm">
                <ul className="list-disc pl-5 mb-4">
                  <li><strong>Internet Computer Exclusivity:</strong> Dedicated focus on the unique dynamics and opportunities within the ICP ecosystem</li>
                  <li><strong>Early Signal Detection:</strong> Proprietary algorithms capable of identifying promising tokens hours or days before mainstream awareness</li>
                  <li><strong>Integrated Data Intelligence:</strong> Unified analysis combining social indicators with on-chain Internet Computer metrics</li>
                  <li><strong>Scientific Methodology:</strong> Data-driven approach eliminating emotional decision-making</li>
                  <li><strong>Aligned Success Incentives:</strong> Business model that ensures we win only when our users win</li>
                  <li><strong>Web-Speed Performance:</strong> Leveraging Internet Computer's web-speed blockchain for rapid trade execution</li>
                  <li><strong>Low Transaction Costs:</strong> Minimal fees on Internet Computer enable frequent trading strategies</li>
                </ul>
              </div>

              <h2 className="text-xl font-bold text-gray-800 mt-6 mb-3">Contact Information</h2>
              <div className="prose prose-sm">
                <p className="italic mt-4">Email: tanishqgupta322@gmail.com | Twitter: @Sniffle_AI | Discord: Coming Soon</p>
              </div>
            </div>
            {/* Resize handle */}
            <div 
              className="absolute bottom-0 right-0 w-8 h-8 cursor-nwse-resize z-30 flex items-center justify-center"
              onMouseDown={(e) => {
                e.stopPropagation();
                startResize(e, id);
              }}
            >
              <FaExpand className="text-black/50 rotate-45" size={14} />
            </div>
          </div>
        );
      case 'wallet':
        return (
          <div 
            className={`bg-white rounded-xl shadow-2xl border-2 border-black overflow-hidden ${activeClass}`}
            style={windowStyle}
          >
            <div 
              className="bg-gradient-to-r from-icp-teal to-icp-teal-dark text-white p-3 flex justify-between items-center cursor-move"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                startDrag(e, id);
              }}
            >
              <div className="flex items-center">
                <FaWallet className="mr-2" />
                <h2 className="text-xl font-bold">Wallet</h2>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleWindow(id);
                }}
                className="bg-red-600 hover:bg-red-700 p-1.5 rounded-full text-white transition-colors z-50"
              >
                <FaTimes size={14} />
              </button>
            </div>
            <div className="p-6 text-center">
              <Image 
                src="/sniffle-logo.png" 
                alt="Wallet" 
                width={80} 
                height={80}
                className="mx-auto mb-4" 
              />
              <h2 className="text-xl font-bold text-gray-800 mb-2">Connect Your Wallet</h2>
              {connected ? (
                <div className="space-y-4">
                  <p className="text-gray-600">Connected to Internet Computer</p>
                  <p className="text-gray-600">Address:</p>
                  <p className="font-mono text-sm bg-gray-100 p-2 rounded break-all">
                    {publicKey?.toBase58()}
                  </p>
                  <button 
                    onClick={() => disconnect()}
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-600 mb-6">Connect your wallet to track your memecoin investments on the Internet Computer</p>
                  <div className="flex justify-center">
                    <SolanaWalletButton />
                  </div>
                </div>
              )}
            </div>
            {/* Resize handle */}
            <div 
              className="absolute bottom-0 right-0 w-8 h-8 cursor-nwse-resize z-30 flex items-center justify-center"
              onMouseDown={(e) => {
                e.stopPropagation();
                startResize(e, id);
              }}
            >
              <FaExpand className="text-black/50 rotate-45" size={14} />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Function to open multiple windows at once
  const openMultipleWindows = (ids: string[]) => {
    console.log("Opening multiple windows:", ids);
    const newWindows = ids
      .filter(id => !openWindows.some(w => w.id === id))
      .map((id, index) => {
        // Center windows based on container size
        const containerWidth = containerRef.current?.clientWidth || window.innerWidth;
        const containerHeight = containerRef.current?.clientHeight || window.innerHeight;
        const windowSize = getDefaultWindowSize(id);
        
        return {
          id,
          position: {
            x: (containerWidth / 2) - (windowSize.width / 2) + (index * 40),
            y: (containerHeight / 2) - (windowSize.height / 2) + (index * 40)
          },
          size: windowSize,
          zIndex: nextZIndex + index
        };
      });
    
    if (newWindows.length > 0) {
      console.log("Adding new windows:", newWindows);
      setOpenWindows(prevWindows => [...prevWindows, ...newWindows]);
      setActiveWindowId(newWindows[newWindows.length - 1].id);
      setNextZIndex(prevZIndex => prevZIndex + newWindows.length);
    }
  };

  const renderLandingPage = () => {
      return (
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="bg-white/95 rounded-3xl shadow-2xl border border-solana-purple/10 p-8 md:p-12 max-w-md w-full text-center">
            <div className="flex justify-center mb-6">
              <Image 
                src="/sniffle-logo.png" 
                alt="Sniffle Logo" 
                width={200} 
                height={200}
                priority
                className="rounded-full"
              />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Sniffle AI</h1>
            <p className="text-gray-600 mb-8 md:mb-10 text-sm">
              An autonomous AI agent that finds trending memecoins on Solana.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
              onClick={(e) => {
                e.stopPropagation();
                  setAppStarted(true);
                  setChatMode(false);
                // Open dashboard and chat windows automatically
                setTimeout(() => {
                  openMultipleWindows([]);
                }, 100);
                }}
                className="px-6 md:px-8 py-3 bg-solana-gradient text-white rounded-lg font-medium hover:bg-solana-gradient-hover transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/30"
              >
                Get Started
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setAppStarted(true);
                  setChatMode(true);
                  setTimeout(() => {
                    toggleWindow('chat');
                  }, 100);
                }}
                className="px-6 md:px-8 py-3 bg-purple-100 text-purple-700 rounded-lg font-medium hover:bg-purple-200 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Chat Mode
              </button>
            </div>
          </div>
        </div>
      );
  };

      return (
      <main 
        ref={containerRef}
        className="min-h-screen dashboard-bg relative overflow-hidden"
        onClick={(e) => {
          e.stopPropagation();
          activeWindowId && bringToFront(activeWindowId);
        }}
      >
        {/* Landing page */}
        {!appStarted && renderLandingPage()}

        {/* Dashboard */}
        {appStarted && (
          <>
            {/* Top right buttons */}
            <div className="absolute top-4 right-4 flex items-center space-x-3 z-50">
              {/* Whitepaper Button */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleWindow('whitepaper');
                }}
                className={`p-2 rounded-lg transition-colors shadow-lg flex items-center ${
                  openWindows.some(w => w.id === 'whitepaper')
                    ? 'bg-solana-purple text-white shadow-solana-purple/50'
                    : 'bg-white text-gray-700 hover:bg-purple-50 hover:text-solana-purple'
                }`}
                title="Whitepaper"
              >
                <FaFileAlt size={18} className="mr-2" />
                <span className="hidden md:inline">Whitepaper</span>
              </button>

              {/* Connect Button */}
              <div className="p-2 rounded-lg shadow-lg bg-white">
                <SolanaWalletButton />
              </div>
            </div>

            {/* Side Menu Squares - now with better styling */}
            <div className="fixed left-6 top-1/2 transform -translate-y-1/2 space-y-5 z-40">
              {menuItems.filter(item => item.id !== 'whitepaper').map((item) => (
                <button
                  key={item.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleWindow(item.id);
                  }}
                  className={`w-14 h-14 flex items-center justify-center rounded-xl transition-all duration-200 shadow-lg ${
                    openWindows.some(w => w.id === item.id)
                      ? 'bg-solana-purple text-white scale-110 shadow-solana-purple/50'
                      : 'bg-white text-gray-700 hover:bg-purple-50 hover:scale-105 hover:text-solana-purple'
                  }`}
                  title={item.label}
                >
                  <span className="text-2xl">{item.icon}</span>
                </button>
              ))}
            </div>

            {/* Windows Area */}
            <div className="h-screen">
              {/* Debug info - remove in production */}
              <div className="fixed bottom-2 left-2 text-xs text-black/50 z-10">
                Open windows: {openWindows.map(w => w.id).join(', ')}
              </div>
              
              {openWindows.map((window) => (
                <div 
                  key={window.id} 
                  onClick={(e) => {
                    e.stopPropagation();
                    bringToFront(window.id);
                  }}
                >
                  {renderWindow(window.id)}
                </div>
              ))}
            </div>

            {/* Welcome message if no windows are open */}
            {openWindows.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center p-12 bg-white/90 rounded-2xl shadow-lg max-w-md border-2 border-solana-purple">
                  <Image 
                    src="/sniffle-logo.png" 
                    alt="Sniffle Logo" 
                    width={100} 
                    height={100}
                    className="mx-auto mb-4" 
                  />
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">Welcome to Sniffle</h2>
                  <p className="text-gray-600 mb-6">Advanced Memecoin Intelligence for Solana - Click on the menu items on the left to get started</p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Debug info - remove in production */}
      </main>
  );
}