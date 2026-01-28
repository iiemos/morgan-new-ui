import React, { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import { useTranslation } from 'react-i18next'

function Notification({ notifications, onClose }) {
  const { t } = useTranslation()
  
  // 通知状态管理
  const [visibleNotifications, setVisibleNotifications] = useState([])
  
  useEffect(() => {
    if (notifications && notifications.length > 0) {
      setVisibleNotifications(notifications)
      
      // 自动清除通知
      notifications.forEach((notification, index) => {
        setTimeout(() => {
          setVisibleNotifications(prev => prev.filter((_, i) => i !== index))
          if (onClose) {
            onClose(notification.id)
          }
        }, 5000)
      })
    }
  }, [notifications, onClose])
  
  const handleClose = (index, id) => {
    setVisibleNotifications(prev => prev.filter((_, i) => i !== index))
    if (onClose) {
      onClose(id)
    }
  }
  
  return (
    <>
      {visibleNotifications.map((notification, index) => (
        <div 
          key={notification.id || index} 
          className={`fixed top-4 right-4 z-9999 ${notification.type === 'error' ? 'bg-red-500' : notification.type === 'success' ? 'bg-green-500' : 'bg-blue-500'} text-white px-6 py-4 rounded-lg shadow-lg max-w-md ${notification.type === 'error' ? 'animate-pulse' : ''}`}
          style={{ top: `${4 + index * 100}px` }}
        >
          <div className="flex items-center gap-3">
            <Icon 
              icon={notification.type === 'error' ? 'mdi:alert-circle' : notification.type === 'success' ? 'mdi:check-circle' : 'mdi:information'} 
              className="text-xl" 
            />
            <div>
              <p className="font-bold">{t(`common.${notification.type}`)}</p>
              <p className="text-sm">{notification.message}</p>
            </div>
            <button 
              onClick={() => handleClose(index, notification.id)}
              className={`ml-auto hover:bg-${notification.type === 'error' ? 'red' : notification.type === 'success' ? 'green' : 'blue'}-600 rounded p-1`}
            >
              <Icon icon="mdi:close" />
            </button>
          </div>
        </div>
      ))}
    </>
  )
}

export default Notification
