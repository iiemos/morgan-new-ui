import React, { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import { useTranslation } from 'react-i18next'

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(true)
  const { t } = useTranslation()

  // 初始化时检查localStorage中的cookie同意状态
  useEffect(() => {
    const consentStatus = localStorage.getItem('cookieConsent')
    if (consentStatus) {
      setIsVisible(false)
    }
  }, [])

  const handleAccept = () => {
    setIsVisible(false)
    localStorage.setItem('cookieConsent', 'accepted')
  }

  const handleReject = () => {
    setIsVisible(false)
    localStorage.setItem('cookieConsent', 'rejected')
  }

  if (!isVisible) {
    return null
  }

  return (
    <div className="fixed bottom-0 right-0 max-w-lg m-6 md:bottom-6 md:right-6 left-6 md:left-auto z-50">
      <div className="glass-panel rounded-2xl p-6 shadow-xl shadow-primary/30 border border-white/5">
        <div className="gap-4">
          <div className="flex items-start gap-3">
            <Icon icon="mdi:cookie" className="text-primary mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-bold mb-1">{t('common.cookieConsent.title')}</h3>
              <p className="text-slate-400 text-sm">{t('common.cookieConsent.message')}</p>
            </div>
          </div>
          <div className="flex justify-end gap-3 ml-auto mt-4">
            <button 
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
              onClick={handleReject}
            >
              {t('common.cookieConsent.reject')}
            </button>
            <button 
              className="px-6 py-2 bg-primary hover:bg-primary/90 rounded-lg text-white font-bold transition-colors shadow-lg shadow-primary/20"
              onClick={handleAccept}
            >
              {t('common.cookieConsent.accept')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CookieConsent