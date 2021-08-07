
class PowerUp extends BaseEffect {
	
	static get maxInvocations() { return 1; }
	static get imgOffset() { return [0, -25]; }
	static get angle() { return 0; }
	static get prettyName() { return "Powerup"; }

}

class PowerupToken extends GameObject {

	static get powerup() { throw Exception("No powerup defined"); }
	static get image() { return this.powerup.image; }
	static get scale() { return this.powerup.scale; }
	static get angle() { return this.powerup.angle; }

	constructor(x, y){
		super(x, y); 
		controller.player.addCollidible(this);
	}

	onCollision(player) {
		if (this.constructor.powerup.name in controller.stats.powerups)
			controller.stats.powerups[this.constructor.powerup.prettyName]++;
		else
			controller.stats.powerups[this.constructor.powerup.prettyName] = 1;
		player.addEffect(new this.constructor.powerup());
		this.despawn();
	}
}

// const appleImg = Resource.addAsset("img/fruit/apple.png");
class Immortal extends PowerUp {

	// static get image() { return Resource.getAsset(appleImg); }
	// static get scale() { return 0.1; }
	static get cooldown() { return 5000; }
	static get prettyName() { return "Osårbarhet"; }

	init(player) {
		super.init(player);
		if (player.lives !== -1){
			this.lives = player.lives;
	 		player.lives = -1;
		}
	}

	remove(player) {
		if (player.lives == -1)
			player.lives = this.lives;
		super.remove(player);
	}

	draw(gameArea) {}
}


const aubimg = Resource.addAsset("img/fruit/aubergine.png");
class JumpBoost extends PowerUp {

	static get image() { return Resource.getAsset(aubimg); }
	static get scale() { return 0.2; }
	static get cooldown() { return 5000; }
	static get prettyName() { return "Hoppboost"; }

	init(player) {
		super.init(player);
 		this.prev = Object.assign({}, player.physics);
 		player.physics.bounce_speed *= 1.5;
	}

	remove(player) {
		player.physics.bounce_speed = this.prev.bounce_speed;
		super.remove(player);
	}
}

class JumpBoostToken extends PowerupToken {
	static get powerup() { return JumpBoost; };
}

const orangeimg = Resource.addAsset("img/fruit/orange.png");
class Rocket extends PowerUp {

	static get image() { return Resource.getAsset(orangeimg); }
	static get scale() { return 0.1; }
	static get cooldown() { return 2200; }
	static get prettyName() { return "Raket"; }

	init(player) {
		super.init(player);

		player.addEffect(new Immortal());

 		this.prev = Object.assign({}, player.physics);
 		player.physics.gy = 0;
 		if(player.physics.vy < 0)
 			player.physics.vy = 0;
	}

	update(player, delta) {
		player.physics.accelerate(0, 20, delta);
		super.update(player, delta);
	}

	remove(player) {
		player.physics.gy = this.prev.gy;
		super.remove(player);
	}
}

class RocketToken extends PowerupToken {
	static get powerup() { return Rocket; }
}
cyberfohslog(`Laddat ${document.currentScript.src}`);