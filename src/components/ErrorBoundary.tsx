import { Component, ReactNode } from 'react';

type State = { hasError: boolean; message: string };

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
	state: State = { hasError: false, message: '' };

	static getDerivedStateFromError(error: Error): State {
		return { hasError: true, message: error.message };
	}

	componentDidCatch(error: Error, info: React.ErrorInfo) {
		console.error('[ErrorBoundary]', error, info.componentStack);
	}

	render() {
		if (this.state.hasError) {
			return (
				<div className='flex flex-col items-center justify-center min-h-screen gap-4 p-8 text-center bg-cream font-nunito'>
					<p className='text-xl font-bold text-red-500'>Something went wrong.</p>
					<p className='text-slate-500 max-w-sm'>{this.state.message}</p>
					<button
						onClick={() => this.setState({ hasError: false, message: '' })}
						className='px-6 py-2 font-bold text-white bg-pink-400 rounded-full hover:bg-pink-500 transition-colors'>
						Try again
					</button>
				</div>
			);
		}
		return this.props.children;
	}
}
