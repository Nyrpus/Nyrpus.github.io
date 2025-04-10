/**
 * Lava lamp visualization with shaders
 **/

// SHADER CODE
const frag = `#version 300 es
precision highp float;

//
// Basic raymarch lava lamp by Tupto
// https://www.shadertoy.com/view/Wt3BWr
//

in vec2 texCoord;
out vec4 outColor;

uniform float time;
uniform float aspect;

const int MAX_STEPS = 100;
const float MIN_DIST = 0.0;
const float MAX_DIST = 100.0;
const float EPSILON = 0.0001;
const int NUM_BUBBLES = 40; // Maximum number of bubbles

uniform float bubble[120]; // NUM_BUBBLES * 3
uniform float color[120]; // NUM_BUBBLES * 3
uniform int n_bubbles;

float smin( float a, float b, float k ) {
	float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
    return mix( b, a, h ) - k*h*(1.0-h);
}


float sdfSphere( vec3 p, float s ){
  return length(p)-s;
}

float map(vec3 p) {
	float final = MAX_DIST;

	for (int i = 0; i < NUM_BUBBLES; i++)	{
	  if (i == n_bubbles) break;
	  int j = i*3;
		vec3 pos = p;
		pos.xy += vec2(bubble[j],bubble[j+1]); 
		float r = bubble[j+2]; 
		float sdf = sdfSphere(pos, r);
		final = smin(final, sdf, 0.25);
	}
	
	return final;
}


vec3 rayDirection(float fov, vec2 texCoord) {
	vec2 xy = vec2 ((texCoord.x - 0.5) * aspect, texCoord.y-0.5) / 2.0;
	float z = 1. / tan(radians(fov) / 2.0);
	return normalize(vec3(xy, -z));
}

float rayMarch(vec3 cam, vec3 dir, float start, float end) {
	float depth = start;
	for (int i = 0; i < MAX_STEPS; i++) {
		float dist = map(cam + depth * dir);
		if (dist < EPSILON) {
			return depth;
		}
		depth += dist;
		if (depth >= end) {
			return end;
		}
	}
	return end;
}

vec3 estimateNormal(vec3 p) {
    return normalize(vec3(
        map(vec3(p.x + EPSILON, p.y, p.z)) - map(vec3(p.x - EPSILON, p.y, p.z)),
        map(vec3(p.x, p.y + EPSILON, p.z)) - map(vec3(p.x, p.y - EPSILON, p.z)),
        map(vec3(p.x, p.y, p.z  + EPSILON)) - map(vec3(p.x, p.y, p.z - EPSILON))
    ));
}

vec3 gouraud(vec3 pos, vec3 normal, vec3 lightPos, vec3 lightCol, vec3 cam) {
	vec3 camVec = normalize(pos - cam);
	vec3 reflection = reflect(camVec, normal);
	
	float dist = length(lightPos - pos);
	vec3 toLight = normalize(lightPos - pos);
	
	float diffuse = clamp(max(dot(normal, toLight), 0.0), 0.0, 1.0);
	return diffuse * lightCol;
}

vec3 bubbleColor (vec3 p) {
	vec3 finalColor = vec3(0.);
	float total = 0.;    
	for (int i = 0; i < NUM_BUBBLES; i++)	{
	  int j = i*3;
		vec3 pos = p;
		pos.xy += vec2(bubble[j],bubble[j+1]); 

		float r = bubble[j+2]; 
		float sdf = sdfSphere(pos, r);
		
		if (sdf < 0.2) {
		    float d = 0.2 - sdf;
		    total += d;
		    finalColor += vec3(color[j], color[j+1], color[j+2]) * d;
		}
	}
	return finalColor / total;
}

void main() {
  vec4 fragColor = vec4(0., 0., 0., 1.);

	vec3 dir = rayDirection(45., texCoord.xy); //rayDirection(45.0, iResolution.xy, fragCoord);
	
	vec3 cam = vec3(0.0, 0.0, 5.0);
	float dist = rayMarch(cam, dir, MIN_DIST, MAX_DIST);
	
	vec3 lightpos = vec3(4.0, 5.0, 10.0);
	//vec3 lightpos = vec3(5.0 * cos(TIME * 0.25), 5.0 * sin(TIME * 0.5), sin(TIME) * 2.0);
	
	if (dist > MAX_DIST - EPSILON)	{
		//MISS
		fragColor = vec4(vec3(0.0), 0.0);
	}
	else 	{
		//HIT
		vec3 pos = cam + dir * dist;
		//fragColor.xyz = gouraud(pos, estimateNormal(pos), lightpos, vec3(1.0, 0.0, 0.0), cam);
		fragColor.xyz = gouraud(pos, estimateNormal(pos), lightpos, bubbleColor(pos), cam);
	}
	
  outColor = fragColor;
}`;

/**
 * The vertex shader
 **/
const vert = `#version 300 es
        
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

in vec3 aPosition;
in vec2 aTexCoord;
out vec2 texCoord;

void main() {
		texCoord = aTexCoord;
  	vec4 viewModelPosition = uModelViewMatrix * vec4(aPosition, 1.0);
  	gl_Position = uProjectionMatrix * viewModelPosition;  
}`;

// PROCESSING SKETCH
let myShader;
let bubbles = [];
let colors = [];
let vel = []
const max_n = 40;
const n = 30;

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight, WEBGL);
  canvas.parent('canvas-container');
  pixelDensity(1);
  myShader = createShader(vert, frag);
  for (let i = 0; i < max_n; i++) {
    bubbles.push(random(-1,1), random(-1,1), random(0.01,0.2));
    colors.push(random(0.4,1), random(0.4,1), random(0.4,1));
    vel.push(random([-1,1])*random(0.002,0.004));
  }
}

function draw() {
  for (let i = 0; i < n; i++) {
    let j = i*3+1;
    if (bubbles[j] > 1.1) { 
      bubbles[j] = 1.1;
      bubbles[j-1] = random(-1,1);
      vel[i] = -abs(vel[i]);
    }
    if (bubbles[j] < -1.1) { 
      bubbles[j] = -1.1;
      bubbles[j-1] = random(-1,1);
      vel[i] = abs(vel[i]);
    }
    bubbles[j] += vel[i];
  }
  background(220);
  shader(myShader);
  myShader.setUniform("aspect", width/height); 
  myShader.setUniform("time", millis()/1000); 
  myShader.setUniform("bubble", bubbles);
  myShader.setUniform("color", colors); 
  myShader.setUniform("n_bubbles", n);
  noStroke();
  plane(width, height);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
