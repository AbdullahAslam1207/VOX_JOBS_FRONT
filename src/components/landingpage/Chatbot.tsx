import React from 'react';
import ChatWindow from '../chat/ChatWindow';

interface ChatbotProps {
	isOpen: boolean;
	onClose: () => void;
}

export default function Chatbot({ isOpen, onClose }: ChatbotProps) {
	if (!isOpen) return null;

	return (
		<>
			<style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(106, 30, 85, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(106, 30, 85, 0.7);
        }
      `}</style>
			<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
				<ChatWindow onClose={onClose} />
			</div>
		</>
	);
}

