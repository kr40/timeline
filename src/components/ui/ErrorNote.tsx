import { ReactNode } from 'react';

export const ErrorNote = ({ children }: { children: ReactNode }) => (
	<p role='alert' className='rounded-2xl border-2 border-danger bg-white px-4 py-3 text-sm font-bold text-danger'>
		{children}
	</p>
);
