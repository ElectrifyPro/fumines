/**
 * Fixed time (+-1 millisecond margin) loop.
 */
export class FixedLoop {
	/**
	 * Function to call on every tick of the loop.
	 */
	callback: () => void;

	/**
	 * The time (milliseconds since page load) the loop started.
	 */
	startTime: number;

	/**
	 * The time (milliseconds since page load) the next tick will execute.
	 */
	nextTick: number;

	/**
	 * The interval (in milliseconds) between ticks.
	 */
	interval: number;

	/**
	 * Scale at which time passes. For example, a value of 0.5 causes the loop to run at half speed.
	 */
	timeScale: number = 1;

	/**
	 * Internal flag to stop the loop.
	 */
	private shouldStop: boolean = false;

	constructor(callback: () => void, interval: number) {
		this.callback = callback;
		this.interval = interval;
		this.resetStartTime();
	}

	/**
	 * Resets the game loop's start time.
	 */
	resetStartTime() {
		const now = performance.now();
		this.startTime = now;
		this.nextTick = now;
	}

	/**
	 * Returns the elapsed time (in milliseconds) since the game loop started.
	 */
	get elapsed() {
		return performance.now() - this.startTime;
	}

	_loop() {
		if (this.shouldStop) {
			this.shouldStop = false;
			return;
		}

		const scaledLen = this.interval / this.timeScale;
		const now = performance.now();
		if (now > this.nextTick) {
			// since requestAnimationFrame always runs at approximately 60 FPS,
			// if we want to temporarily go faster, we will miss some ticks
			const diff = now - this.nextTick;
			if (diff > scaledLen) {
				// the number of ticks that would be missed if we were going
				// faster then requestAnimationFrame
				const missedTicks = Math.floor(diff / scaledLen);

				// the amount of time left over after the missed ticks
				const remainder = diff % scaledLen;

				for (let i = 0; i < missedTicks; ++i) this.callback();
				this.nextTick = now + scaledLen - remainder;
			} else {
				this.nextTick += scaledLen;
			}

			this.callback();
		}

		requestAnimationFrame(this._loop.bind(this));
	}

	/**
	 * Start the game loop.
	 */
	start() {
		const now = performance.now();
		this.startTime = now;
		this.nextTick = now;
		this._loop();
	}

	/**
	 * Stops the game loop as soon as possible.
	 */
	stop() {
		this.shouldStop = true;
	}
}
