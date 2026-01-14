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
 * Represents the state when a piece is being dropped with DAS buffering.
 */
interface DroppingDasBuffer {
	kind: 'droppingDasBuffer';

	/**
	 * Number of ticks a movement key has been held down. This is used to implement DAS buffering while dropping.
	 */
	ticksHeld: number;

	/**
	 * Direction of movement: 1 for right, -1 for left.
	 */
	direction: 1 | -1;
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
export function started(direction: 1 | -1, ticksHeld: number = 0): Started {
	return {kind: 'started', ticksHeld, direction};
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
 * Create an initial dropping with DAS buffer handling state.
 * @param direction direction of movement: 1 for right, -1 for left
 */
export function droppingDasBuffer(direction: 1 | -1): DroppingDasBuffer {
	return {kind: 'droppingDasBuffer', ticksHeld: 1, direction};
}

/**
 * All possible handling states.
 */
export type HandlingState = Idle | Started | AutoRepeat | Dropping | DroppingDasBuffer;

/**
 * Possible actions resulting from handling logic.
 */
export type Action =
	| {move: 1 | -1}
	| {rotate: 1 | -1}
	| {startDrop: true}

/**
 * If the conditions are met, injects a rotation action into the given actions array.
 * @param justPressed array of keys that were just pressed
 * @param actions array of actions to potentially add a rotation action to
 * @returns updated array of actions with rotation action added if applicable
 */
export function maybeAddRotate(
	justPressed: string[],
	actions: Action[],
): Action[] {
	const aPressed = justPressed.includes('a');
	const dPressed = justPressed.includes('d');

	if (aPressed && dPressed) {
		// both keys pressed - do nothing
		return actions;
	} else if (aPressed) {
		return [{rotate: -1}, ...actions];
	} else if (dPressed) {
		return [{rotate: 1}, ...actions];
	}

	return actions;
}

/**
 * Apply the handling logic for piece movement based on the current handling state and pressed keys. Returns `undefined` if the state does not change.
 * @param handlingState current handling state
 * @param keysHeld array of currently held keys
 * @param justPressed array of keys that were just pressed
 * @returns object with the updated handling state and what action to take (if any)
 */
export function applyHandling(
	handlingState: HandlingState,
	keysHeld: string[],
	justPressed: string[],
): {state: HandlingState, actions: Action[]} {
	const leftPressed = keysHeld.includes('ArrowLeft');
	const rightPressed = keysHeld.includes('ArrowRight');
	const downPressed = justPressed.includes('ArrowDown');

	switch (handlingState.kind) {
		case 'idle': {
			const actions = maybeAddRotate(justPressed, []);

			if (downPressed) {
				actions.push({startDrop: true});
				return {state: dropping(), actions};
			}

			if (leftPressed && rightPressed) {
				// both keys pressed - do nothing
				return {state: handlingState, actions};
			} else if (leftPressed) {
				// immediate movement, then wait for DAS
				actions.push({move: -1});
				return {state: started(-1), actions};
			} else if (rightPressed) {
				actions.push({move: 1});
				return {state: started(1), actions};
			}
			return {state: handlingState, actions};
		}

		case 'started': {
			const actions = maybeAddRotate(justPressed, []);

			if (downPressed) {
				actions.push({startDrop: true});
				return {state: dropping(), actions};
			}

			if (
				// moving in the same direction as the key being held?
				(handlingState.direction === -1 && leftPressed) ||
				(handlingState.direction === 1 && rightPressed)
			) {
				const newTicksHeld = handlingState.ticksHeld + 1;
				if (newTicksHeld >= DAS_TICKS) {
					actions.push({move: handlingState.direction});
					return {state: autoRepeat(handlingState.direction), actions};
				}

				return {state: {...handlingState, ticksHeld: newTicksHeld}, actions};
			}
			return {state: idle(), actions};
		}

		case 'autoRepeat': {
			const actions = maybeAddRotate(justPressed, []);

			if (downPressed) {
				actions.push({startDrop: true});
				return {state: dropping(), actions};
			}

			if (
				(handlingState.direction === -1 && leftPressed) ||
				(handlingState.direction === 1 && rightPressed)
			) {
				const newTicksSinceLastMove = handlingState.ticksSinceLastMove + 1;
				if (newTicksSinceLastMove >= ARR_TICKS) {
					actions.push({move: handlingState.direction});
					return {state: autoRepeat(handlingState.direction), actions};
				}
				return {state: {...handlingState, ticksSinceLastMove: newTicksSinceLastMove}, actions};
			}
			return {state: idle(), actions};
		}

		case 'dropping':
			// no movement while dropping, but DAS can be buffered
			if (leftPressed && rightPressed) {
				// no buffering
				return {state: handlingState, actions: []};
			} else if (leftPressed) {
				return {state: droppingDasBuffer(-1), actions: []};
			} else if (rightPressed) {
				return {state: droppingDasBuffer(1), actions: []};
			}
			return {state: handlingState, actions: []};

		case 'droppingDasBuffer':
			if (
				(handlingState.direction === -1 && leftPressed) ||
				(handlingState.direction === 1 && rightPressed)
			) {
				const newTicksHeld = handlingState.ticksHeld + 1;
				return {
					state: {...handlingState, ticksHeld: newTicksHeld},
					actions: [],
				};
			}

			return {state: dropping(), actions: []};
	}
}

/**
 * Apply the state logic when a piece has finished dropping.
 * @param handlingState current handling state
 * @returns updated handling state after drop completion
 */
export function applyDropCompletion(
	handlingState: HandlingState,
): HandlingState {
	switch (handlingState.kind) {
		case 'dropping':
			return idle();

		case 'droppingDasBuffer':
			if (handlingState.ticksHeld >= DAS_TICKS) {
				// start ARR immediately after drop
				return autoRepeat(handlingState.direction);
			} else {
				// in the middle of DAS
				return started(handlingState.direction, handlingState.ticksHeld);
			}

		default:
			return handlingState;
	}
}
