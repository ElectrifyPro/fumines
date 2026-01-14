import {ARR_TICKS, DAS_TICKS} from './config';

/**
 * Represents the state of no movement key being pressed.
 */
interface Idle {
	kind: 'idle';
}

/**
 * Represents the state when the movement key has been pressed, and the game is waiting for DAS to expire.
 */
interface Started {
	kind: 'started';

	/**
	 * Number of ticks the key has been held down. Once this reaches DAS_TICKS, auto-repeat begins.
	 */
	ticksHeld: number;

	/**
	 * Direction of movement: 1 for right, -1 for left.
	 */
	direction: 1 | -1;
}

/**
 * Represents the state when auto-repeat movement is occurring.
 */
interface AutoRepeat {
	kind: 'autoRepeat';

	/**
	 * Number of ticks since the last auto-repeat movement. Once this reaches ARR_TICKS, another movement occurs.
	 */
	ticksSinceLastMove: number;

	/**
	 * Direction of movement: 1 for right, -1 for left.
	 */
	direction: 1 | -1;
}

/**
 * Represents the state when a piece is being dropped.
 */
interface Dropping {
	kind: 'dropping';
}

/**
 * Create a new idle handling state.
 */
export function idle(): Idle {
	return {kind: 'idle'};
}

/**
 * Create a new started handling state.
 * @param direction direction of movement: 1 for right, -1 for left
 */
export function started(direction: 1 | -1): Started {
	return {kind: 'started', ticksHeld: 0, direction};
}

/**
 * Create a new auto-repeat handling state.
 * @param direction direction of movement: 1 for right, -1 for left
 */
export function autoRepeat(direction: 1 | -1): AutoRepeat {
	return {kind: 'autoRepeat', ticksSinceLastMove: 0, direction};
}

/**
 * Create a new dropping handling state.
 */
export function dropping(): Dropping {
	return {kind: 'dropping'};
}

/**
 * All possible handling states.
 */
export type HandlingState = Idle | Started | AutoRepeat | Dropping;

/**
 * Possible actions resulting from handling logic.
 */
export type Action =
	| {move: 1 | -1}
	| {startDrop: true}

/**
 * Apply the handling logic for piece movement based on the current handling state and pressed keys. Returns `undefined` if the state does not change.
 * @param handlingState current handling state
 * @param keysPressed array of currently pressed keys
 * @returns object with the updated handling state and what action to take (if any)
 */
export function applyHandling(
	handlingState: HandlingState,
	keysPressed: string[],
): {state: HandlingState} & (Action | {}) {
	const leftPressed = keysPressed.includes('ArrowLeft');
	const rightPressed = keysPressed.includes('ArrowRight');
	const downPressed = keysPressed.includes('ArrowDown');

	switch (handlingState.kind) {
		case 'idle':
			if (downPressed) {
				return {state: dropping(), startDrop: true};
			} else if (leftPressed && rightPressed) {
				// both keys pressed - do nothing
				return {state: handlingState};
			} else if (leftPressed) {
				// immediate movement, then wait for DAS
				return {state: started(-1), move: -1};
			} else if (rightPressed) {
				return {state: started(1), move: 1};
			}
			return {state: handlingState};

		case 'started':
			if (downPressed) {
				return {state: dropping(), startDrop: true};
			}

			if (
				// moving in the same direction as the key being held?
				(handlingState.direction === -1 && leftPressed) ||
				(handlingState.direction === 1 && rightPressed)
			) {
				const newTicksHeld = handlingState.ticksHeld + 1;
				if (newTicksHeld >= DAS_TICKS) {
					return {state: autoRepeat(handlingState.direction), move: handlingState.direction};
				}
				return {state: {...handlingState, ticksHeld: newTicksHeld}};
			}
			return {state: idle()};

		case 'autoRepeat':
			if (downPressed) {
				return {state: dropping(), startDrop: true};
			}

			if (
				(handlingState.direction === -1 && leftPressed) ||
				(handlingState.direction === 1 && rightPressed)
			) {
				const newTicksSinceLastMove = handlingState.ticksSinceLastMove + 1;
				if (newTicksSinceLastMove >= ARR_TICKS) {
					return {state: autoRepeat(handlingState.direction), move: handlingState.direction};
				}
				return {state: {...handlingState, ticksSinceLastMove: newTicksSinceLastMove}};
			}
			return {state: idle()};

		case 'dropping':
			// no movement while dropping
			return {state: handlingState};
	}
}
