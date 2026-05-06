import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { TooltipProvider } from '@/components/ui/tooltip';
import App from './App';
import LoginPage from './LoginPage';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		<TooltipProvider>
			<BrowserRouter>
				<Routes>
					<Route path="/login" element={<LoginPage />} />
					<Route path="/" element={<App />} />
					<Route path="/channels/:channelId" element={<App />} />
					<Route path="/dms/:conversationId" element={<App />} />
					<Route path="*" element={<Navigate to="/" replace />} />
				</Routes>
			</BrowserRouter>
		</TooltipProvider>
	</React.StrictMode>
);
