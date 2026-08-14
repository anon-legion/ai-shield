import type { IFilter } from '../../models/filter';

const filterDefault: IFilter[] = [
	{
		label: 'Emails (default)',
		regex: /[^@ \t\r\n]+@[^@ \t\r\n]+\.[^@ \t\r\n]+/g,
		isEnabled: true,
	},
	{
		label: 'Phone Numbers (default)',
		regex: /[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}/g,
		isEnabled: true,
	},
];

export { filterDefault };
