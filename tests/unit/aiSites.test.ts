import { describe, expect, test } from 'bun:test';
import { isAiSite } from '@/utils/aiSites';

describe('isAiSite', () => {
	test('matches exact ai hosts', () => {
		expect(isAiSite('chatgpt.com')).toBe(true);
		expect(isAiSite('claude.ai')).toBe(true);
		expect(isAiSite('mistral.ai')).toBe(true);
	});

	test('matches subdomains', () => {
		expect(isAiSite('www.chatgpt.com')).toBe(true);
		expect(isAiSite('chat.mistral.ai')).toBe(true);
		expect(isAiSite('console.mistral.ai')).toBe(true);
	});

	test('x.com only counts on the grok path', () => {
		expect(isAiSite('x.com', '/i/grok')).toBe(true);
		expect(isAiSite('x.com', '/i/grok/chat')).toBe(true);
		expect(isAiSite('x.com', '/home')).toBe(false);
		expect(isAiSite('foo.x.com', '/timeline')).toBe(false);
	});

	test('rejects non-ai hosts', () => {
		expect(isAiSite('example.com')).toBe(false);
		expect(isAiSite('github.com', '/i/grok')).toBe(false);
		// suffix must be a subdomain boundary, not a bare string suffix
		expect(isAiSite('notchatgpt.com')).toBe(false);
	});
});
