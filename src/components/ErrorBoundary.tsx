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
				<div className='flex min-h-screen items-center justify-center p-6'>
					<div className='w-full max-w-sm rounded-card border-2 border-ink bg-white p-8 text-center shadow-sticker'>
						<p className='font-display text-2xl font-extrabold'>Oops, something broke</p>
						<p className='mt-2 text-sm font-semibold text-muted'>{this.state.message}</p>
						<button
							type='button'
							onClick={() => this.setState({ hasError: false, message: '' })}
							className='press mt-6 rounded-2xl border-2 border-ink bg-butter px-5 py-3 font-extrabold shadow-sticker-sm'
						>
							Try again
						</button>
					</div>
				</div>
			);
		}
		return this.props.children;
	}
}
