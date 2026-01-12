/**
 * Is the user currently focused on the canvas?
 */
export let focused = false;

/**
 * A set containing keys that are currently pressed.
 */
export const keys: Set<string> = new Set();

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
canvas.addEventListener('contextmenu', event => event.preventDefault());
canvas.addEventListener('keydown', event => {
	if (!focused) return;
	keys.add(event.key);
});
canvas.addEventListener('keyup', event => {
	if (!focused) return;
	keys.delete(event.key);
});
canvas.addEventListener('focus', () => focused = true);
canvas.addEventListener('blur', () => focused = false);
