let grid;
let dotts = [];
let maxRadius;

let blurAmount = 30; // Adjust blur intensity

function setup() {
  createCanvas(windowWidth, windowHeight);
	
	pixelDensity(1); // Important for consistent filter effects
  dotCanvas = createGraphics(width, height);
	
	bgcolor = color(25, 25, 40)
  background(bgcolor);
  grid =30;
  maxRadius = grid/1;
	defColor = color(64, 135, 194);
  
  // Create all dotts with initial properties
  for (let i = 0; i < width; i += grid) {
    for (let j = 0; j < height; j += grid) {
      let dott = {
        x: i,
        y: j,
        targetRadius: maxRadius * random(0.7,0.8),
        currentRadius: 0,
        animationDuration: random(500, 2000), // Random time between 0.5s and 2s
        startTime: millis(),
        color: color(random(150, 200)),
				displayColor: color(random(150, 200))
      };
      dotts.push(dott);
    }
  }
  
  // Enable animation
  frameRate(60);
  loop();
  
  noStroke();
}

function draw() {
  background(25, 25, 40);
	dotCanvas.background(25, 25, 40);
  
  // Update and draw all dotts
  for (let dott of dotts) {
    // Calculate normal animation progress
    let elapsed = (millis() - dott.startTime) % (dott.animationDuration * 2);
    let normalProgress;
    
    if (elapsed < dott.animationDuration) {
      // Expanding phase
      normalProgress = elapsed / dott.animationDuration;
    } else {
      // Contracting phase
      normalProgress = 2 - (elapsed / dott.animationDuration);
    }
    
    // Base radius from animation
    let baseRadius = normalProgress * dott.targetRadius;
    
    // Calculate distance from mouse
    let distance = dist(mouseX, mouseY, dott.x, dott.y);
    let mouseInfluenceRadius = 300; // Radius of mouse influence
    let mouseEffect = 0;
    
    if (distance < mouseInfluenceRadius) {
      // Calculate mouse effect with falloff (1 at center, 0 at edge)
    //  mouseEffect = 1 - (distance / mouseInfluenceRadius);
      
      // Apply mouse effect (expand to maximum radius based on proximity)
     
		//	dott.currentRadius = lerp(baseRadius, maxRadius, mouseEffect);
			
			
			// Change color based on mouse proximity
		//	let highlightColor = color(255); // Red highlight color
		//	dott.displayColor = lerpColor(dott.color, highlightColor, mouseEffect);
			dott.currentRadius = baseRadius;
			dott.displayColor = defColor;
    } else {
      dott.currentRadius = baseRadius;
			dott.displayColor = defColor;
    }
    
    // Draw the dot
    dotCanvas.fill(dott.displayColor);
    dotCanvas.ellipse(dott.x, dott.y, dott.currentRadius, dott.currentRadius);
  }
	push();
  drawingContext.filter = `blur(${blurAmount}px)`;
  image(dotCanvas, 0, 0);
  pop();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  
  // Clear and regenerate dotts for new window size
  dotts = [];
  for (let i = 0; i < width; i += grid) {
    for (let j = 0; j < height; j += grid) {
      let dott = {
        x: i,
        y: j,
        targetRadius: random(0, maxRadius),
        currentRadius: 0,
        animationDuration: random(500, 2000),
        startTime: millis(),
        color: color(random(150, 200)),
				displayColor: color(random(150, 200))
      };
      dotts.push(dott);
    }
  }
}