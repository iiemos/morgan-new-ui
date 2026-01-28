import React from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Sidebar from './components/Sidebar.jsx'
import Header from './components/Header.jsx'
import CookieConsent from './components/CookieConsent.jsx'
import HomeView from './views/HomeView.jsx'
import StakeView from './views/StakeView.jsx'
import SwapView from './views/SwapView.jsx'
import TeamView from './views/TeamView.jsx'
import MineView from './views/MineView.jsx'
import './i18n/index.js'

// Create React Query client
const queryClient = new QueryClient()

// Mova网络配置 (来自Vue项目App.vue)
const movaChain = {
  id: parseInt(import.meta.env.VITE_MOVA_CHAIN_ID) || 61900,
  name: import.meta.env.VITE_NETWORK_NAME || 'Mova Mainnet',
  network: 'movachain',
  nativeCurrency: {
    name: import.meta.env.VITE_NATIVE_CURRENCY_NAME || 'MOV',
    symbol: import.meta.env.VITE_NATIVE_CURRENCY_SYMBOL || 'MOV',
    decimals: 18
  },
  rpcUrls: {
    public: { http: [import.meta.env.VITE_RPC_URL || 'https://rpc.movachain.com/'] },
    default: { http: [import.meta.env.VITE_RPC_URL || 'https://rpc.movachain.com/'] }
  },
  blockExplorers: {
    default: { name: 'Mova Explorer', url: import.meta.env.VITE_BLOCK_EXPLORER || 'https://explorer.movachain.com/' }
  }
}

// Create Wagmi config with Mova network
const config = createConfig({
  chains: [movaChain],
  connectors: [
    injected(),
  ],
  transports: {
    [movaChain.id]: http(import.meta.env.VITE_RPC_URL || 'https://rpc.movachain.com/'),
  },
})

function AppContent() {
  const location = useLocation()
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false)
  
  const toggleMenu = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }
  
  return (
    <div className="bg-background-light dark:bg-background-dark text-white min-h-screen">
      {/* 在除了首页之外的页面显示 Header */}
      {location.pathname !== '/' && <Header toggleMenu={toggleMenu} />}
      
      <div className="flex flex-col lg:flex-row h-screen overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        
        {/* Main Content Area */}
        <main className={`flex-1 flex flex-col overflow-y-auto ${location.pathname !== '/' ? 'pt-20 h-[calc(100vh-5rem)]' : ''}`}>
          <Routes>
            <Route path="/" element={<HomeView />} />
            <Route path="/stake" element={<StakeView />} />
            <Route path="/swap" element={<SwapView />} />
            <Route path="/team" element={<TeamView />} />
            <Route path="/mine" element={<MineView />} />
          </Routes>
        </main>
      </div>
      
      {/* Global Cookie Consent Banner */}
      <CookieConsent />
    </div>
  )
}

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppContent />
        </Router>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default App