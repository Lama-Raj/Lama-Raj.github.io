
// quotes.js — fetch Quote of the Day from a free API (type.fit) and fall back to embedded quotes
(function () {
	'use strict';

	// Public free endpoint with a large static list
	const REMOTE_URL = 'https://type.fit/api/quotes';

	// Fallback embedded quotes (first one is your approved quote)
	const FALLBACK_QUOTES = [
		{ text: "The only way to do great work is to love what you do.", author: 'Steve Jobs' },
		{ text: "Strive not to be a success, but rather to be of value.", author: 'Albert Einstein' },
		{ text: "The journey of a thousand miles begins with one step.", author: 'Lao Tzu' },
		{ text: "What we think, we become.", author: 'Buddha' },
		{ text: "Success usually comes to those who are too busy to be looking for it.", author: 'Henry David Thoreau' }
	];

	// try to cache remote quotes in sessionStorage for the session
	async function getRemoteQuotes() {
		try {
			const cached = sessionStorage.getItem('remoteQuotes');
			if (cached) return JSON.parse(cached);

			const res = await fetch(REMOTE_URL, { cache: 'no-cache' });
			if (!res.ok) throw new Error('fetch failed');
			const data = await res.json();
			// normalize: ensure text + author
			const normalized = (data || []).map(q => ({ text: (q.text || '').trim(), author: (q.author || '').trim() }));
			if (normalized.length) sessionStorage.setItem('remoteQuotes', JSON.stringify(normalized));
			return normalized;
		} catch (err) {
			console.warn('quotes.js: remote fetch failed', err);
			return null;
		}
	}

	function formatDateKey(d) {
		const yyyy = d.getFullYear();
		const mm = String(d.getMonth() + 1).padStart(2, '0');
		const dd = String(d.getDate()).padStart(2, '0');
		return `${yyyy}-${mm}-${dd}`;
	}

	function pickQuoteForDateFromList(list, d) {
		if (!Array.isArray(list) || list.length === 0) return null;
		const key = formatDateKey(d);
		let sum = 0;
		for (let i = 0; i < key.length; i++) sum = (sum + key.charCodeAt(i)) % list.length;
		return list[sum];
	}

	async function renderQuote() {
		const container = document.getElementById('quote-of-day');
		if (!container) return;

		// try remote first
		const remote = await getRemoteQuotes();
		const source = remote && remote.length ? remote : FALLBACK_QUOTES;
		const q = pickQuoteForDateFromList(source, new Date()) || FALLBACK_QUOTES[0];

		const textEl = container.querySelector('.quote-text');
		const authorEl = container.querySelector('.quote-author');
		if (textEl) textEl.textContent = `"${q.text}"`;
		if (authorEl) authorEl.textContent = q.author ? `— ${q.author}` : '';
	}

	function msUntilNextMidnight() {
		const now = new Date();
		const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
		return next - now;
	}

	function scheduleMidnightUpdate() {
		const ms = msUntilNextMidnight();
		setTimeout(function () {
			renderQuote();
			setInterval(renderQuote, 24 * 60 * 60 * 1000);
		}, ms + 1000);
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', function () {
			renderQuote();
			scheduleMidnightUpdate();
		});
	} else {
		renderQuote();
		scheduleMidnightUpdate();
	}

})();
