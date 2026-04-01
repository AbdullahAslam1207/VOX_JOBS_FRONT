import React, { useEffect, useState } from 'react';
import { ChatJobCard } from '../../api';
import { ConversationJobItem } from '../../api';

interface JobCardProps {
	job: ConversationJobItem;
	onSave?: (job: ChatJobCard) => Promise<void> | void;
	onSelect?: (sequence: number) => void;
	isSelected?: boolean;
	isReferenced?: boolean;
	isHighlighted?: boolean;
}

const JobCard: React.FC<JobCardProps> = ({
	job,
	onSave,
	onSelect,
	isSelected = false,
	isReferenced = false,
	isHighlighted = false,
}) => {
	// Defensive: job_json might be undefined in edge cases; default to empty object.
	const jobData = (job?.job_json ?? {}) as Partial<ChatJobCard>;
	const [isSaved, setIsSaved] = useState(false);
	const location = jobData.location || jobData.city || '';

	useEffect(() => {
		try {
			const saved = localStorage.getItem('voxjobs_saved_jobs');
			const savedMap = saved ? JSON.parse(saved) : {};
			const jobId = jobData.job_link || `${jobData.title ?? 'job'}-${jobData.company_name ?? 'company'}`;
			setIsSaved(Boolean(savedMap[jobId]));
		} catch {
			setIsSaved(false);
		}
	}, [jobData?.job_link, jobData?.title, jobData?.company_name]);

	async function handleSave() {
		if (!onSave || !jobData) return;
		await onSave(jobData as ChatJobCard);
		setIsSaved(true);
	}

	const cardClasses = [
		'bg-gradient-to-br',
		'from-[#3B1C32]/95',
		'to-[#2A1425]/95',
		'border',
		'rounded-xl',
		'p-5',
		'shadow-lg',
		'transition-all',
		'duration-200',
		isSelected ? 'border-amber-400 ring-2 ring-amber-400/60' : 'border-white/20',
		isReferenced ? 'shadow-emerald-500/30' : '',
		isHighlighted ? 'ring-2 ring-purple-400/60' : '',
	].join(' ');

	return (
		<div className={cardClasses}>
			<div className="flex items-start justify-between gap-3 mb-3">
				<div className="flex-1">
					<div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-white/60">
						<span>Job #{job.sequence_num}</span>
						{isReferenced && <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200">Referenced</span>}
					</div>
					<h3 className="text-white font-bold text-base leading-tight mt-1.5">{jobData.title ?? 'Job'}</h3>
					<p className="text-white/90 text-sm font-medium">{jobData.company_name ?? ''}</p>
					{location && <p className="text-white/70 text-xs mt-1">{location}</p>}
				</div>
				<div className="flex flex-col gap-2">
					<button
						type="button"
						onClick={() => onSelect?.(job.sequence_num)}
						className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
							isSelected ? 'bg-amber-500/90 border-amber-200 text-black' : 'bg-white/10 border-white/20 text-white/80 hover:bg-white/20'
						}`}
					>
						{isSelected ? 'Referencing' : 'Use in reply'}
					</button>
					<button
						type="button"
						onClick={handleSave}
						className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
							isSaved ? 'bg-emerald-600/30 text-emerald-200 border-emerald-400/50' : 'bg-white/10 text-white/80 border-white/20 hover:bg-white/20'
						}`}
					>
						{isSaved ? 'Saved' : 'Save'}
					</button>
				</div>
			</div>

			<div className="space-y-2 mb-3 text-xs text-white/80">
				{jobData.job_type && (
					<div className="bg-white/5 rounded-lg px-3 py-2">
						<span className="font-medium">Type:</span> {jobData.job_type}
					</div>
				)}
				{jobData.experience && (
					<div className="bg-white/5 rounded-lg px-3 py-2">
						<span className="font-medium">Experience:</span> {jobData.experience}
					</div>
				)}
				{jobData.education && (
					<div className="bg-white/5 rounded-lg px-3 py-2">
						<span className="font-medium">Education:</span> {jobData.education}
					</div>
				)}
				{jobData.salary && jobData.salary !== 'Not mentioned' && (
					<div className="bg-white/5 rounded-lg px-3 py-2">
						<span className="font-medium">Salary:</span> {jobData.salary}
					</div>
				)}
			</div>

			{jobData.skills && jobData.skills.trim() && (
				<div className="mb-3">
					<h4 className="text-white/90 text-xs font-semibold mb-2">Skills Required</h4>
					<div className="flex flex-wrap gap-2 text-[11px]">
						{jobData.skills.split(',').map((skill) => (
							<span key={skill} className="px-2 py-1 bg-[#6A1E55]/30 text-white/80 rounded-md border border-[#6A1E55]/50">
								{skill.trim()}
							</span>
						))}
					</div>
				</div>
			)}

			<div className="mt-auto pt-3 border-t border-white/10 space-y-1 text-xs text-white/70">
				{jobData.posted_date && (
					<div>
						<span className="font-medium">Posted:</span> {jobData.posted_date}
					</div>
				)}
				{jobData.apply_before && (
					<div className="text-amber-200/80">
						<span className="font-medium">Apply before:</span> {jobData.apply_before}
					</div>
				)}
				{jobData.job_link && (
					<a
						href={jobData.job_link}
						target="_blank"
						rel="noopener noreferrer"
						className="block w-full text-center px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#6A1E55] to-[#7A2E65] text-white text-sm font-semibold hover:from-[#7A2E65] hover:to-[#8A3E75] transition-all duration-200 mt-2"
					>
						View Job →
					</a>
				)}
			</div>
		</div>
	);
};

export default JobCard;

