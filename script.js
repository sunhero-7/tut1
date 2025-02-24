class Ball {
    constructor(x, y, radius, color, dx, dy) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.dx = dx;
        this.dy = dy;
        this.gravity = 0.2;
        this.friction = 0.98;
        this.bounce = 0.7; // Default value, will be updated from slider
        this.mass = radius; // Mass proportional to radius
        this.isResting = false;
        this.restingY = null; // Store the resting Y position
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }

    update(canvas, balls) {
        // If ball is resting, keep it at its resting position
        if (this.isResting) {
            if (this.restingY !== null) {
                this.y = this.restingY;
            }
            return;
        }

        // Apply gravity
        this.dy += this.gravity;
        
        // Bounce off walls with friction
        if (this.x + this.radius > canvas.width) {
            this.x = canvas.width - this.radius;
            this.dx = -this.dx * this.friction;
        } else if (this.x - this.radius < 0) {
            this.x = this.radius;
            this.dx = -this.dx * this.friction;
        }
        
        // Bounce off floor and ceiling with bounce factor
        if (this.y + this.radius > canvas.height) {
            this.y = canvas.height - this.radius;
            
            // More aggressive stopping condition
            if (Math.abs(this.dy) < 2.0) {
                this.dy = 0;
                this.dx *= 0.9; // Stronger friction when almost stopped
                
                // If horizontal movement is very small, stop completely
                if (Math.abs(this.dx) < 0.5) {
                    this.dx = 0;
                    this.isResting = true;
                    this.restingY = canvas.height - this.radius; // Store exact resting position
                }
            } else {
                this.dy = -this.dy * this.bounce;
                this.dx *= this.friction;
            }
        } else if (this.y - this.radius < 0) {
            this.y = this.radius;
            this.dy = -this.dy * this.bounce;
        }

        // Apply stronger air resistance
        if (!this.isResting) {
            this.dx *= 0.99;
            
            // Stop tiny horizontal movements
            if (Math.abs(this.dx) < 0.1) {
                this.dx = 0;
            }
        }

        // Check collisions with other balls
        this.handleCollisions(balls);

        // Update position
        this.x += this.dx;
        this.y += this.dy;
    }

    handleCollisions(balls) {
        for (let i = 0; i < balls.length; i++) {
            const otherBall = balls[i];
            
            // Skip self
            if (this === otherBall) continue;
            
            // Calculate distance between balls
            const dx = otherBall.x - this.x;
            const dy = otherBall.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Check if balls are colliding
            if (distance < this.radius + otherBall.radius) {
                // Only wake up resting balls if the hitting ball has significant energy
                const hittingEnergy = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
                const otherEnergy = Math.sqrt(otherBall.dx * otherBall.dx + otherBall.dy * otherBall.dy);
                
                if (this.isResting && otherEnergy > 1.0) {
                    this.isResting = false;
                }
                
                if (otherBall.isResting && hittingEnergy > 1.0) {
                    otherBall.isResting = false;
                }
                
                // Skip collision calculations if both balls are nearly stopped
                if ((this.isResting || hittingEnergy < 0.1) && 
                    (otherBall.isResting || otherEnergy < 0.1)) {
                    // Just separate them to prevent overlap
                    const angle = Math.atan2(dy, dx);
                    const overlap = this.radius + otherBall.radius - distance;
                    const pushX = (overlap / 2) * Math.cos(angle);
                    const pushY = (overlap / 2) * Math.sin(angle);
                    
                    this.x -= pushX;
                    this.y -= pushY;
                    otherBall.x += pushX;
                    otherBall.y += pushY;
                    continue;
                }
                
                // Calculate collision angle
                const angle = Math.atan2(dy, dx);
                
                // Calculate velocity components
                const thisVelocity = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
                const otherVelocity = Math.sqrt(otherBall.dx * otherBall.dx + otherBall.dy * otherBall.dy);
                
                // Calculate direction angles
                const thisDirection = Math.atan2(this.dy, this.dx);
                const otherDirection = Math.atan2(otherBall.dy, otherBall.dx);
                
                // Calculate new velocities (elastic collision)
                const thisNewVx = otherVelocity * Math.cos(otherDirection - angle) * 
                                 Math.cos(angle) + thisVelocity * 
                                 Math.sin(thisDirection - angle) * 
                                 Math.cos(angle + Math.PI/2);
                                 
                const thisNewVy = otherVelocity * Math.cos(otherDirection - angle) * 
                                 Math.sin(angle) + thisVelocity * 
                                 Math.sin(thisDirection - angle) * 
                                 Math.sin(angle + Math.PI/2);
                                 
                const otherNewVx = thisVelocity * Math.cos(thisDirection - angle) * 
                                  Math.cos(angle) + otherVelocity * 
                                  Math.sin(otherDirection - angle) * 
                                  Math.cos(angle + Math.PI/2);
                                  
                const otherNewVy = thisVelocity * Math.cos(thisDirection - angle) * 
                                  Math.sin(angle) + otherVelocity * 
                                  Math.sin(otherDirection - angle) * 
                                  Math.sin(angle + Math.PI/2);
                
                // Apply new velocities with more energy loss
                const collisionFriction = 0.95; // Energy loss in collision
                this.dx = thisNewVx * collisionFriction;
                this.dy = thisNewVy * collisionFriction;
                otherBall.dx = otherNewVx * collisionFriction;
                otherBall.dy = otherNewVy * collisionFriction;
                
                // Prevent balls from sticking together
                const overlap = this.radius + otherBall.radius - distance;
                const pushX = (overlap / 2) * Math.cos(angle);
                const pushY = (overlap / 2) * Math.sin(angle);
                
                this.x -= pushX;
                this.y -= pushY;
                otherBall.x += pushX;
                otherBall.y += pushY;
            }
        }
    }
}

// Setup canvas
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Create control container and sliders first
const controlContainer = document.createElement('div');
controlContainer.style.margin = '10px';
controlContainer.style.display = 'flex';
controlContainer.style.alignItems = 'center';
controlContainer.style.gap = '10px';
controlContainer.style.flexWrap = 'wrap'; // Allow controls to wrap on narrow screens

// Create bounce slider
const bounceSlider = document.createElement('input');
bounceSlider.type = 'range';
bounceSlider.min = '0';
bounceSlider.max = '100';
bounceSlider.value = '70'; // Default bounce of 0.7 * 100
bounceSlider.style.width = '200px';

// Create bounce slider label
const bounceLabel = document.createElement('label');
bounceLabel.textContent = 'Bounciness: ';
bounceLabel.style.fontFamily = 'Arial, sans-serif';

// Create bounce value display
const bounceValue = document.createElement('span');
bounceValue.textContent = (parseInt(bounceSlider.value) / 100).toFixed(2);
bounceValue.style.marginLeft = '5px';
bounceValue.style.fontFamily = 'Arial, sans-serif';
bounceValue.style.minWidth = '30px';

// Now create balls after the slider is defined
// Create balls
const balls = [
    new Ball(100, 100, 20, 'red', 0, 0),
    new Ball(200, 200, 20, 'blue', 0, 0),
    new Ball(300, 150, 20, 'green', 0, 0),
    new Ball(150, 300, 20, 'green', 0, 0)
];

// Update bounce value display when slider changes
bounceSlider.addEventListener('input', () => {
    const bounceAmount = parseInt(bounceSlider.value) / 100;
    bounceValue.textContent = bounceAmount.toFixed(2);
    // Update bounce factor for all balls
    balls.forEach(ball => {
        ball.bounce = bounceAmount;
    });
});

// Create a div for bounce controls
const bounceContainer = document.createElement('label');
bounceContainer.style.display = 'flex';
bounceContainer.style.alignItems = 'center';
bounceContainer.appendChild(bounceLabel);
bounceContainer.appendChild(bounceSlider);
bounceContainer.appendChild(bounceValue);

// Create energy slider
const energySlider = document.createElement('input');
energySlider.type = 'range';
energySlider.min = '1';
energySlider.max = '30';
energySlider.value = '16';
energySlider.style.width = '200px';

// Create slider label
const sliderLabel = document.createElement('label');
sliderLabel.textContent = 'Kicker Energy: ';
sliderLabel.style.fontFamily = 'Arial, sans-serif';

// Create energy value display
const energyValue = document.createElement('span');
energyValue.textContent = energySlider.value;
energyValue.style.marginLeft = '5px';
energyValue.style.fontFamily = 'Arial, sans-serif';
energyValue.style.minWidth = '30px';

// Update energy value display when slider changes
energySlider.addEventListener('input', () => {
    energyValue.textContent = energySlider.value;
});

// Function to kick all balls
function kickBalls() {
    const maxVelocity = parseInt(energySlider.value);
    balls.forEach(ball => {
        // Random velocities based on slider value
        ball.dx = (Math.random() - 0.5) * 2 * maxVelocity;
        ball.dy = (Math.random() - 0.5) * 2 * maxVelocity;
        ball.isResting = false;
    });
}

// Create kick button
const kickButton = document.createElement('button');
kickButton.textContent = 'Kick Balls!';
kickButton.style.padding = '8px 16px';
kickButton.style.fontSize = '16px';
kickButton.style.backgroundColor = '#4CAF50';
kickButton.style.color = 'white';
kickButton.style.border = 'none';
kickButton.style.borderRadius = '4px';
kickButton.style.cursor = 'pointer';
kickButton.addEventListener('click', kickBalls);
kickButton.addEventListener('mouseover', () => {
    kickButton.style.backgroundColor = '#45a049';
});
kickButton.addEventListener('mouseout', () => {
    kickButton.style.backgroundColor = '#4CAF50';
});

// Add elements to control container
sliderLabel.appendChild(energySlider);
sliderLabel.appendChild(energyValue);
controlContainer.appendChild(sliderLabel);
controlContainer.appendChild(bounceContainer);
controlContainer.appendChild(kickButton);

// Add control container to document
document.body.insertBefore(controlContainer, canvas);

// Animation loop
function animate() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update and draw balls
    balls.forEach(ball => {
        ball.update(canvas, balls);
        ball.draw(ctx);
    });

    // Continue animation
    requestAnimationFrame(animate);
}

// Start animation
animate(); 