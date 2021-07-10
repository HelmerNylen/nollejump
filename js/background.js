class Background extends GameObject {
	constructor(x, y) {
		super(x, y, null, 0, 1, false);

		this.parallax = 0.3;
		this.bufferHeight = JumpController.WIDTH_PX;
		this.nodeSpacing = JumpController.WIDTH_PX;
		this.nodeMargin = 0.1 * JumpController.WIDTH_PX;
		this.gradients = [
			[[40, 40, 40, 0.1]],
			[[140, 140, 120]]
		];
		this.sizes = [
			8,
			3
		];

		const numBuffers = Math.ceil(Math.min((JumpController.WIDTH_PX / JumpController.MAX_ASPECT_RATIO) / this.bufferHeight, 2)) + 1;

		this.path = []; // Also filled out by createGraph() below
		for (let nodeY = -2 * this.nodeSpacing; nodeY <= 2 * this.nodeSpacing; nodeY += this.nodeSpacing) {
			this.path.push([
				Background.randMargin(JumpController.WIDTH_PX, this.nodeMargin),
				nodeY
			]);
		}

		this.buffers = [];
		for (let i = 0; i < numBuffers; i++) {
			const buffer = document.createElement("canvas");
			buffer.width = JumpController.WIDTH_PX;
			buffer.height = Math.ceil(this.bufferHeight / controller.gameArea.unitHeight);

			this.createGraph(buffer, i); // Assigns to this.buffers
		}

		this.isRendering = false;
		this.offsetPrev = controller.gameArea.drawOffsetY;

		controller.registerObject(this, true, false);
	}

	update(delta) {
		super.update(delta);
		this.y -= (1 - this.parallax) * (controller.gameArea.drawOffsetY - this.offsetPrev);
		this.offsetPrev = controller.gameArea.drawOffsetY;

		if (!this.isRendering && !controller.gameArea.isInFrame(
				this.x,
				this.y,
				this.buffers[0].width / controller.gameArea.unitWidth,
				this.buffers[0].height / controller.gameArea.unitHeight)) {
			this.isRendering = true;
			setTimeout(() => {
				const buffer = this.dropBuffer();
				this.createGraph(buffer, this.buffers.length);
				this.isRendering = false;
			}, 0);
		}
	}

	draw(gameArea) {
		// super.draw() deliberately not called
		
		for (let i = 0; i < this.buffers.length; i++)
			gameArea.draw(this.buffers[i], this.x, this.y + this.bufferHeight * i, 0, 1);
	}

	dropBuffer() {
		const buffer = this.buffers.splice(0, 1)[0];
		this.y += this.bufferHeight;
		this.path.forEach(point => {
			point[1] -= this.bufferHeight;
		});
		const lowerLimit = Math.min(0, this.path[this.path.length - 1][1] - 3 * this.nodeSpacing);
		this.path = this.path.filter(point => point[1] >= lowerLimit);
		return buffer;
	}

	createGraph(buffer, index) {
		let nodeY = this.path.length > 0 ? this.path[this.path.length - 1][1] + this.nodeSpacing : 0;

		while (nodeY <= this.nodeSpacing * 2 + this.bufferHeight * (1 + Math.max(index, this.buffers.length))) {
			this.path.push([
				Background.randMargin(JumpController.WIDTH_PX, this.nodeMargin),
				nodeY
			]);
			nodeY += this.nodeSpacing;
		}

		const subpath = this.path
			.filter(point => index * this.bufferHeight - 2 * this.nodeSpacing <= point[1] && point[1] <= (index + 1) * this.bufferHeight + 2 * this.nodeSpacing)
			.map(point => [point[0], point[1] - index * this.bufferHeight]);
		const justBelow = Math.max(subpath.findIndex(point => point[1] >= 0) - 1, 0) / (subpath.length - 1);
		const justAbove = subpath.findIndex(point => point[1] >= this.bufferHeight) / (subpath.length - 1);

		const interpolation = t => Splines.interpolateHermite(
			justBelow + (justAbove - justBelow) * t,
			subpath,
			Splines.DERIVATIVE_MIDPOINT,
			Splines.ENDPOINT_EXTRAPOLATE
		);

		buffer = Background.renderGraphImg(
			buffer,
			null,
			this.bufferHeight,
			interpolation,
			this.gradients,
			this.sizes
		);
		if (index === this.buffers.length)
			this.buffers.push(buffer);
		else
			this.buffers[index] = buffer;
	}

	static randMargin(length, margin) {
		return margin / 2 + Math.random() * (length - margin);
	}

	static toColor(col) {
		if (col.length === 4)
			return `rgba(${col.join(",")})`;
		else
			return `rgb(${col.join(",")})`;
	}

	static renderGraphImg(width, height, n, interpolationFunction, gradients, sizes, transparent = false, flipped = true) {
        if (gradients.length !== sizes.length)
            throw new Error(`Mismatch of length between gradients (${gradients.length}) and sizes (${sizes.length})`);

		let canvas;
		if (width instanceof HTMLCanvasElement)
			canvas = width;
		else {
        	canvas = document.createElement("canvas");
			canvas.width = width;
			canvas.height = height;
		}
		const ctx = canvas.getContext("2d", {alpha: !transparent});
		ctx.save();
		ctx.fillStyle = "white";
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		if (flipped) {
			ctx.translate(0, canvas.height);
			ctx.scale(1, -1);
		}

        for (let spec_ind = 0; spec_ind < sizes.length; spec_ind++) {
            for (let i = 0; i < n; i++) {
                ctx.beginPath();
                ctx.arc(
					...interpolationFunction(i / (n - 1)),
					sizes[spec_ind] / 2,
					0,
					2 * Math.PI);
				ctx.fillStyle = this.toColor(
					Splines.interpolateLinear(
						i / (n - 1),
						gradients[spec_ind]));
                ctx.fill();
            }
		}

		ctx.restore();

        return canvas;
    }
}