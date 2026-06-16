// frontend/src/components/ShareMenu.tsx
import React, { useState } from 'react';

interface ShareMenuProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  text: string;
}

const ShareMenu: React.FC<ShareMenuProps> = ({
  isOpen,
  onClose,
  title,
  text
}) => {
  const [copied, setCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);

  if (!isOpen) return null;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setShowToast(true);
      setTimeout(() => {
        setCopied(false);
        setShowToast(false);
      }, 2000);
    } catch (err) {
      console.error('Ошибка копирования:', err);
      // Fallback через textarea
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setShowToast(true);
      setTimeout(() => {
        setCopied(false);
        setShowToast(false);
      }, 2000);
    }
  };

  const shareToTelegram = () => {
    const encodedText = encodeURIComponent(text);
    const url = `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodedText}`;
    window.open(url, '_blank');
    onClose();
  };

  const shareToWhatsApp = () => {
    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
    onClose();
  };

  const shareToEmail = () => {
    const subject = encodeURIComponent(title);
    const body = encodeURIComponent(text);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    onClose();
  };

  const shareToMAX = async () => {
    await copyToClipboard();
    onClose();
    // Показываем специальное уведомление для MAX
    setTimeout(() => {
      alert('✅ Текст скопирован!\n\nОткройте MAX, выберите чат и вставьте (удержите палец в поле ввода → Вставить)');
    }, 100);
  };

  const shareViaNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: text
        });
        onClose();
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Ошибка шеринга:', error);
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800">Поделиться</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-4">
          {/* Кнопки популярных приложений */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <button
              onClick={shareToTelegram}
              className="flex flex-col items-center p-3 rounded-xl hover:bg-blue-50 transition-colors"
            >
              <span className="text-3xl">📨</span>
              <span className="text-xs mt-1 font-medium">Telegram</span>
            </button>
            <button
              onClick={shareToWhatsApp}
              className="flex flex-col items-center p-3 rounded-xl hover:bg-green-50 transition-colors"
            >
              <span className="text-3xl">💬</span>
              <span className="text-xs mt-1 font-medium">WhatsApp</span>
            </button>
            <button
              onClick={shareToMAX}
              className="flex flex-col items-center p-3 rounded-xl hover:bg-purple-50 transition-colors"
            >
              <span className="text-3xl">💬</span>
              <span className="text-xs mt-1 font-medium">MAX</span>
            </button>
            <button
              onClick={shareToEmail}
              className="flex flex-col items-center p-3 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <span className="text-3xl">📧</span>
              <span className="text-xs mt-1 font-medium">Email</span>
            </button>
            <button
              onClick={copyToClipboard}
              className="flex flex-col items-center p-3 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <span className="text-3xl">📋</span>
              <span className="text-xs mt-1 font-medium">Копировать</span>
            </button>
          </div>

          {/* Кнопка нативного шеринга */}
          {typeof navigator.share === 'function' && (
            <button
              onClick={shareViaNative}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all font-medium flex items-center justify-center gap-2 mt-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Поделиться через систему
            </button>
          )}
        </div>

        {/* Всплывающее уведомление */}
        {showToast && (
          <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-full shadow-lg text-sm z-[70] animate-fadeIn">
            ✓ Скопировано!
          </div>
        )}
      </div>
    </div>
  );
};

export default ShareMenu;