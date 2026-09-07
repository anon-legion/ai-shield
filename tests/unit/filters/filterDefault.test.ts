import { describe, expect, test } from 'bun:test';
import { filterDefault } from '@/utils/filter/filterDefault';
import { generateRedaction } from '@/utils/redaction/redactionGenerator';
import {
	findMatches,
	getRedactionsToPersist,
	redactText,
	unredactText,
} from '@/utils/redaction/redactionText';

function getFilterByLabel(label: string): RegExp {
	const filter = filterDefault.find((filter) => filter.label.startsWith(label));

	if (!filter) throw new Error(`no default filter labelled ${label}`);

	return filter.regex;
}

function hits(label: string, text: string): string[] {
	return findMatches(text, [getFilterByLabel(label)]);
}

describe('Emails', () => {
	test('matches an address with subdomains and a plus tag', () => {
		expect(hits('Emails', 'contact a.b+tag@sub.example.co.uk today')).toEqual([
			'a.b+tag@sub.example.co.uk',
		]);
	});

	test('ignores text with no address', () => {
		expect(hits('Emails', 'no address at all')).toEqual([]);
	});

	test('excludes a trailing sentence period', () => {
		expect(hits('Emails', 'mail me at a@b.com.')).toEqual(['a@b.com']);
	});

	test('excludes surrounding angle brackets and punctuation', () => {
		expect(hits('Emails', 'see <a@b.com>, ok')).toEqual(['a@b.com']);
	});
});

describe('Phone Numbers', () => {
	test('matches a plain ten digit number', () => {
		expect(hits('Phone', 'call 0123456789 now')).toEqual(['0123456789']);
	});

	test('matches a grouped number with separators', () => {
		expect(hits('Phone', 'call (555) 123-4567 now')).toEqual([
			'(555) 123-4567',
		]);
	});

	test('ignores a short digit run', () => {
		expect(hits('Phone', 'only 12345 here')).toEqual([]);
	});

	test('includes the country code', () => {
		expect(hits('Phone', 'call +1 (555) 123-4567 now')).toEqual([
			'+1 (555) 123-4567',
		]);
	});

	test.failing('does not match a fragment inside an IBAN', () => {
		expect(hits('Phone', 'IBAN DE89370400440532013000')).toEqual([]);
	});
});

describe('Names', () => {
	test('matches a labelled two part name without the label', () => {
		expect(hits('Names', 'Name: John Smith')).toEqual(['John Smith']);
	});

	test('matches hyphenated and apostrophed names', () => {
		expect(hits('Names', 'Employee - Mary-Jane O’Brien')).toEqual([
			'Mary-Jane O’Brien',
		]);
	});

	test('caps a name at three words', () => {
		expect(hits('Names', 'Recipient: Ana Maria Silva Costa')).toEqual([
			'Ana Maria Silva',
		]);
	});

	test('ignores a label word inside a longer word', () => {
		expect(hits('Names', 'The filename: Report was fine')).toEqual([]);
	});

	// detecting names without a label needs Named Entity Recognition, and
	// matching from capitalisation alone would redact the start of every sentence
	test.failing('does not match an unlabelled name', () => {
		expect(hits('Names', 'I met John Smith yesterday')).toEqual(['John Smith']);
	});

	test.failing('matches an all caps label and value', () => {
		expect(hits('Names', 'NAME: JOHN SMITH')).toEqual(['JOHN SMITH']);
	});

	test.failing('matches a lowercase name after a label', () => {
		expect(hits('Names', 'name: john smith')).toEqual(['john smith']);
	});
});

describe('Credit Cards', () => {
	test('matches a space separated card number', () => {
		expect(hits('Credit Cards', 'card 4111 1111 1111 1111 ok')).toEqual([
			'4111 1111 1111 1111',
		]);
	});

	test('matches a hyphen separated card number', () => {
		expect(hits('Credit Cards', '4111-1111-1111-1111')).toEqual([
			'4111-1111-1111-1111',
		]);
	});

	test('ignores a digit run below the card length range', () => {
		expect(hits('Credit Cards', 'only 123456789012 here')).toEqual([]);
	});

	// current implementation only uses regex to find targets, but would be cool
	test.failing('rejects a number that fails the Luhn checksum', () => {
		expect(hits('Credit Cards', 'order 1234567890123 shipped')).toEqual([]);
	});
});

describe('Bank Accounts', () => {
	test('matches an IBAN without a keyword', () => {
		expect(hits('Bank Accounts', 'IBAN DE89370400440532013000 x')).toEqual([
			'DE89370400440532013000',
		]);
	});

	test('matches a keyed account number without the keyword', () => {
		expect(
			hits('Bank Accounts', 'Account number: GB29 NWBK 6016 1331'),
		).toEqual(['GB29 NWBK 6016 1331']);
	});

	test('ignores prose following the keyword', () => {
		expect(hits('Bank Accounts', 'account: closed yesterday by staff')).toEqual(
			[],
		);
	});

	test.failing('matches an all caps keyword', () => {
		expect(hits('Bank Accounts', 'ACCOUNT: 12345678')).toEqual(['12345678']);
	});

	// the body needs seven alphanumerics; a six digit sort code falls short
	test.failing('matches a six digit sort code', () => {
		expect(hits('Bank Accounts', 'Sort code: 12-34-56')).toEqual(['12-34-56']);
	});
});

describe('API Keys', () => {
	test('matches a GitHub token', () => {
		expect(
			hits('API Keys', 'ghp_1234567890abcdefghijklmnopqrstuvwxyz here'),
		).toEqual(['ghp_1234567890abcdefghijklmnopqrstuvwxyz']);
	});

	test('matches an AWS access key id', () => {
		expect(hits('API Keys', 'AKIAIOSFODNN7EXAMPLE')).toEqual([
			'AKIAIOSFODNN7EXAMPLE',
		]);
	});

	test('matches an sk- prefixed key', () => {
		expect(hits('API Keys', 'key sk-ant-api03-AbCdEfGhIjKlMnOpQrStUv')).toEqual(
			['sk-ant-api03-AbCdEfGhIjKlMnOpQrStUv'],
		);
	});

	test('matches a JWT', () => {
		expect(
			hits('API Keys', 'token eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.abc123'),
		).toEqual(['eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.abc123']);
	});

	test('ignores a prefix below the minimum length', () => {
		expect(hits('API Keys', 'sk-short')).toEqual([]);
	});

	test('ignores ordinary prose', () => {
		expect(hits('API Keys', 'just some normal words here')).toEqual([]);
	});
});

describe('Secrets', () => {
	test('matches an assigned value without the key name', () => {
		expect(hits('Secrets', 'api_key = "abcdef1234567890"')).toEqual([
			'abcdef1234567890',
		]);
	});

	test('matches a bearer token without the scheme', () => {
		expect(
			hits('Secrets', 'Authorization: Bearer abcdefghijklmnop123'),
		).toEqual(['abcdefghijklmnop123']);
	});

	test('matches credentials embedded in a connection string', () => {
		expect(
			hits('Secrets', 'postgres://user:pa55word@db.example.com:5432/app'),
		).toEqual(['postgres://user:pa55word@db.example.com:5432/app']);
	});

	test('matches a whole private key block', () => {
		const block =
			'-----BEGIN RSA PRIVATE KEY-----\nMIIEow==\n-----END RSA PRIVATE KEY-----';

		expect(hits('Secrets', `before ${block} after`)).toEqual([block]);
	});

	test('ignores a value below the minimum length', () => {
		expect(hits('Secrets', 'password: short')).toEqual([]);
	});

	test('ignores the keyword used in prose', () => {
		expect(hits('Secrets', 'the secret is safe with me')).toEqual([]);
	});
});

describe('Passports', () => {
	test('matches a letter prefixed number without the keyword', () => {
		expect(hits('Passports', 'Passport: A12345678')).toEqual(['A12345678']);
	});

	test('matches a spaced series and number', () => {
		expect(hits('Passports', 'passport number 45 05 123456')).toEqual([
			'45 05 123456',
		]);
	});

	// without the keyword this shape collides with order numbers, invoice ids and part codes
	test('does not match a bare number with no keyword', () => {
		expect(hits('Passports', 'order A12345678 shipped')).toEqual([]);
	});

	test('ignores the keyword used in prose', () => {
		expect(hits('Passports', 'my passport expired last year')).toEqual([]);
	});
});

describe('filters used through redaction', () => {
	const cases: [string, string][] = [
		['Emails', 'reach me at a.b@example.com please'],
		['Phone', 'call 0123456789 please'],
		['Names', 'Name: John Smith called'],
		['Credit Cards', 'card 4111 1111 1111 1111 ok'],
		['Bank Accounts', 'IBAN DE89370400440532013000 ok'],
		['API Keys', 'key AKIAIOSFODNN7EXAMPLE ok'],
		['Secrets', 'password: hunter2hunter2 ok'],
		['Passports', 'Passport: A12345678 ok'],
	];

	for (const [label, text] of cases) {
		test(`${label} round trips through redact and unredact`, () => {
			const targets = hits(label, text);

			expect(targets.length).toBeGreaterThan(0);

			const redactions = targets.map((target) =>
				generateRedaction({ target, alias: '' }),
			);
			const redacted = redactText(text, redactions);

			targets.forEach((target) => {
				expect(redacted).not.toContain(target);
			});

			expect(unredactText(redacted, redactions)).toBe(text);
		});
	}

	test('all filters together redact every match in one pass', () => {
		const text =
			'Name: John Smith, a.b@example.com, 0123456789, IBAN DE89370400440532013000, Passport: A12345678';
		const patterns = filterDefault.map((filter) => filter.regex);
		const redactions = findMatches(text, patterns).map((target) =>
			generateRedaction({ target, alias: '' }),
		);
		const redacted = redactText(text, redactions);

		expect(redacted).not.toContain('John Smith');
		expect(redacted).not.toContain('a.b@example.com');
		expect(redacted).not.toContain('DE89370400440532013000');
		expect(unredactText(redacted, redactions)).toBe(text);
	});

	// the phone pattern matches 893704004405 inside the IBAN, so both become
	// targets. two independent mechanisms keep that from mangling the IBAN:
	// redactText sorts targets longest first, and boundTarget refuses to
	// substitute a target flanked by word characters
	test('an IBAN is redacted whole despite the phone filter matching a fragment', () => {
		const text = 'IBAN DE89370400440532013000 ok';
		const patterns = filterDefault.map((filter) => filter.regex);
		const targets = findMatches(text, patterns);

		expect(targets).toContain('DE89370400440532013000');
		expect(targets).toContain('893704004405');

		const redactions = targets.map((target) =>
			generateRedaction({ target, alias: '' }),
		);
		const iban = redactions.find(
			(redaction) => redaction.target === 'DE89370400440532013000',
		);
		const fragment = redactions.find(
			(redaction) => redaction.target === '893704004405',
		);
		const redacted = redactText(text, redactions);

		expect(redacted).toBe(`IBAN [${iban?.alias}] ok`);
		expect(redacted).not.toContain(`[${fragment?.alias}]`);
		expect(unredactText(redacted, redactions)).toBe(text);
	});

	test('only the redactions actually substituted are kept for persistence', () => {
		const text = 'IBAN DE89370400440532013000 ok';
		const patterns = filterDefault.map((filter) => filter.regex);
		const redactions = findMatches(text, patterns).map((target) =>
			generateRedaction({ target, alias: '' }),
		);
		const kept = getRedactionsToPersist(
			redactText(text, redactions),
			redactions,
		);

		expect(kept.map((redaction) => redaction.target)).toEqual([
			'DE89370400440532013000',
		]);
	});
});

describe('filterStore serialization', () => {
	// filterStore persists patterns as source + flags, so both must survive
	test('every pattern survives a source and flags round trip', () => {
		filterDefault.forEach((filter) => {
			const rebuilt = new RegExp(filter.regex.source, filter.regex.flags);

			expect(rebuilt.source).toBe(filter.regex.source);
			expect(rebuilt.flags).toBe(filter.regex.flags);
		});
	});

	test('rebuilt patterns still match', () => {
		const rebuilt = new RegExp(
			getFilterByLabel('Emails').source,
			getFilterByLabel('Emails').flags,
		);

		expect(findMatches('a@b.com', [rebuilt])).toEqual(['a@b.com']);
	});
});
