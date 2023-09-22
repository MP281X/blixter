export const formatDate = (date: Date) => {
	const currentYear = new Date().getFullYear();
	const year = date.getFullYear();
	const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aaug', 'Sep', 'Oct', 'Nov', 'Dec'];
	const daysDifference = Math.floor((new Date().getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
	const hoursDifference = Math.floor((new Date().getTime() - date.getTime()) / (1000 * 60 * 60));
	const minutesDifference = Math.floor((new Date().getTime() - date.getTime()) / (1000 * 60));

	if (year !== currentYear) return `${currentYear - year}y  ago`;
	if (minutesDifference < 60) return `${minutesDifference}m ago`;
	if (hoursDifference < 24) return `${hoursDifference}h ago`;
	else if (daysDifference < 15) return `${daysDifference}d  ago`;
	else return `${date.getDate()} ${months[date.getMonth()]}`;
};

export const formatDuration = (duration: number) => {
	const hours = Math.floor(duration / 3600);
	const minutes = Math.floor((duration % 3600) / 60);
	const seconds = Math.floor(duration % 60);

	if (hours > 0) {
		return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
	} else if (minutes > 0) {
		return `${minutes}:${String(seconds).padStart(2, '0')}`;
	} else {
		return `00:${String(seconds).padStart(2, '0')}`;
	}
};

export const formatWatchTime = (duration: number) => {
	if (duration < 60) return `${Math.floor(duration)}s`;
	else if (duration < 3600) return `${Math.floor(duration / 60)}min`;
	else if (duration < 86400) return `${Math.floor(duration / 3600)}h`;
	else if (duration < 2592000) return `${Math.floor(duration / 86400)}d`;
	else if (duration < 31536000) return `${Math.floor(duration / 2592000)}M`;
	else return `${Math.floor(duration / 31536000)}y`;
};

export const formatViews = (views: number) => {
	if (views < 10000) return `${views} views`;
	else if (views < 1000000) return `${Math.floor(views / 1000)}k views`;
	else return `${Math.floor(views / 1000000)}M views`;
};
