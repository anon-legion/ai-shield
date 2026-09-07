import type { IFilter } from '../../models/filter';

const filterDefault: IFilter[] = [
	{
		label: 'Emails (default)',
		regex:
			/(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/g,
		isEnabled: true,
	},
	{
		label: 'Phone Numbers (default)',
		regex:
			/[+]?([0-9]{1,2}\s+)?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}/g,
		isEnabled: true,
	},
	{
		label: 'Names (default)',
		regex:
			/(?<=\b(?:[Nn]ame|[Ss]urname|[Cc]lient|[Cc]ontact|[Cc]ustomer|[Ee]mployee|[Pp]atient|[Rr]ecipient|[Aa]pplicant|[Dd]ear|[Tt]o)\s*[:#-]?\s*)[A-Z](?:[a-z]{1,24}|(?=['’-]))(?:['’-][A-Z][a-z]{1,24})*(?:\s+[A-Z](?:[a-z]{1,24}|(?=['’-]))(?:['’-][A-Z][a-z]{1,24})*){0,2}/g,
		isEnabled: true,
	},
	{
		label: 'Credit Cards (default)',
		regex: /\b\d(?:[ -]?\d){12,18}\b/g,
		isEnabled: true,
	},
	{
		label: 'Bank Accounts (default)',
		regex:
			/\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b|(?<=\b(?:[Aa]ccount|[Aa]cct|[Rr]outing|[Ss]ort code|[Bb]ank account|[Ii][Bb][Aa][Nn])\s*(?:[Nn]umber|[Nn]o\.?)?\s*[:#-]?\s*)[A-Z0-9](?:[ -]?[A-Z0-9]){6,32}\b/g,
		isEnabled: true,
	},
	{
		label: 'API Keys (default)',
		regex:
			/\b(?:(?:sk|pk|rk)-[A-Za-z0-9_-]{20,}|(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{24,}|AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{30,}|gh[pousr]_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{60,}|glpat-[A-Za-z0-9_-]{20,}|hf_[A-Za-z0-9]{30,}|xox[baprs]-[A-Za-z0-9-]{10,}|SG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}|ya29\.[A-Za-z0-9_-]{20,}|npm_[A-Za-z0-9]{36}|dop_v1_[a-f0-9]{64}|PMAK-[A-Za-z0-9]{24}-[A-Za-z0-9]{34}|shp(?:at|ca|pa|ss)_[a-fA-F0-9]{32}|sq0[a-z]{3}-[A-Za-z0-9_-]{22,}|(?:AC|SK)[0-9a-f]{32}|key-[0-9a-f]{32}|org-[A-Za-z0-9]{24}|\d{8,10}:AA[A-Za-z0-9_-]{32,}|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)\b/g,
		isEnabled: true,
	},
	{
		label: 'Secrets (default)',
		regex:
			/-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP |ENCRYPTED )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |DSA |OPENSSH |PGP |ENCRYPTED )?PRIVATE KEY-----|\b[a-z][a-z0-9+.-]*:\/\/[^\s:@/]+:[^\s:@/]+@[^\s<>"']+|(?<=\b[Bb]earer\s+)[A-Za-z0-9._~+/=-]{16,}|(?<=\b[Bb]asic\s+)[A-Za-z0-9+/]{20,}={0,2}|(?<=\b(?:[Aa]pi[_-]?[Kk]ey|[Aa]ccess[_-]?[Tt]oken|[Aa]uth[_-]?[Tt]oken|[Ss]ecret|[Pp]assword|[Pp]asswd|[Pp]wd|[Tt]oken)\s*[:=]\s*["']?)[A-Za-z0-9_./+=-]{12,}/g,
		isEnabled: true,
	},
	{
		label: 'Passports (default)',
		regex:
			/(?<=\b[Pp]assport(?:\s+(?:[Nn]umber|[Nn]o\.?|#))?\s*[:#-]?\s*)(?:\d{2}\s?\d{2}\s?\d{6}|[A-Z]{0,2}\d{6,9}[A-Z]?)\b/g,
		isEnabled: true,
	},
];

export { filterDefault };
