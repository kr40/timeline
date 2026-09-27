import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/nunito';
import '@fontsource-variable/grandstander';
import App from './App.tsx';
import { ErrorBoundary } from './src/components/ErrorBoundary.tsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		<ErrorBoundary>
			<App />
		</ErrorBoundary>
	</React.StrictMode>,
);
