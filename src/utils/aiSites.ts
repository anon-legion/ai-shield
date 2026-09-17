// AI chat sites the extension activates on. Match patterns feed the
// manifest; isAiSite re-checks at runtime because match patterns cannot
// gate SPA path changes (x.com/i/grok).
const AI_MATCH_PATTERNS = [
	'*://chatgpt.com/*',
	'*://chat.openai.com/*',
	'*://claude.ai/*',
	'*://gemini.google.com/*',
	'*://grok.com/*',
	'*://x.com/i/grok*',
	'*://copilot.microsoft.com/*',
	'*://chat.deepseek.com/*',
	'*://perplexity.ai/*',
	'*://mistral.ai/*',
	'*://*.mistral.ai/*',
];

const AI_HOSTS = [
	'chatgpt.com',
	'chat.openai.com',
	'claude.ai',
	'gemini.google.com',
	'grok.com',
	'copilot.microsoft.com',
	'chat.deepseek.com',
	'perplexity.ai',
	'mistral.ai',
];

function isAiSite(hostname: string, pathname = '/'): boolean {
	// x.com only counts as an ai site on the grok app path
	if (hostname === 'x.com' || hostname.endsWith('.x.com')) {
		return pathname.startsWith('/i/grok');
	}

	return AI_HOSTS.some(
		(host) => hostname === host || hostname.endsWith(`.${host}`),
	);
}

export { AI_HOSTS, AI_MATCH_PATTERNS, isAiSite };
