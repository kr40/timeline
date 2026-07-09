import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Question } from '../types';

function relativeTime(iso: string): string {
	const diff = Date.now() - new Date(iso).getTime();
	const mins = Math.floor(diff / 60000);
	if (mins < 1)  return 'just now';
	if (mins < 60) return `${mins}m ago`;
	const hrs = Math.floor(mins / 60);
	if (hrs < 24)  return `${hrs}h ago`;
	return `${Math.floor(hrs / 24)}d ago`;
}

export const QATab = ({ isUnlocked }: { isUnlocked: boolean }) => {
	const [questions,   setQuestions]   = useState<Question[]>([]);
	const [isLoading,   setIsLoading]   = useState(true);
	const [askerName,   setAskerName]   = useState('');
	const [questionTxt, setQuestionTxt] = useState('');
	const [submitting,  setSubmitting]  = useState(false);
	const [answeringId, setAnsweringId] = useState<string | null>(null);
	const [answerTxt,   setAnswerTxt]   = useState('');

	useEffect(() => {
		(async () => {
			try {
				const { data } = await supabase
					.from('questions')
					.select('*')
					.order('created_at', { ascending: false });
				setQuestions(data ?? []);
			} finally {
				setIsLoading(false);
			}
		})();
	}, []);

	const submitQuestion = async () => {
		if (!askerName.trim() || !questionTxt.trim()) return;
		setSubmitting(true);
		try {
			const { data, error } = await supabase
				.from('questions')
				.insert({ asker_name: askerName.trim(), question: questionTxt.trim() })
				.select()
				.single();
			if (error) throw error;
			setQuestions(prev => [data, ...prev]);
			setAskerName('');
			setQuestionTxt('');
		} catch { /* silently fail */ } finally {
			setSubmitting(false);
		}
	};

	const saveAnswer = async (id: string) => {
		if (!answerTxt.trim()) return;
		const { data, error } = await supabase
			.from('questions')
			.update({ answer: answerTxt.trim(), answered_at: new Date().toISOString() })
			.eq('id', id)
			.select()
			.single();
		if (error) return;
		setQuestions(prev => prev.map(q => q.id === id ? data : q));
		setAnsweringId(null);
		setAnswerTxt('');
	};

	return (
		<div className='py-4 space-y-4'>
			{/* Submit form */}
			<div className='bg-white rounded-3xl shadow-md p-5'>
				<h2 className='font-poppins font-extrabold text-lg text-[#1A1A2E] mb-1'>Ask Us Anything 💬</h2>
				<p className='text-sm text-slate-400 mb-4'>We'll answer as soon as we can!</p>
				<div className='space-y-3'>
					<input
						type='text'
						placeholder='Your name'
						value={askerName}
						onChange={e => setAskerName(e.target.value)}
						className='w-full rounded-full border-2 border-slate-200 px-5 py-3 text-sm font-nunito focus:outline-none focus:border-[#B39DDB]'
					/>
					<textarea
						placeholder='Ask us anything...'
						value={questionTxt}
						onChange={e => setQuestionTxt(e.target.value)}
						rows={3}
						className='w-full rounded-2xl border-2 border-slate-200 px-5 py-3 text-sm font-nunito focus:outline-none focus:border-[#B39DDB] resize-none'
					/>
					<button
						onClick={submitQuestion}
						disabled={submitting || !askerName.trim() || !questionTxt.trim()}
						className='w-full rounded-full bg-[#B39DDB] text-white font-bold py-3 text-sm disabled:opacity-50 transition-opacity'>
						{submitting ? 'Sending…' : 'Ask Away 💬'}
					</button>
				</div>
			</div>

			{/* Questions feed */}
			{isLoading ? (
				<div className='flex justify-center py-12'>
					<div className='w-8 h-8 rounded-full border-4 border-[#B39DDB] border-t-transparent animate-spin' />
				</div>
			) : questions.length === 0 ? (
				<div className='bg-white rounded-3xl shadow-md p-8 text-center'>
					<p className='text-4xl mb-3'>💬</p>
					<p className='font-poppins font-bold text-[#1A1A2E]'>No questions yet</p>
					<p className='text-sm text-slate-400 mt-1'>Be the first to ask!</p>
				</div>
			) : (
				questions.map(q => (
					<div key={q.id} className='bg-white rounded-3xl shadow-md p-5'>
						<div className='flex items-center justify-between mb-2'>
							<span className='font-poppins font-bold text-sm text-[#1A1A2E]'>{q.asker_name}</span>
							<span className='text-xs text-slate-400'>{relativeTime(q.created_at)}</span>
						</div>
						<p className='text-[#1A1A2E] text-sm leading-relaxed mb-3'>{q.question}</p>

						{q.answer ? (
							<div className='border-l-4 border-[#FF8C69] pl-4 bg-[#FF8C69]/5 rounded-r-2xl py-2 pr-3'>
								<p className='text-sm text-[#1A1A2E] leading-relaxed'>{q.answer}</p>
								<p className='text-xs text-slate-400 mt-1'>— Mum & Dad 💛</p>
							</div>
						) : (
							answeringId !== q.id ? (
								<div className='flex items-center justify-between'>
									<p className='text-xs text-slate-300 italic'>Waiting for an answer... 🌙</p>
									{isUnlocked && (
										<button
											onClick={() => { setAnsweringId(q.id); setAnswerTxt(''); }}
											className='text-xs font-bold text-[#FF8C69] hover:underline'>
											Answer
										</button>
									)}
								</div>
							) : (
								<div className='space-y-2'>
									<textarea
										placeholder='Type your answer...'
										value={answerTxt}
										onChange={e => setAnswerTxt(e.target.value)}
										rows={3}
										autoFocus
										className='w-full rounded-2xl border-2 border-slate-200 px-4 py-3 text-sm font-nunito focus:outline-none focus:border-[#FF8C69] resize-none'
									/>
									<div className='flex gap-2'>
										<button
											onClick={() => saveAnswer(q.id)}
											disabled={!answerTxt.trim()}
											className='flex-1 rounded-full bg-[#FF8C69] text-white font-bold py-2.5 text-sm disabled:opacity-50'>
											Save Answer
										</button>
										<button
											onClick={() => setAnsweringId(null)}
											className='flex-1 rounded-full border-2 border-slate-200 font-bold py-2.5 text-sm text-slate-500'>
											Cancel
										</button>
									</div>
								</div>
							)
						)}
					</div>
				))
			)}
		</div>
	);
};
