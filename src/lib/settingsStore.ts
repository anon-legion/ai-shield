const autoRedactStore = storage.defineItem<boolean>('local:autoRedact', {
	fallback: true,
});

const promptMirrorStore = storage.defineItem<string>('local:promptMirror', {
	fallback: '',
});

export { autoRedactStore, promptMirrorStore };
