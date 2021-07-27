const cornImg = Resource.addAsset("img/corn.png");
class JumpPlayer extends Player {
	static get image() { return Resource.getAsset(cornImg); }
	
	static ACTION_GO_LEFT = 1;
	static ACTION_GO_RIGHT = 2;
	static ACTION_SHOOT = 3;
	static SCREENWRAP_TRACKING = [
		Player.CAMERA_TRACKING_INFRAME,
		400, // Margin top
		Number.NEGATIVE_INFINITY, // Margin right
		Number.NEGATIVE_INFINITY, // Margin bottom
		Number.NEGATIVE_INFINITY // Margin left
	];
	static NON_SCREENWRAP_TRACKING = [
		Player.CAMERA_TRACKING_INFRAME,
		100, // Margin top = JumpController.WIDTH_PX / 4
		100, // Margin right
		100, // Margin bottom
		100, // Margin left
	];

	constructor(x, y) {
		super(
			x,
			y,
			new Map([
				["KeyA", JumpPlayer.ACTION_GO_LEFT],
				["ArrowLeft", JumpPlayer.ACTION_GO_LEFT],
				["KeyD", JumpPlayer.ACTION_GO_RIGHT],
				["ArrowRight", JumpPlayer.ACTION_GO_RIGHT],
				["Space", JumpPlayer.ACTION_SHOOT]
			]),
			controller.screenWrap ? JumpPlayer.SCREENWRAP_TRACKING : JumpPlayer.NON_SCREENWRAP_TRACKING,
			null,
			null,
			null,
			false
		);

		this.accelerationHorizontal = 40;
		this.physics = new PlayerPhysics(this);

		this.lastX = x;
		this.lastY = y;

		this.shootCooldown = 0;
		this.shootCooldownTime = 40; //ms, rimligare med 400 typ
		controller.gameArea.canvas.addEventListener("click", e => {
			if (this.deviceTiltAvailable) {
				this.shoot();
				e.preventDefault();
			}
		}, true);

		this.collidibles = new LinkedList();
		this.isDying = false;
		controller.registerObject(this, false, true);

		this.lives = 1;
	}

	standardBounce() {
		this.physics.bounceSurface(0);
	}

	shoot() {
		if (!this.shootCooldown) {
			const t = (this.y - controller.gameArea.bottomEdgeInGrid) / controller.gameArea.gridHeight;
			let xSpeed = (Math.random() - 0.5) * 0.6;
			let ySpeed = 2 + t * (1.2 - 2);
			if (this.angle)
				[xSpeed, ySpeed] = [xSpeed * Math.cos(this.angle) + ySpeed * Math.sin(this.angle), -xSpeed * Math.sin(this.angle) + ySpeed * Math.cos(this.angle)];
			new Pellet(this.x, this.y, xSpeed, ySpeed);
			this.shootCooldown = this.shootCooldownTime;
		}
	}

	addCollidible(gameObject) {
		this.collidibles.push(gameObject);
	}

	collisionCheck() {
		if (this.isDying)
			return;
		for (const obj of this.collidibles.filterIterate(obj => obj.id !== null)) {
			if (controller.screenWrap ? collisionCheckScreenWrap(this, obj) : this.collisionCheckRectangular(obj)) {
				obj.onCollision(this);
			}
		}
	}

	damage() {
		if (this.lives !== -1 && --this.lives == 0)
			this.die();

	}

	die() {
		this.isDying = true;
		new BasicAnimation(this)
			.set({angle: 0})
			.after(0.5).set({angle: Math.random() < 0.5 ? 2 * Math.PI : -2 * Math.PI})
			.loop().start();
	}

	translate(dx, dy){
		super.translate(dx, dy);
		this.lastX += dx;
		this.lastY += dy;
	}

	update(delta) {
		super.update(delta);

		if (this.deviceTiltAvailable)
			this.physics.setSpeed(this.deviceTilt * this.physics.max_vx, this.physics.vy);
		else {
			if (this.isPressed.get(JumpPlayer.ACTION_GO_RIGHT)) {
				this.physics.accelerate(this.accelerationHorizontal, 0, delta);
			}
			if (this.isPressed.get(JumpPlayer.ACTION_GO_LEFT)) {
				this.physics.accelerate(-this.accelerationHorizontal, 0, delta);
			}

			if (this.isPressed.get(JumpPlayer.ACTION_SHOOT))
				this.shoot();
		}

		
		// Trillar man ner förlorar man
		if (this.y <= (controller.screenWrap ? controller.gameArea.bottomEdgeInGrid : 0) - 2 * this.height) {
			controller.playerDied();
			this.despawn();
		}
		if (controller.screenWrap)
			screenWrap(this);

		this.collisionCheck();
		this.lastX = this.x;
		this.lastY = this.y;

		this.shootCooldown = Math.max(0, this.shootCooldown - delta);
	}

	draw(gameArea) {
		super.draw(gameArea);

		if (controller.screenWrap)
			drawScreenWrap(gameArea, this, super.draw.bind(this));
	}
}


class PlayerPhysics extends Physics {

	constructor(player) {
		super(player);

		this.bounce_speed = 125;

		this.gy = -18;

		this.linear_decay_x = 0.7;
		this.proportional_decay_x = 0.55;

		this.max_vx = 100;
		this.max_vy = 300;

	}

	bounceSurface(angle) {
		super.bounceSurface(angle);

		// let a = Math.atan2(this.vx, this.vy);
		// this.vx = this.bounce_speed * Math.sin(a);
		this.vy = this.bounce_speed; // * Math.cos(a);

	}

}