import type { IPromptSegment } from '../models/redaction';

const autoRedactStore = storage.defineItem<boolean>('local:autoRedact', {
	fallback: true,
});

const promptMirrorStore = storage.defineItem<IPromptSegment[]>(
	'local:promptMirror',
	{
		fallback: [],
		version: 2,
		migrations: {
			// v1 stored the unredacted prompt as one string; drop it, the next
			// chatbox activity re-mirrors as segments
			2: () => [],
		},
	},
);

export { autoRedactStore, promptMirrorStore };
