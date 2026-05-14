import React, { useState, useEffect } from 'react';
import { getCVRecommendations, CVRecommendationJob } from '../../api';

const CVRecommendations: React.FC = () => {
	const [recommendations, setRecommendations] = useState<CVRecommendationJob[]>([]);
	const [message, setMessage] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [hasRequested, setHasRequested] = useState(false);
	const [loadingStep, setLoadingStep] = useState(0);

	const loadingSteps = [
		'Parsing your CV',
		'Extracting your skills',
		'Matching job opportunities',
		'Personalizing recommendations',
	];

	useEffect(() => {
		if (!loading) return;

		const interval = setInterval(() => {
			setLoadingStep((prev) => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
		}, 1500);

		return () => clearInterval(interval);
	}, [loading, loadingSteps.length]);

	const handleGetRecommendations = async () => {
		setLoading(true);
		setLoadingStep(0);
		setError('');
		setRecommendations([]);
		setMessage('');

		try {
			const response = await getCVRecommendations();
			setRecommendations(response.response.jobs || []);
			setMessage(response.response.message || '');
			setHasRequested(true);
		} catch (err: any) {
			setError(err.message || 'Failed to get recommendations. Please try again.');
			setHasRequested(true);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen p-6 md:p-8">
			{/* Header Section */}
			<div className="mb-8">
				<h1 className="text-3xl md:text-4xl font-bold text-white mb-2">CV-Based Job Recommendations</h1>
				<p className="text-white/70">Get personalized job recommendations based on your CV and skills</p>
			</div>

			{/* Action Button Section */}
			<div className="mb-8 flex flex-col sm:flex-row gap-4">
				<button
					onClick={handleGetRecommendations}
					disabled={loading}
					className="px-6 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-[#6A1E55] to-[#A64D79] hover:from-[#7A2E65] hover:to-[#B65D89] disabled:from-[#6A1E55]/60 disabled:to-[#A64D79]/60 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
				>
					{loading ? (
						<>
							<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
							<span>Loading...</span>
						</>
					) : (
						<>
							🎯 Get Recommendations
						</>
					)}
				</button>
				{hasRequested && (
					<button
						onClick={() => {
							setRecommendations([]);
							setMessage('');
							setError('');
							setHasRequested(false);
							setLoadingStep(0);
						}}
						className="px-6 py-3 rounded-lg font-semibold text-white border border-white/20 bg-white/5 hover:bg-white/10 transition-all duration-200"
					>
						Clear
					</button>
				)}
			</div>

			{/* Loading Steps Section */}
			{loading && (
				<div className="mb-8 p-6 rounded-lg bg-gradient-to-r from-[#6A1E55]/20 to-[#A64D79]/20 border border-[#A64D79]/40">
					<div className="space-y-3">
						{loadingSteps.map((step, index) => (
							<div key={index} className="flex items-center gap-3">
								{index < loadingStep ? (
									<div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
										<span className="text-white text-xs font-bold">✓</span>
									</div>
								) : index === loadingStep ? (
									<div className="w-5 h-5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
								) : (
									<div className="w-5 h-5 rounded-full bg-white/10 border border-white/20" />
								)}
								<span
									className={`text-sm font-medium transition-colors ${
										index < loadingStep
											? 'text-emerald-200'
											: index === loadingStep
											? 'text-white'
											: 'text-white/60'
									}`}
								>
									{step}
								</span>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Error Message */}
			{error && (
				<div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-200">
					<div className="flex gap-3">
						<span className="text-xl">⚠️</span>
						<div>
							<p className="font-semibold mb-1">Error</p>
							<p className="text-sm">{error}</p>
						</div>
					</div>
				</div>
			)}

			{/* Recommendation Message */}
			{message && (
				<div className="mb-8 p-4 rounded-lg bg-gradient-to-r from-[#6A1E55]/20 to-[#A64D79]/20 border border-[#A64D79]/40">
					<div className="flex gap-3">
						<span className="text-xl">💡</span>
						<div>
							<p className="text-white/90 text-sm leading-relaxed">{message}</p>
						</div>
					</div>
				</div>
			)}

			{/* No Results Message */}
			{hasRequested && recommendations.length === 0 && !error && (
				<div className="text-center py-12">
					<div className="text-4xl mb-4">📭</div>
					<p className="text-white/70 text-lg">No recommendations available at this time</p>
					<p className="text-white/50 text-sm mt-2">Please try again later or update your CV</p>
				</div>
			)}

			{/* Job Cards Grid */}
			{recommendations.length > 0 && (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{recommendations.map((job, index) => (
						<div
							key={index}
							className="bg-gradient-to-br from-[#3B1C32]/95 to-[#2A1425]/95 border border-white/20 rounded-xl p-5 shadow-lg hover:shadow-xl transition-all duration-200 hover:border-white/30 flex flex-col"
						>
							{/* Job Header */}
							<div className="mb-4 pb-4 border-b border-white/10">
								<h3 className="text-white font-bold text-lg leading-tight mb-1">{job.title}</h3>
								<p className="text-white/90 text-sm font-medium">{job.company_name}</p>
								<p className="text-white/70 text-xs mt-2">📍 {job.location}</p>
							</div>

							{/* Job Details */}
							<div className="space-y-2 mb-4 text-xs text-white/80">
								{job.job_type && (
									<div className="bg-white/5 rounded-lg px-3 py-2">
										<span className="font-medium text-white/90">Type:</span> {job.job_type}
									</div>
								)}
								{job.experience && (
									<div className="bg-white/5 rounded-lg px-3 py-2">
										<span className="font-medium text-white/90">Experience:</span> {job.experience}
									</div>
								)}
								{job.education && (
									<div className="bg-white/5 rounded-lg px-3 py-2">
										<span className="font-medium text-white/90">Education:</span> {job.education}
									</div>
								)}
								{job.salary && job.salary !== 'Not mentioned' && (
									<div className="bg-white/5 rounded-lg px-3 py-2">
										<span className="font-medium text-white/90">Salary:</span> {job.salary}
									</div>
								)}
							</div>

							{/* Skills */}
							{job.skills && job.skills.trim() && (
								<div className="mb-4">
									<h4 className="text-white/90 text-xs font-semibold mb-2">Skills Required</h4>
									<div className="flex flex-wrap gap-2">
										{job.skills.split(',').map((skill, skillIndex) => (
											<span
												key={skillIndex}
												className="px-2 py-1 text-[10px] bg-[#6A1E55]/30 text-white/80 rounded-md border border-[#6A1E55]/50 whitespace-nowrap"
											>
												{skill.trim()}
											</span>
										))}
									</div>
								</div>
							)}

							{/* Footer Info */}
							<div className="mt-auto pt-4 border-t border-white/10 space-y-1 text-[11px] text-white/70 mb-4">
								{job.posted_date && (
									<div>
										<span className="font-medium">Posted:</span> {job.posted_date}
									</div>
								)}
								{job.apply_before && (
									<div className="text-amber-200/80">
										<span className="font-medium">Apply before:</span> {job.apply_before}
									</div>
								)}
							</div>

							{/* Apply Button */}
							{job.job_link && (
								<a
									href={job.job_link}
									target="_blank"
									rel="noopener noreferrer"
									className="block w-full text-center px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#6A1E55] to-[#7A2E65] text-white text-sm font-semibold hover:from-[#7A2E65] hover:to-[#8A3E75] transition-all duration-200"
								>
									View Job →
								</a>
							)}
						</div>
					))}
				</div>
			)}

			{/* Empty State */}
			{!hasRequested && (
				<div className="text-center py-12">
					<div className="text-6xl mb-4">🔍</div>
					<p className="text-white/70 text-lg">Click the button above to get your personalized job recommendations</p>
					<p className="text-white/50 text-sm mt-2">We'll analyze your CV and find the best matching jobs for you</p>
				</div>
			)}
		</div>
	);
};

export default CVRecommendations;
